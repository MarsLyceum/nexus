#!/usr/bin/env python3
import subprocess
import re
import sys
import threading
import atexit
import os
import tempfile
import wave
import math
import struct
import time
import psutil  # pip install psutil
import simpleaudio as sa  # pip install simpleaudio

LOG_FILE = "next.log"


def cleanup_orphaned_dev_servers():
    """
    Finds and kills orphaned dev server processes that were created by this script.
    A process is considered a dev server if its command line (case-insensitive)
    contains both 'pnpm.cmd' and 'run dev'.
    """
    print("Cleaning up orphaned dev server processes...")
    for proc in psutil.process_iter(attrs=["pid", "name", "cmdline"]):
        try:
            cmdline_list = proc.info.get("cmdline")
            if not cmdline_list or not isinstance(cmdline_list, list):
                continue
            cmdline = " ".join(cmdline_list).lower()
            if "pnpm.cmd" in cmdline and "run dev" in cmdline:
                print(
                    f"  Killing orphaned process: PID {proc.info['pid']} - {cmdline}"
                )
                proc.kill()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue


def safe_remove_log_file(filename, retries=10, delay=0.5):
    """
    Attempt to remove the file, retrying if a PermissionError occurs.
    Returns True if removal succeeded, False otherwise.
    """
    for _ in range(retries):
        try:
            os.remove(filename)
            return True
        except PermissionError:
            time.sleep(delay)
    return False


def create_music_wav():
    """
    Generates a 0.5-second musical chord (C major: C4, E4, G4) with a gentle envelope,
    writes it to a temporary WAV file, and returns its path.
    """
    tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    tmp_file_path = tmp_file.name
    tmp_file.close()

    framerate = 44100
    duration = 0.5
    frequencies = [261.63, 329.63, 392.00]  # C4, E4, G4 in Hz
    amplitude = 10000  # quieter sound
    nframes = int(duration * framerate)

    with wave.open(tmp_file_path, "w") as wav_file:
        wav_file.setparams(
            (1, 2, framerate, nframes, "NONE", "not compressed")
        )
        for i in range(nframes):
            t = i / framerate
            envelope = math.sin(math.pi * t / duration)
            sample_value = sum(
                math.sin(2 * math.pi * f * t) for f in frequencies
            ) / len(frequencies)
            sample = amplitude * envelope * sample_value
            wav_file.writeframes(struct.pack("<h", int(sample)))
    return tmp_file_path


# Create the musical sound file; ensure it's removed on exit.
SOUND_FILE = create_music_wav()
atexit.register(
    lambda: os.remove(SOUND_FILE) if os.path.exists(SOUND_FILE) else None
)


def play_sound():
    """
    Plays the generated musical sound using simpleaudio in a non-blocking way.
    """

    def _play():
        try:
            wave_obj = sa.WaveObject.from_wave_file(SOUND_FILE)
            wave_obj.play()
        except Exception as e:
            print(f"Error playing sound: {e}", file=sys.stderr)

    threading.Thread(target=_play, daemon=True).start()


def start_dev_server():
    """
    Starts the Next.js dev server (via pnpm) with output redirected to LOG_FILE.
    Attempts to remove LOG_FILE (waiting until it is unlocked) before starting.
    Returns the subprocess.Popen object.
    """
    if os.path.exists(LOG_FILE):
        if not safe_remove_log_file(LOG_FILE):
            print(
                f"Warning: Could not remove {LOG_FILE}; using existing file.",
                file=sys.stderr,
            )
    cmd = f"pnpm.cmd run dev > {LOG_FILE} 2>&1"
    try:
        # Start the process in a new process group.
        process = subprocess.Popen(
            cmd, shell=True, creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
        )
        print(f"Started pnpm dev server (logs to {LOG_FILE})")
        return process
    except Exception as e:
        print(f"Failed to start dev server: {e}", file=sys.stderr)
        return None


def tail_file(file_path):
    """
    Generator that yields new lines appended to the file.
    Uses polling via os.stat to detect file changes.
    """
    last_position = 0
    buffer = ""
    while True:
        try:
            current_size = os.stat(file_path).st_size
        except Exception:
            time.sleep(0.5)
            continue
        if current_size < last_position:
            last_position = 0  # file was truncated
        if current_size > last_position:
            try:
                with open(
                    file_path, "r", encoding="utf-8", errors="replace"
                ) as f:
                    f.seek(last_position)
                    new_data = f.read()
                    last_position = f.tell()
                    buffer += new_data
                    lines = buffer.splitlines(keepends=True)
                    if lines and not lines[-1].endswith("\n"):
                        buffer = lines.pop()
                    else:
                        buffer = ""
                    for line in lines:
                        yield line
            except Exception as e:
                print(f"Error reading file: {e}", file=sys.stderr)
        time.sleep(0.1)


def tail_log_thread(pattern):
    """
    Continuously tails the log file.
    Prints each new line and triggers play_sound() if the line matches the HTTP log pattern.
    """
    while True:
        try:
            for line in tail_file(LOG_FILE):
                sys.stdout.write(line)
                sys.stdout.flush()
                if pattern.search(line):
                    play_sound()
        except Exception as e:
            print(f"Error in tail_log_thread: {e}", file=sys.stderr)
        time.sleep(1)


def kill_process_tree(pid):
    """
    Kills the process with the given PID and all its children.
    """
    try:
        parent = psutil.Process(pid)
    except psutil.NoSuchProcess:
        return
    for child in parent.children(recursive=True):
        try:
            child.kill()
        except Exception:
            pass
    try:
        parent.kill()
    except Exception:
        pass


def main():
    # First, clean up orphaned dev server processes.
    cleanup_orphaned_dev_servers()

    # Compile regex to match HTTP log lines (e.g., "GET /app 200 in 37800ms")
    pattern = re.compile(r"GET\s+(/[\S]*)\s+(\d{3})\s+in\s+(\d+)ms")

    # Start the tailing thread once as a daemon.
    tail_thread = threading.Thread(
        target=tail_log_thread, args=(pattern,), daemon=True
    )
    tail_thread.start()

    # Main loop: continuously start and monitor the dev server.
    while True:
        dev_process = start_dev_server()
        if dev_process is None:
            print(
                "Dev server failed to start; retrying in 5 seconds...",
                file=sys.stderr,
            )
            time.sleep(5)
            continue

        print("Monitoring dev server process...")
        try:
            while dev_process.poll() is None:
                time.sleep(1)
            print(
                "Dev server process terminated; restarting...", file=sys.stderr
            )
        except Exception as e:
            print(f"Error in monitoring loop: {e}", file=sys.stderr)
        finally:
            try:
                if dev_process and dev_process.poll() is None:
                    kill_process_tree(dev_process.pid)
                    dev_process.wait(timeout=5)
            except Exception as e:
                print(f"Error during cleanup: {e}", file=sys.stderr)
        time.sleep(1)  # Brief pause before restarting.


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nTerminated by user.", file=sys.stderr)

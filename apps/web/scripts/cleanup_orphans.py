#!/usr/bin/env python3
import psutil
import os
import sys


def cleanup_orphaned_processes():
    """
    Scans all running processes and kills any process that appears to be orphaned
    from the alert_page_finished_loading.py script. This includes:
      - Processes whose command line contains both 'pnpm.cmd' and 'run dev'
      - Processes whose command line contains 'alert_page_finished_loading.py'
    The current process is skipped.
    """
    print("Cleaning up orphaned processes...")
    current_pid = os.getpid()
    for proc in psutil.process_iter(attrs=["pid", "name", "cmdline"]):
        try:
            # Skip the current process.
            if proc.pid == current_pid:
                continue
            cmdline_list = proc.info.get("cmdline")
            if not cmdline_list or not isinstance(cmdline_list, list):
                continue
            # Join the command-line arguments to form a single lowercase string.
            cmdline = " ".join(cmdline_list).lower()
            if ("pnpm.cmd" in cmdline and "run dev" in cmdline) or (
                "alert_page_finished_loading.py" in cmdline
            ):
                print(f"Killing process PID {proc.pid}: {cmdline}")
                proc.kill()
        except (psutil.NoSuchProcess, psutil.AccessDenied) as e:
            print(
                f"Could not kill process PID {proc.pid if proc.pid else 'unknown'}: {e}",
                file=sys.stderr,
            )
            continue
    print("Cleanup completed.")


if __name__ == "__main__":
    try:
        cleanup_orphaned_processes()
    except Exception as e:
        print(f"An error occurred during cleanup: {e}", file=sys.stderr)
        sys.exit(1)

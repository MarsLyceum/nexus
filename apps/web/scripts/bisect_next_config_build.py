#!/usr/bin/env python3
import subprocess
import sys
import os
import re
import shutil

# Path to your Next.js config file (TypeScript)
CONFIG_PATH = os.path.join(os.getcwd(), "next.config.ts")
BACKUP_PATH = os.path.join(os.getcwd(), "next.config.ts.bak")

# The build command to test the changes.
BUILD_CMD = ["pnpm.cmd", "run", "build"]

# Define regex patterns to detect common webpack config blocks.
# These patterns try to capture assignments and push calls on the "config" object.
BLOCK_PATTERNS = [
    re.compile(
        r"^\s*config\.resolve\.alias\["
    ),  # alias definitions using bracket notation
    re.compile(
        r"^\s*config\.resolve\.alias\s*="
    ),  # alias definitions using equals
    re.compile(r"^\s*config\.resolve\.fallback\s*="),  # fallback assignments
    re.compile(r"^\s*config\.plugins\.push\("),  # plugins.push calls
    re.compile(
        r"^\s*config\.module\.rules\.push\("
    ),  # module.rules.push calls
    re.compile(r"^\s*config\.module\.parser\s*="),  # module.parser assignments
    re.compile(
        r"^\s*config\.resolve\.mainFields\s*="
    ),  # mainFields assignment
    re.compile(
        r"^\s*config\.resolve\.fullySpecified\s*="
    ),  # fullySpecified assignment
    re.compile(
        r"^\s*config\.resolve\.extensions\.push\("
    ),  # extensions.push calls
    re.compile(
        r"^\s*config\.resolve\.plugins\s*="
    ),  # resolve.plugins assignment
    re.compile(r"^\s*config\.entry\s*="),  # entry assignment
]


def read_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return f.readlines()


def write_config(lines):
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        f.writelines(lines)


def run_build():
    print("Running build...")
    result = subprocess.run(
        BUILD_CMD, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    success = result.returncode == 0
    if success:
        print("Build succeeded.")
    else:
        print("Build failed.")
        # Uncomment the next line to see error details:
        # print(result.stderr.decode("utf-8"))
    return success


def restore_backup():
    if os.path.exists(BACKUP_PATH):
        shutil.copy(BACKUP_PATH, CONFIG_PATH)
        print("Restored original config from backup.")


def detect_blocks(lines):
    """
    Detect blocks in the config file.
    A block starts when a line matches one of our BLOCK_PATTERNS.
    Then, we count curly braces to ensure we capture the entire block.
    We consider the block ended when the brace count is zero and the current line ends with a semicolon.
    Returns a list of (start, end) tuples (inclusive start, exclusive end).
    """
    blocks = []
    in_block = False
    block_start = None
    brace_count = 0

    for i, line in enumerate(lines):
        if not in_block:
            for pat in BLOCK_PATTERNS:
                if pat.search(line):
                    in_block = True
                    block_start = i
                    # Initialize brace count on the starting line.
                    brace_count = line.count("{") - line.count("}")
                    break
        else:
            # Update the brace count.
            brace_count += line.count("{") - line.count("}")
            # If we've balanced all braces and the line ends with a semicolon, end the block.
            if brace_count <= 0 and line.strip().endswith(";"):
                blocks.append((block_start, i + 1))
                in_block = False
                block_start = None
                brace_count = 0
    if in_block and block_start is not None:
        blocks.append((block_start, len(lines)))
    return blocks


def comment_out_blocks(lines, blocks_to_comment):
    """
    Returns a new copy of lines with the specified blocks (list of (start, end) tuples) commented out.
    """
    new_lines = lines.copy()
    for start, end in blocks_to_comment:
        for i in range(start, end):
            if not new_lines[i].lstrip().startswith("//"):
                new_lines[i] = "// " + new_lines[i]
    return new_lines


def test_blocks(lines, block_list, selected_indices):
    """
    Given a list of blocks and a set of indices to comment out,
    modify the lines accordingly and run the build.
    Returns True if the build succeeds, False otherwise.
    """
    blocks_to_comment = [block_list[i] for i in sorted(selected_indices)]
    modified_lines = comment_out_blocks(lines, blocks_to_comment)
    write_config(modified_lines)
    return run_build()


def bisect_blocks(lines, block_list, indices):
    """
    Recursively use binary search on the list of block indices to determine which block(s)
    when commented out cause the build to succeed.
    Once a working configuration is found, the script stops and leaves that version in place.
    Returns a list of block indices that are problematic.
    """
    if not indices:
        return []
    if len(indices) == 1:
        idx = indices[0]
        print(
            f"Testing single block {idx} (lines {block_list[idx][0]} to {block_list[idx][1]})..."
        )
        if test_blocks(lines, block_list, {idx}):
            print(f"Working config found by commenting out block {idx}!")
            return [idx]
        else:
            return []

    mid = len(indices) // 2
    first_half = indices[:mid]
    second_half = indices[mid:]

    print(f"Testing first half blocks {first_half} commented out...")
    if test_blocks(lines, block_list, set(first_half)):
        # If build succeeds, the problematic code is in the first half.
        return bisect_blocks(lines, block_list, first_half)
    else:
        print(f"Testing second half blocks {second_half} commented out...")
        if test_blocks(lines, block_list, set(second_half)):
            return bisect_blocks(lines, block_list, second_half)
        else:
            # If neither half individually fixes the build, then commenting out all of these blocks works.
            print(
                "Working configuration found by commenting out the entire set of selected blocks!"
            )
            return indices


def main():
    # Create a backup of the original config if not already created.
    if not os.path.exists(BACKUP_PATH):
        shutil.copy(CONFIG_PATH, BACKUP_PATH)
        print(f"Backup created at {BACKUP_PATH}")

    lines = read_config()
    block_list = detect_blocks(lines)
    print("Detected blocks (line ranges):", block_list)

    if not block_list:
        print("No blocks detected with the given patterns. Exiting.")
        return

    indices = list(range(len(block_list)))
    problematic_blocks = bisect_blocks(lines, block_list, indices)

    print("Identified problematic block indices:", problematic_blocks)
    for i in problematic_blocks:
        print(
            f"Block {i} (lines {block_list[i][0]} to {block_list[i][1]}) is likely causing the issue."
        )

    print(
        "A working configuration has been left in place. Please review the changes in your config file."
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("An error occurred:", e)
        sys.exit(1)

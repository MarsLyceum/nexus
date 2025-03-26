#!/usr/bin/env python3
"""
report_parse_error_monitor.py

This script is an all-encompassing error monitor:
  - It launches your Next.js development server using "pnpm run dev".
  - It captures the stdout/stderr output in real time.
  - It analyzes each output line with heuristics similar to your ReportParseErrorPlugin
    to detect errors (e.g. SyntaxError, Module not found, Unexpected token, etc.).
  - It prints structured JSON error reports for each unique error detected,
    including additional context lines and suggestions.
  - When you stop the process (e.g. with Ctrl+C), it prints an aggregated summary.
  - It uses fuzzy matching to group together similar (spammy) messages so that repeated
    low-level debug logs are aggregated rather than printed every time.
  - For high‑priority errors, if any context lines resemble a stack trace (starting with "at "),
    those lines are parsed into file name, function name, line, and column numbers and captured
    in a dedicated field (detailed_context). In a production system you might further refine this parsing.
  - Extra datamining is performed to attach environment, configuration, and process information.
  - A new build phase inference is added: by scanning the context buffer for key terms, the script
    deduces which phase of the build (e.g. Compilation, Bundling, Transpilation) is currently active.

Usage:
    python report_parse_error_monitor.py [--cmd "pnpm run dev"]

Requirements:
    - Python 3.x
    - (Optional) nltk with VADER sentiment lexicon installed for sentiment analysis.
"""

import subprocess
import threading
import re
import json
import datetime
import argparse
import sys
import os
import logging
import time
import difflib
from collections import deque
import platform
import glob

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

# (Optional) Sentiment analysis using NLTK’s VADER:
try:
    from nltk.sentiment.vader import SentimentIntensityAnalyzer

    sia = SentimentIntensityAnalyzer()
except Exception:
    sia = None


def get_sentiment(message: str) -> dict:
    """Return sentiment scores for the given message.
    If VADER is unavailable, return a neutral sentiment."""
    if sia is not None:
        return sia.polarity_scores(message)
    else:
        return {"neg": 0.0, "neu": 1.0, "pos": 0.0, "compound": 0.0}


# Define which error types are considered high priority.
HIGH_PRIORITY_ERRORS = {
    "SyntaxError",
    "ReferenceError",
    "TypeError",
    "RangeError",
    "ModuleNotFoundError",
}


def parse_stack_line(line: str) -> dict:
    """
    Attempt to parse a stack trace line.
    Expected formats:
      at functionName (fileName:lineNumber:columnNumber)
      at fileName:lineNumber:columnNumber
    Returns a dictionary with keys: function, file, line, column.
    """
    pattern = r"at\s+(?:(?P<func>[\w\.$<>]+)\s+\()?(?P<file>[^():]+):(?P<line>\d+):(?P<column>\d+)\)?"
    match = re.search(pattern, line.strip())
    if match:
        return {
            "function": match.group("func") if match.group("func") else None,
            "file": match.group("file"),
            "line": int(match.group("line")),
            "column": int(match.group("column")),
        }
    return {}


def parse_full_stack_trace(stack_lines: list) -> list:
    """
    Given a list of stack trace lines, parse each one into structured data.
    Returns a list of dictionaries representing the call stack.
    """
    parsed = []
    for line in stack_lines:
        parsed_line = parse_stack_line(line)
        if parsed_line:
            parsed.append(parsed_line)
    return parsed


def infer_build_phase(context: list) -> str:
    """
    Infer the build phase from context lines.
    Looks for keywords such as 'compil', 'bundle', 'transpil', etc.
    """
    phase_keywords = {
        "compil": "Compilation",
        "bundle": "Bundling",
        "transpil": "Transpilation",
        "analyz": "Analysis",
        "resolve": "Module Resolution",
        "next:": "Next.js Internal Process",
    }
    if context:
        lower_context = " ".join(context).lower()
        for key, phase in phase_keywords.items():
            if key in lower_context:
                return phase
    return "Unknown Phase"


def get_environment_info() -> dict:
    """
    Collect basic information about the current environment.
    """
    info = {
        "os": platform.platform(),
        "python_version": platform.python_version(),
        "working_directory": os.getcwd(),
    }
    try:
        node_version = subprocess.check_output(
            ["node", "--version"], universal_newlines=True
        ).strip()
        info["node_version"] = node_version
    except Exception as e:
        info["node_version"] = f"Error retrieving Node.js version: {e}"
    return info


def get_config_files_info() -> dict:
    """
    Read key configuration files (e.g. tsconfig.json, babel.config.js, package.json) from the current working directory.
    Returns a dict with file names and truncated content.
    """
    config_files = [
        "tsconfig.json",
        "babel.config.js",
        ".babelrc",
        "package.json",
    ]
    config_info = {}
    for filename in config_files:
        try:
            with open(filename, "r", encoding="utf-8") as f:
                content = f.read()
                config_info[filename] = (
                    content[:300] + "..." if len(content) > 300 else content
                )
        except Exception:
            config_info[filename] = "Not found or unreadable"
    return config_info


def get_process_info() -> dict:
    """
    Capture information about the process that started this script.
    """
    return {
        "command_line": " ".join(sys.argv),
        "NODE_OPTIONS": os.environ.get("NODE_OPTIONS", "Not set"),
        "DEBUG": os.environ.get("DEBUG", "Not set"),
    }


def get_module_files_info(keyword: str) -> list:
    """
    Search for files in the current directory and subdirectories that contain the keyword.
    This can help correlate an error (e.g. page: '/welcome') with related source files.
    """
    return glob.glob(f"**/*{keyword}*", recursive=True)


class ReportParseErrorMonitor:
    def __init__(self, options=None):
        self.options = {
            "verbose": True,
            "maxErrorsToLog": float("inf"),
            "showSummary": True,
            "contextLines": 5,
            "aggregationWindow": 2.0,
        }
        if options:
            self.options.update(options)
        self.errorGroups = []
        self.errorReports = []
        self.env_info = get_environment_info()
        self.config_info = get_config_files_info()
        self.process_info = get_process_info()

    def getPackageName(self, moduleResource: str) -> str:
        if not moduleResource:
            return "Unknown package"
        if "node_modules" in moduleResource:
            parts = re.split(r"node_modules[\\/]", moduleResource)
            if len(parts) > 1 and parts[1]:
                packageParts = re.split(r"[\\/]", parts[1])
                return (
                    "/".join(packageParts[:2])
                    if packageParts[0].startswith("@")
                    else packageParts[0]
                )
        return "Local"

    def extractErrorType(
        self, message: str, error_name: str = None, loc: dict = None
    ) -> str:
        errorType = "UnknownError"
        if re.search(r"ProxyNativeModule", message, re.I):
            errorType = "BabelScopeError"
        elif error_name and error_name != "Error":
            errorType = error_name
        elif re.search(r"Module not found", message, re.I):
            errorType = "ModuleNotFoundError"
        elif re.search(r"Unexpected token", message, re.I):
            errorType = "SyntaxError"
        elif re.search(r"cannot read properties of undefined", message, re.I):
            errorType = "UndefinedPropertyError"
        elif re.search(r"tap", message, re.I):
            errorType = "HookRegistrationError"
        elif re.search(r"ReferenceError", message, re.I):
            errorType = "ReferenceError"
        elif re.search(r"TypeError", message, re.I):
            errorType = "TypeError"
        elif re.search(r"RangeError", message, re.I):
            errorType = "RangeError"
        else:
            m = re.match(r"^([A-Za-z]+Error)", message)
            if m:
                errorType = m.group(1)
        if loc:
            errorType += (
                f" (at {loc.get('line', '?')}:{loc.get('column', '?')})"
            )
        return errorType

    def reportError(
        self,
        message: str,
        moduleResource: str = "Unknown module",
        context: list = None,
    ):
        """
        Process an error message line and log it as a structured JSON report.
        Uses fuzzy matching to group similar messages within the aggregation window.
        For high-priority errors, it parses stack trace lines and infers the build phase.
        Additionally, extra environment, configuration, process, and module file information is attached.
        """
        errorType = self.extractErrorType(message)
        current_time = time.time()
        WINDOW = self.options.get("aggregationWindow", 2.0)
        SIMILARITY_THRESHOLD = 0.8

        sentiment = get_sentiment(message)
        group_found = None

        for group in self.errorGroups:
            if (
                group["module"] == moduleResource
                and group["errorType"] == errorType
            ):
                similarity = difflib.SequenceMatcher(
                    None, group["message"], message
                ).ratio()
                if similarity >= SIMILARITY_THRESHOLD:
                    group_found = group
                    break

        if group_found:
            if current_time - group_found["last_time"] < WINDOW:
                group_found["count"] += 1
                group_found["last_time"] = current_time
                return
            else:
                group_found["count"] += 1
                group_found["last_time"] = current_time
                return

        new_group = {
            "module": moduleResource,
            "errorType": errorType,
            "message": message,
            "sentiment": sentiment,
            "last_time": current_time,
            "count": 1,
            "context": context,
        }
        is_high_priority = errorType in HIGH_PRIORITY_ERRORS

        if is_high_priority:
            new_group["priority"] = "CRITICAL"
            stack_lines = [
                line
                for line in (context or [])
                if line.strip().startswith("at ")
            ]
            parsed_stack = parse_full_stack_trace(stack_lines)
            new_group["detailed_context"] = (
                parsed_stack if parsed_stack else context
            )
            # Infer the build phase from context
            new_group["build_phase"] = infer_build_phase(context)
            # Attempt to find module files if the error references a page (e.g., "page: '/welcome'")
            module_files = []
            match = re.search(r"page:\s*['\"](/[\w\-]+)['\"]", message)
            if match:
                keyword = match.group(1).strip("/")
                module_files = get_module_files_info(keyword)
            new_group["module_files"] = module_files

        self.errorGroups.append(new_group)

        report = {
            "severity": "ERROR",
            "component": "DevServer",
            "module": moduleResource,
            "package": self.getPackageName(moduleResource),
            "errorType": errorType,
            "message": message,
            "sentiment": sentiment,
            "timestamp": datetime.datetime.now().isoformat(),
            "env_info": self.env_info,
            "config_info": self.config_info,
            "process_info": self.process_info,
        }
        if context:
            report["context"] = context
        if is_high_priority:
            report["priority"] = "CRITICAL"
            report["detailed_context"] = new_group.get(
                "detailed_context", context
            )
            report["build_phase"] = new_group.get(
                "build_phase", "Unknown Phase"
            )
            report["explanation"] = (
                "This error is high priority and occurred during the build process. "
                "Review the detailed context (parsed stack trace) for file, function, line, and column details, "
                "and check the inferred build phase to understand which part of the process may be causing the error. "
                "Additional environment, configuration, process, and module file information is provided."
            )
            report["module_files"] = new_group.get("module_files", [])
        if errorType == "BabelScopeError":
            report["suggestions"] = (
                "Option 1: Update the plugin that injects 'ProxyNativeModule' to call "
                "scope.registerDeclaration(declarationPath). Option 2: Create a custom Babel "
                "plugin to register the identifier."
            )
        if self.options["verbose"]:
            report["stack"] = (
                "Stack not available from stdout. Consider running with source maps enabled and NODE_OPTIONS=--trace-deprecation"
            )
        print(json.dumps(report, indent=2))
        self.errorReports.append(report)

    def printSummary(self):
        overall_severity = "INFO"
        for group in self.errorGroups:
            if group.get("priority") == "CRITICAL":
                overall_severity = "CRITICAL"
                break

        summary = {
            "severity": overall_severity,
            "component": "DevServer",
            "message": "Error Summary",
            "summary": [],
            "timestamp": datetime.datetime.now().isoformat(),
        }
        for group in self.errorGroups:
            entry = {
                "module": group["module"],
                "package": self.getPackageName(group["module"]),
                "errorType": group["errorType"],
                "message": group["message"],
                "sentiment": group["sentiment"],
                "count": group["count"],
            }
            if "priority" in group:
                entry["priority"] = group["priority"]
            summary["summary"].append(entry)
        print(json.dumps(summary, indent=2))


def monitor_process_output(process, monitor):
    def process_stream(stream, stream_name):
        context_buffer = deque(maxlen=monitor.options["contextLines"])
        for line in iter(stream.readline, ""):
            if line:
                print(line, end="")
                context_buffer.append(line.strip())
                if re.search(
                    r"SyntaxError|Module not found|Unexpected token|ReferenceError|TypeError|RangeError|UndefinedPropertyError|HookRegistrationError|ProxyNativeModule",
                    line,
                    re.I,
                ):
                    monitor.reportError(
                        line.strip(), context=list(context_buffer)
                    )
        stream.close()

    t_stdout = threading.Thread(
        target=process_stream, args=(process.stdout, "stdout")
    )
    t_stderr = threading.Thread(
        target=process_stream, args=(process.stderr, "stderr")
    )
    t_stdout.start()
    t_stderr.start()
    t_stdout.join()
    t_stderr.join()


def main():
    parser = argparse.ArgumentParser(
        description="Launch 'pnpm run dev' and monitor its output for errors."
    )
    parser.add_argument(
        "--cmd",
        default="pnpm run dev",
        help="Command to run (default: 'pnpm run dev')",
    )
    args = parser.parse_args()

    monitor = ReportParseErrorMonitor()

    env = os.environ.copy()
    env["DEBUG"] = "*"
    env["NODE_OPTIONS"] = "--trace-deprecation"

    try:
        process = subprocess.Popen(
            args.cmd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            env=env,
        )
    except Exception as e:
        logging.error(
            f"Failed to start the process with command '{args.cmd}': {e}"
        )
        sys.exit(1)

    logging.info(f"Running command: {args.cmd}")
    try:
        monitor_process_output(process, monitor)
    except KeyboardInterrupt:
        logging.info("Interrupted by user, terminating process...")
        process.terminate()
    finally:
        process.wait()

    logging.info("Process ended. Printing error summary:")
    monitor.printSummary()


if __name__ == "__main__":
    main()

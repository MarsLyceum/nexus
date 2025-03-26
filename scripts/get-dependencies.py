import subprocess
import json
import sys

# Define your sections as a list of (section header, list of root packages)
sections = [
    (
        "Expo & related modules",
        [
            "@expo-google-fonts",
            "@expo/vector-icons",
            "@react-native/assets-registry",
            "expo-modules-core",
            "expo",
            "expo-image",
            "expo-linear-gradient",
            "expo-video",
            "expo-asset",
            "expo-font",
            "expo-auth-session",
            "expo-calendar",
            "expo-constants",
            "expo-file-system",
            "expo-location",
            "expo-splash-screen",
            "expo-status-bar",
            "expo-image-picker",
            "expo-image-loader",
        ],
    ),
    (
        "React Native core",
        [
            "react-native",
            "react-native-toast-message",
            "react-native-vector-icons",
            "react-native-get-random-values",
            "react-native-safe-area-context",
            "react-native-paper",
            "react-native-svg",
            "react-native-svg-transformer",
            "react-native-webview",
            "react-native-config",
            "react-native-reanimated",
            "react-native-gesture-handler",
            "react-native-zoom-toolkit",
        ],
    ),
    (
        "Navigation, lists, and utilities",
        [
            "@shopify/flash-list",
            "recyclerlistview",
            "@react-navigation/native",
            "@jsamr/react-native-li",
            "@react-navigation/core",
            "solito",
            "use-latest-callback",
        ],
    ),
    (
        "Additional packages from dependencies (if needed)",
        [
            "@react-native-async-storage/async-storage",
            "@react-native-picker/picker",
            "react-native-draggable-flatlist",
            "react-native-elements",
            "react-native-event-source",
            "react-native-geolocation-service",
            "react-native-gifted-chat",
            "react-native-markdown-display",
            "react-native-screens",
            "react-native-slick",
            "react-native-web",
        ],
    ),
]

# Create a list of original package names (for quick lookup and to pre-populate sections)
original_packages = []
for header, pkgs in sections:
    original_packages.extend(pkgs)
original_set = set(original_packages)

# Prepare a mapping: section header -> set of package names assigned to that section.
assigned = {header: set(pkgs) for header, pkgs in sections}
extra = set()  # for packages not falling under any section


def assign_section(ancestors):
    """
    Given a list of ancestor package names, return the first section header
    (in the order of `sections`) for which any package in that section is an ancestor.
    If none match, return None.
    """
    for header, pkg_list in sections:
        for pkg in pkg_list:
            if pkg in ancestors:
                return header
    return None


def traverse(node, ancestors):
    """
    Recursively traverse the dependency tree.
    `ancestors` is a list of package names from the root (excluding the project root).
    """
    if isinstance(node, dict) and "dependencies" in node:
        for dep_name, dep_node in node["dependencies"].items():
            current_path = ancestors + [dep_name]
            # Assign this package based on ancestors.
            section = assign_section(current_path)
            if section:
                assigned[section].add(dep_name)
            else:
                extra.add(dep_name)
            # Recurse
            traverse(dep_node, current_path)


def fetch_dependency_tree():
    # Run "npm ls --all --json" to get the full dependency tree.
    result = subprocess.run(
        "npm ls --all --json",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        shell=True,
        check=False,
    )
    if result.returncode != 0:
        print(
            "Warning: npm ls reported errors. Continuing with available JSON output...",
            file=sys.stderr,
        )
    try:
        tree = json.loads(result.stdout)
    except json.JSONDecodeError as e:
        print("Error parsing JSON output from npm ls:", e, file=sys.stderr)
        sys.exit(1)
    return tree


def main():
    tree = fetch_dependency_tree()
    # Start traversal from the top-level dependencies.
    if "dependencies" in tree:
        traverse(tree, [])
    else:
        print("No dependencies found in npm ls output.", file=sys.stderr)
        sys.exit(1)

    # Remove any packages that were already in the original_set from extra
    extra_packages = sorted(extra - original_set)

    # Build the JavaScript array literal output.
    output_lines = []
    output_lines.append("transpilePackages: [")
    for header, _ in sections:
        output_lines.append("    // " + header)
        for pkg in sorted(assigned[header]):
            output_lines.append("    '" + pkg + "',")
        output_lines.append("")  # blank line between sections

    if extra_packages:
        output_lines.append(
            "    // Extra packages (all children not assigned to a section)"
        )
        for pkg in extra_packages:
            output_lines.append("    '" + pkg + "',")
        output_lines.append("")

    output_lines.append("],")
    output = "\n".join(output_lines)

    try:
        subprocess.run("clip", input=output, text=True, shell=True, check=True)
        print("Dependencies list copied to clipboard:")
    except subprocess.CalledProcessError:
        print("Failed to copy to clipboard. Here is the output:\n")

    print(output)


if __name__ == "__main__":
    main()

const fs = require('fs');
const path = require('path');

const pkgPath = path.resolve(__dirname, '../package.json');
const pkg = require(pkgPath);

// Define your repository root
const repoRoot = path.resolve(__dirname, '..');

// Function to convert an absolute path to a relative path (using forward slashes)
const convertToRelative = (absPath) => {
    if (absPath.startsWith(repoRoot)) {
        return path.relative(repoRoot, absPath).replace(/\\/g, '/');
    }
    return absPath;
};

let modified = false;

// Assuming patch paths are under a "patches" field in package.json
if (pkg.patches) {
    for (const key in pkg.patches) {
        const patchPath = pkg.patches[key];
        const relativePath = convertToRelative(patchPath);
        if (relativePath !== patchPath) {
            pkg.patches[key] = relativePath;
            modified = true;
        }
    }
}

if (modified) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log('Patch paths have been converted to relative paths.');
}

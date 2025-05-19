// apps/mobile/scripts/build-eas-local.js
import { spawnSync } from 'child_process';
import { resolve } from 'path';
import { config as loadEnv } from 'dotenv';
import { renameSync, rmSync, readdirSync } from 'fs';

// Setup paths & env
const projectDir = resolve(process.cwd());
const monorepoRoot = resolve(projectDir, '..', '..');
loadEnv({ path: resolve(monorepoRoot, '.env.local') });
process.env.EAS_PROJECT_ROOT = '..';

const workspaceFile = resolve(projectDir, 'pnpm-workspace.yaml');
const buildWorkspaceFile = resolve(projectDir, 'pnpm-workspace.yaml.build');

// Swap in the build‑workspace file
try {
    renameSync(buildWorkspaceFile, workspaceFile);
    console.log(`✔️  Swapped in ${buildWorkspaceFile} → ${workspaceFile}`);
} catch (err) {
    console.error('❌  Failed to swap in workspace file:', err);
    process.exit(1);
}

// Detect OS
const isWindows = process.platform === 'win32';
const requestedPlatform = process.env.PLATFORM ?? 'android';

let result;
if (isWindows) {
    // ── Windows: use Docker build + fix ACLs ──
    const dockerArgs = [
        'run',
        '--rm',
        // no --user needed on Windows
        '--mount',
        `type=bind,src=${monorepoRoot},target=/workspace`,
        '-e',
        `EXPO_TOKEN=${process.env.EXPO_TOKEN || ''}`,
        '-w',
        '/workspace/apps/mobile',
        'eas-android-builder',
        'build',
        '--platform',
        'android',
        '--local',
        '--non-interactive',
        '--profile',
        'development',
    ];
    console.log('> docker', dockerArgs.join(' '));
    result = spawnSync('docker', dockerArgs, { stdio: 'inherit' });
} else {
    // ── macOS / WSL / Linux: direct EAS build ──
    console.log('> running eas build directly');
    result = spawnSync(
        'eas',
        [
            'build',
            '--platform',
            requestedPlatform,
            '--local',
            '--non-interactive',
            '--profile',
            'development',
        ],
        { stdio: 'inherit' }
    );
}

// Restore the original build‑workspace file
try {
    renameSync(workspaceFile, buildWorkspaceFile);
    console.log(`✔️  Restored ${workspaceFile} → ${buildWorkspaceFile}`);
} catch (err) {
    console.error('❌  Failed to restore workspace file:', err);
    process.exit(1);
}

try {
    // paths to clean
    const toDelete = [
        resolve(monorepoRoot, 'node_modules'),
        // apps/*/node_modules
        ...readdirSync(resolve(monorepoRoot, 'apps')).map((dir) =>
            resolve(monorepoRoot, 'apps', dir, 'node_modules')
        ),
        // packages/*/node_modules
        ...readdirSync(resolve(monorepoRoot, 'packages')).map((dir) =>
            resolve(monorepoRoot, 'packages', dir, 'node_modules')
        ),
    ];

    toDelete.forEach((path) => {
        rmSync(path, { recursive: true, force: true });
        console.log(`🗑️  Removed ${path}`);
    });

    console.log('🔄  Running pnpm install in monorepo root…');
    const install = spawnSync('pnpm', ['install'], {
        cwd: monorepoRoot,
        stdio: 'inherit',
    });
    if (install.status !== 0) {
        console.error('❌  pnpm install failed');
        process.exit(install.status);
    }
} catch (err) {
    console.error('❌  Error during cleanup/install:', err);
    process.exit(1);
}

process.exit(result.status ?? 1);

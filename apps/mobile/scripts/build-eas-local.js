// apps/mobile/scripts/build-eas-local.js
import { spawnSync } from 'child_process';
import { resolve, join } from 'path';
import { config as loadEnv } from 'dotenv';
import { renameSync } from 'fs';

const projectDir = resolve(process.cwd()); // e.g. C:\…\apps\mobile or /home/you/.../apps/mobile
const monorepoRoot = resolve(projectDir, '..', '..'); // go up two levels to your repo root

loadEnv({ path: resolve(monorepoRoot, '.env.local') });

process.env.EAS_PROJECT_ROOT = '..';

const workspaceFile = resolve(projectDir, 'pnpm-workspace.yaml');
const buildWorkspaceFile = resolve(projectDir, 'pnpm-workspace.yaml.build');

const uid = process.getuid(); // on Linux/WSL2
const gid = process.getgid();

try {
    renameSync(buildWorkspaceFile, workspaceFile);
    console.log(`✔️  Swapped in ${buildWorkspaceFile} → ${workspaceFile}`);
} catch (err) {
    console.error('❌  Failed to swap in workspace file:', err);
    process.exit(1);
}

const isWindows = process.platform === 'win32';
const userFlags =
    !isWindows && typeof process.getuid === 'function'
        ? ['--user', `${process.getuid()}:${process.getgid()}`]
        : [];

const dockerArgs = [
    'run',
    '--rm',
    ...userFlags,
    `${uid}:${gid}`,
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
const result = spawnSync('docker', dockerArgs, { stdio: 'inherit' });

try {
    renameSync(workspaceFile, buildWorkspaceFile);
    console.log(`✔️  Restored ${workspaceFile} → ${buildWorkspaceFile}`);
} catch (err) {
    console.error('❌  Failed to restore workspace file:', err);
    process.exit(1);
}

// TODO: remove the node_modules folders and reinstall after running
spawnSync(
    'icacls',
    [
        `${monorepoRoot}\\apps\\mobile\\node_modules`,
        '/grant',
        `${process.env.USERNAME}:(OI)(CI)F`,
        '/T',
    ],
    { stdio: 'inherit' }
);

process.exit(result.status ?? 1);

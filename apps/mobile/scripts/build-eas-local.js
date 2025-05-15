// apps/mobile/scripts/build-eas-local.js
import { spawnSync } from 'child_process';
import { resolve, join } from 'path';
import { config as loadEnv } from 'dotenv';

const projectDir = resolve(process.cwd()); // e.g. C:\…\apps\mobile or /home/you/.../apps/mobile
const monorepoRoot = resolve(projectDir, '..', '..'); // go up two levels to your repo root

loadEnv({ path: resolve(monorepoRoot, '.env.local') });

process.env.EAS_PROJECT_ROOT = '..';

const uid = process.getuid();      // on Linux/WSL2
const gid = process.getgid();

const dockerArgs = [
    'run',
    '--rm',
    '--user', `${uid}:${gid}`,
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
process.exit(result.status ?? 1);

#!/usr/bin/env bash
set -e

echo "[install-deps-and-run-eas] Installing mobile app dependencies…"
cd /workspace

export CI=true

# installs everything, including expo-dev-client
# pnpm install --frozen-lockfile

echo "[install-deps-and-run-eas] Starting EAS…"
exec eas "$@"

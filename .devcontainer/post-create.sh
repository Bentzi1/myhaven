#!/usr/bin/env bash
set -euo pipefail

bash .devcontainer/ensure-codex.sh
npm install

#!/usr/bin/env bash
set -euo pipefail

mkdir -p "$HOME/.codex"

config_file="$HOME/.codex/config.toml"
setting='cli_auth_credentials_store = "file"'

if [ -f "$config_file" ]; then
  if ! grep -Eq '^[[:space:]]*cli_auth_credentials_store[[:space:]]*=' "$config_file"; then
    printf '\n%s\n' "$setting" >> "$config_file"
  fi
else
  printf '%s\n' "$setting" > "$config_file"
fi

npm install

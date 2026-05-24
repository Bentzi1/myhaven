#!/usr/bin/env bash
set -euo pipefail

mkdir -p "$HOME/.codex" "$HOME/.npm-global/bin"

npm config set prefix "$HOME/.npm-global" >/dev/null
export PATH="$HOME/.npm-global/bin:$PATH"

profile_file="$HOME/.profile"
path_line='export PATH="$HOME/.npm-global/bin:$PATH"'
touch "$profile_file"
if ! grep -Fxq "$path_line" "$profile_file"; then
  printf '\n%s\n' "$path_line" >> "$profile_file"
fi

config_file="$HOME/.codex/config.toml"
setting='cli_auth_credentials_store = "file"'

if [ -f "$config_file" ]; then
  if ! grep -Eq '^[[:space:]]*cli_auth_credentials_store[[:space:]]*=' "$config_file"; then
    printf '\n%s\n' "$setting" >> "$config_file"
  fi
else
  printf '%s\n' "$setting" > "$config_file"
fi

if ! command -v codex >/dev/null 2>&1; then
  npm i -g @openai/codex
fi

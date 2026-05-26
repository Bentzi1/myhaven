#!/usr/bin/env bash
set -euo pipefail

mkdir -p "$HOME/.codex" "$HOME/.npm-global/bin"

host_codex_dir="${HOST_CODEX_HOME:-/mnt/host-codex}"
if [ -d "$host_codex_dir" ]; then
  for file in auth.json config.toml; do
    if [ -f "$host_codex_dir/$file" ]; then
      cp "$host_codex_dir/$file" "$HOME/.codex/$file"
      chmod 600 "$HOME/.codex/$file" 2>/dev/null || true
    fi
  done

  if [ -d "$host_codex_dir/rules" ] && [ ! -e "$HOME/.codex/rules" ]; then
    cp -R "$host_codex_dir/rules" "$HOME/.codex/rules"
  fi
fi

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
  if [ "${INSTALL_CODEX_CLI:-0}" = "1" ]; then
    npm i -g @openai/codex
  else
    echo "Codex CLI is not installed; skipping npm install. The VS Code Codex extension uses its bundled app-server."
  fi
fi

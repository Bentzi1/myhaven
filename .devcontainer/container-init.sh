#!/usr/bin/env bash
set -euo pipefail

# Allow git commands inside the devcontainer even when the bind mount is owned
# by a different host user.
git config --global --add safe.directory /workspaces

# Docker named volumes start out owned by root, which blocks the `node`
# user used by the devcontainer from installing dependencies on rebuild.
# Avoid recursively chowning bind mounts such as the source tree; on Docker
# Desktop those can be very slow and can stall startup.

ensure_owned_dir() {
  local dir="$1"
  local node_owner

  node_owner="$(id -u node):$(id -g node)"
  mkdir -p "$dir"

  if [ "$(stat -c '%u:%g' "$dir" 2>/dev/null || true)" != "$node_owner" ]; then
    chown -R node:node "$dir" 2>/dev/null || true
  fi
}

ensure_owned_dir /home/node/.npm-global
ensure_owned_dir /home/node/.codex
ensure_owned_dir /workspaces/node_modules

case "${DEVCONTAINER_ROLE:-}" in
  frontend)
    ensure_owned_dir /workspaces/frontend/node_modules
    ;;
  backend)
    ensure_owned_dir /workspaces/backend/node_modules
    ;;
esac

# Some bind-mounted workspaces surface files as `nobody`, which leaves the
# `node` user unable to update npm manifests during post-create setup.
for file in \
  /workspaces/package.json \
  /workspaces/package-lock.json \
  /workspaces/frontend/package.json \
  /workspaces/backend/package.json
do
  if [ -e "$file" ]; then
    chown node:node "$file" 2>/dev/null || true
    chmod u+w "$file" 2>/dev/null || true
  fi
done

case "${DEVCONTAINER_ROLE:-}" in
  frontend)
    cd /workspaces
    npm run dev --workspace frontend &
    ;;
  backend)
    cd /workspaces
    npm run dev --workspace backend &
    ;;
esac

exec sleep infinity

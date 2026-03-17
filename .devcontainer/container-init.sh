#!/usr/bin/env bash
set -euo pipefail

# Allow git commands inside the devcontainer even when the bind mount is owned
# by a different host user.
git config --global --add safe.directory /workspaces

# Docker named volumes start out owned by root, which blocks the `node`
# user used by the devcontainer from installing dependencies on rebuild.
for dir in \
  /workspaces/node_modules \
  /workspaces/frontend/node_modules \
  /workspaces/backend/node_modules
do
  mkdir -p "$dir"
  chown -R node:node "$dir"
done

# Some bind-mounted workspaces surface files as `nobody`, which leaves the
# `node` user unable to update npm manifests during post-create setup.
for file in \
  /workspaces/package.json \
  /workspaces/package-lock.json \
  /workspaces/frontend/package.json \
  /workspaces/backend/package.json
do
  if [ -e "$file" ]; then
    chown node:node "$file"
    chmod u+w "$file"
  fi
done

# Some setups expose the app directories as `nobody`, which blocks normal
# source edits from the devcontainer user. Fix ownership eagerly so Vite
# config and source files remain editable inside the container.
for dir in \
  /workspaces/frontend \
  /workspaces/backend
do
  if [ -e "$dir" ]; then
    chown -R node:node "$dir"
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

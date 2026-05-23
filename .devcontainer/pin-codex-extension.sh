#!/usr/bin/env bash
set -euo pipefail

extension_id="openai.chatgpt"
pinned_version="${CODEX_EXTENSION_PINNED_VERSION:-26.513.21555}"
extension_ref="${extension_id}@${pinned_version}"

find_code_server() {
  local candidate
  for candidate in "${HOME}"/.vscode-server/bin/*/bin/code-server; do
    if [ -x "$candidate" ]; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

is_installed() {
  local query="$1"
  "$code_server" --list-extensions --show-versions 2>/dev/null | grep -Fxq "$query"
}

has_any_installed_version() {
  "$code_server" --list-extensions --show-versions 2>/dev/null | grep -Eq "^${extension_id}@"
}

install_extension() {
  local ref="$1"
  "$code_server" --install-extension "$ref" --force >/dev/null 2>&1
}

code_server="$(find_code_server || true)"
if [ -z "$code_server" ]; then
  echo "Codex pin skipped: could not find code-server under ${HOME}/.vscode-server/bin" >&2
  exit 0
fi

if is_installed "$extension_ref"; then
  exit 0
fi

if install_extension "$extension_ref" && is_installed "$extension_ref"; then
  exit 0
fi

if has_any_installed_version; then
  echo "Codex pin skipped: ${extension_id} is installed but not on ${pinned_version}" >&2
  exit 0
fi

echo "Codex pin fallback: failed to install ${extension_ref}, installing latest ${extension_id}" >&2
if install_extension "$extension_id" && has_any_installed_version; then
  exit 0
fi

echo "Codex extension install failed for ${extension_id}" >&2
exit 1

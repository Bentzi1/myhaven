#!/usr/bin/env bash
set -euo pipefail

extension_id="openai.chatgpt"
pinned_version="26.513.21555"
extension_ref="${extension_id}@${pinned_version}"
pinned_dir="${HOME}/.vscode-server/extensions/${extension_id}-${pinned_version}-linux-x64"

if [ -d "$pinned_dir" ]; then
  exit 0
fi

code_server=""
for candidate in "${HOME}"/.vscode-server/bin/*/bin/code-server; do
  if [ -x "$candidate" ]; then
    code_server="$candidate"
  fi
done

if [ -z "$code_server" ]; then
  echo "Codex pin skipped: could not find code-server under ${HOME}/.vscode-server/bin" >&2
  exit 0
fi

"$code_server" --uninstall-extension "$extension_id" >/dev/null 2>&1 || true
"$code_server" --install-extension "$extension_ref" --force

#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -gt 1 ]; then
  echo "Usage: $0 [repo-root]" >&2
  exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
default_root="$(cd "$script_dir/.." && pwd)"
root="${1:-$default_root}"

if [ ! -d "$root" ]; then
  echo "repo root does not exist: $root" >&2
  exit 2
fi

root="$(cd "$root" && pwd -P)"

old_path='github.com/linkease/quick-start/istore'
old_path="${old_path}-backend"
new_path="github.com/istoreos/quickstart/backend"

mapfile -d '' files < <(
  grep -RIlZ \
    --exclude-dir=.git \
    --exclude-dir=vendor \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=dist \
    --exclude-dir=build \
    -- "$old_path" "$root" || true
)

if [ "${#files[@]}" -eq 0 ]; then
  echo "No files contain $old_path"
  exit 0
fi

for file in "${files[@]}"; do
  OLD_PATH="$old_path" NEW_PATH="$new_path" perl -0pi -e 's/\Q$ENV{OLD_PATH}\E/$ENV{NEW_PATH}/g' "$file"
done

echo "Replaced $old_path with $new_path in ${#files[@]} file(s)."

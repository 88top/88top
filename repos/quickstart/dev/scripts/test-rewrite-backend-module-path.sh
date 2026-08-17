#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
script="$repo_root/scripts/rewrite-backend-module-path.sh"

old_path='github.com/linkease/quick-start/istore'
old_path="${old_path}-backend"
new_path="github.com/istoreos/quickstart/backend"

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

mkdir -p "$tmpdir/backend/pkg" "$tmpdir/.git" "$tmpdir/vendor/pkg" "$tmpdir/node_modules/pkg"

cat > "$tmpdir/backend/go.mod" <<EOF
module $old_path
EOF

cat > "$tmpdir/backend/pkg/example.go" <<EOF
package pkg

import "$old_path/models"
EOF

cat > "$tmpdir/.git/config" <<EOF
$old_path
EOF

cat > "$tmpdir/vendor/pkg/example.go" <<EOF
package pkg

import "$old_path/models"
EOF

cat > "$tmpdir/node_modules/pkg/example.js" <<EOF
const modulePath = "$old_path";
EOF

bash "$script" "$tmpdir" >/tmp/rewrite-backend-module-path-test.out
bash "$script" "$tmpdir" >/tmp/rewrite-backend-module-path-test-second.out

grep -q "module $new_path" "$tmpdir/backend/go.mod"
grep -q "$new_path/models" "$tmpdir/backend/pkg/example.go"
grep -q "$old_path" "$tmpdir/.git/config"
grep -q "$old_path/models" "$tmpdir/vendor/pkg/example.go"
grep -q "$old_path" "$tmpdir/node_modules/pkg/example.js"

if grep -R --exclude-dir=.git --exclude-dir=vendor --exclude-dir=node_modules -q "$old_path" "$tmpdir"; then
  echo "old module path remains in replaceable files" >&2
  exit 1
fi

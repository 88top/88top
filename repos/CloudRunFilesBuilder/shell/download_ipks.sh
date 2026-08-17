#!/bin/bash

echo "=== Starting download ==="

mkdir -p all x86 arm64 arm64-a53

download() {
  local url=$1
  local dir=$2
  if [ -z "$url" ]; then
    echo "⚠️  URL empty, skip $dir"
    return 0
  fi
  echo "→ $dir/: $url"
  if wget -q --timeout=30 --tries=3 "$url" -P "$dir/"; then
    echo "   ✓ Success"
  else
    echo "   ❌ Failed: $url"
  fi
}

download "$LUCI_MAIN_URL" "all"
download "$X86_DAED_URL" "x86"
download "$X86_DAE_URL" "x86"
download "$X86_VMLINUX_BTF_URL" "x86"

download "$ARM_GENERIC_DAED_URL" "arm64"
download "$ARM_GENERIC_DAE_URL" "arm64"
download "$ARM_GENERIC_VMLINUX_BTF_URL" "arm64"
cp all/*.ipk arm64/ 2>/dev/null || true

download "$ARM_A53_DAED_URL" "arm64-a53"
download "$ARM_A53_DAE_URL" "arm64-a53"
download "$ARM_A53_VMLINUX_BTF_URL" "arm64-a53"
cp all/*.ipk arm64-a53/ 2>/dev/null || true

# 版本提取
fname=$(basename "${LUCI_MAIN_URL}")
VERSION=$(echo "$fname" | grep -oP '\d{4}\.\d{2}\.\d{2}' | head -n1)
if [ -z "$VERSION" ]; then
  VERSION=$(date +'%Y.%m.%d')
fi
echo "VERSION=$VERSION" >> $GITHUB_ENV
echo "✅ VERSION = $VERSION"

echo "=== Download finished ==="
ls -lh */*.ipk 2>/dev/null | cat || echo "No .ipk files downloaded"
echo "Download step completed."

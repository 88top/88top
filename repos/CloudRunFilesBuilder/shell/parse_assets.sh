#!/bin/bash
set -euo pipefail

echo "=== Parsing release assets ==="

if [ ! -f release.json ]; then
  echo "❌ release.json not found!"
  exit 1
fi

# 解析 URL
X86_DAED_URL=$(jq -r '.assets[] | select(.name | test("daed_.*_x86_64\\.ipk$")) | .browser_download_url' release.json | head -n1)
X86_DAE_URL=$(jq -r '.assets[] | select(.name | test("dae_.*_x86_64\\.ipk$")) | .browser_download_url' release.json | head -n1)

ARM_A53_DAED_URL=$(jq -r '.assets[] | select(.name | test("daed_.*_aarch64_cortex-a53\\.ipk$")) | .browser_download_url' release.json | head -n1)
ARM_A53_DAE_URL=$(jq -r '.assets[] | select(.name | test("dae_.*_aarch64_cortex-a53\\.ipk$")) | .browser_download_url' release.json | head -n1)

ARM_GENERIC_DAED_URL=$(jq -r '.assets[] | select(.name | test("daed_.*_aarch64_generic\\.ipk$")) | .browser_download_url' release.json | head -n1)
ARM_GENERIC_DAE_URL=$(jq -r '.assets[] | select(.name | test("dae_.*_aarch64_generic\\.ipk$")) | .browser_download_url' release.json | head -n1)

LUCI_MAIN_URL=$(jq -r '.assets[] | select(.name | test("^luci-app-daede.*\\.ipk$")) | .browser_download_url' release.json | head -n1)

# 固定链接
X86_VMLINUX_BTF_URL="https://github.com/kenzok8/vmlinux-btf/releases/download/latest/vmlinux-btf_6.6.141-r1_x86_64.ipk"
ARM_A53_VMLINUX_BTF_URL="https://github.com/kenzok8/vmlinux-btf/releases/download/latest/vmlinux-btf_6.6.141-r1_aarch64_cortex-a53.ipk"
ARM_GENERIC_VMLINUX_BTF_URL="https://github.com/kenzok8/vmlinux-btf/releases/download/latest/vmlinux-btf_6.6.141-r1_aarch64_generic.ipk"

# 正确写入 GITHUB_ENV（关键修复）
{
  echo "X86_DAED_URL=$X86_DAED_URL"
  echo "X86_DAE_URL=$X86_DAE_URL"
  echo "X86_VMLINUX_BTF_URL=$X86_VMLINUX_BTF_URL"
  echo "ARM_A53_DAED_URL=$ARM_A53_DAED_URL"
  echo "ARM_A53_DAE_URL=$ARM_A53_DAE_URL"
  echo "ARM_A53_VMLINUX_BTF_URL=$ARM_A53_VMLINUX_BTF_URL"
  echo "ARM_GENERIC_DAED_URL=$ARM_GENERIC_DAED_URL"
  echo "ARM_GENERIC_DAE_URL=$ARM_GENERIC_DAE_URL"
  echo "ARM_GENERIC_VMLINUX_BTF_URL=$ARM_GENERIC_VMLINUX_BTF_URL"
  echo "LUCI_MAIN_URL=$LUCI_MAIN_URL"
} >> $GITHUB_ENV

# 调试输出
echo "✅ Parse completed successfully!"
echo "LUCI_MAIN_URL     = ${LUCI_MAIN_URL:-EMPTY}"
echo "X86_DAED_URL      = ${X86_DAED_URL:-EMPTY}"
echo "ARM_GENERIC_DAED_URL = ${ARM_GENERIC_DAED_URL:-EMPTY}"

if [ -z "$LUCI_MAIN_URL" ] || [ -z "$X86_DAED_URL" ]; then
  echo "⚠️ Some URLs are empty!"
else
  echo "✅ All main URLs parsed successfully."
fi

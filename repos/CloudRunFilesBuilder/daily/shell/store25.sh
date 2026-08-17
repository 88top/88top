#!/bin/bash

set -e

BASE_URL="https://istore.istoreos.com/repo-apk/all/store/"
TARGET_DIR="store"

mkdir -p "$TARGET_DIR"

echo "[+] Fetching .apk list..."

wget -qO- "$BASE_URL" \
| grep -oE 'href="[^"]+\.apk"' \
| cut -d'"' -f2 \
| while read -r apk; do
    [ -z "$apk" ] && continue

    echo "[+] Downloading $apk ..."
    wget -q -O "$TARGET_DIR/$apk" "${BASE_URL}${apk}"
done

echo "[✓] Done. Saved in: $TARGET_DIR"

#!/bin/bash
mkdir -p armbian

# 读取环境变量 (带默认值)
VERSION_TYPE="${VERSION_TYPE:-standard}"
if [ "$VERSION_TYPE" = "debian12_minimal" ]; then
  echo "构建debian12_minimal-armbian..."
  FILE_NAME="Armbian_25.2.1_Uefi-x86_bookworm_current_6.12.13_minimal.img.xz"
elif [ "$VERSION_TYPE" = "ubuntu24_minimal" ]; then
  echo "构建ubuntu24_minimal-armbian..." 
  FILE_NAME="Armbian_25.2.1_Uefi-x86_noble_current_6.12.13_minimal.img.xz"
elif [ "$VERSION_TYPE" = "homeassistant_debian12_minimal" ]; then
  echo "构建homeassistant全家桶版armbian..." 
  FILE_NAME="Armbian_25.2.3_Uefi-x86_bookworm_current_6.12.17-homeassistant_minimal.img.xz"
else 
  echo "构建standard-armbian..."
  FILE_NAME="Armbian_25.2.1_Uefi-x86_noble_current_6.12.13.img.xz"
fi

REPO="wukongdaily/img-installer"
TAG="2025-03-12"
OUTPUT_PATH="armbian/armbian.img.xz"

DOWNLOAD_URL=$(curl -s https://api.github.com/repos/$REPO/releases/tags/$TAG | jq -r '.assets[] | select(.name == "'"$FILE_NAME"'") | .browser_download_url')

if [[ -z "$DOWNLOAD_URL" ]]; then
  echo "错误：未找到文件 $FILE_NAME"
  exit 1
fi

echo "下载地址: $DOWNLOAD_URL"
echo "下载文件: $FILE_NAME -> $OUTPUT_PATH"
curl -L -o "$OUTPUT_PATH" "$DOWNLOAD_URL"

if [[ $? -eq 0 ]]; then
  echo "下载armbian成功!"
  file armbian/armbian.img.xz
  echo "正在解压为:armbian.img"
  xz -d armbian/armbian.img.xz
  ls -lh armbian/
  echo "准备合成 armbian 安装器"
else
  echo "下载失败！"
  exit 1
fi

mkdir -p output
docker run --privileged --rm \
        -v $(pwd)/output:/output \
        -v $(pwd)/supportFiles:/supportFiles:ro \
        -v $(pwd)/armbian/armbian.img:/mnt/armbian.img \
        debian:buster \
        /supportFiles/build.sh
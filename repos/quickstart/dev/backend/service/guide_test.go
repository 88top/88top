package service

import (
	"log"
	"testing"
)

func TestGetDistFeedUrl(t *testing.T) {
	content := `src/gz istoreos_core https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/21.02.3/targets/x86/64/packages
src/gz istoreos_base https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/21.02.3/packages/x86_64/base
src/gz istoreos_luci https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/21.02.3/packages/x86_64/luci
src/gz istoreos_packages https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/21.02.3/packages/x86_64/packages
src/gz istoreos_routing https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/21.02.3/packages/x86_64/routing
src/gz istoreos_telephony https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/21.02.3/packages/x86_64/telephony
	`
	urlStr, err := getOpkgDistFeedUrlByContent(content)
	if err != nil {
		t.Error(err)
	}
	log.Println("urlStr=", urlStr)
	if urlStr != "https://mirrors.tuna.tsinghua.edu.cn/openwrt/" {
		t.Error("not equal")
	}
	content = `
src/gz openwrt_base https://downloads.openwrt.org/releases/21.02.3/packages/aarch64_cortex-a53/base
src/gz openwrt_luci https://downloads.openwrt.org/releases/21.02.3/packages/aarch64_cortex-a53/luci
src/gz openwrt_packages https://downloads.openwrt.org/releases/21.02.3/packages/aarch64_cortex-a53/packages
	`
	urlStr, err = getOpkgDistFeedUrlByContent(content)
	if err != nil {
		t.Error(err)
	}
	log.Println("urlStr=", urlStr)
	if urlStr != "https://downloads.openwrt.org/" {
		t.Error("not equal")
	}

	content = `https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/25.12.4/targets/armsr/armv8/packages/packages.adb
https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/25.12.4/packages/aarch64_generic/base/packages.adb
https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/25.12.4/targets/armsr/armv8/kmods/6.12.87-1-1f1a8723cca69c83dc152592510e876a/packages.adb
https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/25.12.4/packages/aarch64_generic/luci/packages.adb
https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/25.12.4/packages/aarch64_generic/packages/packages.adb
https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/25.12.4/packages/aarch64_generic/routing/packages.adb
https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/25.12.4/packages/aarch64_generic/telephony/packages.adb
https://mirrors.tuna.tsinghua.edu.cn/openwrt/releases/25.12.4/packages/aarch64_generic/video/packages.adb
	`
	urlStr, err = getApkDistFeedUrlByContent(content)
	if err != nil {
		t.Error(err)
	}
	log.Println("urlStr=", urlStr)
	if urlStr != "https://mirrors.tuna.tsinghua.edu.cn/openwrt/" {
		t.Error("not equal")
	}
	content = `
https://downloads.openwrt.org/releases/25.12.4/targets/armsr/armv8/packages/packages.adb
https://downloads.openwrt.org/releases/25.12.4/packages/aarch64_generic/base/packages.adb
https://downloads.openwrt.org/releases/25.12.4/targets/armsr/armv8/kmods/6.12.87-1-1f1a8723cca69c83dc152592510e876a/packages.adb
https://downloads.openwrt.org/releases/25.12.4/packages/aarch64_generic/luci/packages.adb
https://downloads.openwrt.org/releases/25.12.4/packages/aarch64_generic/packages/packages.adb
https://downloads.openwrt.org/releases/25.12.4/packages/aarch64_generic/routing/packages.adb
https://downloads.openwrt.org/releases/25.12.4/packages/aarch64_generic/telephony/packages.adb
https://downloads.openwrt.org/releases/25.12.4/packages/aarch64_generic/video/packages.adb
	`
	urlStr, err = getApkDistFeedUrlByContent(content)
	if err != nil {
		t.Error(err)
	}
	log.Println("urlStr=", urlStr)
	if urlStr != "https://downloads.openwrt.org/" {
		t.Error("not equal")
	}
}

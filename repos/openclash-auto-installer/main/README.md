# OpenClash Auto Installer

![Release](https://img.shields.io/github/v/release/slobys/openclash-auto-installer?style=flat-square)
![License](https://img.shields.io/github/license/slobys/openclash-auto-installer?style=flat-square)
![Workflow](https://img.shields.io/github/actions/workflow/status/slobys/openclash-auto-installer/shell-check.yml?branch=main&style=flat-square)

适用于 **OpenWrt / iStoreOS / ImmortalWrt** 的代理插件安装、更新、卸载与检查脚本集合。

已集成：

- OpenClash
- PassWall
- PassWall2
- Nikki
- SmartDNS
- MosDNS
- daed

---

## 一键使用

推荐直接使用菜单模式，安装、更新、检查版本和卸载都在菜单里：

```sh
wget -qO /usr/bin/openclash-menu https://raw.githubusercontent.com/slobys/openclash-auto-installer/main/menu.sh && chmod +x /usr/bin/openclash-menu && openclash-menu
```

国内访问 GitHub 较慢时，可使用 Gitee 入口：

```sh
wget -qO /usr/bin/openclash-menu https://gitee.com/naiyou88/openclash-auto-installer/raw/main/menu.sh && chmod +x /usr/bin/openclash-menu && OPENCLASH_AUTO_BASE_URL=https://gitee.com/naiyou88/openclash-auto-installer/raw/main openclash-menu
```

如果系统已安装 `curl`，也可以使用：

```sh
curl -fsSL https://raw.githubusercontent.com/slobys/openclash-auto-installer/main/menu.sh -o /usr/bin/openclash-menu && chmod +x /usr/bin/openclash-menu && openclash-menu
```

菜单结构：

```text
1. 检查插件更新
2. 安装插件
3. 卸载插件
0. 退出
```

---

## 支持范围

推荐使用：

- OpenWrt 24.10.x
- iStoreOS 24.10.x
- ImmortalWrt 24.10.x

可尝试但建议先验证：

- OpenWrt 25.12+ / `apk` 环境
- OpenWrt 23.05.x / 22.03.x
- 第三方固件或精简固件

---

## 功能说明

| 插件 | 支持内容 | 说明 |
|------|----------|------|
| OpenClash | 安装 / 更新 / 核心安装 / 卸载 / 更新检测 | 自动识别 Meta / Smart Meta 内核 |
| PassWall | 安装 / 更新 / 卸载 / 更新检测 | 支持 `opkg`；OpenWrt 25.12+ 下尝试安装上游 `.apk` 构建 |
| PassWall2 | 安装 / 更新 / 卸载 / 更新检测 | 支持 `opkg`；OpenWrt 25.12+ 下尝试安装上游 `.apk` 构建 |
| Nikki | 安装 / 更新 / 卸载 / 更新检测 | 需要 `firewall4/nftables` |
| SmartDNS | 安装 / 更新 / 卸载 / 更新检测 | 使用官方 GitHub Release 包 |
| MosDNS | 安装 / 更新 / 卸载 / 更新检测 | 使用 `sbwml/luci-app-mosdns` GitHub Release 包 |
| daed | 安装 / 更新 / LuCI 管理 / 卸载 / 更新检测 | 使用官方静态二进制，并集成 `luci-app-daed`，面板端口为 `2023` |

---

## OpenWrt 25.12+ / apk 说明

OpenWrt 25.12+ 使用 `apk` 包管理器，本项目已同步适配：

- 安装 / 更新
- 检查更新
- 卸载

PassWall / PassWall2 在 25.12+ 下会尝试安装上游 `.apk` 构建，实际可用性取决于上游是否发布对应架构包。

---

## 重要说明

- 推荐 OpenWrt / iStoreOS / ImmortalWrt 24.x 及以上，整体更稳定。
- 低版本、魔改固件、精简固件可能遇到依赖或软件源不兼容。
- OpenWrt 25.12+ 的 `apk` 环境已做基础适配，但仍可能受上游包影响。
- Nikki 不支持 `iptables` 防火墙栈，需要 `firewall4/nftables`。
- SmartDNS 只安装程序和 LuCI 界面，不自动接管或改写 DNS 配置。
- MosDNS 只安装程序、LuCI 界面和上游 Release 包内的基础数据包，不自动接管或改写 DNS 配置。
- daed 全新安装后，LuCI 中的“启用”选项默认不勾选，请在“服务 → DAED”中手动启用；脚本不会在安装结束时额外停止或禁用服务。启动后可查看日志和打开仪表板，也可直接访问 `http://路由器IP:2023`。
- LuCI DAED 界面使用 `QiuSimons/luci-app-daed` 的 OpenWrt 24.10 `ipk` 或 25.12 `apk`；25.12 会完整使用匹配架构的上游 daed APK，避免通用静态核心覆盖 OpenWrt 专用核心与服务脚本。旧版或特殊固件若界面包不兼容，脚本仍会保留可独立使用的 daed 后端。
- daed 依赖 eBPF/BTF，要求 Linux 5.17+ 且内核开启相关能力；许多裁剪过的 OpenWrt 固件无法运行。
- OpenWrt 25.12 的 `apk` 与 LuCI 界面包已适配。官方原版固件缺少 BTF 时，脚本会从上游文档推荐的第三方软件源 `opkg.cooluc.com`，按当前 OpenWrt 大版本和 `DISTRIB_ARCH` 查找外置 `vmlinux-btf`。
- 完整内核版本一致的 `vmlinux-btf` 会自动安装；只有主次版本一致时，脚本会显示风险并要求确认，不会静默安装。外置 BTF 安装后仍会检查其他 eBPF 能力。
- 更新已启用的 daed 后，脚本会自动重启并确认服务能持续运行；若检测到旧核心的 `local_tcp_sockops` / `bpf_get_current_task` 不兼容错误，会取消启用并停止有限重试，避免持续崩溃刷日志。
- OpenWrt 25.12 更新 daed 时会同时移除旧核心与 LuCI 依赖包后重新安装，并确认旧核心确实已从 `apk` 中移除，避免同版本包未被覆盖。
- daed 安装后约占用 85MB，安装过程还要求 `/tmp` 至少有 130MB 可用空间。
- daed 官方预编译包支持 arm64、MIPS32/64、RISC-V 64 和 x86，不支持 ARMv7 等未发布架构。
- 卸载默认走安全卸载，只移除主包和对应配置，不做激进清理。

---

## 文件说明

| 文件 | 作用 |
|------|------|
| `menu.sh` | 统一菜单入口 |
| `install.sh` | OpenClash 安装 / 更新 |
| `update.sh` | OpenClash 快速更新入口 |
| `repair.sh` | OpenClash 基础修复 |
| `passwall.sh` | PassWall 安装 / 更新 |
| `passwall2.sh` | PassWall2 安装 / 更新 |
| `nikki.sh` | Nikki 安装 / 更新 |
| `smartdns.sh` | SmartDNS 安装 / 更新 |
| `mosdns.sh` | MosDNS 安装 / 更新 |
| `daed.sh` | daed 安装 / 更新 |
| `check-updates.sh` | 检查插件更新 |
| `uninstall.sh` | 安全卸载插件 |
| `auto-download-pro.sh` | 旧入口兼容包装器，已转交给 `passwall.sh` |
| `test-auto-download.sh` | 旧测试入口兼容包装器，已转交给 `passwall.sh` |

---

## 致谢

- OpenClash: <https://github.com/vernesong/OpenClash>
- PassWall: <https://github.com/Openwrt-Passwall/openwrt-passwall>
- PassWall2: <https://github.com/Openwrt-Passwall/openwrt-passwall2>
- Nikki: <https://github.com/nikkinikki-org/OpenWrt-nikki>
- SmartDNS: <https://github.com/pymumu/smartdns>
- MosDNS LuCI: <https://github.com/sbwml/luci-app-mosdns>
- daed: <https://github.com/daeuniverse/daed>
- daed LuCI: <https://github.com/QiuSimons/luci-app-daed>

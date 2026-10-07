# 固件与插件验证报告（2026-10-07）

本次面向 v1.3.0。使用官方发布源，区分“安装通过”“核心可执行”和“完整内核运行”，不把容器测试当成所有路由器的兼容承诺。

## 固件基线

| 系统 | 本次版本 | 架构 / 包管理器 | 验证环境 |
|---|---|---|---|
| OpenWrt 最新稳定版 | 25.12.5 | x86_64 / APK | 官方 generic-targz-rootfs 独立容器 |
| OpenWrt 24.10 分支最新 | 24.10.8 | x86_64 / OPKG | 官方 rootfs 独立容器 |
| iStoreOS 最新正式版 | 25.12.5-2026092410 | x86_64 / APK | 官方镜像原始 squashfs 独立容器；另以 QEMU 启动官方镜像 |

来源：[OpenWrt 正式发布目录](https://downloads.openwrt.org/releases/)、[iStoreOS 正式镜像目录](https://fw.koolcenter.com/iStoreOS/x86_64/)、[iStoreOS OTA 元数据](https://fw.koolcenter.com/iStoreOS/x86_64/version.latest.v2)。未将 alpha/SNAPSHOT 当成最新正式版本。

iStoreOS 镜像 SHA-256：`42a50d85173127748df53e3da7afe607eb97edbbc7e814d7706868e8b1d84eed`。OpenWrt 两个根文件系统均与对应官方 `sha256sums` 核对。iStoreOS 不是修改 OpenWrt 版本号模拟出来的环境，保留其原始包数据库和软件源。

## 安装矩阵

下表六项均在三个系统中分别全新安装成功（18 个基础安装场景），并检查包数据库、配置文件和 init 服务文件。OpenWrt 根文件系统在容器中补充正常启动时生成的运行目录；24.10 根文件系统额外安装 LuCI、firewall4 等测试基础包。不改宿主机网络，不将宿主机内核当作固件内核。

| 插件 | 安装版本 | OpenWrt 24.10.8 | OpenWrt 25.12.5 | iStoreOS 25.12.5 |
|---|---|---|---|---|
| OpenClash | 0.47.156 | 通过 | 通过 | 通过 |
| PassWall | 26.10.4-r1 | 通过 | 通过 | 通过 |
| PassWall2 | 26.10.1-r2 | 通过 | 通过 | 通过 |
| Nikki LuCI | 1.26.1-r1 | 通过 | 通过 | 通过 |
| SmartDNS | Release48.4 / 1.2026.08.05-0921 | 通过 | 通过 | 通过 |
| MosDNS | 5.3.4-r14 | 通过 | 通过 | 通过 |

APK 对 SmartDNS 包修订号显示为 `1.2026.08.05-r0921`，不是不同的上游版本。MosDNS LuCI 为 `1.7.14-r1`，包含 `geo2txt` 依赖。

- 变更后的 PassWall、PassWall2、Nikki 在两个 APK 系统重新全新安装（6 项）；Nikki OPKG 路径额外复测。
- 三项变更插件在 iStoreOS 重复安装，并对自定义配置做前后 SHA-256 比较：保留配置。
- 18 个已安装插件逐一执行更新查询，均成功识别当前版本，未出现 `unknown` 或 `not installed` 误报。
- OpenClash Meta 核心、SmartDNS、MosDNS 的版本命令在三个系统均通过；Nikki Mihomo 核心版本为 1.19.31，并验证可执行。
- 容器中的 procd/ubus 不等同于完整启动系统，部分包 post-install 会提示 ubus 不可用；包记录及核心检查单独验收。
- 不包含真实订阅、节点连通性、透明代理转发、DNS 接管或实体设备性能测试。

## daed 单独验证

在 iStoreOS 官方镜像 QEMU 虚拟机中，实际内核为 `6.12.94`，存在内置 `/sys/kernel/btf/vmlinux`：

- 完整执行 `daed.sh`，安装 OpenWrt 专用核心 `2026.07.31-r1`、LuCI `1.4-r1` 和中文包。
- 在确认内置 BTF 存在后补齐 `vmlinux-btf` 包能力记录，未覆盖 BTF 文件。
- 全新安装默认未启用；测试中手动启用后，进程持续存在，2023 端口监听，HTTP 返回仪表板 HTML。
- 在已启用状态再次执行最新版脚本，核心替换、包重新登记和启动检查均成功，保留启用状态。
- APK 版本查询改为比较 `QiuSimons/luci-app-daed` 的 OpenWrt 构建，不再与通用 `daeuniverse/daed` 版本比较。
- 通用 daed 当前为 v2.1.1；下载 x86_64 ZIP、核对上游 SHA-256，并执行版本命令。它不替换已验证的 OpenWrt APK 专用核心。

**边界：** 本次没有在官方 OpenWrt 内核中验证 daed 的 eBPF 运行，也未验证 ARM/MIPS 硬件。安装脚本仍检查内核/eBPF/BTF 条件；不满足条件时不能强行安装或把虚拟包当成实际 BTF。仪表板可访问不代表配置节点后的透明代理数据面已测试。

## 签名与上游版本

PassWall / PassWall2 APK 改用上游推荐的签名源，安装时预下载事务包；依赖由 APK 统一解析。签名失败不会自动降级为 `--allow-untrusted`。

- 官方公钥：[apk.pub](https://sourceforge.net/projects/openwrt-passwall-build/files/apk.pub/download)
- 公钥 SHA-256：`52802b143489214e13b78f96599a147a638205cc22d9dd6d71229504e38ddc00`
- 源目录：`releases/packages-25.12/x86_64/{passwall_luci,passwall2,passwall_packages}`。
- 两个索引的 `apk verify` 均通过；签名源与 GitHub 最新包版本分别一致为 `26.10.4-r1`、`26.10.1-r2`。
- 密钥摘要不符时停止，提示核实上游换钥；签名源发布滞后时明确显示实际版本，不谎报 GitHub 最新版本。
- Nikki 使用其官方公钥并保持 APK 签名验证，移除多余的 `--allow-untrusted`。本次公钥 SHA-256 为 `677ef1af372065e2e856175363e2da9471a6c5c6443563b912c8d325bfa1fbad`。
- OpenClash、SmartDNS、MosDNS、daed 的直接 APK Release 路径仍使用已有的 `--allow-untrusted`；不宣称这些安装包经过发行者签名验证。

## 本次修复与复现

1. **Nikki 下载失败却报成功**：隔离环境让下载器返回 8，旧脚本仍退出 0 并显示 `unknown`；新脚本退出非零。下载为空同样拒绝执行，安装后必须读到包版本。
2. **Nikki 不支持的版本提前拒绝**：`23.05-SNAPSHOT` 不映射到 24.10；支持范围跟随上游的 24.10 / 25.12 / SNAPSHOT，仍要求 firewall4。
3. **daed APK 更新误报**：同一个已安装专用构建，修复前与 `v2.1.1` 比较并提示更新，修复后显示 `2026.07.31-r1` 已是最新。
4. **修订版更新漏报**：`26.10.1-r1` 对 `26.10.1-2` 现在提示可更新；上游不带包修订号的 Nikki `v1.26.1` 不误报。
5. 保留此前的依赖补齐、dnsmasq-full 切换、MosDNS geo2txt 与 APK 版本读取修复。本次正式 Release 一并包含此前只在 main 的更新。

## 复核命令

```sh
python3 -m unittest discover -s tests -v
for f in *.sh; do sh -n "$f" || exit 1; done
shellcheck *.sh
git diff --check
```

离线回归使用真实脚本函数，覆盖发行分支、IPK/APK 资产选择（单行 JSON 和页面解析后的 URL 列表）、错误/空下载、公钥不符、daed 版本来源及包修订比较。实时上游可变化，本报告记录的是 2026-10-07 的验证结果，不承诺后续版本永久兼容。

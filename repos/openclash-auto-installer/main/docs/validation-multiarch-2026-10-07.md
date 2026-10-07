# 全架构验证报告（2026-10-07 / v1.3.1）

## 范围与结果

以官方发布目录为准，OpenWrt 25.12.5 的 **35 个 CPU/ABI**、24.10.8 的 **36 个 CPU/ABI** 全部纳入矩阵（两代合并 37 种目录名）；另加 6 个 iStoreOS 原始镜像，共 **77 个环境、462 个六插件验证项**。这不等于 462 项全部通过，也不代表每种实体 CPU 的最低指令集均已实测。

最终结果：**239 项安装、包记录及核心版本通过；135 项安装及包记录通过；82 项未通过；6 项环境受阻**。因此安装通过共 374 项，实际尝试 456 项。daed 独立验证，不混入上述六插件计数。

- **I+C**：安装退出 0、包数据库有主包，核心版本命令退出 0。通常在隔离根文件系统中执行，不等于固件内核下服务可用。
- **I**：安装及主包记录通过；PassWall/PassWall2 未覆盖所有用户选用的 Xray、sing-box 等核心。Octeon MosDNS 的版本命令受模拟器故障影响，也仅记 I。
- **F**：未通过。包括上游缺资产/依赖/软件源，以及实际二进制不能执行；不是一概归咎于脚本。
- **B**：尚未完成实装。仅 OpenWrt 24.10.8 `mips64_octeonplus` 的 6 项，OPKG 在用户态模拟器中 SIGBUS，缺少匹配的完整 Octeon 虚拟机，仍需实体设备补验。

机器可读证据：[JSON（逐项退出码、版本输出、来源与 SHA-256）](validation-multiarch-2026-10-07.json)、[CSV](validation-multiarch-2026-10-07.csv)。原 x86 报告保留为 [v1.3.0 历史基线](validation-2026-10-07.md)。

## 固件来源与方法

- 官方源：[OpenWrt releases](https://downloads.openwrt.org/releases/)、[25.12.5 ABI 目录](https://downloads.openwrt.org/releases/25.12.5/packages/)、[24.10.8 ABI 目录](https://downloads.openwrt.org/releases/24.10.8/packages/)、[iStoreOS 镜像目录](https://fw.koolcenter.com/iStoreOS/)。不采用 alpha/SNAPSHOT。
- 71 个 OpenWrt 官方根文件系统，按实际 profiles/目录选择 rootfs 或镜像提取 squashfs，核对上游 SHA-256。保留原始发行信息、包数据库和软件源，没有伪造 CPU 架构或内核包版本。
- iStoreOS：x86_64、armsr、r4s、rpi4、rpi5 为 `25.12.5-2026092410`；seed-ac1 为 `25.12.5-2026091716`。前五者对照官方摘要；seed-ac1 官方目录未提供可用摘要，仅记录下载内容 SHA-256，不能称为已与上游摘要比对。
- iStoreOS 其他旧设备目录仍可能发布 21.02/22.03，不能把所有设备的“最新版本”统一写成 25.12。本次六个代表镜像不是逐板卡/旧版本验证。
- 通常每个插件使用独立干净容器；添加正常启动所需临时目录及 curl、证书、LuCI 等前置包。外架构通过 QEMU 用户态模拟（7.2，个别最低指令集诊断使用 10.0.13）；包脚本真实执行，没有用跳过安装脚本代替成功。
- 24.10 MIPS64 大端/小端的 OPKG 用户态模拟 SIGBUS，通过启动官方 Malta initramfs 与内核 `6.6.144` 补测。这两台完整虚拟机按顺序安装六个插件，**不是每插件独立全新固件**；表中优先报告完整固件结果。
- GitHub 限流/SourceForge 限速后，重测使用本轮官方元数据快照和原始下载内容的本地缓存；缓存不改写包字节。PassWall/Nikki 软件源仍由包管理器验证签名；其余直接 APK 的既有 `--allow-untrusted` 路径不能称为已验证发行者签名。
- ELF 检查对 302 个已取得核心/辅助程序核对机器类型、位数、字节序，无最终匹配错误；这不是 302 个服务运行测试。SmartDNS MIPS64 的 32 位兼容资产单独标记。
- 所有结果是当日上游快照。测试没有真实订阅、路由接管、代理流量或实体设备性能结论。

## 上游版本与发现

| 插件 | 本轮上游版本 / 构建 |
|---|---|
| OpenClash | v0.47.156；Meta alpha-ge183c58 |
| PassWall | 26.10.4-1 / APK 26.10.4-r1 |
| PassWall2 | 26.10.1-2 / APK 26.10.1-r2 |
| Nikki | 1.26.1 |
| SmartDNS | Release48.4 / 1.2026.08.05-0921 |
| MosDNS | v5.3.4-r14 |
| daed | 通用 v2.1.1；OpenWrt 专用 2026.07.31-r1 / LuCI 1.4-r1 |

1. **ABI 优先于内核位数**：OpenClash/SmartDNS 原先可能用 64 位内核名覆盖 32 位用户态。现在优先采用固件 `DISTRIB_ARCH`，补齐 MIPS 大小端、RISC-V、LoongArch 及 ARM 子架构。
2. **APK 与遗留 OPKG 并存**：seed-ac1 原始固件含 opkg 可执行文件，但实际使用 APK 数据库和源。10 个安装/维护入口统一优先采用有效 APK 数据库；六插件重测通过。
3. **不能执行不报成功**：OpenClash/通用 daed 在替换旧核心（及 daed 停旧服务）之前执行版本检查；SmartDNS 在包安装后、脚本显式重启前检查。SmartDNS 检查失败不会回滚已安装软件包，需更换兼容包/固件；不能把它描述成事务回滚。
4. **最低 CPU 指令集**：OpenClash 386 核心为 `GO386=sse2`，在现代 x86 主机 IA32 模式通过不表示 Pentium/MMX 可用；无 SSE2 的模拟 CPU 失败。SmartDNS ARM 包 ELF 属性为 ARMv5T，ARMv4 失败，ARM926 通过，因此拒绝 FA526/ARMv4 与 ARM 大端错误匹配。
5. **MIPS64 的安装不等于运行**：SmartDNS 上游只有对应大小端的 O32 包。用户态模拟可运行，但本次官方 Malta 64 位内核不能执行该 32 位包，最终记 F。MIPS64 OpenClash 在用户态模拟与完整虚拟机结果不同；完整 Malta 虚拟机 SIGILL，解开 UPX 的诊断副本也失败，不擅自归因为实体硬件不支持。Octeon 核心同样需硬件核实。
6. **缺包清楚记录**：ARM 大端、PowerPC 缺多项上游资产；Nikki 对若干 ARM32、MIPS64 通用、旧 x86 ABI 无可安装包；LoongArch PassWall 缺必要依赖。对应 F 不是兼容承诺，也不通过强制改包架构伪造成功。
7. 修复 GitHub API 失败后的残缺 JSON 和 HTML `*name` 路由占位符误当版本；daed APK 无专用架构包时通用回退不再使用空标签。

## daed 单独验证

| 通用资产 | 核心版本检查 | 边界 |
|---|---|---|
| arm64 | 通过 | 不等于所有 ARM64 固件 eBPF 可用 |
| x86_64 | 通过 | 固件内核要求另验 |
| x86_32 | 现代 x86 IA32 / QEMU 10 qemu32 通过 | 旧 Pentium/Pentium III 失败，不承诺全部 i386 CPU |
| riscv64 | 通过 | 未完成该架构固件内核下 eBPF 服务测试 |
| mips32 / mips32le | 失败 | 通用包需要 `/lib/ld.so.1`，原版 musl 固件没有该 glibc 加载器 |
| mips64 / mips64le | 失败 | 通用包需要 `/lib64/ld.so.1` |
| ARM32 / ARM 大端 / PowerPC / LoongArch | 无通用上游资产 | 不能运行验证不存在的发行包 |

全部 8 份通用 ZIP 均下载并与上游 `.dgst` 摘要核对，不能仅凭资产名宣称支持。专用 APK 与通用 ZIP 是不同构建，不能把通用探测结果泛化到全部专用包。

完整内核服务验证：x86_64 为历史基线，ARM64 为本轮 iStoreOS armsr 官方镜像；均为 `6.12.94`。ARM64 实际内置 BTF 大小 5,674,126 字节，专用 APK 安装后启用，进程持续存在，2023 HTTP 返回面板；在已启用状态重装当前脚本后进程和面板仍正常。加入配置标记前后配置 SHA-256 均为 `dad8f1e1efed5526a2f2fcb9bdf6aa3859c6755ed1899a4e53a8592b938b2e4e`，启用状态保留。**未覆盖全部架构的 eBPF 数据面，也没有真实代理流量验证。**

## 完整六插件矩阵

### OpenWrt 25.12.5 / APK

| CPU/ABI / 镜像 | OpenClash | PassWall | PassWall2 | Nikki | SmartDNS | MosDNS |
|---|---|---|---|---|---|---|
| aarch64_cortex-a53 | I+C | I | I | I+C | I+C | I+C |
| aarch64_cortex-a72 | I+C | I | I | I+C | I+C | I+C |
| aarch64_cortex-a76 | I+C | I | I | I+C | I+C | I+C |
| aarch64_generic | I+C | I | I | I+C | I+C | I+C |
| arm_arm1176jzf-s_vfp | I+C | I | I | F | I+C | I+C |
| arm_arm926ej-s | I+C | I | I | F | I+C | I+C |
| arm_cortex-a15_neon-vfpv4 | I+C | I | I | I+C | I+C | I+C |
| arm_cortex-a5_vfpv4 | I+C | I | I | I+C | I+C | I+C |
| arm_cortex-a7 | I+C | I | I | F | I+C | I+C |
| arm_cortex-a7_neon-vfpv4 | I+C | I | I | I+C | I+C | I+C |
| arm_cortex-a7_vfpv4 | I+C | I | I | F | I+C | I+C |
| arm_cortex-a8_vfpv3 | I+C | I | I | I+C | I+C | I+C |
| arm_cortex-a9 | I+C | I | I | I+C | I+C | I+C |
| arm_cortex-a9_neon | I+C | I | I | I+C | I+C | I+C |
| arm_cortex-a9_vfpv3-d16 | I+C | I | I | I+C | I+C | I+C |
| arm_fa526 | F | I | I | F | F | I+C |
| arm_xscale | I+C | I | I | F | I+C | I+C |
| armeb_xscale | F | F | F | F | F | F |
| i386_pentium-mmx | I+C | I | I | F | I+C | I+C |
| i386_pentium4 | I+C | I | I | I+C | I+C | I+C |
| loongarch64_generic | I+C | F | I | I+C | F | I+C |
| mips64_mips64r2 | I+C | I | I | F | I+C | I+C |
| mips64_octeonplus | F | I | I | I+C | I+C | I |
| mips64el_mips64r2 | I+C | I | I | F | I+C | I+C |
| mips_24kc | I+C | I | I | I+C | I+C | I+C |
| mips_mips32 | I+C | I | I | I+C | I+C | I+C |
| mipsel_24kc | I+C | I | I | I+C | I+C | I+C |
| mipsel_24kc_24kf | I+C | I | I | I+C | I+C | I+C |
| mipsel_74kc | I+C | I | I | I+C | I+C | I+C |
| mipsel_mips32 | I+C | I | I | I+C | I+C | I+C |
| powerpc64_e5500 | F | F | F | F | F | F |
| powerpc_464fp | F | F | F | F | F | F |
| powerpc_8548 | F | F | F | F | F | F |
| riscv64_generic | I+C | I | I | I+C | F | I+C |
| x86_64 | I+C | I | I | I+C | I+C | I+C |

### OpenWrt 24.10.8 / OPKG

| CPU/ABI / 镜像 | OpenClash | PassWall | PassWall2 | Nikki | SmartDNS | MosDNS |
|---|---|---|---|---|---|---|
| aarch64_cortex-a53 | I+C | I | I | I+C | I+C | I+C |
| aarch64_cortex-a72 | I+C | I | I | I+C | I+C | I+C |
| aarch64_cortex-a76 | I+C | I | I | I+C | I+C | I+C |
| aarch64_generic | I+C | I | I | I+C | I+C | I+C |
| arm_arm1176jzf-s_vfp | I+C | I | I | F | I+C | I+C |
| arm_arm926ej-s | I+C | I | I | F | I+C | I+C |
| arm_cortex-a15_neon-vfpv4 | I+C | I | I | I+C | I+C | I+C |
| arm_cortex-a5_vfpv4 | I+C | I | I | I+C | I+C | I+C |
| arm_cortex-a7 | I+C | I | I | F | I+C | I+C |
| arm_cortex-a7_neon-vfpv4 | I+C | I | I | I+C | I+C | I+C |
| arm_cortex-a7_vfpv4 | I+C | I | I | F | I+C | I+C |
| arm_cortex-a8_vfpv3 | I+C | I | I | I+C | I+C | I+C |
| arm_cortex-a9 | I+C | I | I | I+C | I+C | I+C |
| arm_cortex-a9_neon | I+C | I | I | I+C | I+C | I+C |
| arm_cortex-a9_vfpv3-d16 | I+C | I | I | I+C | I+C | I+C |
| arm_fa526 | F | I | I | F | F | I+C |
| arm_xscale | I+C | I | I | F | I+C | I+C |
| armeb_xscale | F | F | F | F | F | F |
| i386_pentium-mmx | I+C | I | I | F | I+C | I+C |
| i386_pentium4 | I+C | I | I | I+C | I+C | I+C |
| loongarch64_generic | I+C | F | I | F | F | I+C |
| mips64_mips64r2 | F | I | I | F | F | I+C |
| mips64_octeonplus | B | B | B | B | B | B |
| mips64el_mips64r2 | F | I | I | F | F | I+C |
| mips_24kc | I+C | I | I | I+C | I+C | I+C |
| mips_4kec | I+C | I | I | I+C | I+C | I+C |
| mips_mips32 | I+C | I | I | I+C | I+C | I+C |
| mipsel_24kc | I+C | I | I | I+C | I+C | I+C |
| mipsel_24kc_24kf | I+C | I | I | I+C | I+C | I+C |
| mipsel_74kc | I+C | I | I | I+C | I+C | I+C |
| mipsel_mips32 | I+C | I | I | I+C | I+C | I+C |
| powerpc64_e5500 | F | F | F | F | F | F |
| powerpc_464fp | F | F | F | F | F | F |
| powerpc_8548 | F | F | F | F | F | F |
| riscv64_riscv64 | I+C | I | I | I+C | F | I+C |
| x86_64 | I+C | I | I | I+C | I+C | I+C |

### iStoreOS / APK

| CPU/ABI / 镜像 | OpenClash | PassWall | PassWall2 | Nikki | SmartDNS | MosDNS |
|---|---|---|---|---|---|---|
| istore-armsr-aarch64_generic | I+C | I | I | I+C | I+C | I+C |
| istore-r4s-aarch64_generic | I+C | I | I | I+C | I+C | I+C |
| istore-rpi4-aarch64_cortex-a72 | I+C | I | I | I+C | I+C | I+C |
| istore-rpi5-aarch64_cortex-a76 | I+C | I | I | I+C | I+C | I+C |
| istore-seed-ac1-aarch64_cortex-a53 | I+C | I | I | I+C | I+C | I+C |
| istore-x86 | I+C | I | I | I+C | I+C | I+C |

## 发布检查

15 项离线回归覆盖真实 Shell 函数的全部架构映射、包管理器优先级、下载/API 失败、错误/空核心拒绝、旧核心与服务保留及包版本修订。执行：

```sh
python3 -m unittest discover -s tests -v
for f in *.sh; do sh -n "$f" || exit 1; done
shellcheck *.sh
git diff --check
```

发布附件提供来源/校验与最终安装日志，排除固件二进制、SSH 私钥、访问令牌。源码归档不是离线插件包；菜单脚本固定 tag 后，实时拉取的上游插件仍可能变化。

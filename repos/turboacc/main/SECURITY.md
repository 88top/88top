# Security Policy

[English](#english) | [简体中文](#简体中文)

## English

### Security contact

This project is maintained by [@mufeng05](https://github.com/mufeng05), who is also its security contact. Please report vulnerabilities privately as described below, not in public issues, pull requests or discussions.

### Reporting a vulnerability

Use GitHub private vulnerability reporting: open the [Security](https://github.com/mufeng05/turboacc/security) tab and click **Report a vulnerability**, or go to <https://github.com/mufeng05/turboacc/security/advisories/new>.

Please include:

- OpenWrt version or commit, kernel version, target/architecture, and whether you use firewall3 (iptables) or firewall4 (nftables)
- the affected component (Shortcut-FE, fullcone NAT, `luci-app-turboacc`, `add_turboacc.sh`, ...)
- steps to reproduce, a proof of concept if you have one, and the impact

I will acknowledge your report as soon as I can, keep you informed while it is confirmed and fixed, and agree on a disclosure date with you. After a fix is available I will publish a GitHub Security Advisory and credit you, unless you prefer not to be named.

### Supported versions

There are no tagged releases. Security fixes go to the latest commit on `main`, for the targets listed in the README (OpenWrt 24.10 / 25.12 / snapshot, kernel 6.6 / 6.12 / 6.18). Please check that the issue still reproduces on the latest `main`.

### Scope

In scope:

- `add_turboacc.sh` and everything under `custom/`: this project's own patches and Makefiles, and its customised `luci-app-turboacc` including the rpcd ucode backend
- the way this repository applies and combines the vendored code in an OpenWrt source tree

Code under `lede/` is synced from [coolsnowwolf/lede](https://github.com/coolsnowwolf/lede) and [coolsnowwolf/luci](https://github.com/coolsnowwolf/luci) by an automated workflow. If a vulnerability is in that code, please report it upstream too; reporting it here as well lets the copy in this repository be fixed.

Not vulnerabilities:

- Endpoint-independent mapping and filtering is how full cone NAT (NAT1) works: once an internal host opens a mapping, any external host can send packets to it.
- Issues in unmodified OpenWrt, the Linux kernel or other upstream projects; please report those to the project concerned.

## 简体中文

### 安全联系人

本项目的维护者兼安全联系人是 [@mufeng05](https://github.com/mufeng05)。发现安全漏洞请按下面的方式私下报告，不要发在公开的 Issue、Pull Request 或 Discussion 里。

### 报告漏洞

请使用 GitHub 私密漏洞报告：打开仓库的 [Security](https://github.com/mufeng05/turboacc/security) 页签，点击 **Report a vulnerability**，或直接访问 <https://github.com/mufeng05/turboacc/security/advisories/new>。

请尽量提供：

- OpenWrt 版本或 commit、内核版本、目标平台/架构，以及使用的是 firewall3（iptables）还是 firewall4（nftables）
- 受影响的组件（Shortcut-FE、全锥形 NAT、`luci-app-turboacc`、`add_turboacc.sh` 等）
- 复现步骤、PoC（如有）以及影响

我会尽快确认收到报告，在确认和修复期间同步进展，并与你商定公开时间。修复发布后，我会发布 GitHub 安全公告（Security Advisory）并致谢报告者，除非你希望匿名。

### 支持的版本

本项目没有打标签的发布版本。安全修复只进入 `main` 分支的最新提交，覆盖 README 中列出的目标（OpenWrt 24.10 / 25.12 / snapshot，内核 6.6 / 6.12 / 6.18）。报告前请先确认问题在最新的 `main` 上仍能复现。

### 范围

属于本项目的范围：

- `add_turboacc.sh` 以及 `custom/` 下的全部内容：本项目自己的补丁、Makefile，以及定制过的 `luci-app-turboacc`（包括 rpcd ucode 后端）
- 本仓库把这些代码应用、组合到 OpenWrt 源码树中的方式

`lede/` 下的代码由自动化工作流从 [coolsnowwolf/lede](https://github.com/coolsnowwolf/lede) 和 [coolsnowwolf/luci](https://github.com/coolsnowwolf/luci) 同步而来。如果漏洞出在这部分代码，请同时向上游报告；在这里也报告一份，本仓库中的副本就能一并修复。

不属于漏洞：

- 端点无关映射和端点无关过滤是全锥形 NAT（NAT1）的工作方式：内部主机建立映射后，任何外部主机都可以向该映射发送数据包。
- 未经本项目修改的 OpenWrt、Linux 内核或其他上游项目中的问题，请向对应项目报告。

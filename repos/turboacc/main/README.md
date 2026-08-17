# luci-app-turboacc

简体中文 | [English](./README.en.md)

一个适用于官方Official OpenWrt(24.10/25.12/snapshot) firewall3/firewall4的turboacc
包括以下功能：快速转发引擎、全锥形 NAT1、TCP 拥塞控制算法
支持内核版本：6.6、6.12、6.18

> **如果只需要全锥形 NAT 功能而不需要 turboacc 的其他加速引擎**，可以使用独立项目 **[openwrt-sonic-fullcone](https://github.com/mufeng05/openwrt-sonic-fullcone)**。该项目基于 SONiC 的 fullcone NAT 内核补丁，支持 fw3/fw4 双防火墙、per-zone 和 per-protocol 粒度控制、LuCI Web 界面配置，且无需额外内核模块。

目前仅测试了2025-11-20的x86平台的snapshot版本OpenWrt，fw3(iptables)和fw4(nftables)均可用

## 使用方法

+ 在openwrt源代码所在目录执行：

    ```bash
    curl -sSL https://raw.githubusercontent.com/mufeng05/turboacc/main/add_turboacc.sh -o add_turboacc.sh && bash add_turboacc.sh
    ```

    脚本会自动读取当前源码树的内核版本，并匹配对应的补丁。

+ 之后执行

```bash
make menuconfig
```

+ 在 > LuCI > 3. Applications中选中luci-app-turboacc

## 注意

1. **优先使用 `Flow Offloading`**：`Flow Offloading` 是 Linux 内核原生的流量卸载方案（4.16+ 引入），兼容 nftables，支持进一步卸载到硬件，是长期推荐的加速方案。
2. **`firewall4`(nftables) 环境下请使用 `Flow Offloading`**：`Shortcut-FE` 和 `Fast Classifier` 依赖 iptables 时代的 conntrack chain events 接口，与 nftables 不兼容。OpenWrt 23.05+ 默认使用 `firewall4`/nftables，在此环境下选择 SFE 类方案会存在兼容性风险。
3. **仅在 `firewall3`(iptables) 环境下可选 `Fast Classifier` 或 `Shortcut-FE`**：如果你的固件使用的是 `firewall3`/iptables，可以根据需要选择 `Fast Classifier` 或 `Shortcut-FE CM` 作为加速引擎。
4. 因OpenWrt现在使用`firewall4`作为默认防火墙，如果切换为`firewall3`的话，请把所有与nft相关的包手动取消掉，并替换为相应的ipt包(例如: `iptables-nft`替换为`iptables-zz-legacy`)。
5. **`firewall4`(nftables) 环境下全锥形 NAT1 请选择 `兼容` 模式**：lede 上游并未为 nftables 实现 `高性能 Broadcom` 全锥形 NAT，因此在 `firewall4`/nftables 环境下选择该选项后，重启路由会导致快速转发引擎和全锥形 NAT1 均显示禁用且无法上网。`firewall4` 用户请使用 `兼容` 全锥形 NAT1；`高性能 Broadcom` 仅在 `firewall3`/iptables 环境下可用。参见 [#11](https://github.com/mufeng05/turboacc/issues/11)。

## 插件预览

![fw3预览](https://raw.githubusercontent.com/mufeng05/turboacc/main/img/fw3.png)
![fw4预览](https://raw.githubusercontent.com/mufeng05/turboacc/main/img/fw4.png)

## 关于

此仓库的luci-app-turboacc是基于lede的[luci-app-turboacc](https://github.com/coolsnowwolf/luci/tree/openwrt-25.12/applications/luci-app-turboacc)和chenmozhijin的[turboacc](https://github.com/chenmozhijin/turboacc)修改而来的，保留了lede版luci-app-turboacc的所有功能。

## 感谢

 感谢以下项目：

+ [openwrt/openwrt](https://github.com/openwrt/openwrt)
+ [coolsnowwolf/lede](https://github.com/coolsnowwolf/lede)
+ [coolsnowwolf/luci](https://github.com/coolsnowwolf/luci)
+ [chenmozhijin/turboacc](https://github.com/chenmozhijin/turboacc)

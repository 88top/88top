# luci-app-turboacc

[简体中文](./README.md) | English

A turboacc package for the official OpenWrt (24.10 / 25.12 / snapshot) with both firewall3 and firewall4 support.

It bundles the following features:

- Fast forwarding engine (Flow Offloading / Shortcut-FE / Fast Classifier)
- Fullcone NAT1
- TCP congestion control algorithms

Supported kernel versions: **6.6**, **6.12**, **6.18**.

> **If you only need fullcone NAT and not the other turboacc acceleration engines**, take a look at the standalone project **[openwrt-sonic-fullcone](https://github.com/mufeng05/openwrt-sonic-fullcone)**. It is built on SONiC's fullcone NAT kernel patches, supports both fw3 and fw4, offers per-zone and per-protocol granularity, comes with a LuCI web UI, and does not require any extra kernel modules.

Currently it has only been verified against the 2025-11-20 x86 snapshot of OpenWrt; both fw3 (iptables) and fw4 (nftables) are working.

## Usage

1. From the root of your OpenWrt source tree, run:

    ```bash
    curl -sSL https://raw.githubusercontent.com/mufeng05/turboacc/main/add_turboacc.sh -o add_turboacc.sh && bash add_turboacc.sh
    ```

    The script automatically detects the kernel version of your source tree and applies the matching patches.

2. Then run:

    ```bash
    make menuconfig
    ```

3. Under **LuCI → 3. Applications**, enable `luci-app-turboacc`.

## Notes

1. **Prefer `Flow Offloading`.** `Flow Offloading` is the kernel-native flow offload mechanism (introduced in 4.16+). It is fully compatible with nftables and can be further offloaded to hardware, making it the long-term recommended acceleration path.
2. **Use `Flow Offloading` on `firewall4` (nftables).** `Shortcut-FE` and `Fast Classifier` depend on the iptables-era conntrack chain events interface and are not compatible with nftables. OpenWrt 23.05+ defaults to `firewall4` / nftables, so picking an SFE-style engine in that environment is risky.
3. **Only pick `Fast Classifier` or `Shortcut-FE` on `firewall3` (iptables).** If your firmware still uses `firewall3` / iptables, you can choose `Fast Classifier` or `Shortcut-FE CM` as the acceleration engine.
4. Because OpenWrt now uses `firewall4` as the default firewall, if you switch back to `firewall3` you must manually deselect every nft-related package and replace it with the corresponding ipt package (for example, replace `iptables-nft` with `iptables-zz-legacy`).
5. **On `firewall4` (nftables), pick the `Compatible` fullcone NAT1 mode.** Upstream lede does not implement the `High-performance Broadcom` fullcone NAT for nftables. If you select that option on `firewall4` / nftables, both the fast forwarding engine and fullcone NAT1 will show as disabled after a reboot and you will lose Internet connectivity. `firewall4` users should choose the `Compatible` fullcone NAT1; the `High-performance Broadcom` option only works on `firewall3` / iptables. See [#11](https://github.com/mufeng05/turboacc/issues/11).

## Preview

![fw3 preview](https://raw.githubusercontent.com/mufeng05/turboacc/main/img/fw3.png)
![fw4 preview](https://raw.githubusercontent.com/mufeng05/turboacc/main/img/fw4.png)

## About

The `luci-app-turboacc` in this repository is derived from lede's [luci-app-turboacc](https://github.com/coolsnowwolf/luci/tree/openwrt-25.12/applications/luci-app-turboacc) and chenmozhijin's [turboacc](https://github.com/chenmozhijin/turboacc), keeping all features of the lede version.

## Acknowledgements

Thanks to the following projects:

- [openwrt/openwrt](https://github.com/openwrt/openwrt)
- [coolsnowwolf/lede](https://github.com/coolsnowwolf/lede)
- [coolsnowwolf/luci](https://github.com/coolsnowwolf/luci)
- [chenmozhijin/turboacc](https://github.com/chenmozhijin/turboacc)

## License

See [LICENSE](./LICENSE).

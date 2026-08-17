# CLX-S20P 刷机

串口/TTL、备份、刷写与分区相关命令与注意事项。操作前请务必备份数据并确保电源稳定。

## 1. 进入 failsafe 并重置 `root` 密码

1. 开机或重启时按住 `f`，并多按 `Enter` 进入 failsafe。见`00-failsafe.png`
2. 重置 `root` 密码（示例密码为 `password`）：

    ```sh
    echo -e 'password\npassword' | passwd root
    reboot
    ```

3. 系统启动并按 `Enter` 后，可通过 TTL 登录 `root`，也可通过 SSH 登录 `192.168.8.1:22`（用户名 `root`，密码为上一步设置的密码）。

## 2. 启用 `dropbear`（SSH）

```sh
uci set dropbear.@dropbear[0].enable='1'
uci commit dropbear
/etc/init.d/dropbear start
```

## 3. 备份分区（复制到 `/tmp` 后用 WinSCP 下载到电脑）

```sh
dd if=/dev/mmcblk0boot0 of=/tmp/boot0_bl2.bin conv=fsync
dd if=/dev/mmcblk0 bs=512 count=34 of=/tmp/mmcblk0_GPT.bin conv=fsync
dd if=/dev/mmcblk0 bs=512 skip=34 count=8158 of=/tmp/mmcblk0_unpartitioned.bin conv=fsync
dd if=/dev/mmcblk0p1 of=/tmp/mmcblk0p1_u-boot-env.bin conv=fsync
dd if=/dev/mmcblk0p2 of=/tmp/mmcblk0p2_factory.bin conv=fsync
dd if=/dev/mmcblk0p3 of=/tmp/mmcblk0p3_fip.bin conv=fsync
dd if=/dev/mmcblk0p4 of=/tmp/mmcblk0p4_kernel.bin conv=fsync
dd if=/dev/mmcblk0p5 of=/tmp/mmcblk0p5_rootfs.bin conv=fsync
```

如需备份 `permanent_config`：先清缓存再打包：

```sh
rm -rf /permanent_config/watcher_data/*/storage/.yfnode/cache/*
tar -czvf /tmp/permanent_config.tar.gz /permanent_config
```

恢复 `permanent_config`：

```sh
tar -xzvf /tmp/permanent_config.tar.gz -C /
```

恢复原厂 `kernel` + `rootfs`：

```sh
dd if=/tmp/mmcblk0p4_kernel.bin of=$(blkid -t PARTLABEL=kernel -o device) conv=fsync
dd if=/tmp/mmcblk0p5_rootfs.bin of=$(blkid -t PARTLABEL=rootfs -o device) conv=fsync
```

## 4. 刷写 U-Boot（示例）

```sh
dd if=/tmp/mt7986_clx_s20p-fip_legacy-and-fit_20241010.bin of=$(blkid -t PARTLABEL=fip -o device) conv=fsync
md5sum $(blkid -t PARTLABEL=fip -o device)
```

示例输出：

```
4096+0 records in
4096+0 records out
211b89848fbe383f371433e7cb1889ab  /dev/mmcblk0p3
```

## 5. 使用 U-Boot 网刷固件（快速说明）

- 将网线插入 LAN1-5 任意端口。
- 将电脑 IP 设为 `192.168.1.2/24`。
- 按住 `reset`，给设备上电，等待 `SYS` 灯由闪烁变为常亮后松开 `reset`。
- 浏览器访问 `http://192.168.1.1`，上传固件，等待界面显示 `complete`。

## 6. 刷写/扩展分区表（示例）

先校验 GPT 文件的 md5：

```sh
md5sum /tmp/clx_s20p_*gpt.bin
```

写入 GPT（示例，512M rootfs + 512M production）：

```sh
dd if=/tmp/clx_s20p_rootfs512M_production512M-gpt.bin of=/dev/mmcblk0 bs=512 count=34 conv=fsync
sgdisk -e -n 0:0:-1G -c 0:permanent_config -t 0:0FC63DAF-8483-4772-8E79-3D69D8477DE4 -u 0:5F73EF09-196E-4847-BE1E-69F2BD87E8B1 -p /dev/mmcblk0
```

```sh
# 1G rootfs + 1G production
root@ImmortalWrt:/tmp# dd if=clx_s20p_rootfs1024M_production1024M-gpt.bin of=/dev/mmcblk0 bs=512 count=34 conv=fsync
34+0 records in
34+0 records out
root@ImmortalWrt:/tmp# sgdisk -e -n 0:0:-1G -c 0:permanent_config -t 0:0FC63DAF-8483-4772-8E79-3D69D8477DE4 -u 0:5F73EF09-196E-4847-BE1E-69F2BD87E8B1 /dev/mmcblk0
Setting name!
partNum is 6
Warning: The kernel is still using the old partition table.
The new table will be used at the next reboot or after you
run partprobe(8) or kpartx(8)
The operation has completed successfully.
```

写入后会看到分区表信息并提示 kernel 仍在使用旧表（重启后生效或使用 `partprobe`/`kpartx`）。

成功示例输出会列出各分区和 `permanent_config` 的大小。

## 7. 格式化 `permanent_config`

系统启动后通过 SSH 执行：

```sh
mkfs.ext4 $(blkid -t PARTLABEL=permanent_config -o device)
```

## 8. 双系统切换（21.02 <-> 24.10/immortalwrt）

切换到 21.02（当前为 24.10/immortalwrt）：

```sh
cp /etc/fw_env.config /etc/fw_env.config.bak
echo -e "/dev/mmcblk0p1 0 0x80000" > /etc/fw_env.config
fw_setenv dual_boot.current_slot 0
cp /etc/fw_env.config.bak /etc/fw_env.config
reboot
```

切换回 24.10/immortalwrt（当前为 21.02）：

```sh
fw_setenv dual_boot.current_slot 1
reboot
```

## 9. 注意事项

- 操作前务必备份所有重要分区与配置。
- 写入分区表和刷写固件时请确保电源稳定，避免断电。
- 使用 `md5sum` 校验写入文件完整性。
- 如果不确定某个命令的含义，请先查证或在测试设备上验证。

---

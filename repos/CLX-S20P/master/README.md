<p align="left">
  <img src="src/S20 Plus.JPG" alt="S20 Plus" width="360" />
</p>


# CLX S20 Plus

- ## Hardware Info

   | **Component**      |                         **Details**                           |   **Status**   |
   |--------------------|---------------------------------------------------------------|----------------|
   | **Architecture**   | Ralink ARM                                                    |
   | **Vendor**         | MediaTek                                                      |
   | **Bootloader**     | U-Boot                                                        |
   | **System-On-Chip** | MediaTek MT7986a - ARM Cortex-A53                             |
   | **CPU/Speed**      | 2.0GHz (Quad Core)                                            |
   | **eMMC**           | SanDisk 2201DVAF J00Y                                         |
   | **Size**           | eMMC 128GB   5.1（HS400）                                      |
   | **RAM**            | DDR4 2048 MiB                                                 |
   | **Wireless 1**     | MediaTek MT7975N - 802.11b/g/n/ax (2.4GHz) 4×4 MIMO           |       ✅       |
   | **Wireless 2**     | MediaTek MT7975PN - 802.11a/n/ac/ax (5GHz) 4×4 MIMO           |       ✅       |
   | **Ethernet Lan**   | 5 x 1000M                                                     |       ✅       |
   | **Ethernet Wan**   | 2 x 2500M RTL8221B-VB-CG                                      |       ✅       |
   | **Switch**         | MediaTek MT7531AE                                             |
   | **USB**            | 1 x 3.0                                                       |       ✅       |
   | **Serial**         | Yes                                                           |       ✅       |
   | **M.2**            | Must include socket                                           |       🆗       |

- ## GPT Info
  ```bash
  root@MyRouter:~# gdisk -l /dev/mmcblk0
  GPT fdisk (gdisk) version 1.0.6

  Partition table scan:
    MBR: protective
    BSD: not present
    APM: not present
    GPT: present

  Found valid GPT with protective MBR; using GPT.
  Disk /dev/mmcblk0: 244277248 sectors, 116.5 GiB
  Sector size (logical/physical): 512/512 bytes
  Disk identifier (GUID): 2BD17853-102B-4500-AA1A-8A21D4D7984D
  Partition table holds up to 128 entries
  Main partition table begins at sector 2 and ends at sector 33
  First usable sector is 34, last usable sector is 244277214
  Partitions will be aligned on 1024-sector boundaries
  Total free space is 2105310 sectors (1.0 GiB)

  Number  Start (sector)    End (sector)  Size       Code  Name
    1            8192            9215   512.0 KiB   8300  u-boot-env
    2            9216           13311   2.0 MiB     8300  factory
    3           13312           17407   2.0 MiB     8300  fip
    4           17408           82943   32.0 MiB    8300  kernel
    5           82944         2180095   1024.0 MiB  8300  rootfs
    6         2180096         4277247   1024.0 MiB  FFFF  production
    7         4277248       242180062   113.4 GiB   8300  permanent_config
  ```

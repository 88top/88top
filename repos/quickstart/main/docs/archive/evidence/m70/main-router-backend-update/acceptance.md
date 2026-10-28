# 主路由后端更新验收

2026-10-22，用户明确要求更新 `root@192.168.30.1` 最新后端。本次仅替换后端运行程序、补登记首页配置备份保留路径，并重启 Quickstart 一次；保留正式前端 `ad324e0`。一轮更新及当前设备验收通过。

## 候选与执行

- 运行版本从 `0.14.0 b60f6e53...` 更新为 `0.16.6-test20261018 c9624a38ffe11b45f484b2858ddf16088ae7a6a7`。
- 当前仓库 `backend` 与上述冻结提交无差异，复用已冻结、可追溯的匹配 x86_64 runtime，未为文档/前端变化重复构建相同后端。`go test ./modules/homeconfig ./server` 和 `make test` 重新执行通过；server无独立测试，首页测试与完整现有Go测试覆盖保留。
- 归档 SHA256 `84d74f64be89cd15290d05c202555594dcb7ae864d283c29a79177f9f0f5dc44`，与归档校验文件匹配；抽取ELF64/x86-64程序，SHA256 `983a1c8b819e29a5ac7e053898afa66ccdc8653e535219482c92052b3a90ba11`，与MANIFEST匹配。
- 实际服务 PID 从11725变为12631；`/proc/12631/exe` 指纹与候选一致，命令沿用 `quickstart serve --unix /var/run/quickstart/local.sock`。
- 私有备份：`/root/quickstart-backups/backend-c9624a3-20261022-r1`，包含旧程序、配置和既有Quickstart数据。
- 未调用opkg安装、软件包启动钩子、startdhns或网络重载。实际disable_dhns未设置，且无独立DHNS进程/命名空间；本服务初始化仅建立连接服务，不创建DHNS接口或修改桥。

## 当前接口与持久化

- 真实短期root会话经原LuCI代理读取两个home/v1接口，HTTP200、success0、state=saved；布局schemaVersion3、启动台schemaVersion1。
- 认证首次GET按原产品契约初始化之前不存在的两个文件；迁移记录 `exists=false,diableDisplay=[]`，原UCI配置未变。文件权限600，磁盘值及版本逐项与API一致。
- 两域分别提交一次**原值不变保存**，确认返回值/版本不变，随后GET仍一致；文件SHA、inode、mtime、大小、权限均不变，未重复写闪存。没有为了验收改变用户布局/固定项，没有重放任何网络写操作。
- 加入 `/lib/upgrade/keep.d/quickstart-home`，覆盖与现有包配方一致的八条主/备/损坏文件路径；`sysupgrade -l` 实际包含新生成的两个主页配置文件。未执行系统恢复或系统升级。
- 无认证的本机version探测返回业务 `success=-1001`，`deployment.json` 原样保留；该响应只作为进程响应/认证拒绝记录，**不是业务验证通过依据**。业务结论来自随后真实登录态API及UI检查。

## UI、角色及保护

- 当前正式资源、当前后端、真实登录态：1440px和390px两组中文页面，两个配置错误提示均不存在；布局编辑入口已启用，打开并取消可用，刷新后仍正常且没有写入首页文件。
- 设备管理与设置保留本机负责DHCP、地址/路线可编辑；地址池 `192.168.30.2–192.168.30.249`、租期12h、默认路线本机。实际设备接口返回11条当前观测记录，不复用旁路由数据。
- 四份主要公开前端文件SHA与前端候选一致，未替换/回退前端。桌面、手机及设置截图实际打开审查；截图中的启动后首个网络采样/连接检测属于独立业务加载，不将其解释为已验证持续外网连通或吞吐。
- 浏览器检查不提交业务写请求，只放行读取和白名单只读ubus RPC，无未捕获脚本异常或横向溢出。唯一真实POST为上述两个原值保存；一个root300临时会话已在finally销毁，凭据未入库。
- 网络/DHCP/防火墙/旧Quickstart UCI、启动脚本、LuCI模板、前端、包数据库指纹前后一致；LAN地址、默认路由、netifd/dnsmasq/uhttpd/odhcpd PID均不变，startdhns仍无进程，命名空间仍为空。

## 边界与证据

这是用户要求的运行程序直接更新，opkg的Quickstart/LuCI包版本记录保持旧值，不能宣称匹配IPK完整安装。没有网络策略保存、限速/浮动网关数据面或故障切换验证；未更新B/C/D、5180，未推送、发布或触发Action。

`deployment.json` 为安装和保护记录；`actual-r1/device.json` 为真实读/原值保存/文件/备份/角色/保护记录；`actual-r1/report.json` 为当前UI和公开资源记录。上阶段关于“.1缺home/v1接口”的结论属于更新前历史，由本次实际验证取代。

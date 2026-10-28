# Quickstart 安全与稳定性审查

本次修复针对请求参数进入 Shell、UCI 和磁盘写入流程时的实际缺陷，保留现有接口路径、成功响应结构、正常配置值和业务流程。补丁已写入两个源码仓库，并于审查后部署到测试设备；部署与业务检查结果见[部署摘要](deployment-20261028/summary.md)。本文的隔离验证结果对应部署前审查阶段。

## 范围与依据

- quickstart 基线：`e1a96ee62a4918f4d8c8920202c490292689c87c`，覆盖 Go 入口、路由、中间件、业务模块、系统适配层及前端请求和输出边界。
- LuCI 基线：`78893206928e8ce161d94495825bc87a59972cca`。下文 `LuCI/` 代表 nas-packages-luci 仓库的 `luci/luci-app-quickstart/`。
- 配套启动和 hotplug 文件：nas-packages 仓库的 `network/services/quickstart/files/`，只读核对，没有修改。
- 测试环境：用户指定的 OpenWrt x86 设备及 LuCI/uhttpd 入口。现有版本为 `0.17.1-rc20261028`。

下面的位置使用修复后文件的行号，问题原因描述的是基线代码。P1 表示优先修复的命令、配置或数据完整性问题，P2 表示输入边界和传输稳定性问题，不代表已验证的未认证远程利用等级。

## 已确认问题与修复

| 编号 | 优先级 | 文件与位置 | 原因与影响 | 最小修复 |
| --- | --- | --- | --- | --- |
| Q1 | P1 | `backend/modules/quickstart/config/service.go:28`、`:97`、`:134`；`backend/service/app.go:162` | key 和 value 被拼入 `uci` 的 Shell 命令；目录使用未引用的 heredoc。正常空格、引号和美元符号也会被解释或破坏。前面命令失败后仍可能 commit 并报告成功。 | 限定 UCI option key 和 type，拒绝行终止符；对值做 Shell 参数转义；去掉 heredoc；该配置写入链使用失败即停止的执行方式。 |
| Q2 | P2 | `backend/modules/quickstart/config/service.go:119`、`:145` | 原读取正则只匹配非空白字符，不能完整读取带空格、转义单引号和空字符串的值。修好写入后如果不修读取，会出现配置无法往返的问题。 | 解析 UCI show 的字面量引用，不调用 Shell 解释输出；保留旧的单值与多值响应分类。真实 UCI 的空值清除行为保持不变。 |
| Q3 | P2 | `backend/modules/app/core/service.go:26`、`:50`；`backend/service/app.go:74` | 包参数未限定为包标识符，被用于包信息路径、安装参数和 pgrep 正则。路径分隔符、选项和正则特殊字符可能改变检查对象或含义。运行状态分支还受包信息文件存在性约束，因此不据此宣称完整命令执行链。 | 检查和安装均校验包名，禁止路径、空白和前导选项；进程查询对名称做正则及 Shell 转义。 |
| Q4 | P1 | `backend/service/smart.go:47`、`:76`、`:107`；`backend/modules/smart/config/validate.go:15` | smartd 配置逐行插入 Shell printf 的格式串；引号、美元符号和百分号会改变结果，失败也被忽略。缺失 global 或空数组元素可触发 nil 解引用；热插拔重载也未检查读取失败。 | 写入前校验 global、设备和计划；用临时文件、同步和 rename 完整替换配置，设置 `0600`；传播写入及服务命令错误；检查热插拔读取结果。 |
| Q5 | P1 | `backend/modules/smart/commands/service.go:26` | 测试类型和设备路径直接拼入 smartctl 命令。 | 参数单独转义，限制设备路径位于规范的 `/dev/` 命名空间；拒绝空类型和控制字符。保留正常测试及结果响应。 |
| Q6 | P1 | `backend/modules/nas/disklifecycle/service.go:163` | 用 name 查询磁盘，却使用请求中独立的 path 擦除和分区；name 与 path 不匹配时可以对另一目标写入。 | 在任何卸载或擦除前验证 name 与库存 path 一致，并使用库存中的 path。剩余空间初始化入口也检查同一身份。 |
| Q7 | P1 | `backend/modules/nas/diskcommands/service.go:31`、`:150`；`backend/service/disk_legacy_readers.go:110`；`backend/service/nas.go:224` | mount、umount、格式化、fstab、parted 查询和挂载点辅助命令使用未转义的字符串或单引号拼接，带单引号的目录或名称会破坏参数边界。 | 使用统一 Shell 参数编码器处理设备、UUID、目录和查询参数，并在 parted 查询前验证设备名称；剩余空间初始化的 parted 参数一并转义。不改变正常设备和挂载流程。 |
| Q8 | P1 | `backend/modules/raid/writeflow/service.go:77`；`backend/modules/raid/writecommands/commands.go:30`、`:55` | 创建 RAID 时逐盘检查并立即擦除，后续成员错误或卸载失败会留下已擦除的前序磁盘；无可用 md 编号也在擦除后才发现。未知级别和三个成员的 RAID6 未提前拒绝。其他 mdadm 命令参数也未转义。 | 先校验级别、数量、重复成员、全部库存身份和 md 编号，再完成所有卸载，最后进入擦盘；RAID6 至少四个成员；命令参数逐项转义。已开始的物理写入无法由此获得回滚能力。 |
| Q9 | P1 | `backend/modules/network/interfacewrite/service.go:31`、`backend/modules/network/interfacewrite/types.go:94` | 空配置会被解释为删除全部已有接口；nil、重复接口名及拼入命令的 name、proto、device 未合理约束。 | 在构造删除计划前拒绝空、nil、重复和非法标识符，转义设备值；正常 LAN、WAN 和桥接规划保持原有结果。 |
| Q10 | P1 | `backend/modules/guidecore/networkbasics/commands.go:20`、`:79`；`backend/service/guide.go:393` | PPPoE 凭据和 DNS 值通过单引号拼接；静态参数构建失败仍会执行已生成的部分命令，可能先修改默认路由。负数掩码分量也未拒绝。 | 转义凭据和 DNS 参数；校验网关；拒绝负数掩码分量；构建失败时不执行任何部分命令。 |
| Q11 | P1 | `backend/service/wifi.go:113`、`:238`、`:264`；`backend/service/wifi_qca.go:410`、`backend/service/wifi_zx3000.go:428`、`backend/service/wifi_glinet_mt3000.go:421` | 无线标识符以及三种驱动中的 SSID、密码进入 Shell；双引号不能阻止变量展开，也不能正确保存任意引号。 | API 校验设备和接口标识符，拒绝控制字符；三种驱动及访客配置构造器对 SSID、密码逐项做字面量参数转义。现有硬件选择及加密映射未改。 |
| Q12 | P1 | `backend/service/share_user_usecase.go:48`、`backend/service/share_service_usecase.go:67`；`backend/modules/share/service/service.go:156` | 虽然 UCI batch 已经通过 stdin 传给 uci，密码、共享路径和权限用户名仍未按 UCI 语法引用；空白会截断值，换行会改变命令结构。权限列表中的 null 元素会触发异常。 | 新增专用于 UCI batch 的引用函数并应用到这些值；拒绝行终止符、非法共享用户和 null 元素；共享路径要求绝对路径。保留账户长度限制及正常读写权限设置。 |
| Q13 | P1 | `backend/modules/guidestorage/downloadservices/path.go:12`、`commands.go:29`；`backend/modules/guidestorage/dockertransfer/builders.go:22`；`backend/service/guide.go:413` | 路径检查按字符串前缀接受 `/mnt-other` 和 `/mnt/../etc`；随后会创建目录并 chmod。下载服务配置、RPC token、外部 tracker 列表，以及 Docker 目录检查、复制、覆盖和更新也通过单引号拼接。 | 按清理后的路径组件检查 `/mnt/` 与 `/root/` 子目录，拒绝控制字符和根目录本身，避免对 `/root`、`/mnt` 执行 chmod；配置和迁移路径逐项转义，Docker 预检查拒绝相对路径及根目录。正常下载子目录原有的共享权限未统一修改。符号链接风险另列下表。 |
| Q14 | P1 | `backend/modules/system/modulesettings/service.go:39` | 模块名称被插入单引号形式的 UCI batch；名称中的引号和换行可破坏 batch 语法。 | 使用 UCI 专用引用并拒绝行终止符，不引入固定模块白名单，保留扩展模块兼容性。 |
| Q15 | P1 | `backend/service/disk_legacy_readers.go:78` | 查询分区状态时用固定名称 `.readonly_test` 执行 touch，随后删除；如果磁盘上已有同名用户文件，会被修改时间后删除。不同查询也共用同一探测文件。 | 改为独占创建随机临时文件，只删除本次创建的文件；回归验证已有同名文件或链接保留、探测文件不会遗留。 |
| L1 | P2 | `LuCI/luasrc/controller/quickstart.lua:96`；`LuCI/root/usr/libexec/quickstart/auto_setup.sh:3`、`:19`、`:50` | 安装参数未限定包标识符；脚本使用未引用的 `$@` 再次分词，并将元数据脚本路径插入新的 Shell 程序。能否进一步执行非预期代码还取决于 is-opkg 和 taskd，未做利用验证。 | 控制器与脚本都在执行前校验全部包名；使用 `"$@"`；用位置参数传递待 source 的脚本路径。正常包名包括点、加号、下划线和连字符。 |
| L2 | P2 | `LuCI/luasrc/controller/istore_backend.lua:19`、`:62` | 单次 send 可能只发送部分请求；chunk 数据已完整缓冲而末尾 CRLF 跨边界时，旧代码计算错误的剩余长度；EOF、长度达到上限和缺失十六进制长度还会造成循环或 Lua 异常。 | 改用 nixio sendall，保存已缓冲的尾部长度并只读取缺失字节；处理空接收、上限和缺失长度。用合法响应的全部切分位置回归。 |

## 需要进一步验证的风险

| 位置 | 已知事实与验证边界 | 后续修复建议 |
| --- | --- | --- |
| `backend/modules/guidestorage/downloadservices/path.go:12` | 修复后的目录边界检查是词法检查，尚不解析符号链接。若下载目录的可写祖先中存在指向边界外的链接，mkdir 或 chmod 仍可能作用于链接目标。未在设备上主动构造此场景。 | 核对实际磁盘别名和目录所有权后，沿受信任目录句柄执行创建和权限设置，拒绝越界链接；避免直接禁用全部既有磁盘别名而破坏业务。 |
| `LuCI/luasrc/controller/quickstart.lua:137` 与 `auto_setup.sh:13` | stdout、stderr 和任务结果仍使用固定日志名。测试设备 `/var/log` 为 root 所有、权限 `0755`，未确认普通用户可植入链接；多请求与 taskd 排他性的完整行为尚未验证。 | 使用请求专属临时文件保存控制器输出，并在确认 taskd 行为后决定任务结果是否需要按任务隔离。此项未作为已证实提权漏洞。 |
| `backend/modules/homeconfig/auth.go:27` | TCP 入口按有效 rpcd 会话、token 和 root 身份授权。若部署希望对同一 root 身份再施加只读 rpcd ACL，需要核对这种部署契约；本次未证明权限绕过。 | 根据实际委派需求增加接口级 session.access 检查，不能仅根据某个局部 handler 只检查转发头就认定入口可绕过。 |
| 无线硬件、磁盘、RAID 和网络应用 | 本次覆盖正常计划构造、错误拒绝和隔离参数测试，没有对真实磁盘格式化、创建 RAID、修改管理网络、安装软件包或更改 WiFi。 | 在具备可丢弃磁盘、备用管理链路和相应无线硬件的环境中完成业务验收，再发布对应模块。 |

## 部署前审查验证结果

- 修改前后均运行 `go test ./...`；最终 80 个含测试的包通过，其余包无测试文件。
- 竞态检查通过：配置、磁盘生命周期、parted 查询、RAID 写入、接口写入、首页配置、服务器和 service 共八个包；最后修改涉及的包再次执行竞态检查。
- 前端源码未修改。SSD 副本中执行现有 CJS 17 项、MJS 147 项回归，共 164 项通过；`npm run tsc` 通过。副本保留了前端依赖的后端默认配置 JSON。
- LuCI Shell 测试 2 项通过：全部非法参数在副作用前拒绝，两个正常包通过模拟安装、配置和结果记录流程。
- 在测试设备的独立临时目录中运行修复后源码的 Lua 测试：包参数校验、完整发送、chunk 全部切分位置、EOF 和头长度上限通过。LuCI 与命令依赖均为 mock。
- 在同一设备运行静态编译的修复后 Go 测试程序：真实 `/sbin/uci` 的配置、列表、目录及 UCI batch 引用往返通过；所有配置和 UCI delta 均位于测试临时目录。
- 设备上的隔离 service 回归通过：40 组 Shell 参数往返、失败写入不提交、SMART 非法配置零写入、写失败传播、原子替换及符号链接目标不被覆盖、无线非法标识符拒绝、只读探测保留已有文件、Docker 迁移五种目录与确认分支。所有迁移测试仅使用自动清理的临时目录。
- 设备 `/etc/config/network`、`firewall`、`dhcp`、`quickstart`、`/etc/smartd.conf` 和 `/usr/sbin/quickstart` 的 SHA256 与隔离测试前一致。现有服务未重启。未登录 LuCI 页面返回 403；已知 API 返回现有协议的 `success=-1001`、`Forbidden`。

本次测试证明上述边界修复和既有自动化用例通过，不等同于修复版本已完成设备上全部业务的上线验收。

## 补丁与复测入口

- quickstart 修复与 Go 回归测试位于本仓库 `backend/`；LuCI 控制器、安装脚本及回归测试位于配套 nas-packages-luci 仓库的 `luci/luci-app-quickstart/`。两者应配套审查和部署。
- 本地 Go 回归：通过 SSD wrapper 在 `backend/` 执行 `go test ./...`。
- 实际 UCI 隔离回归：编译 `backend/modules/quickstart/config` 和 `backend/utils` 的测试程序，在 OpenWrt 临时目录设置 `QUICKSTART_TEST_UCI=/sbin/uci`，仅运行 `TestIsolatedRealUCIRoundTrip` 和 `TestUCIQuoteRoundTripWithRealUCI`。默认本机测试会跳过这两个 opt-in 用例。
- LuCI Shell 回归：在 LuCI 包目录执行 `python3 tests/auto_setup_test.py`。
- LuCI Lua 回归：在具备 Lua 5.1 的环境执行 `lua tests/security_regression.lua <LuCI包目录>`；测试不会调用真实 LuCI、安装器或文件操作。

代码提交不包含预编译二进制。后续设备部署的构建标识、校验和及验收边界见[部署摘要](deployment-20261028/summary.md)。完整设备响应、截图和运维记录保留在本地，未提交至公开仓库。

# M70 首页包与安装

## 当前结论（覆盖下方历史候选状态）

安装后补充审查发现原有限速准备入口向已安装NetPolicy重复提供安装动作。该项已在[netpolicy-preparation](netpolicy-preparation/status.md)修正并以新版本重新完成构建、B安装和实机复验；原失败保留，不覆盖0.16.2证据。

业务冻结提交 `c78f62c`，版本 `0.16.3-test20261018`。B `192.168.30.244` 当前普通opkg元数据为 Quickstart `0.16.3-test20261018-2`、LuCI `0.16.3-test20261018-r2`、NetPolicy `0.2.0-test20260928-2`。包、实际ELF/Web、serve与startdhns两种进程、API和资源key一致。NetPolicy保持enabled=0、无进程，原eQoS选择及规则不改；新的准备提示不再重复安装已经存在的包。

当前六个0.16.3 IPK（x64/ARM64各三包）通过：独立build.status成功，fetch、SDK/架构/feed锁/patch和包内原始字节一致。详见[当前精确输入](netpolicy-preparation/release-inputs-0163.md)。APK仍在DNSTAP宿主生成器依赖处按三轮边界暂停；ARM64未实装，24小时观察仍延期。因此仅IPK+B首页安装支线收口，完整多格式发布尚未完成。

B当前七组匹配版本root UI验收通过：完整业务九项断言、准备提示与DHCP权六项、触屏、英文、两主题圆环、20次SPA导航、服务重启后新会话加载。证据在netpolicy-preparation下的b-installed-0163-*与b-after-restart-0163。控制台、pageerror、HTTP错误均为空，原配置内容恢复，各组两个短期会话销毁。20次往返无残留图表/轮询；最后5500ms仅一次周期读取。当前构建另有九组本地兼容场景通过，明确区分模拟异常与实机结果；代表原始截图已打开审查。

0.16.3安装及辅助进程替换后，首页、network/DHCP/firewall/Quickstart、设备资料、provider等严格指纹保持，无归一化例外；.244/24及默认路由经.1保持。此前0.16.2首次安装曾触发既有DHNS初始化，仅加dheth0桥端口并reload B，历史差异仍记录在下文。UI保存合法推进revision后恢复原内容；再重启B Quickstart服务，四份首页主/备及网络配置原文不变，新会话正确加载。实际0.16.3 sysupgrade归档四份首页文件逐项字节一致，八条keep路径齐全；未执行系统恢复。

进程检查补入startdhns别名，先拒绝旧驻留helper，再只替换已验证PID/旧hash/原dhns命名空间中的该进程；无网络配置或接口操作。serve与helper均匹配当前runtime。额外DHNS恢复代理HTTP探测没有通过：127.0.0.1在该命名空间不可达，现有192.168.100.1地址探测超时，根因未定；临时wget已清理，没有开启loopback或添加路由强行通过。该独立恢复链路不在首页通过结论中，后续需隔离复现。

所有公开发布操作均未执行。A/C/D未操作；原共享构建器与其他仓库任务保留。下方按执行顺序保存历史候选/失败，不把早期“尚未安装”视作当前状态。

任务树：冻结业务提交 → 三架构 runtime → App Hub 配方/资源 → 独立 feed 工作树 → 可审计 SDK 测试输入 → x64/ARM64 IPK+APK → fetch/元数据/ELF/Web → B IPK 安装/配置保留/真实 root UI 复验。

验收标准：各架构 build.status 成功、六包准确、SHA256SUMS 与输入补丁/feed/SDK 锁一致；包内二进制和 Web 与冻结提交一致；B 的 opkg 版本/实际文件/进程/API/UI 一致；首页配置与网络配置保持。APK 无适用固件时只记录构建，不冒充实装。24小时观察仍延期，ARM64 数据面问题不由打包通过代替。

冻结源码 `6fcc4bae1a00a0313b77cd9247d4bad326097567`，版本 `0.16.0-test20261018`。runtime 三架构由干净源码 make release 产生；持久归档 `bin/releases/6fcc4ba/`（忽略目录），SHA256 `a22c1f7b1d3d1ee816a397bb666bd2a7cfb33ba839f21ec428551ba90b449dc6`。资源版本 `0.16.0-test20261018-release-bd9944bb18ad`，manifest 含 CSS/vendor。

## 测试输入与隔离

未获授权推送 Git、上传 Release 或触发 Action，因此未执行。采用构建器正式指南第3.3节允许的未发布测试输入：固定 canonical feed 基点 + 入档的 FEED_PATCHES + 精确 hash 的 runtime 下载缓存预置；不能称为已经公开发布的 canonical 包。

构建器根目录有其他 LinkEase 任务的未提交修改，远端 current 也在服务该任务。未覆盖这些内容：单独工作树分支 `quickstart-home-016`，构建器提交 `17d5fa0b0cd6d07d2b8b22067910180d03400307`，单独 deployment `/builders/projects/quickstart-home-builder`、runtime `runtime-17d5fa0b0cd6`。原 `/builders/projects/openwrt-sdk-builder/current` 保持原指向。

profiles：quickstart-home-x64 / quickstart-home-arm64。feed 基点 nas `bee9750470cf903ce5d9f3c563dc1ea2ac56929e`、nas_luci `a370c0b3a56f9175192b449830c9116d46fada16`，第三方 istore 由最终 feed lock 记录。nas 已含 NetPolicy ARM64 配方，不重复旧补丁。NetPolicy 仍使用 canonical 0.2.0-test20260928 的分架构 runtime/hash，不声称本轮修改或验证其数据面。

补丁生成后在真实目录副本反向 dry-run 通过；最初用符号链接搭建验证目录被 patch 的路径保护拒绝，属于工具夹具问题，没有执行写入。make test（10项）、ops-preflight、ops-init/release/deploy/verify 通过。预置 runtime 用硬链接防覆盖既有共享文件，前后 SHA256 均匹配配方。

x64 Build ID `quickstart-home-x64-20261018-0750-6fcc4ba` 已启动；尚未据此宣布构建或安装成功。

## 缓存与 fetch 范围修正

首次 ARM64 `0752` SDK下载约28KiB/s，显式停止本任务唯一匹配 BUILD_ID 和 output mount 的容器；原始失败状态/日志保留。复用旧构建器现有只读归档，ARM IPK SHA `7ac9801311275b63aea3cba74e68c27fc74ced2a50a0c8f4b0d9adfd8ae768ea`、ARM APK `ef6739acc91c346bd1b6b1bea8a6a950120892136cd0b9b849428203d6d6fa94` 与固定 platform 相同，x64 APK `4abb32a6dd05f80c24fc1a487a94b1f5f0a5d4cd560ff3dd8c1bf77793a2d5dc`。仅在新实例缓存创建硬链接，没有覆盖或删除原缓存；x64 IPK首次下载自行完成。

`0750/0754` 初始 base 克隆仍慢；新增本实例独立 bare object seed，原 SDK checkout 只读，不依赖其工作树当发布输入。确认标签 peeled commit 21.02.3 `42a15ca378e1bc52f125f894d748c31ce3c52903`、24.10.8 `0b795ce79e23b553aa184080c390f9ce92a2b6d4`；APK SDK实际配置固定 commit `d266501ad6188cce279a487b1ce61f4f327cd496`，不伪造25.12.2 Git标签。seed 无 alternates、fsck通过。

`0759` 揭示镜像克隆后的 wildcard fetch 导致 SDK 的 git pull 拉取全部上游分支（812459 objects）。构建器 `e9325f491a8989d18d038eaad7645c157dd9e74b` 将 tag/branch 的 refspec 限定为请求项并禁用自动额外 tags；新增真实 Git 临时仓库 pull 测试，11项通过。再次 preflight/release/deploy/verify 通过。上述慢任务按精确归属停止、保留失败证据；没有把中止当编译通过，也没有改FEED_REFRESH=always或改canonical origin。

最终启动 IDs：x64 `quickstart-home-x64-20261018-0803-6fcc4ba`，ARM64 `quickstart-home-arm64-20261018-0803-6fcc4ba`。独立 runtime `runtime-e9325f491a89`，输入补丁 SHA256 `294833706e0a65ab03d8adbaa5a060757e231f7bf9668159c0d9e2ed92adc104`。配方本地提交 nas `70405b1`、nas_luci `26f688d`、App Hub `bba2b39`，均未推送。

B普通 opkg update 已完成、所有源签名通过，日志在 `/root/quickstart-package-candidates/home-016-6fcc4ba/opkg-update.log`；smartmontools-drivedb 7.5-r1 可用，无需删依赖或强制依赖。B正式包安装仍等待本轮产物核验。

## 目录补漏后的最终版本

6fcc4ba 的0.16.0归档已经进入不可覆盖的测试下载缓存，后续目录身份异常补漏不能复用该文件名/hash。353533f 的同名本地归档仅保留为中间构建，未覆盖服务器缓存。最终候选升为 `0.16.1-test20261018`，重新生成完整runtime/资源版本/配方/SDK输入；旧0.16.0与慢构建仅为历史证据，不是最终安装候选。

最终业务源码 `f2c7434e0769c273aa2077ed947894cc93692793`，runtime归档 SHA256 `6e4a111175ea3375e0edf962cdba44464d1ab0fc0c2dee32d60cec8cfea678b1`，资源版本 `0.16.1-test20261018-release-2332b07136c2`。已持久保存 `bin/releases/f2c7434/`，新增版本独立预置缓存，没有覆盖0.16.0。B完整候选 `b-candidate-f2c7434-1` 八项真实业务/主题断言通过，文件和进程匹配，API/控制台/pageerror零、配置恢复、会话销毁。最终源码 make test、104项前端、vue-tsc、make test-ops、make verify-lan-device-business 均通过；homeconfig/app 定向 race 通过；本地完整正式页面回归 `formal-f2c7434-final` 通过。

## 包内容发现的问题与修正候选2

`quickstart-home-arm64-0161-20261018-1` 的IPK已生成，但实际解包发现SDK再次strip预编译ELF：Quickstart预期93f3178c…而包内ef08226e…，NetPolicy manifest预期7fa35c1c…而包内80e0b2b3…。未安装这些包。配方现在RSTRIP=:保留runtime原始字节，两后端与LuCI包revision同步升2，检查脚本继续要求完整hash一致，未放宽断言。App Hub包契约新增原始payload和八条首页备份路径校验，2项通过；资源cache key旧版本相等假设更新为当前版本+内容hash格式，不删版本/三个资源键断言。

同次ARM APK在lucihttp构建缺lua.h，原因是25.12的Lua已在官方packages feed，原profile只含base/luci。仅本次profiles显式启用各SDK默认packages固定commit：IPK21 `78bcd00c13587571b5c79ed2fc3363aa674aaef7`、IPK24 `23abaa6f3b0fdfd76b570031107e5718476ff0c8`、APK25 `268d92d3d46147efe1e81892e3a618f8bbd4806b`。从官方openwrt/packages镜像读取这些Git对象到本实例cache，checkout仍使用SDK默认canonical origin，fsck通过，无Git push。iStore依赖固定为此前成功canonical刷新得到的a97ace34f2da358a015b094d326bba2697697f2e，避免移动main分支和瞬时TLS失败改变输入。

APK rooted feed种子落点修正为base_root，缺固定对象时先读取object cache再访问origin；真实Git测试覆盖root链接和缺pin补齐。本实例错误的旧种子移动到私有work/seed-diagnostics目录保留，未删除共享SDK/cache。构建器13项测试、preflight/release/deploy/verify通过；新runtime `runtime-138538c8fab5`。原构建器current仍为runtime-linkease-176-source-date-fix-20260930，未修改其他任务工作树。输入patch采用固定canonical基点的零上下文生成并在完整目录副本反向dry-run通过，避免patch正文上下文被Git源码空白lint误判。

修正候选2 IDs：`quickstart-home-x64-0161-20261018-2`、`quickstart-home-arm64-0161-20261018-2`；正在构建。前一个构建的失败/中止日志与状态保留，不算最终通过。

## 当前最终业务版本：0.16.2

触屏390px的测速按钮与上传速率标签碰撞，经独立子任务优化1解决，见M69 touch-traffic。当前冻结提交 `eda99c4f5fcb03395024e09b8540a8da5464c6c9`，版本 `0.16.2-test20261018`。三架构runtime归档 SHA256 `4af68fb8009d1055a85c4ac7aa2e9d8c64a469b76a74b1751d8897ec74fc2ff4`，资源版本 `0.16.2-test20261018-release-a2b747a25e6e`，持久保存bin/releases/eda99c4及MANIFEST/SHA256SUMS。没有覆盖既有下载缓存。

B的 `b-candidate-eda99c4-final` 八项真实登录态业务断言通过，控制台/HTTP/pageerror为空；文件与运行进程逐项匹配，两个短期root会话销毁，首页测试配置恢复。当前源码make verify-lan-device-business通过，含104项前端、Go、vue-tsc、部署/安装器契约和局域网确定性场景；这些场景不证明真实限速数据面。七组本地兼容矩阵通过，触屏B另行通过。此刻仍是候选部署，opkg仍为旧包，不能标为安装通过。

App Hub `29d1837`，nas测试工作树 `fcd6112`、nas_luci `fde0e6a` 已同步0.16.2及runtime内原始资源。两项包契约通过。SDK输入补丁 `80084c4f78e0f09a81b45f8aae2550203cf3a00f8046b2f9185aa1e8806aaf88`，完整目录副本反向dry-run通过；构建器 `8f43e098f02b`、13项测试及preflight通过。旧0.16.1构建继续保留历史证据，最终交付必须重新使用0.16.2输入。

公开Release在2026-10-18重新查询：0.15.0标签只有x64 NetPolicy资产，ARM64仍缺。最终测试配方把未改变的两个NetPolicy归档与Go runtime统一指向0.16.2发布批次，三份精确hash归档均已准备在bin/releases/eda99c4。当前仅为未发布缓存输入；需要明确授权后才可上传该新标签资产及推送canonical feed，本轮未执行发布。

旧0.16.1两组任务按容器BUILD_ID及output挂载核对归属后停止，保留中止状态及日志，不计通过。ARM依赖unbound源站下载缓慢，从OpenWrt官方sources镜像读取同名归档，hash `0fe8b6277b0959cfd17562debac0aa5f71e0b02dc4ffa9c60271c583edab586f` 与SDK固定配方一致，仅预置缺失下载文件，没有替换配方或降低校验。当前构建器runtime `runtime-8f43e098f02b` release/deploy/verify通过。

当前最终构建：`quickstart-home-x64-0162-20261018-1` 与 `quickstart-home-arm64-0162-20261018-1`，FORMATS=both、FEED_REFRESH=always、JOBS=4。等待构建及包内核验，尚未安装。B重新只读预检确认NetPolicy包、二进制、配置与服务均不存在；新包默认enabled=0，不为首页验收开启策略引擎。B /tmp余60.9MiB，安装临时目录使用/root自己的候选目录；默认路由仍经A .1。

`reject-candidate-package-metadata` 为当前B反向验证：候选文件/进程已匹配eda，但旧opkg 0.9.9/0.8.17元数据仍被QS_EXPECT_MANIFEST门禁拒绝；未创建任何短期会话。安装后复验强制同时匹配三包版本、五个文件hash、实际进程及LuCI资源key，浏览器/API错误不可通过。当前两架构IPK阶段均完成、feed为fresh，APK仍在构建，不计整组build.status成功。

`ipk-stage-0162.json` 是明确标记stageOnly的提前解包诊断：两架构各三包版本/架构正确，Quickstart及NetPolicy ELF都保留runtime原始hash，CSS亦匹配。不是整组构建或安装通过。

APK下载并发子任务：x64并行编译报告lvm2 normal失败；其构建目录只有prepared-check空标记、未进入configure。共享LVM2.2.03.33.tgz读取先后得到2fb1dfd3…（0条目）、edb9b0b3…（313条目），均不等于配方be4babd8…。官方sources镜像同名归档独立下载的SHA与配方一致。检查SDK download.pl确认临时.dl/.hash位于共享DL而锁位于各SDK tmp，跨SDK竞争与上述动态指纹一致。按精确BUILD_ID停止本任务ARM容器，改为串行调度；随后缓存已由SDK下载流程成为正确be4babd8…，无需人工替换任何共享文件。异常原字节当时已被SDK替换，未伪造归档；观测指纹/归档条目数和原失败日志保留在 `cache-download-repair-0162.json`。x64继续等待自动串行重试；ARM必须使用新编号、在x64完成后重建。没有删除NAS依赖或放宽hash。

进一步进程核对发现x64实际等待OpenSSL源站curl超过1130秒，而非持续编译；独立官方镜像与共享已完成归档均匹配配方 b28c9153…。核对容器BUILD_ID及容器内PID1022完整URL后，仅终止该慢curl，构建器进入正常串行重试，后续iproute2编译继续。未替换正确缓存、未重启目标设备、未动其他进程，见 `openssl-download-0162.json`。

## 分格式结果与当前安装

x64双格式任务最终APK在unbound配置阶段失败：DNSTAP启用却缺少宿主protoc/protoc-c，详见 `apk-dnstap-failure-0162.log`。按本轮三轮优化边界暂停APK闭环，不删除DNS/NAS依赖凑通过。后续方向是核对SDK功能选择及宿主生成器依赖；尚未实现或验证该修正。原双格式失败/中止状态保持，不据其IPK阶段产物声明整组成功。

独立IPK任务 `quickstart-home-x64-ipk-0162-20261018-1` 与 `quickstart-home-arm64-ipk-0162-20261018-1` 均build.status=success、fresh feed，fetch全部SHA256SUMS通过。`x64-ipk-0162-1.json`、`arm64-ipk-0162-1.json` 解包校验通过：各三包版本、架构、原始ELF、完整36份资源集合/字节、模板key、合法SMART依赖和八条keep.d路径。输入patch仍80084c4f…，builder runtime仍8f43e098f02b。产物和完整输入已持久归档 `bin/releases/eda99c4/sdk/<BUILD_ID>/`。这是六个IPK通过；没有APK通过或ARM实装结论。

包保留契约修正：真实SDK的scripts/ipkg-build会将未随包安装的运行时路径过滤出conffiles，include/package-ipkg.mk再把这些路径追加到keep.d。后者与配方显式keep文件可出现重复行，按集合验证。检查器保留/etc/config/quickstart的conffiles校验，要求八条运行时保留路径齐全，并新增断言包内不得携带占位JSON，防止破坏缺文件时初始化。不是删除保留断言凑通过；实际安装和sysupgrade清单另行验证。

B安装准备：私有目录 `/root/quickstart-package-candidates/home-0162-eda99c4-r2` 权限700、备份600，保存当前程序/Web/首页与原软件包文件/记录。普通opkg update通过八源签名检查；包传输SHA、配置指纹、--noaction预演通过。实际普通opkg安装三包及smartmontools-drivedb 7.5-r1成功，未force-depends。旧Quickstart配置被正确保留，新默认另存quickstart-opkg；该配置保留提示不是依赖失败。

### 安装保留检查的红灯与精确解释

`b-install-preservation-0162.log` 首轮严格指纹检查在network报红，未掩盖。应用diagnosing-bugs流程：保留红灯；依次验证DHNS桥端口、UCI格式变化、接口配置变化三个假设。`b-network-change-diagnosis-0162.json` 证明唯一差异为新增 `list ports 'dheth0'`：从当前原文移除此一行，恰恢复安装前SHA49f8c014…。不是LAN被改成DHCP；其余原始字节全部相同。源码确认原有quickstart.uci-default会启动startdhns boot，后者调用uciChange；既有netns.PlanBridgePortCommands负责追加该虚拟端口并在B触发network reload，已存在端口时不再写。定向TestBridgePortCommands通过。未改这一原业务，也未删除其端口迫使hash过关；A/C/D未操作。

原私有备份只留network指纹、遗漏单独原文，已明确承认。按上述可证实的SHA重建安装前原文，存为 `backup/network.before.recovered`（600），没有写回活动network文件。新的 `verify-home-preservation.py` 默认严格模式仍报红，`b-preservation-strict-0162.json` 保留；仅显式--allow-dhns-init且精确移除此一行还原原SHA时允许该已有初始化，任何其他字节变化都失败。`b-preservation-reviewed-init-0162.json` 通过：四份现有首页文件及其余缺失状态、DHCP/firewall/Quickstart/业务资料/执行方偏好、.244/24与默认网关.1保持。不得把此结果概括成所有网络文件字节完全不变。

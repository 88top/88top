> 历史归档：仅供追溯，不代表当前功能、部署状态或开发要求。

# Quickstart M65～M70 接手与首页设计计划

日期：2026-10-14（UTC）；检查源码 HEAD：`54cfecf702bb27970797bea7c7fe3f9a931ee65c`。
开始时 Quickstart 工作树干净，文档中最高已有编号 M64；本轮使用 M65、M66，后续编号预留至 M70。
**当前设备状态与历史验收分开记录。正式首页实现等待 M66 产品确认。**

## 历史完成

- M64 的 55 项业务、设备身份/多地址、设备资料与原创图标、路线/DNS、独立联网权限、分组/时段/配额、事务和降级已有源码及历史验收。
- 独立 netpolicy、x86_64 IPv4/IPv6 数据面、回滚和资源限制有历史证据。
- x86_64/ARM64 三包 IPK/APK 有历史构建；ARM64 Quickstart/LuCI 曾完成安装与登录态检查。
- 这些记录保留原日期、候选哈希与结果，不迁移成当前设备验收。24 小时观察始终未完成，继续按用户决定延期。

## 当前已复验

### 仓库与输入

| 仓库 | 检查时分支与状态 | 本轮处理 |
| --- | --- | --- |
| Quickstart | 当前任务工作树，开始时干净 | 添加设计、诊断记录与只读检查入口；未修改生产首页 |
| quickstart-netpolicy | linkdev，干净 | 读取源码/CLI/接口；运行 43 项测试 |
| istoreos-app-hub | main，干净，比 origin/main ahead 1 | 只读配方和同步规则；不 push |
| nas-packages | master，干净 | 不切分支；用 `git show quickstart-0928:...` 读取正确 feed |
| nas-packages-luci | main，干净 | 不切分支；读取 quickstart-0928 |
| openwrt-sdk-builder | main，ahead 9；构建脚本、测试及 linkease-176 配置有未提交改动 | 全部保留；不提交/部署；10 项当前工作树测试通过 |

2026-10-14 `git ls-remote` 核对 canonical feed：nas-packages `bee9750470cf903ce5d9f3c563dc1ea2ac56929e`；
nas-packages-luci `a370c0b3a56f9175192b449830c9116d46fada16`，与本地 quickstart-0928 对象一致。
canonical nas 配方已经包含 ARM64 target/hash/依赖范围，但本地和服务器 current 的 ARM64 profile 仍声明相同 FEED_PATCHES。
**后续构建前应移除重复补丁声明，并按照构建器契约完成提交/部署/verify；本轮不动含其他任务改动的工作树。**
服务器 current 为 `runtime-linkease-176-source-date-fix-20260930`，不再是历史 Quickstart 构建时的 runtime。

### 四机只读基线

| 设备 | 当前观测 | 判定 |
| --- | --- | --- |
| A .1 | iStoreOS 24.10.2 / 6.6.93；Quickstart/LuCI 0.11.6-r1；上联网关 192.168.9.1 | 仅一次串行只读基线，无会话创建、部署、重启或配置写入 |
| B .244 | iStoreOS 24.10.1 / 6.6.86；Quickstart 0.9.9-r1、二进制 version=0.9.9；LuCI 0.8.17-r1；默认经 A | **与交接中的“新版安装成功”状态不一致，以当前读数为准** |
| C .93 | EasePi R1，24.10.8 / 6.6.144；Quickstart/LuCI 0.15.0-test20260928-r1、netpolicy 0.2.0-test20260928-r1；默认经 B | 用户态可执行；引擎 enabled=0、未监听 8765；未改变默认路由 |
| D .7 | 24.10.1 / 6.6.86；Quickstart 0.13.0-r1、LuCI 0.12.8-r1；默认经 A | 只读；未添加临时路由/流量/文件 |

一次地址快照中 A/B 均未持有 `.3`，B 未读到 floatip 配置/运行进程。
不能宣称当前浮动网关已健康，也未执行故障切换。
此快照不能排除未检查设备上的 VIP 冲突；重建验收时仍需独立预检。

### B 的实际进程与 API

- `/usr/sbin/quickstart` SHA256：`fb2c679f9ae102db01948ca72b4968d01592e07a90dd334b9366818a06f1d8a3`。
- PID 11496 为 `quickstart serve --unix /var/run/quickstart/local.sock`，监听 127.0.0.1:3038，RSS 14680 KiB。
  另一个同 exe 的 PID 14327 为 startdhns，不把它当成 API 服务。
- 正式完整路径 `/cgi-bin/luci/istore/lanctrl/v2/{devices,network-rules,device-traffic}/` 的初次直连均 404。
  第一轮用简写路径取得的 404 已丢弃，不作为定位依据。
- 之后读检查出现部分 10 秒 API 超时与旧 UI 设备路径 30 秒导航超时，见当前报告；未用服务重启绕过。
- 初次登录态观察为旧英文首页，手机有横向溢出，未提供新版三个产品页签。
  当前旧 LuCI 与旧后端并不是交接中的“新前端 + 旧后端”安装组合。

结论：当前 B **没有达到新版安装验收前提**，不是修补前端即可恢复 v2 API。
后续先核对三包、安装来源、二进制与服务进程，再安装匹配包并重验。

### C 的当前业务与 UI

认证直连使用已创建的短期 session，并通过后端要求的 `X-Forwarded-Sid` 头转发；不能用仅带 cookie 的直连结果判断业务失败。
LuCI 使用 sysauth cookies，session 额外授予 UCI read ACL 后，桌面/平板/手机首页到管理页导航成功，控制台和失败网络请求为 0，无横向溢出。
两轮临时会话均在 finally 中销毁，未更改密码，证据不保存会话标识。

| 接口 | 当前业务结果 | 不能推导的结论 |
| --- | --- | --- |
| devices | 有效 result；1 台，0 台在线；health=partial，arp_unavailable | 不能由 HTTP 200 推导所有来源正常 |
| network-rules | 有效 result；0 条规则 | 不证明写入/回滚功能本轮通过 |
| device-traffic | 有效 result；health=ready，1 项 | 不证明 netpolicy 引擎 healthy 或数据面 ready |
| router-context | LAN=lan，地址 192.168.100.1，DHCP authority=local，可编辑 | 不代表 C 在上联 192.168.30.0/24 分配 DHCP |

C 的 br-lan 没有当前 IPv4 邻居；.30 网段在 eth0 上联。库存范围与上联范围不能混淆。
只读 API 与页面通过不替代资料写入、路线应用、真实限速与恢复验收。

### Release 与原有包

实时读取 [统一 Release](https://github.com/istoreos/istoreos-app-hub/releases/tag/quickstart-runtime-v0.15.0-test20260928)，
只有 Quickstart runtime 和 netpolicy x86_64 两项，ARM64 runtime 尚未发布；[原始资产列表](evidence/m65/release-assets.json)已保存。
Quickstart runtime digest 与交接的 `d541d86c…1cd` 一致。

两个历史 artifacts 目录当前仍为 `status=success`，全量 SHA256SUMS 重新校验退出码 0：

- `quickstart-both-20260928-115329`
- `quickstart-arm64-both-20260929-0830-final`

这是历史包的完整性复核，没有生成新候选。
ARM64 build.env 使用 IPK 24.10.8、APK 25.12.2；nas 锁为 `83633a01…`，早于当前 canonical `bee97504…`。
旧包校验成功不能证明当前 feed、此次源码或当前安装版本一致。APK 无适配实机，不做 IPK 设备原地 APK 安装。

### 当前本地门禁

| 门禁 | 本轮结果 |
| --- | --- |
| verify-lan-device-business | 通过：矩阵校验、Go、前端契约/TypeScript、ops、隔离实验室和领域门 |
| build-web | 通过，正式资源生成；没有部署 |
| netpolicy make test | 43 项通过；不代表 ARM64 内核执行通过 |
| builder make test | 10 项通过；包含该工作树已有修改，不代表部署版本 |
| 原型 browser review | 108 个多端/场景/布局组合及 10 项交互通过 |
| 预览生命周期 | start/幂等 start/stop、外部端口占用拒绝与归属保护通过 |

初次本地门因缺少锁定依赖 pofile/vite 失败；`npm ci --no-audit --no-fund` 后一次重跑通过。
未修改 package-lock 或为了通过而放宽测试。

## 未完成与遗留问题分析

### 已定位：空 ARP 被误报不可用

当前反馈环：`rtk python3 scripts/ops/lan-device-takeover-check.py <证据目录>` 可区分缺少接口、无业务 result 与来源降级。
源码 `backend/service/network_device_list_usecase.go` 在读取 ARP 时执行 `cat /proc/net/arp | grep ' br-lan$'`，
零匹配返回码 1 被转为来源错误，随后 `device_inventory_v2_source.go` 加入 arp_unavailable。
2026-10-14 C 只读检查：proc_read_exit=0、LAN device=br-lan、grep_exit=1、neigh_exit=0。
这支持“正常空集合被误判”机制；没有把 eth0 设备错误合并为 LAN 设备。
修复应在读取 Adapter 分清空集合和真正读失败，并先补真实调用 seam 的回归；留在 M67，不在设计原型中掩盖。

### ARM64：尚无有效当前启动复现

只读复验已确认 CLI 支持 `--tc-backend auto|tcx|netlink`、BTF 存在、bpffs 挂载、enabled=0、health 无监听。
当前 logread 没有引擎启动记录。没有启动引擎或触碰 TC，不能判断当前 ELF/BTF/map/program load/attach 到哪一步。
`bandix/src/ebpf/shared.rs` 中“resolved backend”日志位于 `EbpfLoader.load` **之前**；看到 auto→tcx 不能证明已到 attach，更不能证明 TCX 是根因。
program load 还有 3 次重试与 3 秒间隔，现有 topology smoke 的短等待不足以单独判定加载挂死。
已安装 init 脚本没有读取/传递 `tc_backend`，只改 UCI 字段不能算 netlink 对照试验。

M68 的可证伪复现设计：

1. 先在隔离接口上记录接口、BTF、二进制哈希、owner、qdisc/filter、路由和服务初态；不使用 A，不改 C 默认路由。
2. 独立测试端口与临时 data-dir；不复用真实策略库，不启用 DNS、历史、邻居 flush 或外发。
3. 120 秒总等待、每 2 秒一次短超时 health、按 15 秒报告进度；成功必须同时 healthy 与 dataPlane=ready。
   保存完整 stderr、进程存活、内存与退出码；不能仅凭 PID 或一条日志停止等待。
4. 在 ELF load、program load、attach 边界加一次性标记，单次先 auto，再在同一干净初态验证显式 netlink；每次只改一个变量。
   检查实际 cmdline，证明 `--tc-backend` 到达二进制。
5. 本机 trap 与远端超时守护双重清理，按本次 owner/PID 清理；保留外部 TC 资源，退出后比较初态。
   SSH 断开也必须清理；清理不完整即验收失败。
6. 隔离加载通过后才进入受控真实吞吐：路径、限速前/中/回滚后、IPv4/IPv6、对照终端和资源一起验证。

本轮没有宣称已建立并运行这个有状态复现，也没有写自动回退代码。

### 版本、安装与发布

LuCI 配方仍仅 `+quickstart` 无兼容下限；`requestError.ts` 仍为通用错误提取。
建议将前端需要的 API/最低兼容契约写入 runtime manifest 与页面启动检查，同时以两种包管理器验证依赖版本表达。
404 还须结合版本/能力判定，不能把认证失败与路由缺失混为一谈。
三包文档必须同时核对 opkg 数据库、实际 ELF/进程、静态资源身份和 API；候选模式忽略包数据库不能关闭安装门。

安装保持同一工具索引链：普通 opkg 先 update 再 install；is-opkg 更新与安装均用包装器。
不 force-depends、不删除合法 smartmontools-drivedb。当前首页和后台仍提供磁盘/SMART/RAID/NAS，
NAS 拆包必须另列功能和目标固件源依赖影响，不能由一次索引故障推导依赖可删。

## 五层矩阵的当前解释

原矩阵仍是日期为 2026-09-28 的历史基线，不能直接将 55/55 verified 读作本轮实机全绿。
本轮检查了所有 55 项引用文件存在性，并运行当前源码统一回归门；逐项覆盖层状态见
[当前覆盖叠加表](evidence/m65/coverage-current.json)。所有条目的 B/C 当前完整设备验收均保持 not_verified。
本轮只有 C 的基础读取/导航部分证据；涉及策略、权限组合、恢复、真实吞吐和长期资源的项目全部需重验。
未改写生成矩阵或历史 evidence 来抹去这个差异。

## 待产品决策

就地编辑执行更新（2026-10-15）：用户已授权连续实施M66.13～18；13～17自检通过，5180已换为就地编辑原型，18当前候选技术总验收通过、已交付，等待用户实际确认新交互体验。最新结果见[阶段状态](evidence/m66/direct-edit/status.md)，当前操作见[评审指南](evidence/m66/direct-edit/18-review/review-guide.md)。此后新增状态不覆盖M65设备基线，不作为正式首页/API/安装验收。

最新用户反馈（2026-10-15）：产品功能定义已认可并要求先提交当前代码；当前大表单编辑交互仍需优化。M66.12保留最终体验评审，下一步比较更方便、直观且实现成本适中的就地编辑方案；见[功能基线确认](evidence/m66/row-layout/12-design-signoff/functional-baseline-approval.md)。

最新继续结果（2026-10-15）：用户已选择R并同意有限分栏/堆叠；上轮三次优化后停止的两项失败，在用户再次授权继续后已定点复现、修正并完成当前候选回归。M66.10/11当前TypeScript、13交互、24基准、42状态、13临界点、72权限点击、48张PNG及生命周期均通过。M66.12已进入最终人工评审，等待用户实际确认当前视觉/交互；见 [最新状态](evidence/m66/row-layout/status.md)、[评审指南](evidence/m66/row-layout/12-design-signoff/review-guide.md)、[R规格](product/quickstart-home-ordered-prototype-spec.md)。后文旧结果保留原日期，不替代当前设计检查，也不将本次原型验证扩展为设备业务通过。

2026-10-15 当前有效进度：M66.7信息/边界与M66.8 R/G/F三方案已自检通过；M66.9代表布局交互已通过当前浏览器检查，等待用户选择方案。公开入口默认进入R，历史A/B/C不再是默认。任务树、验收与当前证据见 [布局设计计划](product/quickstart-home-layout-decision-and-milestones.md) 和 [执行状态](evidence/m66/row-layout/status.md)。M66.10～12依赖该产品选型，尚未执行；正式开发和设备验收不在本轮范围。下文保留历史迭代过程。

当前 M66 原型已按“移走顶部快捷入口、保留原大图、大胆重组信息”继续迭代。最新依据为 [主视觉与操作空间](product/quickstart-home-canvas.md)，证据在 `docs/archive/evidence/m66/canvas/`。选择的是流量画布/右侧工具台/底部操作台与模块默认值，领域语义不变；前两轮分析与失败记录保持原日期。
新增首要约束：左侧系统菜单保持原样，Quickstart 只设计右侧内容；A/B 页面工具移到内容区右边，浮动条与弹窗遵守宿主边界。当前公开入口的边界验证见 `docs/archive/evidence/m66/system-boundary/`，不以此前全宽预览结果替代。
随后用户授权试设计“快捷入口融入对应模块”。当前默认 A 更新为模块内入口，撤去 A 竖排快捷栏与五入口底栏，隐藏模块时收纳到配置区常用工具；B/C 保留作对照。最新评审与证据见 `docs/archive/product/quickstart-home-canvas.md`、`docs/archive/evidence/m66/contextual-actions/`，待用户确认后再进入正式首页实现。
2026-10-15 用户指出网络区被右侧卡片撑高、应用组织分散。最新 A 改为“紧凑概览＋应用”：图表独立288～352px，应用/系统工具移至网络区下方，常用入口最多6个，软件中心负责安装更新，服务详情独立可选。当前证据为 `docs/archive/evidence/m66/compact-applications/`，此前结果保留历史；正式首页依然等待产品确认。

最新请求已否定前一轮视觉方案并授权重排内容。当前 M66 视觉迭代见 [首页重新设计](product/quickstart-home-redesign.md)：三种结构、模块顺序/宽度编辑、统一深浅主题。新的截图和检查位于 `docs/archive/evidence/m66/redesign/`；前一轮三次失败记录保留，不移作新版结果。当前待选的是三方案及模块默认值，正式实现仍进入 M69。

前一轮用户认可“复用真实 Quickstart Vue/CSS、先还原现有首页、再评审设备摘要”的设计方式，以下保留当时的状态。
M66 现拆为 M66.1～M66.6，见 [当前首页设计实施计划](product/quickstart-home-design-review.md)。
此前 HTML A/B/C 原型保留为历史探索，其整页重排不再作为推荐实施方案；现有 5180 已转换为真实 Vue 构建后预览。
M66.1～M66.4通过；M66.5自动化通过但最终手机深色视觉复核失败，已按三次上限停止；M66.6规格草案见 [Vue 原型规格](product/quickstart-home-vue-spec.md)。
设备摘要位置、6/3 台密度、默认收起速率与单设备深链仍待新原型评审。
设备身份、DNS 跟随、DHCP authority、图标优先级与任务级事务已经有基线，本轮不重新讨论。

## 新里程碑与任务树

当前范围修订：用户明确只做产品/原型设计与人工确认。M66.7～M66.12的有效目标见 [设计阶段计划](product/quickstart-home-layout-decision-and-milestones.md)，以M66.9选型、M66.12最终人工验收为两个确认点。本轮不执行M69正式接入/保存、M70打包或实机验收，也不将其作为设计完成条件。原项目路线图仍保留，等待后续安排。

2026-10-15 布局方向已获用户认可，新增 [方案比较与细化里程碑](product/quickstart-home-layout-decision-and-milestones.md)：推荐R有序行＋比例卡片，备选G自动等宽/F自由画布/T模板。M66.7～M66.12覆盖新原型与最终产品确认，当前M66.7/8自检通过、M66.9待选型；M69.1～M69.3覆盖后续正式布局偏好、真实数据与当前设备验收，接回既有M70打包。以下早期M66子编号结果保留历史，不以方向认可自动关闭视觉门。

| 编号 / 状态 | 任务树 | 可测试验收标准 | 证据位置 |
| --- | --- | --- | --- |
| M65 当前事实核验 / 完成（结果含失败） | 仓库状态 → 四机串行基线 → B/C 版本/进程/API/UI → Release/feed/旧包 → 当前本地门 | 使用当前时间/设备；A 零写入；三项 API 检查业务 result；会话销毁；旧记录与当前失败分开 | docs/archive/evidence/m65/ |
| M66 首页评审交付 / 新三结构原型已交付，最终选型待评审 | M66.1预览环境 → M66.2原界面还原 → M66.3设备摘要布局 → M66.4完整页交互 → M66.5多端/异常自检及用户授权重设计 → M66.6设计选择与规格 | 首轮三次视觉失败记录保留；最新canvas原型通过18布局、14场景和交互/采样复验，移走顶部快捷卡片并保留原大图；美感与默认结构待用户评审 | docs/archive/product/quickstart-home-canvas.md、docs/archive/evidence/m66/canvas/；历史docs/evidence/m66/vue/ |
| M67 安装兼容与空库存 / 待执行 | 版本契约 → 404/权限提示 → 空 ARP 回归修复 → 三包安装文档 → B 匹配安装与读取/UI复验 | 旧版有明确说明；空ARP不报来源故障；合法依赖保留；metadata/ELF/进程/Web/API一致；不 force-depends | docs/archive/evidence/m67/ |
| M68 ARM64 引擎 / 待执行 | 有界可清理启动复现 → 阶段定位 → tc_backend 对照 → 证据驱动修复 → 吞吐/恢复/资源 | healthy+ready；明确阻塞阶段；IPv4/IPv6前/中/后吞吐；对照不受影响；清理与默认路由复核；A零写入 | docs/archive/evidence/m68/ |
| M69 正式首页 / 等待 M66 确认 | 冻结布局 → 共享库存与状态 → 深链 → 有界刷新与缓存 → 多端/主题/语言 | 首页/详情同一身份数量权限；单设备定位不依赖IP；隐藏暂停采样；服务缺失不阻塞；真实导航/API与布局验证 | docs/archive/evidence/m69/ |
| M70 新候选包收口 / 待执行 | 干净提交 → runtime → 配方/canonical feed → 去重复patch → SDK/fetch → 安装/安全Smoke | 新Build ID、3 IPK+3 APK、ELF/版本/依赖、hash/env/lock/input一致；B/C当前安装验收；发布操作另获明确授权 | docs/archive/evidence/m70/ |

每个失败里程碑最多优化三次，仍失败则保留证据并停止该项；不会以修改 A 或删除断言换取通过。
24 小时观察单独延期；最终候选冻结后重新计时，不阻塞 M66，亦未算发布通过。
本轮没有 push、Release 上传、Action 触发、新 SDK 构建、安装、服务重启、压力或故障注入。

## 当前交付与复验命令

```sh
rtk ./scripts/ui-design.sh status
rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/vue-state-review.cjs
rtk python3 scripts/ops/lan-device-takeover-check.py /tmp/quickstart-current-check
```

最后一个命令只对 B/C 创建短期会话和读取；当前 B 失败时预期退出码非 0。
当前 Vue 原型地址：`http://192.168.9.19:5180/?layout=layout-lab&variant=rows`。设计确认后再开展正式首页。

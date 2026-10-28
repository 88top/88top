> 历史归档：仅供追溯，不代表当前功能、部署状态或开发要求。

# Quickstart Vue 首页设计原型

## 当前：淡雅底面与业务点彩（2026-10-20）

用户要求将点彩逻辑应用到正式Quickstart web：大部分淡雅，用重要文字和图标本身的颜色增加生机，参考旧版Quickstart，不靠加深操作/图标底色。当前默认[鲜明点彩版](http://192.168.9.19:5180/)与正式首页共用`home/homeSemanticColors.css`；[浓底方向](http://192.168.9.19:5180/?palette=bold)和[原设计](http://192.168.9.19:5180/?palette=classic)仅在隔离预览对照。中性画布、白卡片、淡操作、彩色线条图标和业务名称着色，状态与身份色独立；保留既有布局、正式蓝色顶部和无粗线规则。[当前色彩规范](../quickstart-home-color-study.md)、[正式实施与设备证据](../../evidence/m70/semantic-colors-production/status.md)。以下是历史设计基线与各自候选验收。

## 当前：网络连接与紧凑网络接口降高

连接改为三个完整信息行，紧凑端口由三层收成两层；字体、状态来源、隐私、原表单和详情保持。约463px桌面卡宽下实测连接334→238px、接口161→136px；长值/异常/触屏可自然增高，手机完整接口形态保留原总数与字段。[目标及任务树](../quickstart-home-network-density.md)、[当前100组检查、截图与资源指纹](../../evidence/m66/network-density/acceptance.md)。下述按钮/命名规范继续有效，旧候选结果作为历史保留。

## 设备“查看全部”按钮统一

设备主按钮移除旧蓝色链接类及其悬停覆盖，复用现有标题分段按钮样式；字体、图标尺寸、边框与其他控件一致。导航、菜单、业务和布局保持。[当前截图、27组检查与资源指纹](../../evidence/m66/device-action-consistency/acceptance.md)。下述命名与图表例外继续有效，前轮验证作为历史保留。

## 主按钮四字命名，图表保留“测速”例外

用户明确要求网络流量按钮恢复“测速”及原图例间距，以保持图表简洁；其他按钮仍为设备管理、接口配置、查看全部、文件管理、存储配置、数据迁移、下载管理、域名配置、信息概览（设备/应用同为查看全部）。图标、更多、向导和目标保持；菜单图标不加文字，摘要不新增主按钮。规则见[VS12](../quickstart-home-widget-visual-standard.md)，当前资源及截图见[恢复验收](../../evidence/m66/widget-action-labels/traffic-restore/acceptance.md)。前轮四字按钮、标题与构图报告保留为历史，不能替代本次核验。

## 当前小幅更新：中文卡片标题统一四字

除Docker外，当前首页标题为网络流量、网络连接、网络接口、设备列表、应用工具、磁盘信息、存储服务、下载服务、远程域名、系统信息；标准/紧凑与布局编辑中的模块名称保持一致。仅缩短标题，不更改业务、模块ID、尺寸或布局算法。取值见[外观规范VS11](../quickstart-home-widget-visual-standard.md)，结果见[本轮标题验收](../../evidence/m66/widget-titles/acceptance.md)。下方M66.76～81为内部构图基线，当前预览资源以标题验收为准。

## 当前：M66.76～M66.81 七控件内部布局重排

用户授权的[六阶段目标、任务树与可测试标准](../quickstart-home-widget-composition-m66-76-81.md)已全部完成，当前七控件内部构图已进入5180：系统指标/资料双区、紧凑服务选择与全宽地址/目录、Docker状态区、网络地址分组、磁盘名称操作同排。[当前执行状态](../../evidence/m66/widget-composition/status.md)与[28套291组核心回归、额外41组可读性/状态及交付核验](../../evidence/m66/widget-composition/81-review/acceptance.md)通过。已用 `/config/playwright-runner` 截图并实际打开审查，[14张前后对照与体验卡](../../evidence/m66/widget-composition/81-review/optimization-1/review-guide.md)可查看。人工最终审美独立待完成，本轮未提交；合成数据/内存偏好的隔离原型边界保持。下方为前轮归档记录，不能用旧380组代替当前验收。

## 历史：M66.70～M66.75 七控件正文精修

[体验当前首页](http://192.168.9.19:5180/?layout=ordered) · [全部服务示例](http://192.168.9.19:5180/?layout=ordered&scenario=business-all) · [六阶段目标、任务树与验收标准](../quickstart-home-widget-body-m66-70-75.md) · [执行状态](../../evidence/m66/widget-body/status.md) · [人工体验卡与前后对照](../../evidence/m66/widget-body/75-review/review-guide.md)。M66.70～M66.75已连续完成，[当前31套380组及资源/源码/TypeScript核验](../../evidence/m66/widget-body/75-review/acceptance.md)通过。统一七控件正文阅读轴、服务选项、只读路径、磁盘动作、网络隐私外观和系统指标层级；布局结构、字段、动作与原字体保持，系统指标使用已有指标字阶。仍为合成数据/内存偏好的隔离Vue原型，人工审美确认待用户完成；用户已要求[提交归档](../../evidence/m66/widget-body/commit-note.md)。

## 标题操作基线：M66.69

[体验当前首页](http://192.168.9.19:5180/?layout=ordered) · [目标／任务树／验收](../quickstart-home-header-actions-m66-69.md) · [当前检查状态](../../evidence/m66/header-actions/status.md) · [人工体验卡](../../evidence/m66/header-actions/review/review-guide.md)。已有标题主操作统一为前置16px业务图标＋文字、6px间距；连体更多、原动作和正文导航保持。新设计卡共用WidgetPrimaryAction，原业务模板消费兼容样式。[当前19套210组验收](../../evidence/m66/header-actions/review/acceptance.md)及源代码／资源校验通过，1次检查优化已记录；人工确认独立，用户已要求[提交归档](../../evidence/m66/header-actions/commit-note.md)。

## 应用与工具能力基线：M66.63～M66.68 完整应用启动台

[体验首页](http://192.168.9.19:5180/?layout=ordered) · [35项完整库](http://192.168.9.19:5180/?layout=ordered&scenario=apps-35) · [120项分页](http://192.168.9.19:5180/?layout=ordered&scenario=apps-120&favorites=24) · [任务树与可测试目标](../quickstart-home-launchpad-m66-63-68.md) · [当前状态](../../evidence/m66/launchpad/status.md) · [人工体验卡](../../evidence/m66/launchpad/68-review/review-guide.md)。

点击应用与工具“全部”，默认完整来源图标网格，支持全库搜索、轻量筛选、每页48项；首页仍只固定24项。可添加／编辑／删除最多64条用户链接，默认不固定；取消固定不删除链接。保存会定位至对应页，新安装应用不自动写首页。保留原八工具、常用拖动编辑与首页布局。[当前28套318组浏览器＋16组模型验收](../../evidence/m66/launchpad/68-review/acceptance.md)及341源码／64原业务保护通过；人工美感与易用性确认待用户完成。用户已要求提交归档，见[提交说明](../../evidence/m66/launchpad/commit-note.md)。

仍为隔离Vue原型、合成目录、会话内存收藏／链接，刷新恢复；链接仅预览目的地址，不访问真实服务。正式API、ACL、持久化和设备验收另行实施。

## 历史：M66.57～M66.62 应用与工具快捷启动台

[体验默认首页](http://192.168.9.19:5180/?layout=ordered) · [六阶段任务树](../quickstart-home-launcher-m66-57-62.md) · [当前22套263组验收与指纹](../../evidence/m66/launcher/62-review/acceptance.md) · [人工体验卡](../../evidence/m66/launcher/62-review/review-guide.md)。

默认八工具，半宽4×2／手机2×4；更多→编辑快捷入口，真实网格支持添加、移除、拖动、键盘、撤销、恢复与保存／取消。最多24项；保留旧收藏、显示偏好与不可用入口，全部／搜索承接溢出，软件中心保留原目标。编辑宿主独立于响应式槽位，布局与收藏两份事务互斥。原业务表单及目标语义沿用，其他控件与布局保护通过。

本轮仍是合成目录及内存收藏，导航保留、刷新恢复示例。技术通过，待用户人工审美与易用性确认；下列早期候选组数属于历史，不能代替当前版本验收。重复执行可用SSD入口运行`launcher-final-runner.cjs`，见验收文档。

## 历史：M66.51～M66.56 视觉精修

[体验默认五行](http://192.168.9.19:5180/?layout=ordered) · [全部服务运行示例](http://192.168.9.19:5180/?layout=ordered&scenario=business-all) · [六阶段任务树](../quickstart-home-visual-refinement-m66-51-56.md) · [最终176组检查及截图](../../evidence/m66/visual-refinement/56-review/acceptance.md) · [人工体验清单](../../evidence/m66/visual-refinement/56-review/review-guide.md)。

只精修原型样式：共享浅深主题、服务选中态、信息容器、字重与留白、系统中性面板、图例读数、设备／应用图标底座和磁盘轨道。卡片业务与布局核心不变，121实现和64原业务文件保护通过。技术完成，待用户人工审美确认；下列早期候选组数是历史证据。

## 默认布局更新（2026-10-17）

用户指定的默认首页为五行：左单右双（网络流量／右上网络连接／右下网络接口状态）；等宽双列（局域网设备／应用与工具）；等宽双列（磁盘信息／存储服务）；三列（Docker／下载服务／远程域名）；单列系统信息。

[默认首页](http://192.168.9.19:5180/?layout=ordered)及“恢复推荐布局”采用此顺序。其他命名对照示例保持原样；组件业务、形态选择、响应式拆行及内存草稿机制不变。

[本轮8组布局检查与截图](../../evidence/m66/default-layout/acceptance.md)通过。下面152组统一样式检查属于上轮候选，不能替代本轮默认布局验证。

用户已确认首页自定义布局完成，归档提交`ed30df5`。随后开始[统一控件外观与独立业务设计](../quickstart-home-widget-visual-standard.md)，以磁盘卡为首个样张方向。用户校正的标题操作已恢复原版连体分段外观，共用外框／单条分隔线／零间隙；[前一候选55组检查与截图](../../evidence/m66/widget-action-group/acceptance.md)保留为历史。

最新实施：11个控件已共用卡片圆角、边框、间距、标题字阶与操作样式；磁盘和SAMBA额外计数尾注已移除，完整信息入口、异常和权限说明保留。[当前候选152组检查、64文件保护与审图](../../evidence/m66/widget-standard/acceptance.md)。标题分段记录为前一候选，不能替代本轮验证；正式业务结构迁移尚未进行。

## M66.50 统一边界调整

[直接体验](http://192.168.9.19:5180/?layout=ordered&preset=network-stack&scenario=business-all) · [规则与任务树](../quickstart-home-boundary-resize-m66-50.md)。进入“自定义首页”，选中行可拖左右边界调宽、上下边界分配当前空间、底边增加行空间。默认仍自动；内容最低需求是硬边界。行布局面板可一次恢复自动。普通浏览与手机拆成单卡后不显示手柄；宽屏偏好保留。

本轮验证脚本：`boundary-contract-review.cjs`、`boundary-interaction-review.cjs`、`boundary-touch-review.cjs`、`boundary-layout-review.cjs`、`boundary-state-review.cjs`、`boundary-resource-review.cjs`及`boundary-handoff-review.cjs`。193组场景、64文件保护及4组交付检查通过，优化2轮；[当前验收](../../evidence/m66/boundary-resize/acceptance.md)、[人工体验卡](../../evidence/m66/boundary-resize/handoff/review-guide.md)。继续用RTK＋SSD入口和独立证据目录，初始失败与优化记录保留。合成数据、内存草稿、刷新恢复示例的边界不变，人工体验需用户确认。

## 历史：M66.44～M66.49 结构与形态解耦

[完整连接＋紧凑端口](http://192.168.9.19:5180/?layout=ordered&preset=network-stack&scenario=business-all) · [左右镜像](http://192.168.9.19:5180/?layout=ordered&preset=network-stack-mirror&scenario=business-all) · [上下反转](http://192.168.9.19:5180/?layout=ordered&preset=network-stack-reverse&scenario=business-all) · [当前技术检查](../../evidence/m66/structure-presentation/48-review/acceptance.md) · [人工任务卡](../../evidence/m66/structure-presentation/49-handoff/review-guide.md) · [架构交接](../../evidence/m66/structure-presentation/49-handoff/development-handoff.md)。

上下位置不再强制摘要。连接标准形态保留完整原连接信息；接口紧凑形态直接显示有界具名端口及状态／速率；组合图表真实绘图区可伸展，上下按内容分配。移动、替换、镜像和撤销共用计划；总览独立显示名称及实际形态，不把缩略高度用于真实卡片。旧rows/v1/v2迁移到v3，保留auto及各版本原推荐含义；通过现有显示设置／恢复推荐显式采用新规则。顶部设计预览可切三个网络组合。

当前构建192组检查通过，原业务64文件未改。只开放已验证的形态／位置，不是全部模块任意嵌套。人工体验待本轮用户确认；旧记录不代替新验收。服务为隔离Vue构建、合成数据和内存草稿，刷新恢复示例，没有真实用户存储／设备验收。旧v2示例可加`legacy=1`，旧v1推荐可加`legacy=0`。任务与唯一规则见[M66.44～49](../quickstart-home-structure-presentation-m66-44-49.md)和[规范1.4](../quickstart-home-layout-interaction-spec.md)。

新检查入口：`structure-spec-review.cjs`、`structure-contract-review.cjs`、`structure-render-review.cjs`、`structure-interaction-review.cjs`、`structure-compatibility-review.cjs`、`structure-matrix-review.cjs`、`structure-overview-review.cjs`、`structure-port-fit-review.cjs`、`structure-resource-review.cjs`、`structure-handoff-review.cjs`；仍用RTK＋SSD及独立证据目录。交付检查需先生成同一被测候选指纹、报告与任务卡。下方M66.38～43固定图表／上下限制为历史，冲突处以1.4为准。

## 历史：M66.38～M66.43 自然高度与系统信息双形态

[当前首页](http://192.168.9.19:5180/?layout=ordered) · [六组件示例](http://192.168.9.19:5180/?layout=ordered&preset=services&scenario=business-all) · [当前规则与任务树](../quickstart-home-natural-layout-m66-38-43.md) · [技术检查](../../evidence/m66/natural-home/42-review/acceptance.md) · [人工体验任务卡](../../evidence/m66/natural-home/43-handoff/review-guide.md) · [正式开发参考](../../evidence/m66/natural-home/43-handoff/development-handoff.md)。

普通行按有限内容自然增高，同排等高；上下小卡按内容分配；网络曲线自身320px／手机300px保持。移除普通行高／上下比例及接受增高操作，保留结构、列宽、显示设置、移动排序及撤销。系统自动在普通槽560px分界选择紧凑概览／完整信息；明确选择完整信息在普通窄槽仍完整展示。标题一个主要操作加必要更多，底部不重复放详情按钮；磁盘首页合计3项、SAMBA2项，完整原组件和原向导仍可达。

24组尺寸／主题／语言基准、临界宽度、原业务／表单、触摸、20次切换和实际卸载检查已通过，详见本轮证据。仅设计Vue构建适配、合成数据和内存草稿；当前人工体验待用户确认。原业务64文件未改；设计构建会注入标题菜单和有限读投影，正式集成应改为显式组件契约。刷新旧标签页加载当前资源。

可重复入口：`natural-contract-review.cjs`、`natural-system-review.cjs`、`natural-layout-review.cjs`、`natural-interaction-review.cjs`、`natural-matrix-review.cjs`、`natural-resource-review.cjs`和`natural-handoff-review.cjs`。继续使用下方RTK＋SSD命令格式和独立证据目录；handoff脚本需已有当前候选指纹及任务卡。下文是历史版本记录，出现手动行高等冲突时以规范1.3 R25～R30为准。

## 历史：M66.35～M66.37 六组件对齐原业务

[六组件完整示例](http://192.168.9.19:5180/?layout=ordered&preset=services&scenario=business-all) · [磁盘状态示例](http://192.168.9.19:5180/?layout=ordered&preset=services&scenario=business-disks) · [业务基线与任务树](../quickstart-home-business-widgets-alignment.md) · [当前检查](../../evidence/m66/business-widgets/status.md)。

磁盘信息、存储服务、Docker、下载服务、远程域名、系统信息直接复用当时Quickstart web的原Vue组件／子组件及配置表单，补回原分页签、完整字段、状态判断、开关、向导及具体高级入口。当时标准卡完整内容在卡内滚动；此规则已由1.3自然高度／有限首页投影替代。保留布局交互及共同字体，暂不重做六组件视觉设计。

顶部“设计预览→数据场景”可切全部运行、RAID／SMART／未挂载、未安装／未配置、仅IPv6、局部失败、提交拒绝和Docker非空目录确认。真实API、外部链接及安装后跳转均不执行；DDNSTO外部授权／绑定以明确的模拟按钮演示。当前资源以本轮指纹为准，下列字体及网络PID／资源是历史候选。

## 前轮：全部首页组件统一原字体

[当前首页](http://192.168.9.19:5180/?layout=ordered) · [含三列服务的完整示例](http://192.168.9.19:5180/?layout=ordered&preset=services) · [共享字体规范](../quickstart-home-typography.md) · [本轮检查与资源](../../evidence/m66/home-typography/acceptance.md)。

当前有序首页11个模块统一Arial／微软雅黑字体栈；标准标题16px、正文14px、辅助文字12px，窄卡／窄屏标题14px和正文13px，摘要标题14px。CPU／内存等关键数字保留原指标字号。对应应用／网络产品面板共用字阶；图表形态及左侧菜单保持原样。以下网络卡专项目录、PID和资源是此前候选记录，当前构建以本轮清单为准。

## 当前反馈修正：网络连接标准形态

[原版截图数据对照](http://192.168.9.19:5180/?layout=ordered&preset=network-business&scenario=network-reference) · [反馈、任务树与检查](../../evidence/m66/network-widgets/visual-fidelity/acceptance.md)。顶部“数据场景→原版截图对照”也可切换。标准卡恢复原字阶、图标、边框按钮、状态时长徽标和地址信息组；摘要形态继续单独适配。对照场景使用无IPv6及固定时长的模拟数据；“正常”场景保留双栈隐私演示，不代表当前路由器状态。M66.32～34下列清单及PID为上一候选历史证据，新构建以本轮记录为准。

## 当前原型：M66.32～M66.34 网络控件业务对齐

[连接与接口独立示例](http://192.168.9.19:5180/?layout=ordered&preset=network-business) · [当前执行及验收状态](../../evidence/m66/network-widgets/status.md) · [任务树与标准](../quickstart-home-network-widget-m66-32-34.md) · [原业务核对](../quickstart-home-network-widget-business-alignment.md) · [开发交接](../../evidence/m66/network-widgets/business-handoff.md)。

- “网络连接和IP地址”保留原状态、协议、接口在线时长、独立IPv4／IPv6隐私、DNS及来源、设备管理，以及DNS／软件源异常动作；连接详情与标准／摘要共用业务逻辑。
- “网络接口状态”独立添加、隐藏、移动及设置形态；端口详情可点击／键盘打开，保留MAC、双工、协商速率和包计数；完整清单有界分页。
- 旧布局不自动插入接口卡。顶部“设计预览→布局示例→连接与接口独立”可查看新示例；在原布局中也可用“自定义首页→添加模块→网络接口状态”加入。
- 顶部“数据场景”提供DNS、软件源、未联网、检测中、加载、接口失败及写入拒绝等场景。异常动作直接复用原配置表单，仅写本次合成内存；刷新恢复示例。
- 正式首页、原业务源文件、系统菜单和原流量图未修改。当前资源与源指纹见[本轮清单](../../evidence/m66/network-widgets/34-review/final/candidate/candidate.json)，不能用下方历史资产标识代替当前版本。

## 已验收布局基线：M66.26～M66.31 模块形态与显示设置

用户已授权并完成M66.26～30的实现与当前候选技术检查；M66.31技术交付、正式开发交接及用户人工验收通过。[当前状态](../../evidence/m66/widget-presentation/status.md) · [验收与交付](../../evidence/m66/widget-presentation/31-handoff/acceptance.md) · [用户确认](../../evidence/m66/widget-presentation/31-handoff/user-signoff.md)。产品基线为[规范1.2](../quickstart-home-layout-interaction-spec.md)，架构见[设计参考](../quickstart-home-widget-presentation-architecture.md)，任务树及可测试目标见[六阶段计划](../quickstart-home-widget-presentation-milestones.md)。实现基线提交`952528c`，本轮按用户要求归档提交。

[应用与设备同排／6常用项](http://192.168.9.19:5180/?layout=ordered&preset=apps-devices&favorites=6) · [默认首页](http://192.168.9.19:5180/?layout=ordered)。顶部设计预览可切“应用与设备同排”。URL中的favorites只是初始设计夹具；正常也可在布局编辑外用“全部→管理常用”准备6项。

1. 自定义首页→模块齿轮“显示设置”：应用可选自动、网格、启动条；网格可选单／双／三行。6项双行为3×2，三行为2×3；预览不改草稿，采用一次提交，原行高足够则保持。
2. 设备可选标准／摘要，统计、身份、权限及完整管理入口共用；摘要不自动开放上下小槽。自动、保存偏好与实际呈现分别处理，窄屏往返不改设置。
3. 槽位选择区分直接可放入、调整后可放入、没有合法方案。短行里的设备不再只显示禁用；可确认增加共同高度，或明确选摘要替代。拖放需调整时也等待同一确认。
4. 移动、替换、显示偏好与必要行高一次撤销；隐藏再添加保留设置，取消整份编辑恢复已应用文档。常用项内容管理仍独立，改变行数不删常用项。
5. 行布局、整行直接排序、空位整理和系统菜单边界沿用已验收行为。仅设计fixture及内存草稿，刷新恢复URL示例；未接真实偏好存储或路由器。

该轮入口`index.61df59de.js`，三份JS/CSS及50个源指纹见[历史候选清单](../../evidence/m66/widget-presentation/31-handoff/candidate.json)。该轮技术结果见[30阶段验收](../../evidence/m66/widget-presentation/30-review/acceptance.md)，人工结果见该轮用户确认，不用旧截图或M66.25确认替代。

## 历史基线：M66.25 整行直接排序

保留已认可的槽位编辑，补充[整行排序任务树与RS01～RS08验收](../quickstart-home-row-sort-m66-25.md)。产品指导见[布局交互规范1.1](../quickstart-home-layout-interaction-spec.md)。以下M66.19～24报告是历史候选，不能代替新排序验收。

进入“自定义首页 → 布局总览”，从左侧“⠿ 第N行”拖动整行，邻行让位，松手提交；手机跨屏靠近上下边缘自动滚动。单击行标题只选中，不再打开整行目标列表。行内“···”支持上移／下移／置顶／置底；手柄支持Alt+上下和Alt+Home／End。一行的模块、比例和高度一起保留，一次撤销还原。

[五行示例](http://192.168.9.19:5180/?layout=ordered&preset=services)便于体验第五行直接拖到第一行；[左右组合](http://192.168.9.19:5180/?layout=ordered&preset=stacked)用于检查不同行高。新检查入口`row-sort-review.cjs`，证据根`docs/archive/evidence/m66/row-sort/25-review/`；状态见[本轮记录](../../evidence/m66/row-sort/25-review/status.md)。内存草稿、刷新重置和系统菜单边界保持原规则。

## 基线：M66.19～M66.24 槽位编辑

用户已认可“真实页面选行布局、填槽位为主，整页布局总览为辅”。产品指导统一见[布局交互规范1.0](../quickstart-home-layout-interaction-spec.md)，实施任务树、测试目标及证据位置见[M66.19～M66.24计划](../quickstart-home-slot-edit-milestones.md)。[阶段状态](../../evidence/m66/slot-edit/status.md)：19～23自检通过，24当前候选技术验收通过、已交付，待用户最终体验确认。

公开入口：[默认首页](http://192.168.9.19:5180/?layout=ordered) · [应用半宽](http://192.168.9.19:5180/?layout=ordered&preset=half)。顶部设计预览也提供半宽、左右上下组合、三列服务、状态、权限及语言选择。刷新旧标签页加载当前构建。左侧系统菜单保持；内存应用、刷新恢复示例。

1. “自定义首页”默认进入真实页面编辑；每行“布局”选择五种结构。缩槽明确选择保留项，不再自动新建行收纳多余模块。
2. 空槽位添加、已有模块替换或从首页移除。选择器说明适配及已有来源；选中后在底部预览影响，再确认。已有模块移来，来源留空，被替换模块仅隐藏，不交换。
3. 分隔线或行工具调整比例／高度；放不下时明确说明，不裁切或自动拉高。空槽位编辑中保留，完成前预览整理；复杂上下组合须补齐或换结构。
4. 次级“布局总览”压缩四行结构便于移动。点击名称→移动→选择位置，或拖名称；整行有独立手柄。普通单／双列边缘可扩列，满三列和上下组合不隐式扩容。返回真实页面判断尺寸。
5. 撤销恢复一个完整动作；取消恢复进入时布局；完成更新本次内存，详情往返保持，刷新重置。Escape先取消当前动作／关闭面板。应用卡按容器宽高换列，全部面板保留常用管理、系统工具及软件中心。

该基线的[技术验收](../../evidence/m66/slot-edit/24-review/acceptance.md)、[场景覆盖](../../../evidence/m66/slot-edit/24-review/coverage.md)、[候选资源](../../evidence/m66/slot-edit/24-review/candidate.json)、[人工任务卡](../../evidence/m66/slot-edit/24-review/review-guide.md)。基线入口index.76bdeab0.js已由新候选替换；不能使用旧截图或旧PID代替当前候选。

检查入口：`slot-contract-review.cjs`、`slot-module-review.cjs`、`slot-primary-review.cjs`、`slot-normalization-review.cjs`、`slot-overview-review.cjs`、`slot-input-review.cjs`、`slot-resource-review.cjs`、`slot-navigation-review.cjs`、`slot-final-review.cjs`、`slot-candidate.cjs`。均通过`rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/<入口>`；重验给`QS_DESIGN_EVIDENCE_ROOT`新的独立目录。最终视觉脚本逐轮保留子目录，结束后再以该子目录运行`ordered-screenshot-audit.cjs`，不要在报告生成前启动审计。权限专项复用`ordered-authority-popover-review.cjs`。下文均为历史实现说明，不作为当前操作指南。

## 历史：M66.13～M66.18 就地编辑

此前公开入口为[5180首页](http://192.168.9.19:5180/)。用户已认可功能基线并授权执行就地编辑计划；M66.13～17已自检通过，M66.18技术检查通过、候选已交付，最终体验尚待用户确认。[该轮阶段状态](../../evidence/m66/direct-edit/status.md) · [评审指南](../../evidence/m66/direct-edit/18-review/review-guide.md) · [计划](../quickstart-home-direct-edit-milestones.md)。以下操作说明记录该轮实现，本次未重新验证服务状态；后续交互目标以文首新规范为准。

1. 刷新页面，右上“自定义首页”进入编辑。上方只保留紧凑工具条，原大表单已移走。
2. 拖卡片手柄到高亮目标：交换、空位或独占新行；也可点手柄→移动→点目标，跨屏用“目标列表”。整行有独立移动手柄。
3. 拖分隔线调整比例，或从行边缘“布局”打开结构缩略图、行高档位与比例小样；精确数值可展开。手机通过同一结构面板调整桌面比例，单列阅读不改写原配置。
4. 添加模块打开临时面板，选择模块后选择位置；已添加模块可定位或隐藏。隐藏全部后仍可添加或从“更多”恢复推荐。
5. 撤销一次恢复一个成功动作；取消恢复上次完成的布局；完成只保留预览内存。设备详情往返保持，刷新恢复URL示例。Escape取消当前操作或关闭面板。

设计预览控件继续集中在顶部，可切换默认、左右堆叠、三列服务、数据状态、DHCP分配方、语言与主题。320px使用“预览/Preview”短标题，读屏名称保留完整含义。左侧系统菜单不在编辑范围。

新检查入口：`direct-editor-review.cjs`、`direct-movement-review.cjs`、`direct-layout-review.cjs`、`direct-input-review.cjs`、`direct-visual-review.cjs`、`direct-resource-review.cjs`。均使用`rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/<入口>`；新一轮给`QS_DESIGN_EVIDENCE_ROOT`指定独立目录，保留失败历史。PNG审计在visual报告完成后运行`ordered-screenshot-audit.cjs`，其证据根必须与visual一致。

## 历史：M66.10～M66.12 的完整原型

最新产品反馈（2026-10-15）：用户认可功能定义并要求提交当前代码；当前大表单编辑交互仍需优化。此认可作为功能基线，不能标记最终视觉/交互验收完成，见[确认记录](../../evidence/m66/row-layout/12-design-signoff/functional-baseline-approval.md)。

当前验收状态（2026-10-15）：用户授权继续后，320px权限弹层越界已修正，整页截图捕获期间的临时视口重排已定位并采用同宽完整内容捕获。当前TypeScript、13组编辑交互、24基准/42状态/13临界点/生命周期、72次权限说明点击及48张真实PNG图表区域审计均通过；见 [本轮验收](../../evidence/m66/row-layout/11-review/continuation-1/acceptance.md)。M66.12已交付，待用户实际确认视觉和交互，见 [评审指南](../../evidence/m66/row-layout/12-design-signoff/review-guide.md)。上轮失败证据原样保留。

当前公开入口：[默认首页](http://192.168.9.19:5180/?layout=ordered)。请刷新旧标签页，当前服务使用构建后预览。

- [左大右上下](http://192.168.9.19:5180/?layout=ordered&preset=stacked)：320px原曲线旁是连接/系统两个紧凑摘要。
- [左上下右大](http://192.168.9.19:5180/?layout=ordered&preset=mirrored)：同一组合的镜像。
- [三列服务](http://192.168.9.19:5180/?layout=ordered&preset=services)：Docker、下载、远程作为独立三列行。

顶部“设计预览”统一选择布局示例、数据场景、地址分配方和语言；旁边切换主题。无需先编辑，就能查看三种组合的普通浏览态。切换布局示例或语言会刷新当前示例，先完成或取消草稿。

“自定义首页”使用流程：

1. 选择某一行，点击整行／两列／三列／左大右上下／镜像缩略图。
2. 在槽位选择卡片，已经显示的模块会移动或交换，不重复；减少槽位时多出的模块移到后续新行。
3. 改变列宽、行高、上下比例，可用分隔线指针或键盘；最小尺寸优先，不够高会阻止并说明。
4. 拖动可视区域内卡片手柄交换，跨屏或触屏可用选择器；整行上移/下移按钮排序。模块清单开关十类内容，重新开启的模块独占新行。
5. 取消恢复上次应用，撤销恢复上一步；应用在本次浏览器预览中保留，进入设备详情返回仍在，刷新恢复URL示例。恢复推荐也先作用于草稿，可取消或撤销。

空布局仍有添加、恢复、页脚应用/工具入口。六类紧凑摘要为连接、系统、共享、Docker、下载、远程，不开放任意递归嵌套。手机按列优先展开，单列使用标准卡片自身高度，变宽恢复偏好。

当前规格见 [完整R原型规格](../quickstart-home-ordered-prototype-spec.md)；证据在 [M66.10](../../evidence/m66/row-layout/10-interactions/acceptance.md)、[M66.11](../../evidence/m66/row-layout/11-review/acceptance.md)。自动化和自检不代表M66.12用户视觉验收。

```sh
rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/ordered-interaction-review.cjs
rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/ordered-visual-review.cjs
rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/ordered-screenshot-audit.cjs
```

再次复验时给每条命令加同一个新的`QS_DESIGN_EVIDENCE_ROOT`环境变量，保留历史报告，例如`docs/archive/evidence/m66/row-layout/11-review/recheck-YYYYMMDD-HHMM`。先运行交互和主视觉检查，再对主视觉产物运行截图审计；权限专项入口为`ordered-authority-popover-review.cjs`。本轮所有报告单独保存在`11-review/continuation-1/`。

## 历史：M66.7～M66.9 布局方案比较

最新：用户已明确选择R有序自定义布局，G/F保留比较，不再等待方案选择。当前讨论R的一行三列与单侧上下堆叠设计，尚未改变5180实现；下文代表交互及限制保持有效。

公开入口：[首页](http://192.168.9.19:5180/)。刷新旧标签页加载当前构建。三方案入口：

- [R 有序行＋比例卡片（已选，比较小样）](http://192.168.9.19:5180/?layout=layout-lab&variant=rows&stage=compare)：默认网络60/40等高，应用独占一行，设备/系统组合。
- [G 自动等宽网格](http://192.168.9.19:5180/?layout=layout-lab&variant=grid)：列数、卡片密度优先，结构更规整，比例表达较少。
- [F 自由画布](http://192.168.9.19:5180/?layout=layout-lab&variant=free)：位置和尺寸自由度高，需要用户维护空间秩序。

底部方案条切换R/G/F，右上“体验布局调整”打开当前方案的代表控制；`tools=0`仅隐藏评审方案条，不隐藏产品操作入口。选择推荐R仍需用户反馈，不以方向认可代替具体选型。

评审步骤：

1. 先比较普通态首屏和整页。三方案使用同样七个默认模块及合成数据，扩展服务开关统一补齐Docker、下载、远程共十类。
2. R：拖动网络两卡之间的分隔线，或用比例预设；分隔线可用键盘左右键。改变网络行高，两卡仍等高。
3. 调整“内容预览宽度”，查看按最小尺寸拆行，再点“自动宽度”；宽屏恢复原比例和顺序，不改原偏好。
4. G：改变列数与密度，再缩窄容器。F：拖动手柄移动、缩放，恢复示例；窄屏按顺序堆叠，不保留二维坐标外观。
5. 右上切换主题/示例场景；可加`lang=en`比较英文。点击设备仍进入同一合成身份详情。

这一步验证代表交互，尚无完整跨行编辑、全部卡片显隐、布局应用/取消/撤销，也没有F碰撞自动整理或真实偏好存储。布局示例刷新恢复；这些完整交互在M66.9选型后进入M66.10。全部使用Quickstart Vue/CSS、原曲线组件、既有设备身份语义；左侧只是不操作的系统宿主占位，不能编辑或覆盖。

自检证据：[执行状态](../../evidence/m66/row-layout/status.md)、[M66.8视觉](../../evidence/m66/row-layout/08-visual-options/acceptance.md)、[M66.9交互与选型](../../evidence/m66/row-layout/09-selection/acceptance.md)。原型通过不代表用户美感确认或真实设备验收。

```sh
rtk ./scripts/ui-design.sh status
rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/row-layout-visual-review.cjs
rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/row-layout-interaction-review.cjs
```

## 以下为历史设计与运行说明

用户访问入口为 `http://192.168.9.19:5180/`，已在该入口复验实际浏览器加载、三种结构与切换条。`192.168.98.2` 为此前使用的容器地址；两者目前返回同一预览服务owner/PID，评审链接统一使用用户入口。
上一轮默认入口为 [A 紧凑概览＋应用](http://192.168.9.19:5180/?variant=canvas)，对照 [B 右侧工具台](http://192.168.9.19:5180/?variant=sidebar)、[C 底部操作台](http://192.168.9.19:5180/?variant=stage)。历史依据见 [主视觉与操作空间](../quickstart-home-canvas.md)。
2026-10-15 更新：图表独立288～352px，不被连接卡和配置工具撑高。“应用与工具”移到网络区下方，默认四个常用入口、最多六个；八个系统工具在另一页签；软件中心作为安装更新入口。“全部应用”可搜索，常用入口支持选择/排序/取消/应用；应用清单的空、加载、失败、大量状态可切换。Docker/下载/远程详情卡默认收起，可单独开启。B/C 保留作历史对照，未确认最终选型。
本轮证据在 `docs/archive/evidence/m66/compact-applications/`：8组多端主题、7种状态、13个点击目标及交互/采样验证通过。所有应用目录均为合成示例，不代表测试路由器安装状态。
系统左侧菜单保持原样，所有设计仅作用于右侧内容。桌面左边为明确标注的不可操作宿主占位区，不是菜单设计；暂预留200px，不代表真实菜单宽度。A/B 页面工具位于内容区右边，浮动条和弹窗也遵守边界；正式页面不引入这套占位外壳。
本次边界证据为 `docs/archive/evidence/m66/system-boundary/`，实际公开入口通过18组多端主题组合及设备详情/工具导航检查。复验命令：`rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/system-boundary-review.cjs`。
底部悬浮条显示A/B/C；`tools=0`会隐藏该评审条。已打开旧页面时重新加载，构建后预览不会自动替换浏览器已运行的旧JavaScript。
顶部不放五个快捷卡片；原 `NetworkFlow.vue` 大图保留，配置位置与设备摘要独立。
上一轮入口组织证据在 `docs/archive/evidence/m66/contextual-actions/`；此前全宽与边界版本证据分别在 canvas/system-boundary 中，保持历史结果。下文更早的设计可用 `layout=studio` 或旧 variant 保留对照。请刷新旧标签页加载新版设计。

当前可重复验收：

```sh
rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/compact-applications-review.cjs
```

A 在原图下方统一组织常用入口与系统工具，B 保留内容区右侧工具台，C 保留内容区底部操作台作对照。
手机 A 使用模块内入口，B/C 保留操作台作对照。“自定义首页”独立选择设备、系统、磁盘、共享、Docker、下载、远程访问；内容区支持排序和宽度调整，主图是本轮固定锚点。

以下为前一轮首页设计，见 [当时的分析与设计依据](../quickstart-home-redesign.md)。
使用 Quickstart 的 Vue、request 层、原创设备图标与身份呈现函数，布局和视觉重新设计；正式首页入口未引入设计代码。

- [A 均衡概览](http://192.168.98.2:5180/?variant=studio)
- [B 网络监控](http://192.168.98.2:5180/?variant=network&theme=dark)
- [C 设备优先](http://192.168.98.2:5180/?variant=device)

底部切换方案，右上“预览设置”切换数据场景、DHCP权限、主题与语言。
“自定义首页”打开模块编辑器：开关、拖动/上下排序、选择宽度、恢复预设、草稿取消与应用。
选择仅在本页内存中生效，进入设备详情再返回保留布局；刷新恢复预设。
`tools=0` 隐藏底部方案切换器用于截图。

新版可重复验收：

```sh
rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/studio-review.cjs
```

证据在 `docs/archive/evidence/m66/redesign/`。新增 `network-error|storage-error|services-error` 场景验证局部降级。
以下入口与脚本是旧版忠实复用对照，仍可访问，不是最新推荐设计。

当前预览直接使用 `web/src/pages/index/index.vue`、原 App、原卡片/网络/NAS/服务/系统组件和 CSS。
新增摘要位于独立 `web/src/design/`，正式入口不导入它；两个空插槽和共享身份呈现函数不改变正式首页布局。
产品语义来自 [唯一基线](../../lan-device-management-product-architecture.md)，实施与评审见 [M66 计划](../quickstart-home-design-review.md)。

```sh
rtk ./scripts/ui-design.sh start
rtk ./scripts/ui-design.sh status
rtk ./scripts/ui-design.sh logs
rtk ./scripts/ui-design.sh stop
# 前台运行
rtk ./scripts/ui-design.sh run
```

start/run 通过 `/var/cache/build-cache/run.sh` 加载 SSD 环境，先构建独立 Vue 原型，再启动预览。
Vite 缓存与原型输出位于该工作树的 SSD work 目录；正式 `web/dist` 和 `node_modules` 不移动、不覆盖。
修改组件后 stop → start 重新构建设计快照。初次安装依赖先使用 ssd-build-cache 技能的入口执行 npm ci。

使用构建后预览是为避免长时间评审依赖 HMR WebSocket；仍是项目 Vue/CSS 编译结果，不是手写 HTML 仿制。
此前开发服务器曾在连续页面检查中发生动态模块导入失败，记录保留在 `docs/archive/evidence/m66/vue/05-review/`。

访问：

- 当前首页：`http://192.168.98.2:5180/?layout=baseline`
- 推荐位置：`http://192.168.98.2:5180/?layout=below-network`
- 对照位置：`http://192.168.98.2:5180/?layout=above-network`

参数：`scenario=normal|many|empty|loading|error|stale|old|permission|no-speed|disabled|speed-error|unsupported`，
`authority=external|local|unknown`，`theme=light|dark`，`lang=zh-cn|en`，`tools=0` 隐藏评审工具。
单设备深链：`/devicemanagement?layout=below-network&filter=all&device=<合成deviceId>`。
管理页、抽屉与移动详情使用正式组件，由设计专用适配器驱动；正式路由支持留给 M69。

所有数据均为合成示例。资料/策略应用只改变本页内存；重新加载恢复示例。
仅明确列出的读接口和内存写入接口有响应；未知 GET 为 501、未模拟写入为 403，服务端不转发 `/cgi-bin/`。
无需 SSH、LuCI 登录或路由器后台，不安装/重启测试设备。原有家长控制、测速等外部工具入口需在正式环境使用。

服务绑定 `0.0.0.0:5180`，nohup + setsid 持续运行。PID、锁、日志按仓库路径隔离，
只停止命令行归属本仓库 Node 服务（兼容停止旧 Python 服务）的 PID。
端口被其他项目占用时拒绝启动，不停止其进程。`/health` 返回 owner/PID/mode。
本机通过 LAN 地址访问已验证；C 的跨网段访问此前超时，不能将本机成功说成所有网络均可访问。

可重复评审：

```sh
rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/vue-review.cjs 01-preview
rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/vue-review.cjs 03-summary
rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/vue-review.cjs 04-navigation
rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/vue-state-review.cjs
rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/vue-polling-review.cjs
```

证据写入 `docs/archive/evidence/m66/vue/`。`index.html`、`app.js`、`style.css`、`serve.py`、`review.cjs`
是首次 HTML 原型的历史文件，当前服务不使用它们；根目录 M66 截图不能替代新 Vue 原型证据。

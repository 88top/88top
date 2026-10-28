# 首页固定应用直接打开：验收

历史记录：以下为1388e6a候选及当时暂停结论。用户随后重新授权手机续修，当前d74e6d4已通过相关门禁，见[续修最终验收](../mobile-scroll-followup/acceptance.md)。本页原失败与统计保留，不代表当前候选结论。

2026-10-19，用户反馈的“首页点击先闪完整应用窗口、返回仍留在窗口”已实际修复并更新B192.168.30.244；当前第三候选中文桌面11组通过。手机返回首页/窗口/焦点正确，但严格滚动位置检查在第三轮仍失败，按用户最多三轮要求暂停这项，不能宣称全端完全通过。[任务树](status.md)与[正式导航契约](../../../../product/quickstart-home-launcher-navigation.md)共同约束当前行为。

## 最终行为

- 首页固定应用：图标原位loading，保持卡片高度及首页URL；解析成功直接同窗跳转，Back恢复首页滚动和图标焦点，不创建完整窗口/panel历史项。
- 完整应用库：用户显式点“查看全部”才打开；库内进入应用后Back继续恢复窗口、分类、搜索、页码、滚动和焦点。
- 首页读取失败/5秒超时：控件内非模态小提示提供重试/原配置/关闭，不改变卡片高度。Escape、关闭提示及源失效清理加载；关闭提示后焦点回原图标。打开全部应用会取消旧首页请求，晚响应不能再跳转。
- 自定义域名链接：维持表单已说明的新标签页语义，直接打开，不弹启动台、不调用动态入口脚本。

稳定宿主仍是唯一激活请求owner，`ActivationSource`分离反馈位置；响应式卡片只读共享状态。首页返回数据只在现有history.state.qsHomeEntry保存有界版本/ID/scroll及原auto/manual滚动恢复模式，合并保留Router字段，不保存目标URL/凭据，不写路由器配置。恢复观察器只在有历史记忆时启动，至多10秒，恢复/卸载清理并归还原滚动模式。原installed GET首载、8秒目录超时/手动重试、本地图标、单应用CSRF/status、安全URL和不启停应用保持。

## 候选与保护

当前B前端冻结`1388e6aacb61b09f7beecdf7a522aedbec3c1cee`，缓存键`0.16.6-test20261018-preview-1388e6a-a18192a98bf9`。index SHA`721060548e209fd4abe6d27f4ba8a1a0d056ff272bca6b1ec695ca4669783145`，CSS SHA`ca27cf1c756388818e6481d52b9c99d8987046dfa4687659d67d67e683d53925`；MANIFEST/zip/SHA256SUMS在忽略目录bin/previews/1388e6a。设备资源及serve/startdhns二进制摘要与各自冻结输入匹配。

后端仍c9624a3/0.16.6，opkg仍Quickstart0.16.5-test20261018-2/LuCI-r2，本次是授权的快速候选替换，不是软件包升级。原子部署私有备份`/root/quickstart-backups/home-0166-pinned-direct-1388e6a-r3`。[KSpeeder脚本/配置及PID680369](round-3/b-entry-preservation.json)保持不变，没有修改应用仓库或启停KSpeeder。NetPolicy保持disabled/stopped；A/C/D及APK设备未操作。无push/Release/Action。

收藏顺序与临时测试域名只在测试浏览器GET响应中覆盖，未保存；停止/错误/晚响应/原配置导航通过沙箱网络响应模拟，未写业务设置。[最终配置保护](round-3/b-final-preservation.json)的20路径（包括缺失配置）及LAN/default via192.168.30.1均不变。10份本轮device.json逐一核对共20个临时root会话均销毁，没有保存登录凭据。

## 检查与审图

| 检查 | 当前证据 |
| --- | --- |
| 128项前端单元、独立vue-tsc、make build-web | 两轮最终代码均通过；新增有界首页历史记忆契约，业务失败及URL校验旧用例保留 |
| 正式构建本地UI | [round-2/local/report.json](../../../../../evidence/m70/installed-apps/pinned-direct/round-2/local/report.json)：21组/7视图，包含首页/完整库两套返回、80项分页；第三轮仅更改首页滚动路径，[round-3/local/report.json](../../../../../evidence/m70/installed-apps/pinned-direct/round-3/local/report.json)19组/7视图通过，原业务表单/配置持久化/失败草稿、320～桌面及深色边界保留 |
| 当前B中文桌面 | [round-3/b-current/pinned-entry/report.json](../../../../../evidence/m70/installed-apps/pinned-direct/round-3/b-current/pinned-entry/report.json)：11组通过，包括真实KSpeeder页面与两种返回、全过程零中间窗口/零panel历史、错误/超时/重试/原配置、普通域名新标签页、Escape/显式All/源移除取消、重新启动及关闭提示焦点 |
| 当前B英文触屏 | [第三轮失败](../../../../../evidence/m70/installed-apps/pinned-direct/round-3/b-english-touch/pinned-entry/report.json)保留；第二轮[诊断](../../../../../evidence/m70/installed-apps/pinned-direct/round-2/b-return-diagnostic-check2/pinned-entry/report.json)为保存1020、返回1028。首页/URL/焦点正确，严格像素scroll未通过，暂停该依赖；独立功能复核另外记录，不冒充完整通过 |
| 当前B手机独立复核 | [round-3/b-english-independent/pinned-entry/report.json](../../../../../evidence/m70/installed-apps/pinned-direct/round-3/b-english-independent/pinned-entry/report.json)记录11项独立功能结果，运行时错误0；实际Web→Back的scroll仍1020→1028，明确blocked/partial、退出1。零闪窗、正确返回页面/焦点、完整库恢复、错误/重试/取消、域名直开及深色提示通过。原严格套件保持失败 |

零闪窗通过MutationObserver从点击前监听窗口节点插入及panel参数变化，延迟status期间验证，避免“最终DOM没有窗口”漏掉短暂闪现。B用真实认证、实际元数据/实际KSpeeder status及仪表盘内容验收，Back不重复执行status；不以HTTP200/进程存在替代。

本地及当前B真实Web、首页返回、完整库返回和深色错误截图已实际打开审查。首页返回截图中的系统信息模糊属于既有独立加载状态，结构保持；最终应用库返回截图等待真实PNG解码。没有声称KSpeeder登录后/Docker加速业务或原生BFCache命中。

当前用户可从首页无panel地址重新进入测试；历史上已打开的panel书签/历史项仍按其URL恢复完整库，这是保留的显式浏览语义，修复只确保新的首页固定点击不生成该项。

## 失败保留与轮次

1. [基线](../../../../../evidence/m70/installed-apps/pinned-direct/baseline/pinned-entry/report.json)明确失败：窗口存在且记录5次窗口状态变化，URL从panel=all到apps。原断言与代码在cbd9ff3保留。
2. 第一轮本地封装route.fetch绕过模拟取得HTML，修正测试fixture后[local-check2](../../../../../evidence/m70/installed-apps/pinned-direct/round-1/local-check2/report.json)19组通过；产品候选c339ca3在B10组通过。
3. 第一轮补查源图标移除，发现晚结果没有清loading，[失败](../../../../../evidence/m70/installed-apps/pinned-direct/round-1/b-origin-cancellation/pinned-entry/report.json)及[审查记录](round-1/review.md)保留。第二候选45993ab清理自己代次的失效结果并恢复关闭提示焦点，本地21组与B中文11组通过，但英文scroll失败；两次诊断及[第三轮边界](round-2/review.md)保留。
4. 第三轮统一首页历史项滚动恢复的owner，有界记忆原模式、恢复后归还；128前端/独立类型/最终构建及本地19组、B中文11组通过，[本地记录](round-3/review.md)。手机严格scroll仍失败，三轮已到，不再修改产品源码。独立测试模式明确记录blocked并返回partial/非零状态，原严格断言默认仍执行，没有放宽容差或删除失败。

历史上原测试把“首页固定返回Apps”当作通过目标，此规则已被本轮用户交互决策明确替代，当前测试改为“首页返回首页”，完整库恢复断言保留，历史证据未删除。既往English320连接标题/旧家长控制404/打包和延期观察不在本轮通过结论内。

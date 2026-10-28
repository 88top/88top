# 应用工具“查看全部”简化验收

2026-10-19用户要求去掉按钮旁“还有10个”。第一份产品候选c743b9c已更新B192.168.30.244并通过。[任务](status.md)。

正式与设计源HomeApplications删除标题主操作的余量small及无用CSS，只保留前置业务图标+“查看全部”（英文沿用All），连体更多菜单保持。可见容量、形态、收藏顺序/24项上限、完整库/搜索和原激活行为不改。当前规范已更新；四份旧原型脚本把已明确废止的计数断言替换为无计数/准确按钮名断言，原可见容量、完整库、编辑六项及几何断言保留。这些旧阶段脚本没有当作本轮通过证据，也没有重建设计5180服务。

本机SSD入口运行独立vue-tsc、make build-web通过，只有原有v-deep弃用提示；显式产物web/dist。低影响标题修改使用真实页面定向浏览器验证，没有新增镜像实现的单元测试或重复跑无关业务全套。

当前B认证UI：[原始报告](../../../../evidence/m70/app-header-simplification/round-1-ui/app-header/report.json)，20视图通过（1440/1024/768/390/320 × 中英 × 深浅色，触屏）。浏览器GET投影24个自定义链接/固定项，未持久写入；每个视图实际可见数量小于24且不超过原capacity、顺序为原前缀。标题/按钮无相互重叠，标题最多两行、没有挤成逐字竖排，操作框在卡片内，无横向页面溢出。四种语言/主题组合均从“查看全部”进入24项完整链接库并搜索到最后一项，关闭正常；没有首页/软件中心非GET请求或页面异常。桌面中文、320深色中文和768英文截图已实际打开。窄卡标题仍允许正常两行，不以缩小字体或删除入口凑通过。

预检第一次误带上轮KSpeeder脚本SHA参数，当前该脚本已不存在，因此在建立会话之前退出，见[保留说明](round-1/preflight-note.md)。本任务不依赖该应用，按本轮实际设备状态移除不适用参数后复验；未重新安装或修改应用。正式UI运行创建的两个临时root会话均已销毁。

前端冻结`c743b9c7bbdd4b449e7706646392998340993f21`，缓存键`0.16.6-test20261018-preview-c743b9c-ee5ca4cf2b99`。index SHA256`46ecb64271bca7e93c3ab5d39b5bba7b00773b461d67f96a76e1c2dcefa863bc`；CSS`2f3fd81626929fc8d59d2a93b87277ec2a6cc58a4e619ee2269d80381315699c`。zip/MANIFEST/SHA256SUMS在忽略目录bin/previews/c743b9c。后端c9624a3/0.16.6、资源与运行进程指纹匹配，实际opkg保留0.16.5，不是新包安装验收。

部署备份/root/quickstart-backups/home-0166-app-header-c743b9c-r1；本轮独立保护基线/root/quickstart-package-candidates/home-0166-app-header-r1。[最终保护](preservation.json)：20份当前配置存在/缺失与摘要保持，含布局/收藏/链接/网络/设备资料，LAN/default via.1保持，无例外；NetPolicy仍disabled/stopped且指纹不变。当前基线重新采集，不沿用上一任务网络或应用状态。

没有push/Release/Action/SDK/new package、A/C/D/APK操作，不把该标题检查代替旧独立业务/视觉/安装门禁。复验通过SSD wrapper运行home-current-acceptance.py 新目录，QS_EXPECT_MANIFEST=bin/previews/c743b9c/MANIFEST、QS_ACCEPT_RUNTIME_CANDIDATE=1、QS_EXPECT_PACKAGE_VERSION=0.16.5-test20261018、QS_ACCEPT_APP_HEADER=1；使用实际当前应用状态，不附加历史脚本SHA条件。

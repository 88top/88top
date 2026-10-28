# 详情窗口分段操作修复

2026-10-19，用户反馈域名详情“域名配置”的更多按钮挤到下一行。第一份产品候选`0e7786ed7e87099ad3a60981528e6e76dd60392b`已更新B192.168.30.244。[任务树和标准](status.md)。

## 原因与修改

[原版本实际失败](../../../../evidence/m70/detail-header/baseline/detail-header/report.json)：按钮top319.796875/bottom349.796875，更多top349.796875/bottom381.796875，组display:block。详情Teleport到body，脱离natural-home，共用widgetActionGroup.css未生效；并非业务按钮文字太长。正式样式作用域扩展至network-dialog，首页原选择器优先级相同；原业务组件、菜单、处理函数、权限和数据owner未改。

主操作与更多保持同一横向分段外框；窄屏允许整组换到标题下方，不缩字或单独把更多挤下去。桌面最终按钮和更多top同为336.796875/bottom364.796875，中间1px分隔，组30px高；触屏组46px，内部目标44px。VS03补充弹窗作用域规则。

## 当前版本验证

- [类型、正式Web构建](round-1/local-checks.json)通过；SSD wrapper保留原输出web/dist，构建仅既有v-deep弃用警告。未改Go或业务逻辑，不机械重复无关全量业务测试。
- [最终实际B报告](../../../../evidence/m70/detail-header/round-1/current-b/detail-header/report.json)72组通过，`styleProbe:false`：远程域名、磁盘、存储服务、Docker、下载、系统六详情，中英、深浅、1440/390/320。检查分段上下对齐、连接距离、详情无水平溢出、44px触屏尺寸；菜单首项可命中与聚焦、Escape先关菜单再关弹窗、焦点与滚动锁恢复。蓝色旧顶部同时检查。无pageerror或业务写请求，LuCI自身只读POST按明确RPC白名单检查。
- 实际业务API保留B响应，浏览器仅投影公开默认布局以覆盖用户已隐藏控件，不写用户配置。已实际打开桌面中文域名、320深色域名、英文域名/存储服务/系统、中文磁盘/Docker/下载最终截图，与失败截图对照。本轮验收标题操作布局和菜单，不替代各业务完整功能、数据面或所有正文视觉验收。
- [20路径配置保护](round-1/preservation.json)通过，包含首页布局/收藏/链接、网络与设备资料；LAN/defaultvia192.168.30.1保持，无例外。私有新基线见[b-prepare](round-1/b-prepare.json)。
- [实际设备/资源/进程](round-1/current-b/device.json)匹配：iStoreOS24.10.1/kernel6.6.86/x86_64；后端c9624a3/0.16.6保持，startdhns568345未重启，serve更新为912675；NetPolicy仍disabled/stopped且二进制指纹一致。

## 冻结与清理

资源键`0.16.6-test20261018-preview-0e7786e-ebd06f6f58dc`；CSS SHA256`a6cf04a7a78cacdab180f946d31cd7ed9c685345b03d7fc1af830e03bb299efa`，index/en/vendor摘要与前一版相同。冻结zip/MANIFEST/SHA256SUMS在忽略目录bin/previews/0e7786e；部署备份/root/quickstart-backups/home-0166-detail-header-0e7786e-r1。实际opkg仍为Quickstart0.16.5-2/LuCI0.16.5-r2，本次是快速runtime替换，未宣称新包安装通过。

原始失败、[首个样式探针](../../../../evidence/m70/detail-header/style-probe/detail-header/report.json)和[RPC最小探针](../../../../evidence/m70/detail-header/style-probe-read-rpc/detail-header/report.json)均保留。前者72组几何通过但误将LuCI只读POST算写入，后者辨认出list/getFeatures/file.list/uci.changes后修正白名单；[最终探针](../../../../evidence/m70/detail-header/style-probe-final/detail-header/report.json)72组通过。无额外产品修订，仅一份CSS候选。五次运行各销毁2个临时root session，共10个；不记录凭据。

复验入口：`rtk proxy /var/cache/build-cache/run.sh -- env QS_EXPECT_MANIFEST=bin/previews/0e7786e/MANIFEST QS_ACCEPT_RUNTIME_CANDIDATE=1 QS_EXPECT_PACKAGE_VERSION=0.16.5-test20261018 QS_ACCEPT_DETAIL_HEADER=1 python3 scripts/ops/home-current-acceptance.py 新证据目录`。最终验收不设置QS_DETAIL_STYLE_LOCAL或QS_DETAIL_BASELINE。

未push/Release/Action/SDK/new package，未操作A/C/D/APK，未重建他人5180服务。旧独立门禁和24小时观察不据此升级结论。

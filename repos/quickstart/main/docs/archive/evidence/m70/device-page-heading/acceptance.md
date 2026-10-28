# 设备页删除重复介绍：已更新 B

2026-10-21，前端源码 `668a9fcea8e77b5b96ee30cef95219270f5ac267`，资源键 `0.16.6-test20261018-preview-668a9fc-b0cd351d508e`。

删除内容顶部“局域网设备管理”及“认识每台设备，并用简单的方式安排它如何连接和上网。”整段header和无用样式。main用aria-label保留可访问页面名称，面包屑及设备/分组与计划/局域网设置三页签保留。设备页业务脚本、列表、分组与设置组件原文保持：[保护检查](round-1/business-protection.json)。

中文1440页签top163.125→94.531px，上移68.594px；390页签170.219→94.531px，上移75.688px，根容器宽度保持：[对比](round-1/comparison.json)。不是通过改变缩放、缩小正文或恢复居中限宽腾空间。

独立vue-tsc、正式Web构建、19项既有设备业务保护测试通过，产物web/dist：[构建](round-1/build.json)。最初辅助脚本的正则双重转义导致保护检查未取到script块，改用re.S后对真实script/完整组件字节比较通过；无产品代码因此改动。

实际B4宽度旧版基线/12已加载页签保留于baseline-b；新版本8组中英×深浅×1440/390，共24个已加载页签通过：[UI报告](../../../../evidence/m70/device-page-heading/round-1/current-b/report.json)。确认重复header不在DOM、main名称及面包屑翻译正确、三页签内容真实加载、原生左右边界、无横向溢出、搜索/展开筛选/详情/Escape/焦点恢复以及手机首页往返均正常。系统菜单/顶部外壳几何与对应旧基线相同。无页面脚本错误、业务写请求；两个运行共4个临时root会话均由finally销毁。中文桌面、英文深色手机设备、中文手机已加载局域网设置截图已实际打开。

公开4个资源与冻结候选匹配：[资源](round-1/public-resources.json)；20项配置及LAN/默认路由保护严格通过：[配置](round-1/preservation.json)。后端c9624a3、服务进程、FastNet、NetPolicy disabled/stopped及包记录不变：[部署保护](round-1/deployment.json)。

只快速替换B前端/key，无服务重启/新包安装/SDK/push或其他设备操作。冻结产物bin/previews/668a9fc，私有回退/root/quickstart-backups/home-0166-device-heading-668a9fc-r1。5180没有因本任务重建，之前的布局提示修复仍在预览中。

用户同时询问进一步美化空间，具体[视觉建议](../../../product/lan-device-visual-refinement.md)已写入产品文档，当前仅两行介绍删除已实施；页签外壳、工具栏重组、表格字阶/列宽/配色仍为建议，不冒充完成。

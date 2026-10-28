# 网络流量保留“测速”

状态：通过。用户明确图表控件应保持简洁，撤销网络流量按钮“测速→网络测速”的调整。当前可见按钮恢复“测速”，图例预留恢复原90px；原辅助访问名称“网络测速”、前置图标、原测速目标保持。其他控件的四字标题与四字按钮保持。

相对前一候选90份运行源，仅 `LayoutPreviewCard.vue` 与 `homeWidgetChrome.css` 变化，两文件已逐字核对恢复至本轮改名前的HEAD版本；其他88份运行源未变，保留已有工作区改动，未改原图表、采样或布局核心。

[当前恢复/原导航3组](../../../../../evidence/m66/widget-action-labels/traffic-restore/report.json)、[六宽度/中英/标准紧凑标题14组](../../../../../evidence/m66/widget-action-labels/traffic-restore/header/report.json)通过。已实际打开[桌面](../../../../../evidence/m66/widget-action-labels/traffic-restore/1440-traffic.png)与[手机](../../../../../evidence/m66/widget-action-labels/traffic-restore/390-traffic.png)截图检查，按钮恢复简短，原图例间距恢复，无标题/图例/按钮重叠；未重跑未变化的完整业务矩阵。

[当前源码/公开资源指纹](candidate/candidate.json)对应当前项目PID2494及3份SSD/公开资源。设计规则已将图表例外写入[VS12](../../../../product/quickstart-home-widget-visual-standard.md)，不再机械要求图表按钮四字。

[当前预览](http://192.168.9.19:5180/?layout=ordered&scenario=business-all)。仍为隔离Vue原型，未提交或推送，未操作路由器；前一按钮候选41组结果保留为历史，不替代本次17组检查。

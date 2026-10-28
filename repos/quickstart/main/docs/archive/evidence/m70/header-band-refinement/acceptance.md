# 顶部蓝带边界细化：当前B验收

2026-10-20，第一轮产品候选通过。正式源码48b4a95，B当前前端资源版本`0.16.6-test20261018-preview-48b4a95-c648599bf482`。用户要求与任务树见[status.md](status.md)，正式产品规则已补入[产品契约](../../../product/quickstart-home-production.md)。

## 细节决策与结果

旧版da46bfa首页第一段48px是透明占位，B当前Argon主题`header::after`只延伸2rem=32px蓝色。前轮将48px占位全涂蓝色，导致蓝色下边界比原主题延伸多16px。本轮桌面操作区32px并垂直居中；蓝色至首行固定20px，减少旧透明占位尾部多余的16px空白。小屏≤600px及粗指针保留48px，触控按钮至少44px。没有为了薄蓝带缩小手机点击目标，也没有修改原生系统顶栏/菜单。

当前B同视口、同主题、同语言前后测量，页面坐标单位CSS px：

|输入/视口|操作区|蓝色下边界|首卡上边界|相对此前|
|---|---|---|---|---|
|鼠标1440/1024/768|32|89.59375|109.59375|蓝带与首卡均上移16|
|触屏390/320|48|105.59375|125.59375|保持|
|大屏触控1440|48|105.59375|125.59375|保持|

上述桌面89.59375px等于原生系统顶栏bottom57.59375px加主题32px延伸；不是根据不同缩放的用户截图强行取相同像素。官网和设置在操作区垂直居中、白字白图标、没有裁切，右边界继续对齐正文。两侧20/16px及全部内容宽度与前轮相同。几何对照见[comparison.json](round-1/comparison.json)，保留[旧候选基线](../../../../evidence/m70/header-band-refinement/baseline-b/report.json)。

## 当前验证

- [本地正式入口](../../../../evidence/m70/header-band-refinement/round-1/local/report.json)：11组/7视图通过，十一控件、四项原业务弹窗、键盘编辑、保存刷新、未知结果保留草稿、响应式与隐藏轮询；实际打开截图。
- [B真实登录态24视图](../../../../evidence/m70/header-band-refinement/round-1/current-b/report.json)：中英文×深浅×1440/1024/768鼠标、390/320触屏、1440触控。精确验证32/48px、原主题蓝色延伸、20px首行间隔、20/16px左右间距、顶部操作水平/垂直对齐及触控目标、系统外壳保持、无溢出。中文浅色的1440鼠标/触控及390/320触屏另测键盘设置/总览/取消、控件菜单、应用窗口打开/关闭。无页面异常或写请求，原kai.png缺失404仍按原glyph兜底。
- 已实际打开同设备前后1440鼠标截图、当前1440浅/深与触控、390/320浅/深以及320英文浅/深截图。桌面蓝色区域减薄、首行上移；触屏保持原可用空间。原生菜单的几何、背景和字体与基线完全一致。
- [构建](round-1/build.json)走SSD缓存，产物实际在web/dist；源码后续仅加CSS注释后重建，产物内容仍只有style.css变化，无资源增删。[部署](round-1/deployment.json)只替换该CSS和LuCI资源版本，保留远端私有回滚备份，无后端/网络/服务重启。[四份公开资源](round-1/public-assets.json)匹配冻结清单。
- [最终配置保护](round-1/preservation-after.json)：20条首页/业务/网络路径、LAN地址与默认路由严格不变，无例外。[进程与运行文件](round-1/runtime-after.json)同部署前：Quickstart serve9386、startdhns14546、FastNet10304、FastNet配置/入口脚本、后端/NetPolicy二进制、opkg记录及NetPolicy禁用状态保持。

本轮基线和验收共4个短期root会话均销毁。源码和证据本地提交，未推送。一轮产品候选，无新增失败。历史48px固定蓝带的通过记录保留，不能据此否定当前用户的边界修正；共享测试明确替换为桌面32px/触控48px，未删除高度或边界断言。

后端仍c9624a3/0.16.6，opkg仍0.16.5记录。本轮是前端快速候选，不是包安装、SDK、APK、其他设备、长期观察或完整业务重新验收；没有push/Release/Action。

[当前桌面效果](../../../../evidence/m70/header-band-refinement/round-1/current-b/zh-light-1440-mouse.png) · [当前手机效果](../../../../evidence/m70/header-band-refinement/round-1/current-b/zh-light-390-touch.png)

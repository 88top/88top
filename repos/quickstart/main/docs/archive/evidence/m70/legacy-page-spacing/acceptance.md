# 正式首页左右间距对齐旧版

2026-10-20，产品候选第一轮：正式前端72b2ded，B资源版本`0.16.6-test20261018-preview-72b2ded-f20a10da5c24`。用户要求已实现：恢复原生内容边距，正式正文使用可用宽度；保留48px蓝顶和20px首行间隔、当前控件内部排版及点彩。起点be7777e干净，任务树见[status.md](status.md)，正式规则见[产品契约](../../../product/quickstart-home-production.md)。

## 原因与实际结果

旧版da46bfa正式首页无设计预览的额外外层padding；当前正式首页原先把LuCI内容边距20/16px和原型32/24/14px叠加，正文另有1640px上限。以当前B原生同类容器的计算样式作为基准，不从不同缩放截图猜测像素。

|视口宽度|之前单侧留白|当前单侧留白|当前正文宽度|
|---|---:|---:|---:|
|2560px|340px|20px|2280px|
|1440px|52px|20px|1192px|
|1024px|44px|20px|776px|
|768px|44px|20px|728px|
|390px|30px|16px|358px|
|320px|30px|16px|288px|

桌面正文宽度已扣除当前LuCI侧栏，手机侧栏收起。顶部官网/设置右边界与正文边界相同，系统侧栏与系统顶栏几何/字体/背景在相同宽度的前后比较保持一致。内部响应式按增加后的可用空间自然排布，不写回用户布局。

## 本次验证

- [六宽度真实登录态基线](../../../../evidence/m70/legacy-page-spacing/baseline-b/report.json)，包含旁置原生容器及系统外壳测量。
- [本地正式构建回归](../../../../evidence/m70/legacy-page-spacing/round-1/local/report.json)：12组、7视图，十一控件、原业务弹窗、编辑/保存/刷新/失败保留、隐藏轮询；深浅配色与已确认5180预览完全一致。构建见[记录](round-1/build.json)，实际输出web/dist。与前候选zip逐项比较只有style.css改变。
- [B当前28视图](../../../../evidence/m70/legacy-page-spacing/round-1/current-b-harness2/report.json)：中文/英文×深浅×2560/1920/1440/1024/768/390/320px。左右边距匹配原生容器、正文无1640px上限、48px通栏/20px首行间隔、顶部操作对齐、无横向溢出；16个组合执行键盘布局编辑/总览/取消、更多菜单及启动台打开/Escape。无页面异常及非预期写请求。
- 首次B脚本在第20个视图关闭启动台后立即断言DOM数量，遇到Vue异步移除时序；失败[报告与截图](../../../../evidence/m70/legacy-page-spacing/round-1/current-b/report.json)保留。改为等待实际detached，保持关闭条件不放宽；不改产品、不重建/重部署，完整28视图复验通过。正常页面截图改在交互之前采集，避免把取消编辑通知/焦点滚动当成初始页面。
- [部署报告](round-1/deployment.json)：只替换style.css及LuCI资源版本，远端先做私有备份，未重启服务。[四份公开资源](round-1/public-assets.json)逐字节匹配冻结清单。设备backendc9624a3/0.16.6及原opkg0.16.5记录保留，本轮属于前端快速候选，不是包安装验收。

已实际打开当前B的2560/1440/390/320中文深浅及320英文深浅截图：留白缩小、首行位置稳定、顶部及正文边界一致，手机英文标题自然换行。原kai图标404仍走已有glyph兜底；不把它当成应用清单读取失败或删改收藏。

真实应用返回[32组](../../../../evidence/m70/legacy-page-spacing/round-1/navigation-b/fastnet/report.json)通过：1440中文浅色、390英文浅色、320英文深色，真实FastNet Web与原生Back恢复首页焦点/滚动，启动台恢复窗口/搜索/焦点，固定应用返回首页；同时通过错误/无权限/超时/取消回归。安装动作全部拦截模拟，未执行真实安装、运行测速或写策略。已打开三份返回截图。

最终[20条配置/LAN/路由保护](round-1/preservation-after.json)严格通过，无例外；[运行状态](round-1/runtime-after.json)与部署前一致：Quickstart serve9386、startdhns14546、FastNet10304、二进制/脚本/配置/opkg记录和netpolicy禁用状态均保持。四次B验收（基线、首次失败、完整复验、应用返回）共8个短期root会话全部销毁，无凭据入库。G1～G4完成，一轮产品候选通过；首次自动化时序失败单独保留。

## 可查看的当前截图

[1440桌面](../../../../evidence/m70/legacy-page-spacing/round-1/current-b-harness2/zh-light-1440.png)、[2560宽屏](../../../../evidence/m70/legacy-page-spacing/round-1/current-b-harness2/zh-light-2560.png)、[390手机](../../../../evidence/m70/legacy-page-spacing/round-1/current-b-harness2/zh-light-390.png)、[320英文深色](../../../../evidence/m70/legacy-page-spacing/round-1/current-b-harness2/en-dark-320.png)。桌面截图为LuCI当前可见滚动区域，不冒充所有下方业务的逐项实机验收。

未执行后端发布、包安装、SDK、push、Release、Action、A/C/D/APK或长期观察；本轮不改变这些历史验收边界。

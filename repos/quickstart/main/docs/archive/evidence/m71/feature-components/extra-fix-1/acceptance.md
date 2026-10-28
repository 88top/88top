# M71 追加定向修正与B交付验收：通过

用户在三轮阻塞说明后明确回复“继续”。按[本次任务树](plan.md)只形成一个追加产品候选63101c0；前三轮、before/probe及部署脚本反馈全部保留。未修改系统菜单，没有重新设计组件面板。

## 根因和修正

LuCI内容祖先relative/z50把子抽屉z2500限制在内部，原生.showSide/z99仍绘制到标题上。inert只限制交互，没有停止绘制，旧命中检查漏报。before与probe均准确失败：`Native chrome paints over component heading`；probe把同一DOM移到body后unobscured=true，定位到堆叠上下文。

组件抽屉改用Teleport/body；共用deviceVisualTokens显式覆盖新弹层语义颜色，深浅主题不依赖旧祖先继承。没有提高/隐藏/修改原生菜单，后端、表单及业务写函数没有修改。防回归检查同步解除inert后检测绘制顺序，再立即恢复，覆盖原失败模式。

## 验证结果

| 范围 | 结果与证据 |
| --- | --- |
| 前端全量147、vue-tsc、正式Web构建 | 全部通过；冻结63101c0后再次构建，见[候选](candidate.json)、[构建日志](../../../../../evidence/m71/feature-components/extra-fix-1/web-build.log) |
| 同数据同外壳视觉复现 | [before](../../../../../evidence/m71/feature-components/extra-fix-1/before/en-dark-390-components.png)失败；[修正后](../../../../../evidence/m71/feature-components/extra-fix-1/matrix/en-dark-390-components.png)无遮挡，已实际打开审查 |
| 浏览器投影12组基础+12组扩展 | [matrix](../../../../../evidence/m71/feature-components/extra-fix-1/matrix/report.json)、[extended-matrix](../../../../../evidence/m71/feature-components/extra-fix-1/extended-matrix/report.json)通过：中英、深浅、1440/390/320；草稿/计划保留、取消、不自动切换、提交后关闭重开不重复操作、嵌套Escape/焦点/滚动恢复及卸载清理。投影的安装/启用/切换POST未到路由器 |
| 实际部署后的12组 | [installed-current](../../../../../evidence/m71/feature-components/extra-fix-1/installed-current/report.json)通过，rehearsal=false/projected=false；12组均检查嵌套抽屉，读取真实状态。无pageerror/意外业务写入，配置/路由/包记录/后端及进程快照相同；临时会话销毁 |
| 真实组件预检与取消 | [actual-plans](../../../../../evidence/m71/feature-components/extra-fix-1/actual-plans/report.json)桌面中文浅色、390英语暗色，共6次真实只读预检：native启用、eqos安装、floatip安装；真实包名/空间/影响提示均可展示，取消后无配置变化，无apply调用 |
| 公开与设备资源 | [deployment](deployment.json)：4份公开SHA匹配，36份安装资源匹配；LuCI index/CSS/i18n使用新asset_version，vendor使用冻结index.js内Vite内容指纹。首次脚本假设错误及修正见[反馈](deployment-preflight.md)，未更改产品代码或删除检查 |

已打开实际设备的[390英语暗色](../../../../../evidence/m71/feature-components/extra-fix-1/installed-current/en-dark-390-components.png)、[320中文浅色](../../../../../evidence/m71/feature-components/extra-fix-1/installed-current/zh-cn-light-320-components.png)、[手机嵌套](../../../../../evidence/m71/feature-components/extra-fix-1/installed-current/en-dark-390-nested-components.png)、[桌面](../../../../../evidence/m71/feature-components/extra-fix-1/installed-current/zh-cn-light-1440-components.png)、[启用确认](../../../../../evidence/m71/feature-components/extra-fix-1/actual-plans/en-dark-390-actual-plan-quickstart-native.png)、[安装确认](../../../../../evidence/m71/feature-components/extra-fix-1/actual-plans/zh-cn-light-1440-actual-plan-eqos.png)：标题无遮挡、颜色/布局正确、确认说明可读。长内容可在抽屉内自然滚动。

## 当前设备与边界

192.168.30.244前端63101c0；缓存版本`0.17.0-test20261022-preview-63101c0-9e48c843d2d2`。仅替换4份前端资源和LuCI模板缓存键，其他32份与候选相同而保留。后端仍abfe06f/0.17.0，serve PID7092和实际exe SHA保持不变；未重启服务。

入口：局域网设备管理→局域网设置→功能组件；设备详情→使用管理→管理限速组件复用同一抽屉。当前原生包已安装但停用，eqos配置被选中但包未安装，floatip未安装，分别如实显示；没有代用户切换/安装/启用。上一阶段真实native启用到就绪并恢复的证据仍见[backend-acceptance-startup](../backend-acceptance-startup.json)。

安装执行链有Go测试和浏览器投影覆盖，**没有在本次确认安装真实软件包**，也没有APK设备/SDK/IPK/APK安装验收。旧opkg元数据与保留的DHNS进程限制仍成立，不宣称完整runtime/软件包一致性。A及其他设备、5180没有更新；不推送、不上传、不触发Action，延期24小时观察没有执行。

预防：未来复用该内容弹层时保留顶层挂载与明确主题变量；测试同时检查视觉绘制和交互隔离，不能用inert命中结果替代截图审查。

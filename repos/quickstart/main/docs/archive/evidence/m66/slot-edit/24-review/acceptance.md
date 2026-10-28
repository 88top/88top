# M66.24 当前候选技术验收

2026-10-15。技术自检通过，设计者审图另见manual-visual.md；**最终用户体验确认待进行，M66.24整体不记为已完成。** 用户授权的原型实现、自动检查与评审交付已推进到本阶段；未把人工未参与当作通过。

## 当前结果

| 检查 | 当前证据 | 结果 |
|---|---|---|
| TypeScript | SSD入口执行`npm --prefix web run tsc`，当前源码退出0 | 通过 |
| 统一命令及能力边界 | contract/attempt-2.json，十模块边界及五模板，5组 | 通过 |
| 槽位主流程 | current-primary/report.json，11组 | 通过 |
| 空位整理及恢复 | current-normalization/report.json，7组 | 通过 |
| 总览及三种输入一致性 | current-overview/report.json，10组 | 通过 |
| 手机／焦点／取消／中断／卸载 | current-inputs/report.json，10组，含CDP触摸事件 | 通过 |
| 循环操作和读取边界 | resources/report.json，20次移动／切视图／改比例／撤销，2组 | 通过 |
| 五快捷入口及八系统工具导航、设备同一身份、全隐藏找回 | navigation/report.json，15组 | 通过 |
| 当前视觉与业务状态 | visual/attempt-3/review-report.json，24基准、42状态、10临界宽度、五示例各三次往返、6种编辑组合 | 通过 |
| 实际导出PNG曲线 | visual/attempt-3/screenshot-audit.json，48张图表区域 | 通过 |
| DHCP分配权说明 | current-authority/authority-popover-report.json，72次真实点击 | 通过 |
| 公开服务／资源／源码 | candidate.json，owner、PID、3个JS/CSS资源与SSD构建文件逐字节校验、45份源码指纹 | 通过 |
| 人工独立任务和美观确认 | review-guide.md | 待用户参与 |

资源循环耗时5.571秒，仅出现一次正常流量采样；无额外业务读取，历史≤30。视觉回归另观察原图单一5秒采样，10600ms有2～3次；隐藏／卸载后5600ms新增0次，日志≤120。当前完整视觉检查控制台异常0、外域请求0。系统菜单占位HTML在24组基准中一致，变更仅右侧设计内容。

工具、网络等原有入口在设计模式进入安全目的页，证明导航保持；局域网设备进入真实管理组件的合成数据界面，并校验同一deviceId及名称。这不是对应功能的真实设备验收。

## 优化与失败保留

初次检查后共优化3次，未超过用户上限：

1. 首轮：手机窄列名称被操作挤到44px以下；资源脚本重复点选取消了选中；刚恢复原图立刻隐藏时，原生延迟初始化仍读取一次。第1次优化：手机名称／操作上下排，选择面板提供移除入口；修正脚本选中条件；设计容器隐藏时卸载原图、恢复时挂载，未改原NetworkFlow组件或正式首页。首轮视觉失败在visual/attempt-1/，触摸失败在inputs/attempt-1.json，资源失败在resources/attempt-1.json。
2. 第1次优化后：手机10组通过、视觉24／42／10通过，资源循环暴露可见集合变化导致所有通道刷新（端口读取16次）。第2次优化：`studioModel.ts`按通道保留未变化任务，仅实际增减通道；显式重试、恢复可见与场景切换仍可刷新。resources/attempt-2.json保留失败，attempt-3.json通过；新候选重跑完整视觉，不沿用前一候选截图。
3. 第2次优化候选：current-inputs/attempt-1.json中真实滑动后立即轻点未进入总览，页面无错误；上一候选相同路径曾通过。第3次优化只修改测试，等待浏览器惯性滚动稳定，再真实轻点并断言总览打开。current-inputs/attempt-2.json通过。产品源码和公开资源未再改变。

图表PNG审计曾在视觉报告尚未写出时提前启动，报缺少review-report.json；等待主检查完成后重新执行。未将该次工具启动失败记成图表通过，也未以此改动产品。

## 交付与未验证

入口：[首页](http://192.168.9.19:5180/?layout=ordered) · [应用半宽](http://192.168.9.19:5180/?layout=ordered&preset=half)。顶部设计预览提供半宽、两种堆叠、三列服务及异常状态。当前为工作区原型候选，以candidate.json的源码／实际资源指纹识别，不是正式发布版本。

当前浏览器为Chromium，手机使用移动端模拟及CDP真实触摸事件；没有物理手机或完整读屏器认证。用户最终体验尚未确认。未修改正式首页、原NetworkFlow组件、后端、路由器、SDK或包配方；没有push、Release上传或Action。24小时观察继续延期。

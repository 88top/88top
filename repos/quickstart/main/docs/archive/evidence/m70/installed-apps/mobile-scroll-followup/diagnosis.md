# 手机scroll诊断

起点1388e6a未修改产品代码。单独首次真实Web往返的baseline偶尔通过1020→1020，说明不能只验证一次干净路径。组合旧路径后existing-loop捕获到1028，但新封装未初始化checks数组导致报告push中断，保留此封装失败，不把它当成业务断言。

修正封装并压缩到旧helper首次往返+稳定后断言，minimized明确失败：保存/离开1020，返回即时/网络稳定/再等500ms均1028；命令为run.sh env QS_ACCEPT_SCROLL_TRACE=1 QS_SCROLL_TRACE_EXISTING=1 QS_PIN_RETURN_ONLY=1（以及对应1388e6a MANIFEST/root会话保护）python3 scripts/ops/home-current-acceptance.py。它驱动真实首页恢复代码和目标导航，不是源码字符串检查。

时间线显示restore确实调用scrollTo(1020)，随后focus(preventScroll:true)也仍1020；但聚焦时图标处在临时排版，文档坐标约2127，下一帧变为约1429，期间没有第二个scrollTo却变成1028。body margin始终0，不是浏览器默认8px margin。

排序假设：1）恢复早于响应式/自然行排版收敛，等待目标几何稳定应消失；2）浏览器锚定在临时几何上，单独禁用overflow-anchor应消失；3）焦点触发补滚，推迟焦点应消失。已向用户说明后逐项验证。

probe-anchor唯一改变是在测试浏览器中禁用CSS锚定，旧恢复逻辑和容差不变：同一minimized用例即时/稳定/500ms均1020，通过。确认锚定参与偏移，永久禁用锚定不作为产品方案。

第一候选：有界恢复owner暂时关闭原生scrollRestoration和CSS锚定，等目标位置/尺寸连续三帧相同且文档可容纳原scroll，再恢复位置/焦点；成功/超时/卸载还原原inline值及priority、原历史模式。用户pointer/touch/wheel/keyboard操作立即取消并清掉待恢复记忆，不与用户争抢滚动。仅在本次有历史记忆时采样，最多10秒，不持久化测量或增加业务读取。

第一候选9d2675e通过本地21组，但B严格390英文失败（round-1/b-390-en）。恢复owner收敛不能避免随后数据更新时的自然高度测量：measure临时改行样式并同步getBoundingClientRect，虽在绘制前恢复，却能影响浏览器滚动锚定。带详细测量读数的trace-measure改变了时序且通过，不当成修复证据。

单变量probe-measure-guard只在每行设置/移除data-size-measuring之间临时设置html overflow-anchor:none!important，并精确还原原值/priority；不增加几何读取、不改恢复逻辑。B同一完整pinned脚本全部11组通过，首次模拟及真实KSpeeder返回均保持原scroll（原始report.json留在round-1/probe-measure-guard）。这定位了临时测量引起的锚定副作用。

第二候选将该保护放入正式useNaturalSizing.measure的同步try/finally，覆盖后续业务数据更新。保留原先有界返回owner和用户中断清理，避免常驻禁用锚定、固定补偿8px、滚动轮询。正式验收移除浏览器测量补丁，不使用任何放宽scroll断言的选项。

第二候选d246cfd本地21组、B390英文/320英文/1440中文各11组均通过，但重新运行原minimized仍失败1020→1028，因此不算收口。trace-rows增加读数后通过，属于观察改变时序；读数显示connection从240.96875增到249.59375（8.625px），应用上方行随之移动。仅延迟既有network/status响应1200ms的delayed-network再次稳定复现1028，其他请求/恢复代码不变。几帧稳定不能代表尚未完成的首轮读取已结束。

第三候选：数据owner提供initialSettled，只读判断各控件依赖通道是否有成功或失败结果；返回owner根据目标所在行及上方控件订阅该就绪状态（包含网络数据与布局配置首读），再检查几何稳定。没有新请求、Promise.all首屏阻塞或常驻RAF；等待结果时不轮询，依赖变化由Vue watch唤醒。下方无关磁盘/服务不阻塞返回，10秒总截止、用户输入取消、目标消失与样式/历史清理仍保留。以延迟network和下方disk的严格用例验证，不能用上轮完整路径偶然通过替代。

# M66.56 最终候选技术验收

2026-10-17。**技术通过，待用户人工审美确认**。M66.51～M66.56已连续完成实施、自检及交付，不把自动化检查作为“用户认为好看”的结论。

## 最终结果与保护边界

11控件保留默认五行和原字号，统一浅深主题色阶、服务1px选中态、状态／路径容器、内部字重与间距。系统元数据改为中性面板；网络读数与图例同色；设备与应用图标底座、磁盘6px轨道统一。原磁盘阈值、进度百分比、完整信息、权限与异常说明保留。修正手机英文异常磁盘提示气泡撑宽页面，以及未启动状态文字的对比度。

运行源码只新增`homeVisualTokens.css`、`homeWidgetDetails.css`，并在`OrderedHome.vue`追加两个style引用。Vue模板／脚本、布局／偏好／形态、API／读取owner、原业务计算／动作／表单没有改变。正式组件结构迁移和正式首页接入不在本轮范围。

## 当前候选检查

下表报告均在`optimization-1/<目录>/report.json`，针对同一最终运行资源实际执行，共**176组浏览器检查通过**：

| 目录 | 检查 | 组数 |
|---|---|---:|
| matrix | 默认11控件×6宽度×2语言×2主题的24组；16种加载／空／错误／旧后端／权限／缺服务／磁盘等场景；实际警告气泡显示与手机边界 | 41 |
| business | 原业务字段、条件、页签、完整信息、状态、原操作和独立降级 | 19 |
| forms | 原NAS、磁盘、Docker、下载、域名等模拟表单及拒绝／失败反馈 | 13 |
| headers | 11控件标题／操作／图例、中英文浅深主题、全部可用摘要和启动条 | 14 |
| resources | 20次切换、后台恢复与实际卸载；单一读取owner及有界请求，无多余监听／定时器／观察器 | 3 |
| layout | 左右／上下／行空间，最低内容边界，键盘及指针取消，撤销、响应式及恢复自动 | 10 |
| row-sort | 整行排序、键盘／指针／触摸、总览／真实页、取消及一次撤销 | 9 |
| placement | 放置／替换／移动／结构调整、显示偏好、适配与原子撤销；编辑不提交业务配置 | 8 |
| chart | 真实有色曲线像素、缩屏与返回、普通／组合、中英文浅深主题及原几何基线 | 18 |
| network | 隐私时限、原DNS／软件源、端口与互联网语义、网络错误和详情导航 | 14 |
| visual | 五行默认、主题／正文角色对比度、手机无滚动、图例读数、原磁盘38%绿色／95%红色及6px轨道 | 13 |
| actions | 连体按钮、独立主／更多动作、键盘与触摸44px、摘要单菜单 | 9 |
| accessibility | 选中边界至少3:1、独立键盘可见焦点、减少动画偏好 | 5 |

最终矩阵扫描可见控件文本，字号不低于12px、文本对比度至少4.5:1；标题／操作／图例无重叠，无水平溢出和新增卡内滚动，响应式不改写布局文档。报告页面／控制台错误和意外外部请求均为零。该范围不是整站完整无障碍合规认证。

[121实现保护](../../../../../evidence/m66/visual-refinement/56-review/optimization-1/protection/report.json)和[64原业务文件保护](../../../../../evidence/m66/visual-refinement/56-review/optimization-1/original-source/report.json)通过；`npm --prefix web run tsc`（vue-tsc --noEmit）退出0，`git diff --check`通过。先前阶段专用应用／设备／超长内容检查分别保留候选，不将其组数重复计入176。

## 失败证据与优化次数

M66.56运行源码优化1次：初版先遇未启动标签浅灰对比度不足，随后完整收集40组发现同类标签及手机英文磁盘隐藏气泡宽度／动作文字色问题。`initial/matrix/attempt-1.json`与`attempt-2.json`、失败截图保留。仅修正对应颜色和气泡对齐／宽度，没有隐藏警示、裁切卡片或修改状态判断；优化1的41组矩阵和全部最终回归通过。新增实际hover检查证明气泡可读且仍可显示。

其他阶段优化次数：M66.51无运行改动，M66.52优化1次，M66.53优化1次，M66.54优化1次，M66.55未优化。测试脚本修正与原始失败记录见各阶段验收，均未超过3次运行优化。

## 实际审图、资源和交付

已实际审看最终[浅色桌面](../../../../../evidence/m66/visual-refinement/56-review/optimization-1/visual/desktop-light.png)、[深色桌面](../../../../../evidence/m66/visual-refinement/56-review/optimization-1/visual/desktop-dark.png)、[手机浅色](../../../../../evidence/m66/visual-refinement/56-review/optimization-1/visual/mobile-light.png)和[手机深色](../../../../../evidence/m66/visual-refinement/56-review/optimization-1/visual/mobile-dark.png)；曲线为原组件实际绘制。可对照M66.51的同条件基线，系统面板、服务色块、深色图表底色、磁盘轨道及整体色彩分量均已收敛。

当前服务PID2633，绑定0.0.0.0:5180；公开3项JS/CSS与SSD构建文件逐项SHA一致，79项运行源码及检查脚本指纹见[最终candidate.json](optimization-1/candidate/candidate.json)。入口`/assets/index.24c82dfd.js`，SHA256 `f3eeb1f6248a2a9f79a89f9deffb95f780f28d363f80887b11e5942c7d614283`。基线HEAD为`fc9df26`，当前为未提交的工作树候选。构建入口保留SSD缓存规范，实际输出在`/var/cache/build-cache/users/911/projects/quickstart-df92025bd880/work/vue-preview`。

[默认体验](http://192.168.9.19:5180/?layout=ordered) · [全部服务运行示例](http://192.168.9.19:5180/?layout=ordered&scenario=business-all) · [人工体验清单](review-guide.md)。使用合成数据和内存布局，刷新恢复示例。未接触真实路由器、发布包或远端仓库，未把本轮称为设备或长期观察通过。

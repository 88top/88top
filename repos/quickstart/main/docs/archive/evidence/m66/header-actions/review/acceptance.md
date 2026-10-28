# M66.69 标题主操作统一验收

状态：技术通过，人工美感与易用性确认独立。受测工作树基于ffb233e，用户后续已要求提交归档，见[提交说明](../commit-note.md)；仍为5180隔离Vue原型，没有实际设备／软件包／发布的验收结论。受测指纹保留提交前真实状态。

最终[交付校验](optimization-1/handoff-review.json)通过：19套210组当前浏览器检查；341个非标题保护源码文件、6个改动SFC业务脚本及64个原业务文件未改变业务。TypeScript、源码／验证脚本／公开3份资源指纹、Git差异空白及本地文档链接检查通过。原318组是上一阶段证据，未用其替代本轮验证。

任务树达成：

| 任务 | 结果与证据 |
| --- | --- |
| 冻结和规范 | baseline/sources.json与controls.json、前版接口／应用截图；唯一外观规范VS03及M66.69任务树已更新 |
| 共用实现 | WidgetPrimaryAction提供原生button、装饰图标槽、文字槽及属性／点击透传；6个新设计卡接入，原业务模板仅消费兼容样式，无新增状态／请求／计时器／全局监听 |
| 全部控件一致 | 六宽度×两语言×两主题24矩阵、3组24收藏溢出检查通过；每个已有主操作单枚16px前置图标、6px间距、原字号、无尾部箭头；只含菜单的摘要不增加主操作 |
| 行为与资源 | 原业务、原工具、网络、完整启动台／链接及64容量、键盘／触摸、布局／图表和资源回归通过；动作／菜单／权限／正文箭头保持 |
| 当前交付 | 当前受测源码89份及验证脚本与公开JS/CSS一致；PID11810，0.0.0.0:5180，运行入口index.13e3f2ff.js；技术通过、等待用户人工确认 |

[完整套件](optimization-1/suite-results.json) · [27组新矩阵](../../../../../evidence/m66/header-actions/review/optimization-1/header-action-matrix-review/report.json) · [6组新交互](../../../../../evidence/m66/header-actions/review/optimization-1/header-action-interaction-review/report.json) · [保护检查](../../../../../evidence/m66/header-actions/review/optimization-1/protection/report.json) · [原业务64文件](../../../../../evidence/m66/header-actions/review/optimization-1/original-business/report.json) · [源码／脚本／资源](optimization-1/candidate/candidate.json) · [人工体验卡](review-guide.md)。

自检1次优化：初始矩阵未识别原域名配置按钮的直接文本节点，误报文字为空；保留原始failure及截图，测试改用Range测量该文本，仍验证DOM前后关系和真实几何。没有为通过测试改原业务模板或运行源码；初始18套183组通过记录保留，最终19套210组重新运行通过，详见optimization-1.md。

审图：已直接读取当前接口桌面浅色、应用手机深色、磁盘原版浅色和连接摘要手机PNG。前置图标与文字排列一致，分段外框／单条分隔线保持；字体与标题基线延续既有标准，标题及按钮无重叠。对应截图在当前矩阵和交互目录，用户最终审美确认不由检查替代。

正式开发参考：新设计组件可直接复用主操作组件；原业务Card逐项迁移时保留已有回调、菜单条件和权限，避免为样式重写业务。正文、完整启动台内部及系统菜单属于不同层次，本次不全局替换箭头。

复验命令：先冻结新的证据目录/candidate，再用同一目录执行header-action-final-runner.cjs；补齐protection与original-business后执行header-action-handoff-review.cjs，均使用RTK＋SSD入口和NODE_PATH=/config/playwright-runner/node_modules，期间不重建候选。全部脚本位于docs/product/ui-design/。

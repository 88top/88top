# M66.34 当前候选验收

2026-10-16。M66.32～34技术目标完成；M66.34初检后优化3次，当前全部适用自检通过。新控件用户主观体验尚未收集，不替代旧布局人工认可、不宣称真实设备业务通过。

## 候选与复验范围

- [连接与接口独立](http://192.168.9.19:5180/?layout=ordered&preset=network-business)，也可在旧布局模块库独立添加接口卡。
- PID3928、0.0.0.0:5180，入口`index.2addfc11.js`，SHA256 `3e58084c5ecdea6607b0bf151a15e067ac27ace685ce59186e34aa5a85bdfe75`。
- [candidate.json](final/candidate/candidate.json)：三份公开JS／CSS与SSD构建逐项一致，58个运行时源、54个验证脚本指纹。源码基线bcf3c6a，Git dirty，本轮未提交、推送或发布。
- [源文件保护](../../../../../evidence/m66/network-widgets/34-review/final/source-guard/report.json)：正式首页、两原网络组件、原流量图、store、router、请求层及原DNS／软件源动作共12个源文件与HEAD一致。改动仅为设计目录、文档及术语，不改后台／包／实际网络。
- 该候选构建后完成以下最终报告；前两次优化的通过结果不替代此候选。TypeScript退出0；`rtk git diff --check`通过。

## 目标覆盖与实际结果

| 目标 | 当前证据 | 结果 |
|---|---|---|
| N01～N05 状态、秒数、端口独立性、旧布局及恢复 | [六组网络契约](../../../../../evidence/m66/network-widgets/34-review/final/network-contract/report.json)，含无布尔值／矛盾布尔值、损坏文档、窄宽往返；[六组展示契约](../../../../../evidence/m66/network-widgets/34-review/final/presentation-contract/report.json)；原槽位五组／11类能力边界 | 通过 |
| N06 原字段、设备管理与异常入口 | [十四组业务交互](../../../../../evidence/m66/network-widgets/34-review/final/network-interaction/report.json)：标准／摘要共用状态和完整详情，原设备／接口配置路由 | 通过 |
| N07 两族隐私与清理 | 同上独立60秒定时器、共享详情、关闭遮蔽；[资源](../../../../../evidence/m66/network-widgets/34-review/final/network-resource/report.json)背景隐藏及实际卸载；[输入](../../../../../evidence/m66/network-widgets/34-review/final/network-input/report.json)键盘与触摸显隐 | 通过 |
| N08 原DNS／软件源表单 | 十四组交互中的原表单能力约束、校验、取消、成功、两类提交拒绝；只请求原端点，写入fixture内存 | 通过 |
| N09 独立端口详情与降级 | 接收／发送包计数、双工、MAC、协商速率、逻辑接口及原配置路由；128端口／48DNS的20项分页；真实延迟加载及空／失败详情不混写 | 通过 |
| N10 业务动作不混入布局事务 | 编辑层inert保护，显示形态撤销不写DNS／软件源；原型请求记录核对 | 通过 |
| N11 尺寸、主题、异常、输入及代表审图 | [新控件矩阵](../../../../../evidence/m66/network-widgets/34-review/final/network-visual/report.json)：24组宽度／主题／语言、48异常组合各标准／摘要、18上下组合；六组触摸／键盘；手机摘要176且逻辑行高不变，变宽恢复 | 通过 |
| N12 原布局及恢复 | [十二套回归](final/regression/batch-2.json)全退出0；[原布局基准](../../../../../evidence/m66/network-widgets/34-review/final/baseline/attempt-2.json)24基准／42状态／10临界点；新控件添加／隐藏及完整撤销 | 通过 |
| N13 有界读取和资源 | 四组网络资源检查、原图表资源回归；隐藏接口停止端口读取，隐藏连接不误停接口，卸载无新增读取、1秒计时器及visibility监听为0，日志≤120／历史≤30 | 通过 |
| N14 公开资源与受测代码 | 当前候选三资源校验、源指纹、受保护源文件及本地文档一致性；本项目进程归属核验 | 通过 |

最终网络资源窗口16秒左右内只出现单一5秒状态／10秒端口读取，具体计数与监听数量保留在资源报告。60秒隐私测试使用导航前安装的Playwright虚拟时钟推进真实组件定时器，没有缩短产品时限。

## 图表与视觉

[48张导出PNG审计](final/baseline/attempt-2/screenshot-audit.json)全部通过，读取实际图片中的原图表区域像素；原NetworkFlow源码保持，既有真实canvas与采样回归通过。没有用HTTP200、空画布、拼接图或保存配置代替完整检查。

设计者代表审图覆盖最终手机英文深色摘要、桌面英文深色详情、320px原DNS表单及桌面原软件源表单，并结合宽屏标准卡／手机详情的演进截图：层级明确、原信息有入口、弹层在视口内，摘要留白已按第三次优化收紧。保留原表单按钮与业务处理，不将其称为新视觉设计的完整人工验收。

## 优化历史与边界

初始手机弹层越界见`network-visual/attempt-1.json`；优化1修复固有宽度，候选及记录见[optimization-1.md](optimization-1.md)。补查发现接口失败详情误显示加载，见`interface-detail-boundary/attempt-1.json`及[optimization-2.md](optimization-2.md)。设计审图的手机摘要留白见[optimization-3.md](optimization-3.md)，优化前截图保留，最终均重新验证，没有第四次优化。

原型保存成功只证明原表单和fixture内存闭环。接口配置目的页是安全占位，设备管理复用隔离完整页面；真实路由器、实际ACL／版本兼容、正式偏好存储、安装包／runtime、多架构及长期观察不在本轮通过项。物理手机、完整读屏认证及用户新体验未假填为通过。

复验脚本位于`docs/product/ui-design/network-*-review.cjs`及现有回归入口；统一使用`rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules QS_DESIGN_EVIDENCE_ROOT=<新的证据目录> node <脚本>`。服务生命周期仍为`scripts/ui-design.sh start/stop/status/logs/run`，只操作核验归属的本项目5180进程。

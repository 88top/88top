# M66.30 当前候选技术验收

2026-10-16。当前功能及受影响旧交互技术自检通过，共优化2次，没有使用第3次优化。人工体验不由本报告代签。

## 当前结果

| 检查 | 当前证据与结果 |
|---|---|
| TypeScript、Git格式 | 最后一次业务代码修改后`npm --prefix web run tsc`和`git diff --check`通过，均经rtk及适用SSD环境 |
| 统一契约 | `contract/report.json`6组通过，覆盖十模块形态／角色／尺寸、迁移、三类计划、完整快照、版本失效和不修改无关自动偏好 |
| 旧契约 | `legacy-contract/`5组、10组能力边界通过 |
| 现有首页基准 | `baseline/attempt-3.json`24组宽度／主题／语言、42个状态、10个宽度边界通过 |
| 新形态基准 | `presentation-matrix/attempt-3.json`24组应用三行＋设备摘要实际Vue，另含0／1／4／6常用项及三宽度设置面板；无溢出或主要触摸目标不足 |
| 最低尺寸及恢复 | `presentation-boundary/attempt-4.json`4组通过：窄启动条失败态、指定形态进入上下组合前确认、隐藏再添加保留偏好、4宽度×2语言×5状态的主动最小行高检查 |
| 输入与导航 | `regression/batch-2.json`12套全部通过：应用6组、设备5组、协商7组、槽位11组、整理7组、总览10组、输入10组、整行9组、生命周期2组、导航15组、通用资源2组、新形态资源3组 |
| 导出图表 | `baseline/attempt-3/screenshot-audit.json`48个PNG实际曲线区域全部通过；不是只检查活canvas |
| 新形态读取 | `regression/presentation-resource/report.json`20次显示设置／视图操作后10600ms仅2次原5秒采样，同一canvas；20次撤销还原完整文档，隐藏及卸载后5600ms新增采样0次 |
| 候选一致性 | `current-candidate/candidate.json`公共三份JS/CSS逐项与SSD构建一致，50个源指纹；M66.31再次采集交付清单 |

设计者已实际查看1440中文新形态、320暗色英文、新窄启动条失败态及设置截图，核对曲线、应用网格、内容层级和边界；这不是用户的主观美感签字。触摸为Chromium模拟及CDP事件，物理手机和完整读屏认证未做。

## 优化与失败记录

1. 初检候选`initial-candidate/`：新摘要220px在320px宽时内容溢出；资源脚本的`!i%2`错误，只产生11次变更。保留`presentation-matrix/attempt-1.json`、`failure-1.png`及独立`presentation-resource/attempt-1.json`。
2. 优化1候选`optimization-1-candidate/`：摘要删除重复解释及错误态冗余内容，按实际空间预留260px（宽）／280px（窄于450px）；启动条采用横向56px入口，最低150px；修正资源循环。原24组基准／42状态和新增24组及12套回归通过。随后扩大窄卡边界，发现结构面板仍用旧固定高度，`presentation-boundary/attempt-2.json`及`failure-2.png`保留；复核还发现摘要替代会把无关自动上下槽固定为摘要。
3. 优化2当前候选：结构预检使用显示契约；替代只改目标或不兼容的指定形态；窄启动条失败态保留状态／重试与全部入口；自动排布均衡，属性更新类型收紧。最终边界`attempt-3`通过后，无业务代码改动，再扩为主动最小高度的40状态检查，`attempt-4`通过。额外重复执行不是第3轮代码优化。

所有失败记录保留。当前入口`index.61df59de.js`，SHA256 `5f516a36b2aeb8a66e1e4aa9e225347aec963f9df3e89e7219c6ac554be0aa67`，PID8246。工作区候选未提交／发布；旧阶段或旧资源不替代此候选验证。

## 可重复入口

统一执行：`rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules QS_DESIGN_EVIDENCE_ROOT=<新的证据目录> node docs/product/ui-design/<脚本>`。

脚本：`presentation-contract-review.cjs`、`presentation-regressions.cjs`、`presentation-matrix-review.cjs`、`presentation-boundary-review.cjs`、`slot-final-review.cjs`。PNG审计必须等最终视觉报告生成，再将证据根指向该次`attempt-N`运行`ordered-screenshot-audit.cjs`；当前资源清单使用`slot-candidate.cjs`。

本轮只验证隔离原型，不把合成请求、短期浏览器观察当成当前设备、安装包或24小时观察通过。

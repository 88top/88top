# M66.50 技术验收

核验时间：2026-10-17 00:28 UTC。结果：**技术自检通过；用户随后确认首页自定义布局完成并要求提交**。下方机器报告及待确认表述保留其生成时的历史状态，后续单控件样式进入独立任务。

## 当前候选

- 入口：http://192.168.9.19:5180/?layout=ordered&preset=network-stack&scenario=business-all
- 服务：PID13201，0.0.0.0:5180，owner为当前仓库的docs/product/ui-design；公开3个JS/CSS与SSD构建输出哈希一致。
- 入口JS：`/assets/index.40b30263.js`，SHA256 `9d75c65541a20b07bea062b5653bbd2dcff71c2369655ff4642cc9a2d6f989f5`。
- 75个运行源码与验证脚本指纹见[候选记录](handoff/candidate.json)。HEAD为8a12d353682ec755389245780a8e152e1b93347f，当前包含先前保留的未提交工作及本轮修改；不把HEAD当作该候选全部源码。

## 任务与检查

| 任务 | 当前证据及结论 |
|---|---|
| 50.1 规则／模型 | boundary-contract 5组：旧尺寸不激活、迁移幂等、有限值校验、镜像／重建／排序、上下空间钳制通过；规范1.5统一规则 |
| 50.2 边界 | boundary-interaction 10组、structure-render 7组：三种44px手柄、最小提示、真实图表伸展、固定总高再分配通过 |
| 50.3 手势／恢复 | boundary-touch 4组、network-input 6组，以及交互检查：实际CDP触摸、键盘、Escape／blur／pointercancel／resize、无变化不写历史、整页取消通过 |
| 50.4 结构一致性 | boundary-layout 7组、structure-interaction 8组、row-sort 9组：镜像、响应式往返、应用后再取消、单次撤销／恢复自动、整行排序通过 |
| 50.5 内容／资源 | boundary-state 9组、structure-matrix 39组、natural-matrix 37组、boundary-resource 3组、structure-resource 3组：状态变化、尺寸／主题／语言、内容边界、后台／卸载、有界测量／读取通过 |
| 50.6 业务／交付 | business-widgets 19组、business-actions 13组、network-interaction 14组：原字段／表单／动作通过；64个原业务源码未改；handoff 4组核对当前报告、源码、公开资产与任务卡 |

16套场景脚本合计193组，另有64文件保护及4组交付检查。[机器汇总](../../../../evidence/m66/boundary-resize/handoff/report.json)逐项列出报告路径对应名称，报告均在`optimization-2/<名称>/report.json`。浏览器报告没有控制台／页面错误或外部请求。`npm run tsc`退出0、`git diff --check`退出0。隔离Vue构建成功，保留已有组件的CSS calc与deep语法警告，未顺手修改业务源码。

实测示例：默认网络组约476.14px；底边拉高160px后为636px，真实图表也为636px。上下分隔线再移动80px，两卡由454.81／163.19px变为374.81／243.17px，行总高仍为636px；完整连接形态保持。像素取整容差不超过2px。

## 优化与设计审图

初始实现发现最小提示被残留点击清掉；优化1普通拖动修复后，取消拖动的残留点击仍可能误选下一行。优化2统一在主容器捕获这类点击，所有当前检查通过。初始和优化1的报告／失败截图保留，未覆盖为通过；优化3未使用。

已查看当前`optimization-2/boundary-interaction/desktop-resized.png`及`boundary-touch/touch-mobile.png`：桌面左右／上下／底边手柄方向和位置明确；重新分配后图表填满、右卡内容完整；手机拆卡不显示尺寸手柄，原连接字段仍可读。矩阵和反转／镜像截图见同目录，技术审图不替代用户对美观与顺滑度的确认。

## 验收边界

仅隔离设计原型，合成API、内存布局、刷新恢复示例。原正式首页、系统菜单、后端、设备配置和发布资产未修改；没有用HTTP200或编译成功替代业务交互检查。未访问路由器、未重新验收IPK/APK或限速数据面，24小时观察仍独立延期。本轮不提交、不推送代码。

[人工体验任务卡](handoff/review-guide.md) · [架构交接](handoff/development-handoff.md) · [目标与任务树](../../../product/quickstart-home-boundary-resize-m66-50.md)

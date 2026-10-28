# M66.25 验收与体验指南

用户确认（2026-10-16）：自定义首页的交互功能体验通过，并要求提交代码。本确认覆盖本轮既有交互，不扩大为后续模块属性／多形态方案或正式首页开发验收。

2026-10-16。任务树、RS01～RS08标准在[里程碑文档](../../../../product/quickstart-home-row-sort-m66-25.md)，产品规则写回[规范1.1](../../../../product/quickstart-home-layout-interaction-spec.md)。范围为隔离Vue原型。

## 完成的任务树

- [x] 整行排序从模块槽位移动分离，移除整行目标列表及结构面板的重复排序按钮。
- [x] 左侧行标题手柄、整行浮起、同高占位、相邻行让位；预览不写草稿，松手一次提交。
- [x] 跨屏有界滚动、列表边界限位、取消清理；行内菜单及Alt+上下／Home／End共用命令。
- [x] 保留行ID、内部模块、结构、比例和高度；撤销、取消、面板和视图互斥。
- [x] 规范、可重复浏览器检查、当前资源清单和人工体验入口。

## 当前检查

| 标准 | 证据 |
|---|---|
| RS01/02 第五行到第一行、整行保留、预览不提交、一次撤销及原位无历史 | `gesture/attempt-3.json`，`desktop-drag-preview.png` |
| RS03 行标题点击不进目标模式；菜单与键盘共用排序、稳定焦点 | `gesture/attempt-3.json`、`visual/report.json` |
| RS04 左右组合、不同高度、视图往返和取消 | `gesture/attempt-3.json`、`visual/768-stacked.png`、`visual/768-mirrored.png` |
| RS05 手机跨屏双向排序、停止滚动 | `gesture/attempt-3.json`、`gesture/phone-drag-preview.png` |
| RS06 Escape/cancel/blur/resize/视图/面板/外部落点；真实Vue卸载及外部草稿变更 | `gesture/attempt-3.json`、`lifecycle/attempt-2.json` |
| RS07 320/390触摸、正文滑动、44px手柄、减少动态效果；320/390/768/1440明暗主题 | `gesture/attempt-3.json`、`input/report.json`、`visual/report.json`，10组视觉检查；已人工查看320暗色、768组合及手机拖动截图 |
| RS08 模型、槽位、结构、整理、模块移动、资源与版本一致 | `contract/`5组及10组能力边界、`primary/`11组、`normalization/`7组、`overview/attempt-2.json`10组、`input/`10组、`resource/`2组，及下述资源清单 |

整行专项9组、生命周期2组通过，均无页面错误或外部请求。整行20次排序／撤销保留同一真实流量canvas；通用20次移动／视图／尺寸回归观察6.825秒，仅1次原5秒网络采样，历史上限30。补充整行专属的完整采样周期观察见`row-resource/report.json`。TypeScript在最后产品代码修改后通过；`git diff --check`通过。

## 轮次与失败保留

1. 初检失败：手机向下拖动时来源transform撑大页面，自动滚动追赶不断延伸的底部。保留`gesture/attempt-1.json`及`failure-1.png`。
2. 优化1：来源限于原列表，滚动限定为手势开始时的文档边界。双向跨屏通过；触摸测试固定180px没有跨过第二行中点，因此正确得到原位结果。另有卸载测试把Playwright监听器算为应用残留。保留`gesture/attempt-2.json`、`lifecycle/attempt-1.json`及失败截图。
3. 优化2：触摸落点使用真实第二行中点并断言目标位次；卸载记录监听器注册栈，校验应用所有权。最终`gesture/attempt-3.json`、`lifecycle/attempt-2.json`通过。剩余pointerup明确来自Playwright `InjectedScript._setupHitTargetInterceptors`，不来自应用；应用监听与帧均清理。此轮未再修改产品行为。

共优化2次，未超出3次上限。浏览器报告保留每次attempt，不覆盖失败。

## 当前候选和人工体验

[当前五行示例](http://192.168.9.19:5180/?layout=ordered&preset=services)。刷新后选择“自定义首页 → 布局总览”，从第五行左侧“⠿ 第5行”拖到第一行；手机靠近上下边缘连续拖动。试一次撤销，再试行内“···”的上移／下移／置顶／置底。

当前PID `32427`，入口`index.17c521bf.js`，SHA256 `41538a6664cd9692d09ff2b111c33555622cb715a56468d68132bdf422a2b4fb`。公开三份JS/CSS与SSD构建目录逐项一致，46个源文件指纹见[candidate.json](candidate.json)。基线已提交为`dbe77a9`，本轮仍是工作区候选，未推送、未发布。

当前检查证明技术行为，不替代用户对新手感和美观的确认。仅合成数据、内存草稿；未改正式首页或系统菜单，未做路由器部署、安装包及实机业务复验；物理手机与完整读屏认证不在本轮。24小时观察仍独立延期。

复验所有浏览器入口：`rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules QS_DESIGN_EVIDENCE_ROOT=<新的证据目录> node docs/product/ui-design/<脚本>`。脚本为`row-sort-review.cjs`、`row-sort-lifecycle-review.cjs`、`row-sort-visual-review.cjs`、`row-sort-resource-review.cjs`，以及表中`slot-*`回归；候选清单入口`slot-candidate.cjs`。先启动当前构建预览，再检查，历史截图不可替代。

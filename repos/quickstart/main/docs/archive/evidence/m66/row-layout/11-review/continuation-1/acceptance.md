# M66.11 继续修正与当前候选复验

2026-10-15。用户在上次按三轮上限停止后明确回复“继续”，授权本轮修正。先前失败、截图和报告保留，不改成通过。本轮任务树：两个定点复现 → 分辨产品/取证原因 → 最小修正 → 当前候选回归 → PNG与人工审图 → 达成后进入M66.12。验收：320px完整阅读权限说明、不同分配权语义一致；同宽导出保留真实曲线；既有完整编辑、多端、状态与生命周期检查保持通过。

## 定点复现与根因

一条快速命令：`rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/ordered-closeout-repro.cjs`。原始报告在focused/repro-report.json，两个真实失败均被捕获；不是检查进程存在或HTTP200。

- 权限说明：320px下左边界-157.390625px。说明锚定在换行后的窄details区域，右对齐270px宽弹层会向左越界。改为相对于整个设备页脚定位，并限制为该容器宽度；不改变卡片高度，不改变DHCP分配权文案。
- 导出曲线：同一651×177实际canvas有23941青色像素，视口PNG也有23941，而原生整页PNG对应区域为0。捕获期间测得innerHeight短暂为1、canvas变成412×187并移动位置，捕获后恢复。当前本机Playwright 1.62.1 / HeadlessChrome 151.0.7922.34；其整页路径使用Page.captureScreenshot的captureBeyondViewport。观察仅针对当前本机组合，不声称所有版本均有同一问题。

提出并核验的假设依次为临时视口引发重排、单纯绘制未完成、审计坐标失准。native-control/repro-report.json在同一修正后UI上只换回原生整页捕获，权限通过但曲线再次为0；fixed/repro-report.json使用同宽扩展高度捕获，视口与整页23941像素均通过，捕获后视口/图表尺寸恢复。证据支持取证视口重排；没有改原NetworkFlow来掩盖问题。

## 修正与取证边界

第一轮实现：仅修改设计层layoutPreviewCard.css的权限说明定位；增加ordered-capture.cjs，由验证脚本共用同宽整页内容捕获。捕获真实DOM，扩展高度前限制上限12000px，等待布局帧，确认页脚内容进入画面，最后恢复原视口和滚动位置。没有克隆DOM、重画曲线、图片拼接或隐藏不利内容。整页导出表示“同宽扩展高度的完整内容”；固定定位编辑工具在扩展后的视口底部，正常视口图仍单独保留。

新增QS_DESIGN_EVIDENCE_ROOT支持，把本轮证据独立放在continuation-1下。早期capture-experiment与服务重启重叠，出现连接重置，该次作废，不作产品失败或通过依据；服务就绪后fixed与native-control完整重跑。运行时UI未加入诊断日志；追踪仅存在于独立复现浏览器，退出即销毁。

## 验证入口与当前结果

- fixed/repro-report.json：两个定点均pass。
- native-control/repro-report.json：预期负对照fail（旧截图方式），证明当前采样/曲线数据不缺失。
- review/review-report.json：pass。24基准、42状态、9示例、六紧凑卡失败状态、13临界点及浏览器/生命周期检查通过，浏览器异常与外部请求均0。
- authority/authority-popover-report.json：pass。6宽度×深浅×中英文×3种DHCP分配权=72次实际点击通过；检查边界、全文、卡片高度与语义。320px弹层边界为32～288px，宽256px。
- interactions/interaction-report.json：pass。当前13组完整布局、真实拖动、比例、导航及应用/取消/撤销/恢复通过。
- review/screenshot-audit.json：pass。主报告完成后独立审计48张PNG的实际图表区域，24视口及24同宽完整内容图均通过；不以活canvas或图标代替导出证据。
- TypeScript检查退出0。上述交互、权限、主检查在09:02 UTC启动，独立PNG审计09:07 UTC完成，均针对本轮重新构建的候选。

人工自检已查看320px权限说明、1440px深色完整内容、左大右堆叠、390px手机和1024px英文布局：说明全文可读，曲线保留，顺序和容器边界符合规格。这里只记录设计者自检，不代替用户审美确认。M66.11本轮通过，进入M66.12最终人工评审；当前候选标识见 [candidate.md](candidate.md)，操作与反馈清单见 [评审指南](../../12-design-signoff/review-guide.md)。本轮首个修正方案通过，无需追加优化。

预防方向：弹层应使用稳定的卡片/内容容器作为边界；取证工具也应有明确的视口契约，并验证导出的像素。现有布局和业务来源无需因此重建，不增加路由器统计或后台服务。

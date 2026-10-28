# 5180配色候选验收

2026-10-19，响应用户“太淡、过于低调，希望更浓/鲜艳/有生机”，当前目录预览已重新启动，默认鲜明版；[任务树](status.md)、[产品说明](../../../product/quickstart-home-color-study.md)。本轮是新配色提案，已确认的布局、字体、交互与业务基线继续有效。

## 当前体验

- [鲜明版](http://192.168.9.19:5180/)：推荐日常方向，宝石蓝主色、浓色蓝/青绿/紫工具图标、浅蓝分段操作、选中层级和卡片边缘色晕，保留白/深色阅读区。
- [浓彩版](http://192.168.9.19:5180/?palette=bold)：实色蓝主操作、更浓的画布和图标，作为色彩浓度更高的候选。
- [原版](http://192.168.9.19:5180/?palette=classic)：原有低饱和配色对照。右上“设计预览→色彩风格”同样可切换，不改布局/保存结构。

只修改设计入口和配色样式；原WidgetMenu/分段动作通过可回退变量适配，单独的摘要更多使用正常文字色，原菜单正文保持可读。原业务黑色单色动作图形只在实验配色中跟随文字，品牌/状态色不批量重画。图表内核及其原背景绘制仍保留，只按现有令牌增强读数/图例；不把本次颜色检查解释成重做全部图表。全页色彩强度由用户后续体验选择，不据技术通过宣称审美通过。

## 当前版本证据

[最终配色报告](../../../../evidence/m70/design-color/round-3/visual/report.json)60视图通过：三配色×中英×深浅×1440/1024/768/390/320。11卡片尺寸、完整布局文档和系统菜单占位样式与同环境原版一致，页面无水平溢出；正文、辅助字、选中项、链接、状态、动作及图标渐变两端的受检颜色对比度≥4.5:1。两种增强配色均验证预览选择只改风格、应用库可搜索、菜单Escape关闭、编辑/总览/取消保持内容、真实存储摘要独立更多可读并可用。根URL默认vivid。无pageerror或跨源请求。

[32组回归](round-3/regression/suite-results.json)通过：launcher-home8、boundary-interaction10、home-widget-header14，覆盖应用固定容量/搜索/形态、边界手柄/撤销/取消/响应式及全部标题分段操作。通过独立SSD wrapper执行vue-tsc；预览构建成功，输出位于SSD工作树隔离目录work/vue-preview，现存CSS calc空格/v-deep警告没有作为本轮新功能修复。

[数据恢复专项](../../../../evidence/m70/design-color/round-3/recovery/report.json)通过：设备示例错误503→点击重试恢复200→切换浓彩仍200。此前独立红例[200→503](../../../../evidence/m70/design-color/recovery-baseline/report.json)保留，第三候选将palette切换与原场景重置分开；不会让比较颜色顺带改变示例数据。真实路由器未被请求。

已实际打开[最终鲜明桌面](../../../../evidence/m70/design-color/round-3/visual/vivid-zh-cn-light-1440-top.png)、[浓彩桌面](../../../../evidence/m70/design-color/round-3/visual/bold-zh-cn-light-1440-top.png)、[鲜明深色](../../../../evidence/m70/design-color/round-3/visual/vivid-zh-cn-dark-1440-top.png)、[320英文深色](../../../../evidence/m70/design-color/round-3/visual/vivid-en-dark-320-top.png)及前轮全页对照。截图保留真实画布，使用已有ordered-capture避免截长图时清空canvas；最初基线全页截图出现过画布重绘时机差异，不以该空画布宣称原功能缺失。

## 生命周期与指纹

旧5180 health owner、PID21126的cmdline/cwd均属于0153-device-lists-sho。用户本轮明确要求停止它，实际调用该目录自有ui-design.sh stop；没有直接杀未知进程或修改旧工作树。当前94c4目录通过自有stop/start在SSD构建，最终health PID4999/owner本工作树，[三公开资源与源码指纹](round-3/resources.json)匹配。测试期间未重建；设计服务继续运行供用户体验。

`git diff HEAD -- web/src/home web/src/pages web/src/plugins web/src/request backend`为空，记录在最终资源报告；本轮无正式业务/配置/权限/设备写入，无B/A/C/D/APK部署、push/Release/Action。设计构建属于合成数据/内存偏好，颜色验收不能代替正式设备、安装或长时间观察。

保留失败：[首轮对比度](../../../../evidence/m70/design-color/round-1/visual/report.json)浓彩深色辅助字4.1877:1；[第二轮编辑取消](../../../../evidence/m70/design-color/round-2/visual/report.json)错误比较本地草稿revision0与2；[摘要测试](../../../../evidence/m70/design-color/round-2/visual-recheck/report.json)误把实际含连体主操作的网络摘要拿白色面板做独立更多对比。修正为内容检查（配色切换本身仍比较完整文档）和真正仅更多的存储摘要，不删行为断言。两次测试修正不是额外产品候选；第三产品候选关闭示例数据重置问题，后续无第四次产品优化。

复验入口：`rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules QS_DESIGN_EVIDENCE_ROOT=新的证据目录 node docs/product/ui-design/home-color-review.cjs`；恢复专项同环境运行home-color-recovery-review.cjs。服务资源先冻结，测试过程中不重建。

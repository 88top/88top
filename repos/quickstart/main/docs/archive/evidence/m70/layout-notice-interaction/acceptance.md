# 首页操作提示：可关闭、自动收起，已更新 B

2026-10-21，产品候选 `f4cff5ed89687d3c647e6b8ef54c59d09e57f180`，资源键 `0.16.6-test20261018-preview-f4cff5e-ed50560ff61c`。

## 用户可见行为

- 取消、撤销、位置变更、保存成功等提示提供明确的“×”关闭按钮，无需刷新页面；未交互时3秒自动收起。
- 鼠标悬停或键盘聚焦提示时暂停计时，离开后重计；连续相同消息有独立事件身份，旧计时器不关闭新消息。
- 保存中、校验或保存失败不自动消失，但可手动关闭。关闭只隐藏消息，不取消请求、不清空草稿、不清除冲突/结果未确认等配置状态。
- 提示始终是右侧内容区内的浮层，不占首页高度、不依赖原型侧栏宽度变量；长文可换行且有界。按钮44×44px，可点击、触屏和键盘关闭，关闭后恢复适当焦点。
- 正式首页与设计源码复用 `LayoutNotice.vue` 和 `useLayoutNotice.ts`，卸载清理计时器、ResizeObserver、scroll/resize监听及帧回调。保留原布局、撤销、空位整理、真实保存及并发保护语义。

## 验证与失败证据

- [基线](../../../../evidence/m70/layout-notice-interaction/baseline-b/report.json)在原B前端51a6170上明确红灯：取消提示没有关闭按钮。此前[诊断](../layout-notice-diagnosis/status.md)中的悬空/取消后约65px占位也属于本次修复范围。
- [本地检查](round-1/build.json)：独立类型检查、最终前端构建、37项配置/请求/语言测试通过。首次构建后还有模板修改，因此再次类型检查和构建后才冻结，实际产物位于web/dist。
- [最终UI断言](../../../../evidence/m70/layout-notice-interaction/round-1/current-b-final/report.json)：11组通过，包括中英×深浅×1440/390的8组正常交互，及手机保存冲突、真实AbortController超时路径、成功响应三组浏览器拦截场景。普通提示按钮/Enter/tap、自动消失、聚焦/悬停暂停、重复撤销重计时、导航卸载后不残留均通过；8组关闭前后相对内容位移均0px，提示边界均在实际右侧内容区内。无页面脚本错误或未拦截业务写请求。
- 保存三组的POST均由Playwright截获，冲突返回409，超时让前端8秒Abort并只GET确认，成功返回匹配请求的浏览器响应。未向路由器提交这些测试草稿。失败提示等待6.5秒仍在，关闭后草稿顺序保留，取消仍可用；成功提示自动收起。此处验证消息及草稿交互，不冒充真实配置写入验收。
- 桌面浅色取消、英文深色手机、中文手机冲突/超时截图已实际打开审查。

产品代码只形成一个候选，保留三次设备检查：

1. `round-1/current-b/`：测试时钟在页面挂载后接入，首次点击未触发布局编辑，等待取消按钮超时；无产品通过结论。
2. `round-1/current-b-verified/`：改为导航前安装时钟，前两组完整通过；第三组因使用Node时间暂停浏览器时钟而触发 Cannot fast-forward to the past。证据保留。
3. `round-1/current-b-final/`：按浏览器自身时间加1秒暂停，11组断言全部完成并写出 passed 报告。外层命令随后以143退出，未生成通常的device.json，不能把它伪装成包装器正常退出。已用[单独清理审计](round-1/current-b-final/cleanup-audit.json)识别并销毁本轮仅有的两个root/900秒临时会话，保留用户root/3600秒会话及其他会话；再独立完成运行状态与配置核验。异常退出原因未确定，无产品代码因此改动。

基线及三次候选检查共8个临时root会话，前6个有各次device.json的finally清理记录，最后2个由上述审计明确收尾，凭据未归档。

## 当前设备与交付

四个公开资源与冻结候选匹配：[资源](round-1/public-resources.json)。20项配置、LAN地址、默认路由严格一致：[最终配置](round-1/preservation-final.json)。后端c9624a3、Quickstart/startdhns/FastNet进程、引擎disabled/stopped状态及包记录均保持：[最终运行状态](round-1/runtime-final.json)、[部署](round-1/deployment.json)。

仅B前端资源及版本键替换，无服务重启/新包安装/SDK/push/Release/Action，不操作其他设备，不重建5180。冻结产物 `bin/previews/f4cff5e`；私有回退 `/root/quickstart-backups/home-0166-layout-notice-f4cff5e-r1`。

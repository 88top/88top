# 第二轮设备复核

45993ab的128前端/独立类型/Web、本地21组/7视图、当前B中文11组通过。手机英文首次在Back后scroll严格断言失败，窗口/URL/焦点均正确，失败截图及报告保留。不能算手机通过。

第一次诊断错误地在导航拦截器内等待page.evaluate，阻塞新文档提交。仅终止自有测试Node（未动任何路由器服务）；Python finally销毁两临时会话，device.json保留。第二次改成history.replaceState边界的异步只读快照：[b-return-diagnostic-check2/pinned-entry/report.json](../../../../../../evidence/m70/installed-apps/pinned-direct/round-2/b-return-diagnostic-check2/pinned-entry/report.json)确认离开scroll=1020，保存也为1020；返回焦点正确但scroll=1028，数据稳定后仍1028，图标文档位置不变，并非内容自然增高导致。诊断结果为diagnostic，不冒充完整通过。

第三轮只处理原生历史滚动与自定义恢复竞争：记忆并暂时接管该首页历史项的scrollRestoration，返回后在布局帧完成再恢复scroll/焦点并归还先前模式；保持有界超时/卸载清理。原严格滚动断言不放宽，完整库路径不变。这是本轮最后一次产品优化；若仍失败，仅暂停该依赖并如实报告。

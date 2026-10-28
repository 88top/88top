# 用户追问旧悬空框：两个入口重新核验

2026-10-21。无产品源码修改，B仍为f4cff5e。用户再次提供历史截图及旧 `p.ordered-notice`，要求确认。

## 发现与处理

- B实际公开index.js/style.css与冻结修复候选一致，不含 `ordered-notice`，包含新的可关闭提示。[公开资源](B-public.json)。
- 5180当时确实仍在提供旧构建：入口index.13b7529b.js动态加载mount.d84bd4de.js，后者包含 `ordered-notice`，没有新的关闭按钮。不能只用B已经更新来声称预览也已更新。
- 经 `scripts/ui-design.sh status` 确认当前项目拥有原服务PID16245；仅通过本项目脚本stop/start重建，启动为PID13599。SSD构建输出在 `/var/cache/build-cache/users/911/projects/quickstart-6fd8ef14aa05/work/vue-preview`。
- 当前公开入口index.0f6426aa.js与mount.12d9cc8d.js已不含旧提示，新关闭按钮存在。[预览资源](preview-public.json)。构建有既有::v-deep和其他样式calc空格警告，本次未借机更改无关样式。

## 实际交互检查

- B真实root登录态1440/390两组，不使用虚拟时钟。进入总览→行上移→撤销，旧段落不存在；新提示在右侧实际内容区内、有关闭按钮、可点击关闭；等待3.4秒自动消失。撤销后行/卡片/空位与操作前深比较相同。[报告](../../../../../evidence/m70/layout-notice-interaction/recheck-20261021/report.json)。
- 单独隐藏系统信息后出现原位置添加空位，此时没有任何操作提示；撤销隐藏恢复系统信息。说明空位与通知是独立状态，不是通知插入布局行。始终取消草稿，不保存。
- 报告中的 `afterUndo` 字段误在取消退出概览后采样，故为空，不作为恢复断言依据；真实恢复是在两次撤销后立即执行深比较，`undoRestoredSystem=true`和无异常退出表明断言通过。
- 5180 ordered入口1440/390两组也通过上移/撤销、旧提示不存在、点击关闭、3.4秒自动消失和行序恢复。[预览报告](preview-report.json)。
- B手机与预览桌面撤销截图已实际打开。B首页布局/启动台前后SHA256完全相同；新增1个带任务标记的root300秒会话由finally明确销毁，包装器正常0退出。[配置与清理](device-cleanup.json)。

结论：旧悬空空框已在两个入口解决；编辑时移走控件产生的草稿空槽仍按原规则保留，完成时整理。没有自动删用户空行或重写配置。本次只重建当前项目预览，不重新部署B，不操作其他设备。

# 正式业务开发参考

产品规则统一采用[规范1.3 R25～R30](../../../../product/quickstart-home-layout-interaction-spec.md)，当前参数和里程碑见[自然高度契约](../../../../product/quickstart-home-natural-layout-m66-38-43.md)。本轮仅隔离Vue原型；未来正式集成需沿用业务基线、替换设计适配层，并另做真实接口、安装及迁移验收。

## 实现分层

- `widgetPresentation.ts`：同一模块ID下的展示形态、显示属性和容量。系统auto以普通槽宽560px为分界，上下小槽用紧凑形态；显式完整在普通槽保留。实际DOM高度不参与选择或有限列表容量。
- `homeDocument.ts`、`orderedLayout.ts`：schemaVersion 2、行heightMode content/chart；兼容旧rows和v1并保留原身份、顺序、列宽、偏好及旧height/split。旧像素字段只作兼容资料，实际高度不写回。未知版本保留原输入并拒绝迁移。
- `slotLayout.ts`和统一变更计划：结构／宽度／角色约束仍有效；普通行自然增高无需确认；显式形态适配仍预览并原子提交。撤销、取消、过期计划检查共用一套文档。
- `naturalHome.css`：内容先决定高度，再由CSS Grid同排拉伸；上下两个auto轨道按内容分配。图表自身320px、手机300px保持原曲线；外框可因指定完整的邻卡增高。没有DOM高度→保存高度→形态的反馈链。
- `SystemOverview.vue`与原`SystemInfo.vue`：共用系统store／原口径，紧凑卡仍保留原信息概览目标，完整详情复用原组件，互不产生第二套业务读取。
- `WidgetMenu.vue`：一个主要操作加更多菜单，支持方向键、Home/End、Escape和焦点恢复。标题详情入口替代重复底部按钮，底部状态／权限解释保留。
- `nativePreviewScope.ts`：只投影首页副本，磁盘（含RAID）合计3、SAMBA 2；根快照和原向导／完整详情保持全量。未显示异常有摘要，不能把隐藏条目报为不存在。

## 原业务边界与设计专用适配

64个原首页／请求／路由／store／向导源文件由哈希检查保护。**源文件未改不表示运行中毫无适配**：`vite.design.config.ts`仅在设计构建注入`NativeCardMenu`和首页读投影，原高级操作仍点击原anchor；原卡片主动作、包检查和原表单经现有NativeBusinessHost隔离到合成API。正式Vite配置没有这套transform。正式实现应将标题操作与投影做成显式组件／数据契约，不能把源码字符串替换作为正式扩展机制。

原系统组件未实际开放的监控／备份菜单本轮不凭模板文本擅自开放。原内存零可用被`||100`覆盖、缺失温度0，以及原翻译不完整等保留并独立记录，不因外观改动默默改变业务。DDNSTOiframe仅作明确的合成认证／绑定回调，不证明真实第三方认证安全。

当前读者仍由首页统一持有，磁盘／RAID／共享／Docker／下载／版本一次读取，远程3s、系统5s；形态／位置改变复用快照，显式业务写入或重试才刷新。20次切换、后台及实际Vue卸载清理见[资源报告](../../../../../evidence/m66/natural-home/42-review/final/resources/report.json)。日志上限120、历史上限30；长时观察仍未开展。

真实偏好存储作用域、服务器版本化保存、真实权限与设备环境、安装包前后端一致性需在正式集成任务验证。完整旧业务基线见[六组件清单](../../../../product/quickstart-home-business-widgets-alignment.md)，网络连接和接口仍是两个独立模块。当前技术通过不等于路由器、包或人工验收通过。

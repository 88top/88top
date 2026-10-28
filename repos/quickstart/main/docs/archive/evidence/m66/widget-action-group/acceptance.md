# 首页标题操作：还原连体分段外观

用户明确指出：原版文件管理／更多共用外框，当前原型却是两个分开的按钮。已据此修正唯一视觉规范VS03；独立交互目标仍使用同一外框，不能将“独立点击”理解成两个分开的边框。

## 当前实现

- `widgetActionGroup.css`统一外框、4px圆角、零间隙和单条竖分隔线；桌面约30px高，更多区域24px，触屏两个目标各至少44px。
- 网络连接、接口、设备和系统概览显式消费共同样式；原Card业务通过NativeBusinessSurface现有Adapter消费同一规则。紧凑系统卡避免套双层外框；只有更多的摘要菜单保留独立外框。
- WidgetMenu通过CSS变量接入分段样式，菜单键盘行为不改；主操作和更多仍是独立DOM目标。旧Card的div主入口由隔离Adapter补齐role、Tab、Enter／Space，退出恢复属性并清理监听器；没有修改原业务源码或新增全局读取／轮询。
- 主要动作、更多原入口、业务状态及布局偏好不改变。正式首页、系统菜单和设备未修改，本轮未提交／推送代码。

## 自检

当前候选5套脚本合计**55组通过**：

| 脚本／报告目录 | 组数 | 重点 |
|---|---:|---|
| `optimization-1/widget-actions` | 9 | 一条外框／分隔线、无间隙、两段等高；8组实际标题操作；键盘独立焦点与动作；桌面／平板／手机、深浅主题、中英文、44px实际触摸；摘要单菜单不产生空段 |
| `optimization-1/network-interaction` | 14 | 原连接状态、隐私、DNS／软件源表单、接口详情及导航 |
| `optimization-1/business-widgets` | 19 | 六个原业务组件、页签、原动作和异常分支；磁盘管理入口及向导 |
| `optimization-1/boundary-interaction` | 10 | 上下／左右／整行空间、撤销、恢复自动、取消及响应式 |
| `optimization-1/resources` | 3 | 20次形态／总览切换、共享读取、后台恢复和实际卸载清理 |

每套目录保留report.json与attempt记录；当前报告无页面／控制台错误及外部请求。64个受保护原业务源码未变，见`optimization-1/source/report.json`。`npm run tsc`与`git diff --check`通过。

初次自检并行运行时，新增脚本及六业务脚本在8秒图表初始化等待处超时，截图随后出现图表，尚未执行到按钮断言；原报告保留在`initial/`。自检同时发现紧凑系统卡残留独立边框，优化1移除该声明。新增脚本使用20秒初始化等待并在类型检查结束后重跑，当前所有检查通过；没有把初次截图视为通过或覆盖失败报告。

## 当前公开候选与审图

入口：[六业务卡](http://192.168.9.19:5180/?layout=ordered&preset=services&scenario=business-all)。服务PID6925，0.0.0.0:5180。3个公开JS/CSS与SSD输出一致，76个运行源码及验证脚本指纹见[candidate.json](candidate/candidate.json)。入口JS为`/assets/index.b5c47c42.js`，SHA256 `cdd8b3cbd0cc81f34ef93d800b037a345456c620f5d71d9f380edaa5f7d4cc54`。

已实际查看[按钮局部](../../../../evidence/m66/widget-action-group/optimization-1/widget-actions/disk-actions.png)和[磁盘卡](../../../../evidence/m66/widget-action-group/optimization-1/widget-actions/disk-card.png)：文件管理与更多共用连续外框，只有中间分隔线。手机截图见[触屏卡片](../../../../evidence/m66/widget-action-group/optimization-1/widget-actions/disk-touch.png)。本轮是针对用户截图结构的修正，不宣称全套控件美化或用户视觉确认已经完成。

# 首页11个控件：公共视觉统一与数量尾注清理

2026-10-17。用户要求移除磁盘卡底部“显示3／4块磁盘 · RAID 0”，并让其他所有控件采用同一标准。当前结果：**隔离原型技术自检通过，用户视觉体验待确认**。

## 目标与任务完成情况

| 任务 | 实现与验收 |
|---|---|
| 去掉额外尾注 | 磁盘及SAMBA的常规“展示数量／总量”栏移除；有界首页投影仍为磁盘合计3项、SAMBA2项，标题菜单可打开原完整清单；真实隐藏异常、局部失败与权限信息保留 |
| 全部控件统一 | traffic、connection、networkInterface、applications、devices、system、storage、sharing、docker、downloads、remote共用外框、圆角、内边距、标题字阶、20px图标和标题操作规则 |
| 保持形态／布局 | 普通与摘要密度分别消费公共令牌，手机共用6px圆角／10px边距；有序行、上下空间、移动／替换、恢复自动与撤销仍使用既有模型 |
| 标题操作补齐 | 应用与工具采用“全部／更多”分段外观，更多直接复用原管理常用动作；原测速入口采用同一套单操作按钮外观。未添加无意义的更多占位 |
| 保持业务和资源 | 原磁盘／服务／系统／网络字段、动作、状态和API不重写；无新增轮询、统计历史或业务实例；正式首页和系统菜单未修改 |

公共视觉落点：`web/src/design/homeWidgetChrome.css`、`widgetActionGroup.css`；形态解析继续使用`widgetPresentation.ts`。原Card通过已有NativeBusinessSurface Adapter接入公共样式，不重复包两层卡片。正式业务结构迁移与各控件内部美化继续独立推进，本轮不宣称全部正式组件重构完成。

## 当前验证

当前10套检查合计**152组通过**，每套报告均位于`initial/<目录>/report.json`：

| 报告目录／脚本 | 组数 | 内容 |
|---|---:|---|
| standard／home-widget-standard | 13 | 实际添加接口卡后覆盖全部11个控件；五种屏幕宽度的令牌、字阶、图标；磁盘／SAMBA尾注移除与完整清单；真实异常保留；应用与测速动作 |
| headers／home-widget-header | 14 | 11控件在中英文／深浅主题及六宽度下标题、图例、操作不重叠；全部支持的摘要与启动条；手机适配 |
| actions／widget-actions | 9 | 连体外框、独立点击与键盘焦点、触摸44px、摘要单菜单 |
| business／business-widgets | 19 | 原六业务组件、页签、字段、安装检查、异常、详情及导航 |
| forms／business-actions | 13 | 原NAS／磁盘／Docker／域名表单与模拟提交、错误和清理 |
| layout／boundary-interaction | 10 | 尺寸、内容最低需求、撤销、恢复自动、取消和响应式 |
| network／network-interaction | 14 | 原连接、隐私、DNS／软件源、接口详情与业务语义 |
| resources／structure-resource | 3 | 20次形态／总览切换、有界请求、后台和实际卸载清理 |
| states／structure-matrix | 39 | 宽度／语言／主题、加载／空／失败／旧后端／缺服务、信息边界 |
| chart／home-widget-chart | 18 | 普通与上下组合在三种语言／主题组合、六次宽度变化中保留真实有色曲线像素、绘图区高度及布局意图 |

64个受保护原业务源码未变，见`initial/source/report.json`。`npm run tsc`和差异空白检查通过。当前浏览器报告没有页面／控制台错误或外部请求；包与真实设备不属于本轮验收。

卡片、业务及布局检查没有触发运行源码优化。追加曲线保护检查时，测试脚本先修正括号，再将基线判断从视窗宽度改为实际首页内容宽度（768px视窗仍可能因系统菜单预留而拆行），并排除画布纯色背景像素；失败记录`initial/chart/attempt-1.json`保留，最终attempt-2通过。不把测试脚本错误描述成已修复的产品故障，也不覆盖失败证据。

## 实际审图与候选

已查看：[无尾注的磁盘卡](../../../../evidence/m66/widget-standard/initial/standard/disk-without-footer.png)、[统一首页顶部](../../../../evidence/m66/widget-standard/initial/standard/all-widgets-top.png)、[手机暗色英文曲线实际绘制](../../../../evidence/m66/widget-standard/initial/chart/mobile-chart-painted.png)。早先快速缩屏截图曾出现空白画布，追加检查用1300ms稳定等待及实际蓝／紫系列像素排除背景，18组通过；此处不据空白截图推断新的引擎或接口故障。

入口：[六业务卡](http://192.168.9.19:5180/?layout=ordered&preset=services&scenario=business-all)。接口卡可在自定义首页添加，完整11项已由当前自动化实际添加并验证；默认展示项目不被本轮样式工作重排。

服务PID17622，0.0.0.0:5180。公开3个JS/CSS与SSD构建产物一致，77个运行源码及验证脚本指纹见[candidate.json](candidate/candidate.json)。入口JS为`/assets/index.0a8f8b8c.js`，SHA256 `bebfe003b7e3dd2fe1ccbf32d38a1e5e6e4d137c2622d29e9916b1bbad35f029`。原型使用合成数据和内存布局；未提交／推送本轮代码，未部署设备、构建安装包或执行长期观察。

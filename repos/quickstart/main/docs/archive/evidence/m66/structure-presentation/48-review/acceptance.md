# M66.48 当前构建验收

2026-10-16。本阶段在第3次优化后通过。**当前最终证据统一使用`optimization-3/`**；根目录、`final/`和`optimization-2/`是本轮中间候选，保留原记录，不代表当前资源。当前候选PID22387，入口`index.8754558a.js`，SHA256 `3e9aaa786cfa4b9107f4f8699a1c8b786845e7425ac7d567c85c9001a6088b98`，三份公开JS/CSS与SSD构建一致，72个运行源有指纹，见[清单](optimization-3/candidate/candidate.json)。

## 最终结果

独立设计构建通过；`rtk proxy /var/cache/build-cache/run.sh -- npm --prefix web run tsc` exit 0；`rtk proxy git diff --check` exit 0。构建输出为`/var/cache/build-cache/users/911/projects/quickstart-df92025bd880/work/vue-preview`，不是正式web/dist。以下192组均在本轮当前构建／源码通过。

| 检查 | 组数 | 报告 |
|---|---:|---|
| 规范1.4、操作表、版本兼容和内容边界 | 4 | [spec](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/spec/report.json) |
| 形态级适配、v1/v2/v3、旧auto差异、过期计划、移动替换 | 7 | [contract](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/contract/report.json) |
| 混合／镜像／上下反转、实际图表填满、原端口详情、普通与旧图表 | 7 | [render](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/render/report.json) |
| 移动替换、点击／键盘／鼠标、总览、一次适配确认、撤销取消 | 8 | [interaction](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/interaction/report.json) |
| 旧组主动采用新连接／接口、绘图区适配、精确撤销 | 3 | [compatibility](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/compatibility/report.json) |
| 混合组合24基准、12状态、临界点、采样稳定及总览 | 39 | [mixed-matrix](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/mixed-matrix/report.json) |
| 其他组件24基准、系统阈值、有限内容与原指标口径 | 37 | [all-widgets-matrix](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/all-widgets-matrix/report.json) |
| 6宽×2语言总览，标题／形态／菜单无重叠 | 12 | [overview](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/overview/report.json) |
| 4宽×2语言明确紧凑端口，状态／速率不被遮挡 | 8 | [port-fit](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/port-fit/report.json) |
| 六个原业务组件、字段、页签、状态、向导及异常 | 19 | [business](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/business/report.json) |
| 原表单精确提交字段、包检查、磁盘双确认及拒绝反馈 | 13 | [actions](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/actions/report.json) |
| 原网络状态、独立隐私租约、DNS／软件源动作及接口清单 | 14 | [network](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/network/report.json) |
| 320／390px中英真实触摸、焦点陷阱、独立添加接口 | 6 | [touch](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/touch/report.json) |
| 鼠标／键盘／原生触摸整行排序，取消中断及20次排序撤销 | 9 | [row-sort](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/row-sort/report.json) |
| 全服务页20次切换、后台、实际卸载与原表单浮层清理 | 3 | [resources](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/resources/report.json) |
| 混合组合20次切换、画布实例保留、有界读者及卸载 | 3 | [mixed-resources](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/mixed-resources/report.json) |

另有[64个原业务源文件哈希保护](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/source/report.json)通过；浏览器报告均无console error、pageerror或外部请求。没有真实路由器或安装验收。

## 优化与失败保留

1. 补充兼容用例发现：旧组主动采用新完整连接后，图表仍固定320px。修正为组合成员明确采用新规则或明确标准连接移入后派生伸展，不改写图表偏好；撤销恢复旧外观。[初始失败](../../../../../evidence/m66/structure-presentation/48-review/compatibility/attempt-1.json)。
2. 审图发现320px总览长名称与新形态标签挤成逐字竖排。首次分开标题和标签后，专项测试仍发现菜单重叠、窄列标题过长，结果为未达成。[失败报告](../../../../../evidence/m66/structure-presentation/48-review/optimization-2/overview/report.json)。
3. 最终总览采用独立缩略轨道（普通104px、上下216px）和标题／形态／44px操作分区，不沿用真实卡片伸展比例；12组通过。对照`git show HEAD:web/src/design/widgetPresentation.ts`另确认v1系统auto普通槽始终standard，与v2的560px规则不同；先[复现失败](../../../../../evidence/m66/structure-presentation/48-review/legacy-v1-initial/report.json)，再以推荐版本0/1分别保留，当前7组契约通过。没有放宽原业务断言。

## 视觉与测量

已查看本轮[最终桌面明色](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/mixed-matrix/mixed-1440-light-zh-cn.png)、[暗色](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/mixed-matrix/mixed-1440-dark-zh-cn.png)、[320px英文](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/mixed-matrix/mixed-320-light-en.png)、[中文总览](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/overview/overview-zh-cn.png)、[英文总览](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/overview/overview-en.png)及[明确紧凑端口](../../../../../evidence/m66/structure-presentation/48-review/optimization-3/port-fit/compact-en.png)。完整连接、紧凑端口和曲线主视觉保留；总览名称不再逐字竖排，菜单可达。

1440px首个组合当前测量：连接约295px、端口约163px，加18px间距总高约476px；左右外框误差≤1px，真实画布随绘图区伸展。窄列可将端口重新排成纵向有限列表，窄屏按列内顺序拆行。明确紧凑不变，auto可按普通位置展开；这些结果都不写回偏好或历史。只证明实测形态／组合范围，不开放任意递归布局或所有完整形态堆叠。

旧rows/v1/v2迁移保留展示意图及auto推荐规则，不宣称恢复历史固定行高的逐像素截图。v1系统普通auto完整、v2窄槽auto紧凑均有独立检查。原内存零值等已知口径问题、原翻译不完整、DDNSTO合成认证等沿用前轮业务基线，不假称本轮已修复。人工美感／易用性仍待本轮用户体验；24小时观察延期。

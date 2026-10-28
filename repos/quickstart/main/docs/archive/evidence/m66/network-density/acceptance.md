# 网络连接与网络接口紧凑排版验收

状态：首轮自检通过，0次产品优化重试；人工最终审美待用户确认。属于隔离Vue原型，未提交、未推送，未操作真实路由器或构建安装包。此前验收不能替代本次结果。

## 范围及结果

[任务树与可测试目标](../../../product/quickstart-home-network-density.md)的1～5项已完成：采集当前基线；连接改成IPv4/IPv6/DNS横向信息行，去掉重复“已启用”描边标签，眼睛按钮继续控制隐私；当前紧凑接口名称/状态在上、逻辑接口/速率在下。原状态、接口时长、协议、DNS来源、异常、修复、完整详情及全部目标保留。

同为1440px视口、约463px卡宽、浅色中文正常场景：

| 控件 | 本次修改前 | 当前候选 | 结果 |
|---|---:|---:|---|
| 网络连接 | 333.98px | 238px | 目标220～240px通过，约减少29% |
| 紧凑网络接口 | 161.19px | 136px | 目标135～145px通过，约减少16% |
| 第一行整体（含18px间距） | 513.17px | 392px | 原有自然等高/图表拉伸规则派生，未改图表代码 |

390px手机视口的连接卡305→220px。手机默认将接口解析为完整形态，仍保留原端口总数、链路说明及完整字段，高约231px；没有为满足桌面紧凑形态尺寸而删掉这些信息。长IPv6、多DNS、异常及真实触屏允许按内容增高，不强制上述目标高度。

## 当前候选验证

- [新增44组](../../../../evidence/m66/network-density/initial/report.json)：87份当前运行源基线保护；6宽度×深浅主题×中英24种正常呈现；2宽度×8种异常/无地址/多数据/接口局部失败16种边界；3种宽度完整长IPv6与键盘显隐。截图不改写布局偏好，页面/卡片无横向溢出或内部滚动。
- [真实触屏6组](../../../../evidence/m66/network-density/initial/touch/report.json)：1440/390/320px×中英，IPv4/IPv6分别点击显隐，眼睛区域至少44×44px，两个端口仍能点击进入原详情。
- [原业务交互14组](../../../../evidence/m66/network-density/initial/regression/network-interaction-review/report.json)：各状态、独立60秒隐私、详情关闭隐藏/焦点、原DNS与软件源表单及拒绝写入、原导航、128端口/48DNS分页、形态与编辑保护。
- [上下空间交互10组](../../../../evidence/m66/network-density/initial/regression/boundary-interaction-review/report.json)：内容最小高度、行增长/上下分配、拖动/键盘、撤销/重置、Escape/中断、手机拆排及取消。
- [标题14组](../../../../evidence/m66/network-density/initial/regression/home-widget-header-review/report.json)、[主按钮/菜单/键盘/触屏6组](../../../../evidence/m66/network-density/initial/regression/header-action-interaction-review/report.json)、[长地址与磁盘保护6组](../../../../evidence/m66/network-density/initial/regression/widget-body-network-disk-review/report.json)。

合计100组当前浏览器检查通过，控制台/页面错误与外部业务请求均为空。另[12份正式原业务源码逐文件保护](../../../../evidence/m66/network-density/initial/source-guard/report.json)通过。未重跑未变化的完整后端/安装矩阵。

相对本次[87份源基线](before/sources.json)，仅`NetworkConnectionCard.vue`模板、`homeWidgetDetails.css`、`naturalHome.css`、`rowLayout.ts`、`widgetPresentation.ts`五份变化；其余82份及全部已存在Vue业务脚本逐字一致。连接最小220px/单卡参考240px、当前紧凑接口136px与新构图对齐，旧版摘要尺寸保持；自然测量/尺寸分配/文档/历史代码和用户保存值未改。

基线采集首条临时内联脚本有括号语法错误，未运行页面或改业务；已改为可重复的`network-density-review.cjs`并成功采集。不计作产品优化轮次，未丢弃产品失败结果。

## 截图及交付

已实际打开以下原始截图检查，而非只检查HTTP或生成截图：

- 修改前：[桌面连接](../../../../evidence/m66/network-density/before/1440-light-zh-cn-connection.png)、[桌面接口](../../../../evidence/m66/network-density/before/1440-light-zh-cn-networkInterface.png)。
- 当前：[桌面连接](../../../../evidence/m66/network-density/initial/1440-light-zh-cn-connection.png)、[桌面接口](../../../../evidence/m66/network-density/initial/1440-light-zh-cn-networkInterface.png)、[深色网络行](../../../../evidence/m66/network-density/initial/1440-dark-zh-cn-network-row.png)、[完整首页](../../../../evidence/m66/network-density/initial/1440-light-zh-cn-home.png)。
- 边界：[390px连接](../../../../evidence/m66/network-density/initial/390-light-zh-cn-connection.png)、[320px连接](../../../../evidence/m66/network-density/initial/320-light-zh-cn-connection.png)、[320px完整长IPv6](../../../../evidence/m66/network-density/initial/320-long-address.png)、[320px英文真实触屏](../../../../evidence/m66/network-density/initial/touch/320-en-connection.png)。

视觉检查：三个信息行的名称/值对齐，协议与DNS来源弱化但可见；正常图标与地址无需独占一层，端口卡保持完整两层；长地址换行完整可读，触屏按钮有足够区域，英文标题自然换行。审美确认由用户另行完成。

[资源及源指纹](initial/candidate/candidate.json)：本项目服务PID21126，3份实际公开JS/CSS与SSD构建结果一致，入口`/assets/index.d975b8ba.js`，入口SHA256为`b090b4961694255f069685a63d941589b0c576c09e4bec1c2042b947127240fe`。工作区候选，不是已提交发布版本。

[查看当前原型](http://192.168.9.19:5180/?layout=ordered&scenario=business-all)。刷新会恢复示例，仍为合成数据与内存偏好。

# 淡雅底面与业务点彩验收

2026-10-20，起点`afb4af1`，第二份产品候选通过。只调整隔离设计配色、对应浏览器检查与文档。当前自有5180服务PID27403，使用本目录脚本stop/start重建于SSD，测试期间未重建。未操作B或其他路由器，没有正式首页/后端源码变更。

## 参考与结果

实际打开用户两张截图，对照历史`da46bfa`中下载、存储、域名、流量及网络连接五份源码，[取色来源](old-colour-sources.json)。参考的是业务颜色的分工：大部分淡雅，少量名称、重要文字和图标有色；没有照搬旧版结构、旧标题和选中粗框。

默认`vivid`恢复中性浅灰画布、白卡片、浅/中性操作和彩色线条工具图标。下载名称/图标恢复橙、灰蓝、青绿；存储恢复蓝、绿、紫；域名采用蓝、绿、灰蓝；部分系统资料随原图标着色。连接成功文字为绿，其他状态按原分支，接口在线时长保持中性及解释。所有布局、字号、间距、表单、状态来源、图表阈值保持。

当前规则写入[唯一色彩方案](../../../../product/quickstart-home-color-study.md)，并由设计README和外观规范引用。推荐方向覆盖前轮以浓底为主的建议；`bold`仍可作浓底方向比较，`classic`保留原设计对照，URL均不进入用户配置。

## 当前候选证据

- [60视图和交互](../../../../../evidence/m70/design-color/semantic-accents/round-2/visual/report.json)：三配色×中英×深浅×1440/1024/768/390/320，11控件尺寸/布局文档与原设计一致，系统菜单样式一致，无横向溢出和页面异常/外部请求。正文、辅助、状态、操作、工具图标、服务名称/图标/状态（含悬停）、系统资料及浓底对照渐变端点对比度均≥4.5。配色切换、应用搜索、菜单Escape、总览取消、实际摘要更多及根地址默认均通过。
- [业务身份与状态专项](round-2/semantics.json)：10组连接状态视图（正常/DNS错误/断网/未知/读取失败×深浅）仅正常分支文字为绿，时长保持中性并解释其意义；18个服务选项实际悬停检查名称/图标同色、对比度≥4.5、状态仍为中性辅助色；选中变化不改身份色，下载未启用不伪装运行；两主题键盘焦点可见。
- [当前资源](round-2/resources.json)：自有owner/PID27403，HTML入口和异步JS/CSS三份公开资源逐字节匹配SSD，源码/测试与资产SHA256记录。正式业务前端与后端源码差异为空。
- 实际打开当前桌面浅/深完整截图、320英文浅/深顶部截图，以及下载未启用和网络连接截图检查：卡片与按钮退回淡雅层级，名称与线条图标有色，顶部装饰线未恢复。

截图：[桌面](../../../../../evidence/m70/design-color/semantic-accents/round-2/visual/vivid-zh-cn-light-1440.png)、[深色](../../../../../evidence/m70/design-color/semantic-accents/round-2/visual/vivid-zh-cn-dark-1440.png)、[320浅色](../../../../../evidence/m70/design-color/semantic-accents/round-2/visual/vivid-en-light-320-top.png)、[320深色](../../../../../evidence/m70/design-color/semantic-accents/round-2/visual/vivid-en-dark-320-top.png)、[未启用服务](../../../../../evidence/m70/design-color/semantic-accents/round-2/stopped-downloads-light.png)。浏览器检查通过SSD入口运行`home-color-review.cjs`，状态专项使用同一Playwright环境读取真实computed style/状态/焦点并实际hover、选择；原始报告留存。CSS改动没有无关类型或后端构建。

## 迭代与边界

首候选[60常规视图](../../../../../evidence/m70/design-color/semantic-accents/round-1/visual/report.json)、[28组网络/标题回归](round-1/regression/suite-results.json)、[恢复专项](../../../../../evidence/m70/design-color/semantic-accents/round-1/recovery/report.json)通过，恢复示例200→200；这些属于首候选，不替代当前候选结果。追加[悬停检查](round-1/hover-review.json)发现绿/青绿4.394/4.442，第二候选只调深同色相文字/图标，并在完整矩阵及实际悬停专项重验通过。

首轮专项将中性qBittorrent标题与中性未启用说明要求为不同颜色，检查过度约束，[失败保留](../../../../../evidence/m70/design-color/semantic-accents/round-1/semantics-initial-failure.txt)；调整为检查状态确为中性辅助色、身份与图标一致且不随选中变化后通过。没有为了检查通过而改业务或混淆状态。

本轮是5180新配色候选，不代表用户审美确认、正式主题上线或当前设备业务通过。

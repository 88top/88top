# 首页右上角主按钮统一四字

状态：通过。用户要求右上角按钮名称也尽量统一四字。现有中文主操作为：

| 控件 | 主按钮 |
|---|---|
| 网络流量 | 网络测速 |
| 网络连接 | 设备管理 |
| 网络接口 | 接口配置 |
| 设备列表 | 查看全部 |
| 应用工具 | 查看全部 |
| 磁盘信息 | 文件管理 |
| 存储服务 | 存储配置 |
| Docker | 数据迁移 |
| 下载服务 | 下载管理 |
| 远程域名 | 域名配置 |
| 系统信息 | 信息概览 |

仅缩短/补全中文主按钮名称，保留前置图标、更多分段、原回调及目标。Docker仍打开原迁移向导，存储仍打开原NAS配置；应用查看全部仍包括工具、应用、链接，溢出数量提示保持。原本只有更多的摘要不新增主按钮，更多图标和菜单项不强制四字。原业务SFC未写入，两处原卡文案仅由设计构建改写；其他三处使用当前设计组件的原模板。

## 当前候选验证

- [11控件名称及原向导3组](../../../../evidence/m66/widget-action-labels/optimization-1/report.json)：1440/390px检查全部已有主按钮四字；Docker/存储改名后仍打开原向导。
- [当前标题/操作、动作及原图表38组](optimization-1/regression/suite-results.json)：六宽度、中英/主题、标准/紧凑及应用启动条，标题/图例/按钮无重叠；键盘、触摸、原目标、图表绘制与资源保持。
- 已实际打开[桌面流量](../../../../evidence/m66/widget-action-labels/optimization-1/1440-traffic.png)、[手机流量](../../../../evidence/m66/widget-action-labels/optimization-1/390-traffic.png)、[手机Docker](../../../../evidence/m66/widget-action-labels/optimization-1/390-docker.png)、[手机存储](../../../../evidence/m66/widget-action-labels/optimization-1/390-sharing.png)审查；桌面/手机整页见同目录`1440-home.png`与`390-home.png`。原字号和分段样式保持。
- [当前源码/检查/公开资源指纹](optimization-1/candidate/candidate.json)：本项目PID30532，入口`index.9a6f0d31.js`，实际三份资源与SSD产物一致。差异空白检查通过。

首轮标题检查发现“网络测速”比“测速”宽，旧90px固定预留导致与图例重叠，见[失败报告](../../../../evidence/m66/widget-action-labels/regression/home-widget-header-review/report.json)。优化1将预留按四字正文宽度加图标/内边距/间隙计算，仍允许窄屏自然换行，不修改图表/采样或布局规则；当前14组标题与18组原图表检查通过。初次名称探针误假设所有原卡都含span，远程按钮为直接文本导致探针超时；修正读取选择器后检查全部实际按钮，未因此修改产品。

当前入口：[5180全部服务示例](http://192.168.9.19:5180/?layout=ordered&scenario=business-all)。名称基线为[唯一外观规范VS12](../../../product/quickstart-home-widget-visual-standard.md)。仍为合成数据/内存偏好的隔离Vue原型，本轮未提交或推送。前轮标题16组、内部构图28套291组及41组属于历史候选，不替代本次41组当前检查。

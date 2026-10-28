# 首页其他控件字体统一

2026-10-16。依据用户“按照原字体，继续修改其他组件的字体，都统一字体大小”实施。

任务树、原版依据和可测试标准见[共享字体规范](../../../product/quickstart-home-typography.md)。本轮只调整隔离原型的字体和必要间距；保留既有未提交工作，不改正式业务、菜单、路由器或软件包。

初检：320／1440两宽度、三列服务与独立接口两示例覆盖11组件，原字体栈、12px下限及卡片边界通过；应用标题仍被旧!important规则固定为13px。TS检查通过。

优化1：明确覆盖应用标题的旧高优先级规则，补齐接口数量单位的共同12px字阶。初检证据保留在[initial/report.json](../../../../evidence/m66/home-typography/initial/report.json)，完整检查在新构建后进行，不沿用上一轮网络卡验收。

优化1完整检查：11模块字体检查及大部分边界通过；320px英文下，缺流量服务的设备卡溢出40px、大量磁盘提示溢出20px。24个产品面板检查发现部分详情按钮／说明／分页／原型配置提示仍为10～11px。应用6组、设备5组、网络14组交互通过，12个受保护业务源文件保持原样。

优化2：仅在窄屏有能力提示时压缩设备卡的空隙与计数行高，底部两个入口并列换行，保留两条设备和完整文案；磁盘卡减少区块间距以容纳容量换行及完整清单提示。补齐详情／分页／配置提示的12px字体，表单正文使用共同字阶。失败记录见[full/report.json](../../../../evidence/m66/home-typography/full/report.json)、[dialog-initial/report.json](../../../../evidence/m66/home-typography/dialog-initial/report.json)，不删除、不伪报通过。

优化2复验：70组完整字体／边界场景及24个产品面板通过；两处窄屏卡片的真实子块坐标和截图见[fixed-geometry.json](fixed-geometry.json)。网络14组、设备5组、输入6组当前检查通过。补查已声明的260px标准最小高度，连接卡在300／382／520px三宽下仍溢出6～7px；独立接口卡三宽均通过，原菜单HTML与计算字体保持一致。

优化3：只对短连接卡收紧地址组间距、地址上间距与详情入口上间距，维持字体大小、内容、用户行高和尺寸声明。最终候选需在此变更后验证及重新记录资源；不得把优化2清单标成优化3。

## 当前预览与验收

[当前首页](http://192.168.9.19:5180/?layout=ordered) · [三列服务](http://192.168.9.19:5180/?layout=ordered&preset=services) · [独立网络接口](http://192.168.9.19:5180/?layout=ordered&preset=network-business)。当前PID28989，绑定0.0.0.0:5180；入口`index.32a5b569.js`，SHA256 `0a6fb7c89a24685e1ffcb4d761f1045e53b12634464adff1c6ed694e862ef745`。三份公开资源与SSD构建产物一致，59个运行源文件、58个验证脚本指纹见[当前候选清单](candidate-final/candidate.json)。

| 检查 | 候选及结果 |
|---|---|
| 11模块，5宽度×2语言×2主题×2示例，24状态边界、上下组合、应用多行／启动条 | 优化3当前候选：[70场景／3组检查通过](../../../../evidence/m66/home-typography/complete-final/report.json)，problems为空、浏览器错误及外部请求为0 |
| 原菜单HTML与计算字体、连接／接口各三宽的260px标准最小尺寸 | 优化3当前候选：[2组通过](../../../../evidence/m66/home-typography/minimum-final/report.json) |
| 网络状态、IPv4／IPv6隐私、异常表单、详情、摘要及撤销 | 优化3当前候选：[14组通过](../../../../evidence/m66/home-typography/network-current/report.json) |
| 手机触控模拟、键盘焦点、详情往返、原滚动锁恢复 | 优化3当前候选：[6组通过](../../../../evidence/m66/home-typography/input-current/report.json) |
| 24应用／连接／端口／分页／原配置面板的字体与边界 | 优化2：[24面板通过](../../../../evidence/m66/home-typography/dialog-final/report.json)，优化3不改面板规则 |
| 应用2／3行、同排等高、容量、取消／撤销、清单失败 | 优化1：[6组通过](../../../../evidence/m66/home-typography/apps/report.json)，后续不改应用规则；最终完整检查再次覆盖2／3行和启动条 |
| 设备标准／摘要、稳定身份导航、宽窄往返、9类状态及权限 | 优化2：[5组通过](../../../../evidence/m66/home-typography/devices-final/report.json)，优化3不改设备规则 |
| 原业务源码保护 | 优化2：[12个源文件原样](../../../../evidence/m66/home-typography/source-guard-final/report.json)，后续仅追加原型CSS及检查脚本；`git diff -- web/src/pages/index`为空 |
| TS／构建 | 初次`npm --prefix web run tsc`通过；后续仅CSS及检查脚本变动；当前隔离Vue预览构建通过 |

本轮是字体与必要间距的原型调整，业务信息、设备身份、权限、导航、请求周期和布局事务保持原逻辑；没有新增存储、后台采样或实机写入。正式源码、左侧系统菜单、安装包和真实路由器未变更。本次没有提交、推送或发布，保留之前的工作区改动。

技术检查与人工美观确认分开记录，不把本轮自动检查写成用户已认可视觉效果，也不替代真实设备及安装验收。

结论：三次优化后，本轮字体统一、布局边界与相关交互技术检查通过。共享规则已写入产品文档，当前预览可供人工查看；人工美观确认待用户反馈。

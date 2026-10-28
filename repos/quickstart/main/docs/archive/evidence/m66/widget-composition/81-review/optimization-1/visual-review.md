# 当前候选实际审图记录

审查者：本轮实施助手。方法：通过Playwright生成真实浏览器逐卡、整行、整页原图，再使用图片查看工具实际打开七张桌面浅色对照、七张手机深色对照、当前浅色整页、浅/深色三列服务整行、系统完整手机/长字段及触屏告警原图。不用像素变化或自动化组数证明美感；以下为开发者自检，用户最终审美确认仍待完成。

对照来自同一 `business-all` 合成场景、视口、主题、语言、服务选择及默认隐私。系统时间/接口时长存在秒级动态差异；它们不是内容删改。图表保持原算法/单位/颜色/绘制，截图等待原动画，不绘制替代图像。对照导出用HTML并列显示原图，按原始宽度展示，裁去输出画布空白；原图另存且未编辑。

| 控件 | 实际看到的变化与判断 | 保持/代价 |
|---|---|---|
| 网络连接 | **改善**：两组地址轻分隔，控制更易对应；DNS层级更清楚。见[桌面](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/1440-light-connection.png)/[手机](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/390-dark-connection.png) | 字段/字号/控制保持；自然高度301.98→333.98px，不以越矮越好评判 |
| 磁盘 | **改善**：名称与操作同排，进度及用量全宽，左侧不再因分组缩进挤占正文。见[桌面](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/1440-light-storage.png)/[手机](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/390-dark-storage.png) | 首页3项、原分组/容量/异常动作保持；自然高度402→411px |
| 存储 | **改善**：宽卡选择区从高块变为紧凑选项，服务地址成为完整信息块；窄共享逐项地址→目录，不再细长两列。见[桌面](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/1440-light-sharing.png)/[手机](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/390-dark-sharing.png) | 选中/已配置/启用语义保持；与磁盘同排等高，余下留白不补虚假内容 |
| Docker | **改善**：状态/开关成组，根目录独立；少量内容有明确主次。见[桌面](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/1440-light-docker.png)/[手机](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/390-dark-docker.png) | 留白仍存在；同排从380.48→433.30px由下载真实内容高度决定，未增加填空统计 |
| 下载 | **改善**：目录/Web入口获得全宽，认证紧邻入口；选择块变轻，阅读顺序连续。见[桌面](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/1440-light-downloads.png)/[手机](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/390-dark-downloads.png) | 信息更纵向，故同排自然增高；原服务/凭据/链接/帮助保持 |
| 远程 | **改善**：选择块变轻，域名与对应控制台集中且能换行。见[桌面](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/1440-light-remote.png)/[手机](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/390-dark-remote.png) | 未擅自删重复状态或合并不同服务含义；域名仍原目标，留白保持 |
| 系统 | **改善**：三指标集中、资料形成独立区，宽卡重心更稳定。见[桌面](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/1440-light-system.png)/[手机](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/390-dark-system.png) | 完整宽卡418→290px来自重排，未删字段；手机默认紧凑保持，显式完整仍三图可自然增高 |

整排/整页复核：[浅色三列](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/widget-composition-review/1440-light-service-row.png)、[深色三列](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/widget-composition-review/1440-dark-service-row.png)、[当前浅色首页](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/widget-composition-review/1440-light-home.png)、[手机深色首页](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/widget-composition-review/390-dark-home.png)。共同标题/操作/字号未漂移，没有把所有业务强行排成同一种表单。Docker和远程比下载空，原因是原业务信息量不同，此留白是设计选择，不以新统计填补。

长字段复核：[320px SAMBA](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/widget-composition-long-review/320-sharing-long.png)、[宽卡长型号](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/widget-composition-long-review/1440-system-long.png)、[长域名](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/widget-composition-long-review/320-remote-long.png)、[手机完整系统](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/widget-composition-review/390-dark-system-full.png)可读；异常复核：[修正后的触屏告警](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/widget-composition-access-review/320-touch-disk-warning.png)完整显示。初次触屏越界见[保留的失败原图](../../../../../../evidence/m66/widget-composition/81-review/access-initial/320-touch-disk-warning.png)，优化1只改对应气泡锚点。M66.78窄SAMBA初次视觉失败亦保留在该阶段，未用无溢出断言掩盖细长双列。

结论：七控件针对本轮问题均有可见改善，字段、操作和主题可读性保持；开发者视觉复核通过，无未处理阻断项。该结论不代替用户对日常美感的最终确认，也不代表真实设备验收。

# 七控件正文精修：人工体验卡

技术结果以[当前验收](acceptance.md)为准；本卡用于用户判断美观、清晰与日常舒适度，不把自动化通过写成人工确认。

[默认首页](http://192.168.9.19:5180/?layout=ordered) · [全部服务示例](http://192.168.9.19:5180/?layout=ordered&scenario=business-all) · [磁盘条件示例](http://192.168.9.19:5180/?layout=ordered&scenario=business-disks) · [缺失服务](http://192.168.9.19:5180/?layout=ordered&scenario=business-missing)。顶部设计预览仍管理场景/主题/布局，不增加新工具栏。刷新会恢复合成数据与会话内存偏好，不是实际路由器状态。

## 建议体验顺序

1. 桌面打开全部服务示例，先看磁盘/存储双列，再看Docker/下载/远程三列。确认同类标签、数据起点、分组留白与服务选项整齐；Docker下方空白保留，不用虚构信息填满。
2. 存储切到SAMBA，比较表头与地址/目录两列；目录仍能点击，SAMBA地址保持只读。切到易有云/WebDAV查看原状态与URL；未配置易有云仍进入原配置向导。
3. Docker根目录应像只读数据，区别于可编辑输入框。开关仍控制合成服务状态，迁移入口与原表单保留；不影响任何真实服务。
4. 下载三个服务的状态、目录、Web入口保持。AriaNg自动配置与易有云远程下载帮助仍有链接反馈，没有被当作普通说明隐藏。
5. 远程页签选中与业务状态分别表达；域名完整换行，控制台入口仍在同一区域。点链接只打开目标预览，设计服务不访问外部站点。
6. 网络连接默认是短圆点遮罩。IPv4/IPv6可独立显示，仍有60秒恢复和详情关闭/后台隐藏。接口运行时长改为较弱中性色，含义不改成“互联网持续正常”。
7. 磁盘名称、进度、用量保持同一阅读轴；条件示例的更多→完整信息可查看未分区、未挂载、只读、SMART/RAID等原状态。标题主操作与更多仍为连体分段。
8. 系统完整形态的指标更醒目，CPU/内存仍为百分比、温度为℃，型号/固件/内核/时间/启动时长都在。手机自动摘要保持；在显示设置显式选完整时，等原圆环动画完成后比较三图。
9. 缩到平板、390/320px，确认必要地址/目录不被省略，控件自然拆行。实际触屏的操作区域增大，磁盘动作可排到数据下面；没有新增卡内滚动或固定行高设置。
10. 用键盘打开标题更多、Escape关闭及链接访问，检查焦点可见与恢复。布局编辑、移动/整行排序、上下分配、取消仍沿用已确认交互。

## 同数据前后对照

[修改前桌面整页](../../../../../evidence/m66/widget-body/70-baseline/1440-light-home.png) · [修改后桌面整页](../../../../../evidence/m66/widget-body/75-review/optimization-3/widget-body-matrix-review/1440-light-home.png) · [修改前手机深色](../../../../../evidence/m66/widget-body/70-baseline/390-dark-home.png) · [修改后手机深色](../../../../../evidence/m66/widget-body/75-review/optimization-3/widget-body-matrix-review/390-dark-home.png)。以上均为合成business-all数据；自然内容高度允许改变，默认布局文档逐项保持。

| 控件 | 修改前桌面 | 当前桌面 |
|---|---|---|
| 网络连接/IP | [原图](../../../../../evidence/m66/widget-body/70-baseline/1440-light-connection.png) | [当前](../../../../../evidence/m66/widget-body/75-review/optimization-3/widget-body-matrix-review/1440-light-connection.png) |
| 磁盘信息 | [原图](../../../../../evidence/m66/widget-body/70-baseline/1440-light-storage.png) | [当前](../../../../../evidence/m66/widget-body/75-review/optimization-3/widget-body-matrix-review/1440-light-storage.png) |
| 存储服务 | [原图](../../../../../evidence/m66/widget-body/70-baseline/1440-light-sharing.png) | [当前](../../../../../evidence/m66/widget-body/75-review/optimization-3/widget-body-matrix-review/1440-light-sharing.png) |
| Docker | [原图](../../../../../evidence/m66/widget-body/70-baseline/1440-light-docker.png) | [当前](../../../../../evidence/m66/widget-body/75-review/optimization-3/widget-body-matrix-review/1440-light-docker.png) |
| 下载服务 | [原图](../../../../../evidence/m66/widget-body/70-baseline/1440-light-downloads.png) | [当前](../../../../../evidence/m66/widget-body/75-review/optimization-3/widget-body-matrix-review/1440-light-downloads.png) |
| 远程域名 | [原图](../../../../../evidence/m66/widget-body/70-baseline/1440-light-remote.png) | [当前](../../../../../evidence/m66/widget-body/75-review/optimization-3/widget-body-matrix-review/1440-light-remote.png) |
| 系统信息 | [原图](../../../../../evidence/m66/widget-body/70-baseline/1440-light-system.png) | [当前](../../../../../evidence/m66/widget-body/75-review/optimization-3/widget-body-matrix-review/1440-light-system.png) |

希望用户重点判断：状态是否容易区分、信息是否有稳定阅读起点、留白是否舒服、七控件是否属于同一套产品。正式接入、真实API/ACL/设备/安装包及持久化不由本次预览证明。

补充样张：[当前SAMBA两列](../../../../../evidence/m66/widget-body/75-review/optimization-3/visual-audit/samba-final.png) · [手机完整系统三图](../../../../../evidence/m66/widget-body/75-review/optimization-3/widget-body-system-review/390-dark-system.png) · [Docker警告](../../../../../evidence/m66/widget-body/75-review/optimization-3/widget-body-warning-review/320-dark-docker-warning.png) · [多动作磁盘警告](../../../../../evidence/m66/widget-body/75-review/optimization-3/widget-body-warning-review/320-dark-disk-warning.png)。

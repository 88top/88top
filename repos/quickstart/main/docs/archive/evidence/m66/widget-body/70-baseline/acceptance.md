# M66.70 基线与正文契约

结果：通过，未修改运行外观。起点`ff901ba`；已有三份计划文档改动保留。当前5180归本项目所有，PID11810，三份公开资源与SSD构建产物一致，见[candidate](candidate/candidate.json)。

[当前浏览器检查](../../../../../evidence/m66/widget-body/70-baseline/report.json)通过5组：1440/390px×浅深主题的七控件真实DOM、字号、默认布局文档与截图，以及磁盘条件动作截图。[源码清单](sources.json)冻结整个web源码与构建/服务入口；后续仅允许正文适配CSS及连接卡隐藏遮罩模板变更，连接脚本逐字保护。64项原业务源码另作当前检查，不能由展示例外豁免。

## 源码与业务保护表

| 控件 | 当前入口/适配 | 保留字段、条件与动作 |
|---|---|---|
| 网络连接 | `web/src/design/NetworkConnectionCard.vue`、`networkBusiness.ts`、`useAddressPrivacy.ts` | 状态、接口时长、IPv4/IPv6、DNS；两族独立60秒显示，详情/后台/形态重置；DNS/软件源修复；标准/摘要。仅长星号遮罩可改短圆点 |
| 磁盘信息 | `pages/index/info/DiskInfo.vue`、`components/DiskItem.vue`、`nativePreviewScope.ts` | 原系统/非系统/RAID分组及组合名称、进度、使用率/用量；SMART、只读、未分区/未挂载、局部错误；格式化/挂载/详情、文件与高级入口；首页合计3项及隐藏异常说明 |
| 存储服务 | `pages/index/Storage/`四个Vue | 原三个页签、自动首个有效服务/手动选签优先；易有云enabel、SAMBA清单、WebDAV路径判定；地址/目录、服务URL、配置及帮助；SAMBA地址原本只读 |
| Docker | `pages/index/info/Docker.vue`、`info/status.vue` | 安装/运行/停止；开关提交禁用与失败恢复、运行时根目录/异常；迁移、条件高级入口；不开放注释的容器/镜像数 |
| 下载 | `pages/index/service/DownloadService.vue`、三个服务Vue | 三页签与原running口径；目录、Web、AriaNg认证地址、默认凭据与帮助；选签对应安装/向导；不新增任务/吞吐统计 |
| 远程 | `pages/index/service/RemoteDomain.vue` | DDNSTO、条件IPv4/IPv6；选项状态和正文状态都保留；Stopped/Disabled原处理；域名、安全href、控制台/DDNS/授权；自动与用户选签 |
| 系统 | `pages/index/info/SystemInfo.vue`、`components/PieChart.vue`、`design/SystemOverview.vue` | 原三图、CPU/温度/内存值及阈值、型号/固件/内核/时间/启动时长；摘要/完整/手动自动偏好与原概览入口 |

## 复现与测试边界

正常用`?layout=ordered&scenario=business-all`；条件盘用`business-disks`；空/缺服务用`business-empty`、`business-missing`、`business-stopped`；IPv6用`business-ipv6`；写失败用`business-write-error`；局部/服务/系统读取失败用`business-raid-error`、`storage-error`、`services-error`、`system-error`。网络及设备沿用`loading/empty/error/old/permission/no-speed`等现有场景。系统边界值用`system-zero/system-high/system-missing`。

长字符串、业务读取暂缓与选签后刷新由测试的Response/读取适配器注入，经过现有读取链路，不编辑DOM文字、不触达真实服务。它们是隔离浏览器fixture证据，不代表实机通过。

正文规则延续VS09：键值行有固定阅读起点、值可换行；同类选项基线差≤2px；辅助标签弱于值但正文对比≥4.5；状态由原业务判定；路径不模拟输入框；链接保留交互；保留自然高度，不做固定行高与卡内滚动。详见[实施计划](../../../../product/quickstart-home-widget-body-m66-70-75.md)。

构建/测试入口：`rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules QS_DESIGN_EVIDENCE_ROOT=... node docs/product/ui-design/<script>.cjs`。基线脚本为`widget-body-baseline.cjs`，资源记录为`slot-candidate.cjs`。源码与截图均为本轮实际读取，历史M66.69结论仅作对照。

人工审图：已实际查看1440px默认整页、存储服务、系统卡原图。现状主要问题为地址遮罩过长、服务字段50/50布局形成不一致缩进、只读路径边框像输入框、磁盘条件图标改变进度宽度、系统图心数值较弱；以上作为后续改动依据。

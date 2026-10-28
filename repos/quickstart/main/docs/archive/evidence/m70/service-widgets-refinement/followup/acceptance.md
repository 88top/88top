# 服务控件续修：通过并已更新B

2026-10-21。用户明确恢复此前三轮暂停。此次第二个续修候选通过；[目标、任务树与过程](status.md)全部完成。此前ba5a831的失败报告保留，当前结果覆盖“未部署/仍被旧CSS覆盖”的历史结论。

## 最终改动

服务正文CSS明确限定到已确认的home-semantic-colors作用域，同时适用于正式首页和teleport详情，优先于旧通用规则；没有增加新的!important、改变全局色板或业务计算。绿色运行状态、纵向服务选择项、最小76px与同排自然等高均按认可规则生效。

Docker轻量状态行和上标签下数值根目录、下载单次状态/完整目录及Web/认证和原账号提示/辅助入口、远程完整地址独占下一行与独立控制台/编辑入口均已正式接入。远程“有地址”显示已配置，未声称在线健康；下载未安装/未运行/未知状态保持区分。原开关、迁移/下载/域名配置、导航和数据owner不改。

本次续修还修正了带right类的下载标签漏过class后缀选择器的问题：使用三个显式业务标签类，320px英文“Authentication failed?”完整显示并自然换行，不再受旧50%列宽/nowrap裁剪。

## 验证结果

- 当前类型检查、135项前端测试、Web构建通过，使用SSD缓存包装器；产物实际位于项目web/dist。相对原B67b6546，压缩包只有index.js/style.css变化，其他资源字节一致，见[build](round-2/build.json)。
- 八个业务组件/状态解释文件与ba5a831完全一致；本次产品修改仅serviceWidgetBody.css，见[保护检查](round-2/business-protection.json)。ba5a831归档的原业务处理器也未因续修改变。
- 第二候选4组本地正式入口/24个首页与详情视图通过，含绿色精确值、12px标签/14px资料、无标签裁剪、纵向/min76px、悬停对比度≥4.5、手机tap及44px正文入口、菜单/Escape/滚动解锁，见[local](../../../../../evidence/m70/service-widgets-refinement/followup/round-2/local/report.json)。
- 第二候选10组业务状态场景通过：未运行、未安装、未知、未配置/Stopped/Disabled、超长路径/地址及原警告、延迟、503、403与重试、原操作、摘要到详情。Docker两次切换POST仅在本地浏览器拦截，三个原业务表单可打开/取消，不操作B服务；见[state-cases](../../../../../evidence/m70/service-widgets-refinement/followup/round-2/state-cases/report.json)。
- 当前B真实root登录态中英×深浅×1440/768/390/320共16组通过，三个控件首页+详情共96个视图，见[current-b](../../../../../evidence/m70/service-widgets-refinement/followup/round-2/current-b/report.json)。完整形态及Quickstart语言仅浏览器投影，不写路由器布局或语言；其余业务读取真实。当前B实际Aria2未运行、qBittorrent/Transmission未安装，未为截图启动或安装它们。此结果是UI与现有业务入口验收，不是这三个下载引擎的数据面验证。
- 当前B无页面脚本错误、HTTP失败或业务写请求，2个临时root会话销毁。实际打开了桌面整行深浅、320英文Docker/远程详情、390英文下载卡，另检查本地完整认证提示、长地址、DDNS状态与摘要截图。

同B、语言、主题和宽度比较，1440中文浅色整行从335.171875px收至251px；320英文强制完整形态Docker301→213px、下载328.671875→310px、远程382.265625→326px，见[测量](round-2/comparison.json)。长值仍自然增高，不固定DOM高度或裁剪资料。

## 候选与设备保护

已部署前端a2861dd1fbd1acbb77f161a7fcfab2c510190871，资源键`0.16.6-test20261018-preview-a2861dd-247e50265cbe`。后端c9624a3/0.16.6、opkg0.16.5保留；本次为快速前端替换，不是新包安装或SDK验收。私有前端/模板回退备份见[deployment](round-2/deployment.json)。

更新前后及UI结束后四个公开资源均与冻结候选一致，见[最终资源](round-2/public-resources-final.json)。20项既有保护配置、额外dockerd/ddnsto/ddns三项、LAN地址/默认via.1均保持原样，无例外；Quickstart serve9386/startdhns14546/FastNet10304、配置/脚本/二进制/包记录、LuCI语言zh_cn不变，NetPolicy仍disabled/stopped。见[配置](round-2/preservation-final.json)、[运行状态](round-2/runtime-final.json)。

本次仅两个续修候选：第一候选绿色/布局及状态检查通过，但截图发现英文认证标签裁剪；第二候选补选择器与断言后通过。没有第三候选，也没有删除旧失败/放宽断言。未改后端/其他设备，未重建5180，未执行SDK、新包安装、Git push、Release或Action。

效果：[桌面整行](../../../../../evidence/m70/service-widgets-refinement/followup/round-2/current-b/zh-light-1440-normal-row.png)、[深色整行](../../../../../evidence/m70/service-widgets-refinement/followup/round-2/current-b/zh-dark-1440-normal-row.png)、[手机远程详情](../../../../../evidence/m70/service-widgets-refinement/followup/round-2/current-b/en-dark-320-normal-remote-details.png)。

# 六组件原业务对齐：当前候选检查

2026-10-16。本轮范围为隔离Vue产品原型，先保留磁盘信息、存储服务、Docker、下载服务、远程域名、系统信息的原功能，再开展各组件美化。任务树及标准见[唯一业务核对基线](../../../product/quickstart-home-business-widgets-alignment.md)；不将模拟表单成功解释成真实设备业务通过。

## 当前结果

| 检查 | 当前结果及证据 |
|---|---|
| 六组件内容／状态／原入口 | 19组通过：[report](../../../../evidence/m66/business-widgets/final/review/report.json)。包含三图及完整系统字段、原服务分页签、AriaNg令牌编码、RAID／SMART及磁盘异常、原向导、缺失／局部失败／恢复、摘要完整详情、1440／1024／768／390及深色／英文 |
| 原表单和提交参数 | 13组通过：[report](../../../../evidence/m66/business-widgets/final/actions/report.json)。三下载服务包检查及POST字段，IPv6 DDNS，DDNSTO完整模拟授权／绑定链，Docker非空目录force／overwriteDir，挂载、磁盘初始化双确认，NAS选盘→保留文件系统→共享权限创建，提交拒绝，三服务高级配置安装及目标元数据 |
| 有界读取和资源清理 | 3组通过：[report](../../../../evidence/m66/business-widgets/final/resources/report.json)。8次形态／总览切换后一次性服务GET仍各1次；8.338秒内远程增加3次、系统增加2次，符合3s／5s采样。后台无新读取、1s时钟为0；恢复后时钟及可见性监听数不增长；实际Vue卸载后读请求不增长、时钟／可见性监听／弹层／滚动锁清零；日志最多120项 |
| 网络交互回归 | 14组通过：[report](../../../../evidence/m66/business-widgets/final/network/report.json)，本轮候选重新运行，未沿用前轮通过结论 |
| 字体／截图／布局事务边界 | 4组通过：[report](../../../../evidence/m66/business-widgets/final/visual/report.json)。六原组件Arial字体及标准／窄卡标题16／14px，固定视口桌面／手机截图；编辑中原业务控件inert，隐藏／撤销／取消不写业务、不改变菜单；历史grid对照不启用本轮原组件桥接 |
| 正式源码保护 | 64文件逐一与HEAD比较一致：[report](../../../../evidence/m66/business-widgets/final/source/report.json)。覆盖原首页及子组件、全部相关向导、请求、store、路由和安装工具 |
| 类型与构建 | `rtk proxy /var/cache/build-cache/run.sh -- npm --prefix web run tsc`退出0；当前设计构建／服务启动成功。输出位于SSD `/var/cache/build-cache/users/911/projects/quickstart-df92025bd880/work/vue-preview` |
| 当前公开资源 | [candidate.json](final/candidate/candidate.json)：PID15707、入口`index.6a1d6489.js`，SHA256 `5d2a698d2e26e220cacf27ffee56189b62187348f293b1e56029b6819fdc6856`。3个JS／CSS公开资源逐一与SSD字节校验一致；67个运行源指纹。工作树候选，未提交／发布 |

浏览器检查共53组；以上五份浏览器报告均为零pageerror／console error、零外部请求。脚本入口位于`docs/product/ui-design/business-{widgets,actions,resource,visual,source}-review.cjs`及网络回归脚本；使用`NODE_PATH=/config/playwright-runner/node_modules`和独立`QS_DESIGN_EVIDENCE_ROOT`复跑。

## 自检与优化记录

- M66.35：先核对当前六组件、子组件、请求及动作，保留原规则和原问题，不以此前布局／字体验收代替。
- M66.36：三次优化分别收口TypeScript索引类型、嵌套返回后的焦点恢复、步骤切换移除焦点节点后的Escape关闭。最终当前构建通过。原Docker／下载延迟保持800／1100ms，并由设计构建适配取消尚未执行的卸载回调；DDNSTO两个外部嵌入明确改为设计模拟，不访问真实授权网站。
- M66.37：初期浏览器脚本有过未等待异步业务拒绝／迁移结果的断言，以及NAS脚本遗漏原有“使用原文件系统”步骤；已修正脚本，未省略原步骤或伪改业务来通过。初期失败保留在`review/attempt-*.json`与`actions/attempt-1.json`；最终证据统一在`final/`，当前所有检查通过。
- 长视口整体截图仍可触发当前Chromium的局部重绘空白；不将它认定为页面空白或视觉通过依据。评审以[桌面顶部](../../../../evidence/m66/business-widgets/final/visual/1440-top.png)、[桌面存储／服务](../../../../evidence/m66/business-widgets/final/visual/1440-storage.png)、[手机服务](../../../../evidence/m66/business-widgets/final/visual/390-services.png)等固定视口原始截图及DOM／真实点击证据为准。

## 人工体验与后续边界

[完整六组件示例](http://192.168.9.19:5180/?layout=ordered&preset=services&scenario=business-all)。顶部“设计预览→数据场景”还可选择磁盘状态、服务缺失、仅IPv6、局部失败、业务拒绝及Docker非空目标确认。

原业务组件标准形态采用卡内滚动保留全量内容，系统三图、完整版本及全部磁盘没有因行高不足被删除；摘要打开相同原完整组件。视觉精修与更合适的组件信息密度尚待逐项设计及用户确认，本轮不宣称最终美观验收完成。

原代码已知问题继续见业务基线：系统高级菜单缺少开启动作、零可用内存的`||100`行为、Docker HTTP异常未回退开关、原DDNSTO消息来源未核验等，均未被悄悄重定义。本轮POST、软件安装、SMART／RAID／挂载、DDNSTO授权等都是合成响应；未检查真实路由器／安装包／业务数据面。24小时观察仍延期。正式迁移需独立验收真实API、权限及服务状态。

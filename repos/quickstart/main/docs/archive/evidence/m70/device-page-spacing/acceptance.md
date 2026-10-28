# 局域网管理页宽度修正：通过并已更新B

2026-10-21，第一产品候选通过。[目标及任务树](status.md)P1～P5完成。用户截图所示两侧留白来自device/index.vue额外1320px居中限宽，不是设备数量或系统菜单问题。

## 实现与测量

仅修改device-management外容器为width:100%、max-width:none、margin:0，设备/分组与计划/局域网设置共用LuCI原生内容宽度。表格、表单、抽屉、内部padding、模板、业务脚本/权限和其他样式均字节保留，见[源码保护](round-1/business-protection.json)。规范已同步[局域网产品基线](../../../lan-device-management-product-architecture.md)。

当前B相同宽度/中文/浅色、三个页签分别测量，见[比较](round-1/comparison.json)：

| 屏宽 | 原页面宽度 | 当前页面宽度 | 原单侧外间距 | 当前单侧外间距 |
| --- | --- | --- | --- | --- |
| 2560 | 1320 | 2280 | 500 | 20 |
| 1920 | 1320 | 1640 | 180 | 20 |
| 1440 | 1192 | 1192 | 20 | 20 |
| 390 | 358 | 358 | 16 | 16 |

外间距相对于右侧maincontent区域计算，不包含系统菜单。保留正文内部18px/手机既有13px或8px等padding；没有通过放大字体/页面缩放或删除业务字段占满页面。

## 当前验证

- SSD包装器下独立vue-tsc、135项前端测试、Web构建通过。实际产物仍在项目web/dist。zip只改变index.js/style.css；Vue样式scope ID与压缩变量名使JS也变化，未错误宣称只需替换CSS。见[build](round-1/build.json)。
- 当前B真实root登录态、32组中英×深浅×2560/2048/1920/1440/1024/768/390/320，通过三个页签共96个加载完成后的视图，见[最终报告](../../../../evidence/m70/device-page-spacing/round-1/current-b-loaded/report.json)。不注入CSS，不模拟业务响应，只在当前浏览器投影语言/主题，不写路由器语言或用户配置。
- 每个页签等待真实业务已加载：设备列表、分组evaluation、设置settings-nav，再检查根容器与父级/原生LuCI边界一致。检查无页面横向溢出、搜索/更多筛选、详情/Escape与焦点恢复；2560/390的各语言/主题额外验证首页导航和原生Back后宽度恢复。没有提交表单、修改设备/分组/网络策略。
- 当前最终报告无页面脚本错误、HTTP失败或业务写请求。系统菜单/外壳几何与原有匹配宽度基线一致。桌面宽屏设备/已加载设置、英文手机分组/设置、深色手机设备截图均已实际打开审查。

原始基线与预演各4组保留；预演注入CSS仅用于部署前评估，不当作当前安装验收。第一次current-b矩阵虽然宽度通过，但部分设置截图仍是加载占位；保留该报告，补充真实业务就绪等待后，在current-b-loaded重新完成32组，以后者作为当前通过结论。产品代码没有因此再次改动。

初次baseline-b因复用首页专用主题helper要求首页DOM而超时，报告与失败截图保留；改为设备页主题/实际语言检查后baseline-b-verified通过。该问题属于测试辅助函数，不是产品失败。

## 设备与交付边界

已部署前端16167b949324e9d5a613c176df388b28590c5869，资源键`0.16.6-test20261018-preview-16167b9-27cd87b0c4f1`。B为iStoreOS24.10.1/2025052311、kernel6.6.86，后端c9624a3/0.16.6与opkg0.16.5记录保留；快速前端替换不是SDK/新包安装验收。私有回退备份见[deployment](round-1/deployment.json)。

最终四个公开资源匹配冻结候选，20项保护配置、LAN/默认via192.168.30.1严格一致，无例外；Quickstart serve9386/startdhns14546/FastNet10304及配置/脚本/二进制/包记录/语言zh_cn不变，NetPolicy仍disabled/stopped。见[公开资源](round-1/public-resources-final.json)、[配置](round-1/preservation-final.json)、[运行状态](round-1/runtime-final.json)。五次基线/预演/矩阵执行共10个短期root会话均销毁，凭据未归档。

只操作B，不重启后端、不修改系统左侧菜单、不操作A/C/D、不做SDK/新包安装/push/Release/Action，不重建5180。此任务不新增网络策略或数据面验收结论。

效果：[宽屏设备列表](../../../../evidence/m70/device-page-spacing/round-1/current-b-loaded/zh-light-2560-tab-0.png)、[宽屏设置](../../../../evidence/m70/device-page-spacing/round-1/current-b-loaded/zh-light-2560-tab-2.png)、[手机设备](../../../../evidence/m70/device-page-spacing/round-1/current-b-loaded/zh-light-390-tab-0.png)。

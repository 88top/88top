# 默认首页五行布局

2026-10-17。仅修改隔离原型的推荐布局及默认布局名称；原组件业务、显示偏好、响应式和布局编辑模型保持不变。未覆盖当前内存中已应用的用户布局；主动“恢复推荐布局”采用新默认值。既有命名对照示例使用原比较基线。

| 顺序 | 行结构 | 从左至右／从上至下 |
|---|---|---|
| 1 | 左单右双，沿用60／40列宽 | 网络流量；右上完整网络连接，右下自动紧凑网络接口状态 |
| 2 | 等宽双列 | 局域网设备、应用与工具 |
| 3 | 等宽双列 | 磁盘信息、存储服务 |
| 4 | 三列，沿用34／33／33 | Docker、下载服务、远程域名 |
| 5 | 单列 | 系统信息 |

任务已完成：调整默认定义；保留对照示例；更新默认示例名称；重建并启动5180；自检实际宽屏和手机布局、取消及恢复推荐。

当前[report.json](../../../../evidence/m66/default-layout/report.json)共8组通过：桌面真实坐标／11项唯一／自动形态；1024、768、390、320及恢复1440的五组响应式；取消结构编辑；从旧对照示例恢复推荐并应用。浏览器页面／控制台错误与外部请求均为零。`git diff --check`通过。截图已实际审看：[桌面](../../../../evidence/m66/default-layout/default-desktop.png)、[手机](../../../../evidence/m66/default-layout/default-mobile.png)。构建由现有SSD缓存入口执行，产物位于`/var/cache/build-cache/users/911/projects/quickstart-df92025bd880/work/vue-preview`，当前服务PID11814。

首次检查的布局与响应式部分通过，但脚本在模态行设置面板未关闭时点击页面取消按钮，等待超时；原始attempt-1与失败截图保留。修正脚本先关闭面板再取消，attempt-2通过；审图后对手机缩屏补充1300ms绘图等待及真实有色系列像素检查，attempt-3仍为8组通过，手机截图已更新。没有由此修改运行源码。此处8组为本轮实际结果，不将上轮152组检查视为新默认布局的重新验收。

复验入口：仓库根目录执行`rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules QS_DESIGN_EVIDENCE_ROOT=docs/archive/evidence/m66/default-layout node docs/archive/evidence/m66/default-layout/review.cjs`。

体验[默认首页](http://192.168.9.19:5180/?layout=ordered)。此前含`preset=services`等参数的地址仍展示对应对照示例。合成数据、内存草稿与刷新恢复示例规则不变；未修改正式首页或设备，未构建安装包。本轮尚未提交。

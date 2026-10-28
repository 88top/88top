# M66.57～M66.62：技术通过，待人工体验确认

2026-10-17，最终候选在自有5180服务上完成。以本页链接的`optimization-1`报告为当前验收；初始候选261组虽全部通过，追加溢出状态检查仍发现遗漏，相关失败完整保留，不能替代新候选验收。

## 当前可体验行为

默认八工具按用户指定顺序显示；标准半宽4×2、手机2×4。系统工具、已安装应用与内置功能共用收藏身份，最多24项；用户可以添加、移除、拖动排序、局部撤销、恢复默认，再保存或取消。所有选择为内存预览，刷新恢复示例。

全部／搜索、软件中心原目标、八工具原表单或目标／选项可访问。安装／刷新目录不自动收藏；未知、权限不足、卸载与缺有效入口分别说明。超出首页容量的未知／卸载项也能从“全部→已收藏·当前不可用”进入，保留原顺序与计数。

快捷入口与布局编辑互斥，历史独立；跨屏只取消当前手势，稳定宿主保留面板与草稿。首页行结构、边界计算、其他控件业务和原动作处理器保持保护。

## 当前验证

[22套263组全部通过](optimization-1/suite-results.json)：

| 检查 | 组数 |
| --- | ---: |
| 八工具、终端配置、固件选项、软件中心 | 13 |
| 默认八项、容量与旧显示属性 | 8 |
| 添加／鼠标／触摸／键盘／保存取消／撤销／互斥 | 9 |
| 数量、目录状态、卸载、旧收藏、跨屏与身份去重 | 17 |
| 20次编辑器开关、历史30步、表单计时器、后台及实际卸载 | 5 |
| 溢出未知与第24项卸载仍可访问 | 2 |
| 1440／1280／1024／768／390／320 × 中英文 × 浅深主题 | 24 |
| 整页视觉矩阵、状态与原磁盘提示 | 41 |
| 原网络曲线实际绘制、尺寸与主题 | 18 |
| 网络业务与原配置表单 | 14 |
| 六业务控件及原动作 | 19＋13 |
| 连体按钮、11控件标题与共同标准 | 9＋14＋13 |
| 尺寸边界、整行排序、放置与结构、资源 | 10＋9＋8＋3 |
| 设备／应用形态、旧六项启动条、视觉回归 | 5＋4＋5 |

[254文件保护与非应用形态算法检查](../../../../../evidence/m66/launcher/62-review/optimization-1/protection/report.json)、[64原业务文件核对](../../../../../evidence/m66/launcher/62-review/optimization-1/original-business/report.json)通过。必要例外只有向应用传递已有网络快照的单一绑定，脚本逐字保护其余LayoutPreviewCard代码；应用组件、目录、设计动作与显示分支的授权改动单独列出。

Vue `vue-tsc --noEmit`与`git diff --check`退出0。每套浏览器报告记录当前交互、受监测的页面／控制台错误与外部请求；通过报告无意外错误。图表检查以实际canvas像素和连续更新为证据，服务与动作并非仅检查HTTP200。

## 当前指纹和人工审图

[候选指纹](optimization-1/candidate/candidate.json)与[交付核对](optimization-1/handoff-review.json)一致：PID23613，`0.0.0.0:5180`，`vue-design-built`；入口`/assets/index.5b76ba87.js`，SHA256 `a283048e8311f424e2d8a9d54edbf9825553c83611e61bd399a001cbaf9cebd7`。公开三个资源与SSD构建文件逐项匹配，测试时的源码及验证脚本指纹未变化。Git HEAD为`fc9df26`，当前是保留既有视觉精修的未提交工作树候选，不能冒称正式版本或发布包。

设计者已查看当前浅色手机与深色桌面编辑面板：真实网格、拖动手柄、移除、计数、保存／取消可辨认，字体与低饱和图标沿共同规则。宽度与对比度由当前矩阵检查支撑；人工审美与易用性尚未由用户确认。

- [当前浅色首页](../../../../../evidence/m66/launcher/62-review/optimization-1/launcher-matrix-review/home-light.png)
- [当前深色桌面编辑器](../../../../../evidence/m66/launcher/62-review/optimization-1/launcher-matrix-review/editor-1440-dark.png)
- [当前浅色手机编辑器](../../../../../evidence/m66/launcher/62-review/optimization-1/launcher-matrix-review/editor-390-light.png)
- [人工体验卡与状态直达](review-guide.md)
- [正式开发交接](development-handoff.md)

## 重复执行

```sh
rtk proxy bash scripts/ui-design.sh status
rtk proxy /var/cache/build-cache/run.sh -- npm --prefix web run tsc
rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules QS_DESIGN_EVIDENCE_ROOT=docs/archive/evidence/m66/launcher/recheck-local node docs/product/ui-design/launcher-final-runner.cjs
rtk proxy /var/cache/build-cache/run.sh -- node docs/product/ui-design/launcher-protection-review.cjs
```

若源码变化，先通过自有生命周期脚本stop／start重建，等health确认后再测试；静态预览无HMR。不得停止其他项目进程。构建输出在`/var/cache/build-cache/.../work/vue-preview`，证据在仓库持久目录。

本轮无真实路由器访问、安装、打包、发布、推送。应用目录全为合成，现有正式后端“读取失败映射空数组”、ACL／真实入口验证和收藏持久化留在正式集成前置；内网换地址及沙箱重启只验证原表单与模拟拒绝／清理。24小时观察仍独立延期，未宣称通过。

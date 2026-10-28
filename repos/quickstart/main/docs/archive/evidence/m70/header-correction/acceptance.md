# 顶部截图纠正：B快速候选结果

本次界面纠正已完成并直接替换B，实际打开截图确认：48px通栏蓝底，白色官网文字和设置图标，下面没有旧快捷卡片，新有序控件与无自建页脚保持。首轮界面实现通过；原业务导航扩展检查另有家长控制404，不能宣称全业务通过。

用户后续要求“先用最快速的编译方法，替换 root@192.168.30.244，并查看最终运行效果即可”，因此使用已经生成的runtime直接部署，跳过SDK包构建/安装。不是0.16.6正式IPK验收。

## 当前实际运行

- B：iStoreOS24.10.1 / kernel6.6.86 / x86/64，实际root登录态重新验收。
- runtime：`0.16.6-test20261018`，冻结源码 `c9624a38ffe11b45f484b2858ddf16088ae7a6a7`，资源key `0.16.6-test20261018-release-c82f517e513c`。
- 主程序及serve/startdhns两个实际进程均为 `983a1c8b819e29a5ac7e053898afa66ccdc8653e535219482c92052b3a90ba11`，四份关键Web资源及模板key与MANIFEST匹配。辅助进程通过旧PID/命令/旧hash/原dhns命名空间一致性检查后替换，没有操作接口、默认路由或策略。
- 原opkg记录仍为Quickstart0.16.5-2/LuCI0.16.5-r2；NetPolicy0.2.0-2仍disabled且无进程。不能把runtime候选说成包元数据也更新。
- 私有完整备份：`/root/quickstart-package-candidates/home-0166-header-r1/backup/`；候选替换回滚点：`/root/quickstart-backups/home-0166-c9624a3-header-r1/`。没有改用户密码或把凭据放入仓库。

## 检查结果

| 检查 | 当前结果 | 证据 |
|---|---|---|
| 类型/Go/前端/构建 | vue-tsc、Go、105前端测试及正式构建通过；候选安装器缩进key/完整性/失败回滚测试通过 | 本目录日志；安装器回归脚本 |
| 本地正式页面 | 中文完整11项、英文触屏系统深色5项、未来配置只读6项通过 | `round-1/local-*/report.json` |
| 同数据正文保护 | 本地7视图77控件宽/高/形态完全一致；B1440px11控件也逐项一致 | `round-1/body-size-comparison.json`、`b-body-size-comparison.json` |
| B顶部及页面 | 中文桌面只读5项、英文触屏/系统深色6项通过；5种宽度无页面横向溢出、触屏主操作44px；两组均无pageerror/console/HTTP错误 | `round-1/b-final-readonly/`、`b-final-touch-english/` |
| B原入口扩展 | 网络向导/完整设备管理键盘导航、FastNet安装提示取消不安装、启动台响应式宿主和焦点通过；家长控制跳到原services/appfilter返回404，本组整体失败 | `round-1/b-final-shell/ui.json`及`b-parental-navigation.png` |
| 配置保护 | 部署后和UI后严格逐项核验20路径（含主/备文件与缺失文件状态）、LAN地址与默认路由；没有临时配置写入或备份污染 | `round-1/b-preservation-after-deploy.json`、`b-preservation-final.json` |

已实际打开B桌面浅/深、390px英文触屏及本地320px中文深色原始截图；没有用截图生成成功代替审图。蓝条左右与B右侧内容边界完全一致（1440px时208～1440），高48px；正文首行比蓝条底低20px，无旧快捷区占位。顶部设置可以键盘进入同一编辑器、切换总览、取消后返回焦点。没有覆盖已保存的布局/收藏/链接，所有UI组都记录layout/launcher unchanged。

本轮共创建并销毁8个短期root会话（基线2、业务入口组2、英文触屏2、中文只读2）。浏览器和本地5181验收服务均已结束，5180参考服务未重启或改动。A/C/D、网络策略和已延期24小时观察未操作。

## 分开保留的未通过项

1. 当前B的luci-app-oaf5.0.7控制器登记在`admin/network/appfilter`，原Quickstart动作使用`admin/services/appfilter`，所以实际跳转404。本次截图改动未改变此业务源码；保留完整失败证据，没有自动安装/升级OAF或修改其配置。本组中“入口存在/已跳转”的文字不代表目的页可用，以最终failed及HTTP404为准。后续需兼容不同OAF入口；本轮按用户最新要求先交付运行效果。
2. 原320px英文触屏网络连接标题侵入操作区约7.23px的视觉失败仍保留在上一轮证据，本次未修改该控件正文，不将无横向溢出检查说成该问题已修复。
3. APK、DHNS恢复代理、ARM实机、24小时观察及公开包发布均没有新增通过结论。

## 输入及交付边界

Runtime归档SHA256 `84d74f64be89cd15290d05c202555594dcb7ae864d283c29a79177f9f0f5dc44`，三架构runtime、Web、MANIFEST、三份输入归档及SHA256SUMS保留在忽略目录`bin/releases/c9624a3/`。App Hub `7dfedb8`、专用nas `76f4ec9`、专用nas_luci `25a30e0`及专用SDK `3f0ec96`仅准备本地输入；feed patch反向dry-run/构建器13测试/preflight通过，但没有部署新构建器或启动SDK。未push、未发布Release、未触发Action。

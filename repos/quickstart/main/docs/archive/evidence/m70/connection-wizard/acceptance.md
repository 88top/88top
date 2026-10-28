# 网络连接 → 网络向导：已实施并更新 B

2026-10-21，前端源码 `f778f99fe7d2f80f436fa03af495faf21bcfef88`。

网络连接右上角主操作由“设备管理”改为“网络向导”（英文 Network setup），导航目标改为已有 `/network`。
正式与设计组件同步，标准/摘要使用同一标题操作。详情里的设备管理入口、连接数据、隐私显示、DNS/软件源修复及布局未修改。
当前视觉契约与相关原型导航检查同步；旧验收证据保留。

## 验证

- 独立 vue-tsc、正式 Web 构建、29项首页配置/语言测试通过，实际产物在 web/dist。[构建记录](round-1/build.json)。
- 当前 B 真实 root 登录态，中英×深浅×1440/390 共8组通过按钮文字、桌面 Enter/手机 tap、准确 `/network` URL、已有三种连接选择、浏览器返回首页。[UI报告](../../../../evidence/m70/connection-wizard/round-1/current-b/report.json)。实际当前布局的手机连接卡为完整形态，未把它误报为摘要形态专项验收。
- 桌面浅色卡片、手机深色中英卡片、实际向导截图已打开检查。无页面脚本错误、业务写请求；仅打开向导，不提交任何网络设置。两个临时 root 会话均销毁。[设备及会话](round-1/current-b/device.json)。
- 四个实际公开资源 SHA256 与冻结产物一致。[资源指纹](round-1/public-resources.json)。
- 20项配置文件及 LAN/默认路由保护通过，无例外；Quickstart/startdhns/FastNet 进程、后端和软件包记录保持。[配置保护](round-1/preservation.json)、[部署保护](round-1/deployment.json)。

## 交付

资源键 `0.16.6-test20261018-preview-f778f99-addcd9c3a8a6`；冻结目录 `bin/previews/f778f99`。
仅快速替换 B 的 index.js/style.css 和 LuCI 资源键，无后端重启或包安装；后端仍 c9624a3，原 opkg 记录保留。
私有备份 `/root/quickstart-backups/home-0166-connection-wizard-f778f99-r1`。
5180未重建、未操作其他路由器、未推送。此前布局提示问题仅已诊断，本次未包含修复。

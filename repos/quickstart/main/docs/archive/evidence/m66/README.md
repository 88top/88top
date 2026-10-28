# M66 首页原型检查

当前有效进度（2026-10-15）：5180已进入完整R有序布局原型，M66.11自检通过；用户已认可功能定义并要求提交代码，编辑交互仍需优化。见[最新阶段状态](row-layout/status.md)、[功能基线确认](row-layout/12-design-signoff/functional-baseline-approval.md)。以下为原日期历史说明，旧地址与待确认状态不覆盖当前结论。

日期：2026-10-14。设计待确认，正式首页未开发。

本目录根部截图和browser-review为首次HTML原型的历史证据。
当前真实Vue原型证据在 [vue/](vue/)，阶段状态见 [最新规格](../../product/quickstart-home-vue-spec.md)。

`browser-review.json`：三布局 × 十二场景 × 三屏幕，共 108 个组合，10 项交互；无浏览器错误。
截图为合成数据，使用项目现有原创图标；不代表测试机当前状态。
`lifecycle.json`：外部端口占用时 start 拒绝，stop 保留外部 listener；正常 start/stop 和幂等 start 已实际检查。

预览监听 0.0.0.0:5180，本机通过 192.168.98.2 访问成功。从 C .93 对该地址访问在 3 秒后超时，
不能宣称所有设备网段已能访问；可能需要开发环境提供到该网段的既有访问路径。本轮不更改路由器路由或防火墙。

访问：http://192.168.98.2:5180/?variant=A

产品与交互解释见 [首页评审](../../product/quickstart-home-design-review.md)。
评审决定：**待用户确认**。

# 七控件内部构图：体验与前后对照

[当前首页](http://192.168.9.19:5180/?layout=ordered) · [全部服务运行](http://192.168.9.19:5180/?layout=ordered&scenario=business-all) · [未安装/未配置](http://192.168.9.19:5180/?layout=ordered&scenario=business-missing) · [磁盘复杂状态](http://192.168.9.19:5180/?layout=ordered&scenario=business-disks) · [局部服务失败](http://192.168.9.19:5180/?layout=ordered&scenario=services-error)。顶部原有“设计预览”切场景/语言，主题按钮切浅深色；不增加第二处预览工具。

当前为隔离Vue原型、合成数据、内存偏好；刷新恢复示例，业务导航仅展示原目标。未连接路由器或外部服务。浏览器测试和开发者审图分别留证，最终审美请按实际日常体验判断。

## 七控件对照

| 控件 | 1440px浅色 | 390px深色 |
|---|---|---|
| 网络连接 | [前后对照](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/1440-light-connection.png) | [前后对照](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/390-dark-connection.png) |
| 磁盘信息 | [前后对照](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/1440-light-storage.png) | [前后对照](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/390-dark-storage.png) |
| 存储服务 | [前后对照](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/1440-light-sharing.png) | [前后对照](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/390-dark-sharing.png) |
| Docker | [前后对照](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/1440-light-docker.png) | [前后对照](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/390-dark-docker.png) |
| 下载服务 | [前后对照](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/1440-light-downloads.png) | [前后对照](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/390-dark-downloads.png) |
| 远程域名 | [前后对照](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/1440-light-remote.png) | [前后对照](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/390-dark-remote.png) |
| 系统信息 | [前后对照](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/1440-light-system.png) | [前后对照](../../../../../../evidence/m66/widget-composition/81-review/optimization-1/comparisons/390-dark-system.png) |

截图宽度/数据/主题相同；对照PNG按原图宽度并列，不调整字号制造差异。原图见 `widget-composition-review/`，[审图理由与高度变化](visual-review.md)单独记录。

## 建议的实际体验顺序

1. 打开全部服务示例，先看整页是否协调，再看系统指标与设备资料是否比原先更集中。
2. 存储切易有云/SAMBA/WebDAV，检查地址、目录和未配置入口；缩窄窗口后看共享条目是否容易读。
3. 下载切三服务，检查目录、Web入口、原凭据与AriaNg认证；远程切各有效页签，检查域名和控制台/编辑的对应关系。
4. Docker试原开关与迁移示例；网络分别显示IPv4/IPv6，再打开/关闭详情，检查隐私恢复和连接状态。
5. 磁盘检查名称对应的详情/挂载/格式化示例、SMART和只读提示；不要把原型模拟流程当作设备操作。
6. 将浏览器缩到手机宽度，检查服务选择、长值和菜单；需要时通过原显示设置选系统完整形态，查看原三图与资料。
7. 进入自定义首页，试移动、改宽、上下分配、总览、撤销与取消，确认内部重排未改变已认可的布局交互。

设计/架构参考仍以[唯一外观规范](../../../../../product/quickstart-home-widget-visual-standard.md)、[六阶段计划](../../../../../product/quickstart-home-widget-composition-m66-76-81.md)为准。本轮没有修改左侧系统菜单、默认行结构或正式首页入口。

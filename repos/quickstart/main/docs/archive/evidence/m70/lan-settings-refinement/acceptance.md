# 局域网设置交互整理：第三候选通过，B已更新

2026-10-21。前端源码 `9f31d4f756e28efa34def21e74b603f1568e8665`，资源键 `0.16.6-test20261018-preview-9f31d4f-697cfb959c91`。依据[产品方案](../../../product/lan-settings-interaction-refinement.md)及[目标/任务树](status.md)。

## 已实现

- 删除重复局域网设置标题/介绍，区域aria-label及网络服务/上网路线/规则台账保留。
- 权限分别说明地址配置、路线、其他服务，分别使用既有editable/routeEditability，不再泛指“本页只读”。不虚构其他路由器管理链接。
- 成功读取且只读时展示本机配置、地址池、租期摘要；明确数据归属，完整禁用字段通过查看本机配置展开，禁用提交按钮不再占位。失败/无效响应显示不可用，前端默认值和placeholder不冒充事实。
- 异常卡直接查看执行方式，展开并聚焦原控件；原安装、迁移/恢复、完整编辑和预览确认保留。白/深色底面、细边框、蓝动作/绿正常/橙异常，两卡自然高度，手机页签折行、触控44px。
- 重新检查只调用已有只读globalConfigs一次，检查中禁用重复操作；10秒AbortController、代次和卸载清理，成功只更新观察数据；不改DHCP/限速/路线草稿、待确认计划或展开状态。失败显示状态未更新并重试，未知时不能使用过期状态继续确认限速计划。

原17个预览/应用/安装/迁移事务函数保持字节一致，设备列表/分组/详情/规则业务与后端源码未改：[保护检查](round-3/business-protection.json)。请求层仅给globalConfigs GET增加可选AbortSignal，其他调用兼容。

## 三轮与验证

第一候选高级summary不足44px；第二候选深色警告继承浅色变量，对比度失败；第三候选纳入既有deviceVisualTokens统一主题范围后通过。每轮失败截图与报告保留。脚本自身的关闭context响应释放、即时失败busy时序、卸载挂起点等待问题另行修正并保留原报告，没有增加第四产品候选。

独立vue-tsc、正式Web构建、全部138项前端测试通过：[构建/产物](round-3/build-checks.json)、[测试日志](../../../../evidence/m70/lan-settings-refinement/round-3/check-1.log)。18条新增英语同时更新PO/JSON；旧gettext-compile因现有PO无Language头失败，本轮按新增PO同步JSON，未扩大修改整个语言编译流程。node_modules位于SSD，正式输出仍web/dist。

[当前B真实登录态24组](../../../../evidence/m70/lan-settings-refinement/round-3/current-b/report.json)：中英×深浅×2560/1440/1280/768/390/320，无溢出；三区可导航，真实重新检查只新增一次globalConfigs读取，不重新读取无关设置；异常入口展开/聚焦正常。测试没有替换候选静态资源。当前真实DHCP读取失败被诚实呈现，见下一节，不能将这些组称为真实DHCP配置读取成功。

[当前资源12组补充投影](../../../../evidence/m70/lan-settings-refinement/round-3/current-b-states/report.json)：草稿/计划保留、503重试、200业务失败、200结构损坏、10秒超时/重试、卸载、地址未知/读取失败、地址/路线独立权限、服务就绪、未安装、预览/确认流程通过。所有写请求均在浏览器中拦截并生成响应，未发给B；不冒充真实策略应用或安装/数据面验收。第三候选4组基础/12组专项候选投影也独立保留。

已打开当前B中文桌面、英文深色手机、正常摘要/服务就绪、失败后草稿和计划保留等截图；基线和当前宽度[对比](round-3/comparison.json)保持，原生20/16px外间距与系统菜单/顶部保持。标签对比度按实际背景复合计算，不仅与卡片底色比较。

## 当前设备发现的后端问题，未宣称修复

真实地址接口返回success=-1000、`LAN IPv4 address or netmask is invalid`，无result。只读[核查](round-3/dhcp-read-only-probe.json)确认network.lan.proto=dhcp，静态ipaddr/netmask不存在，运行时br-lan有192.168.30.244/24。源码defaultLanDHCPSettingsStore.Read依赖这两个静态字段，不能兼容该读取场景。这解释了旧页中的默认/占位192.168.1.*，这些不是成功读取的真实地址池。

本轮完成失败展示与独立服务交互；正常只读摘要/编辑流程通过明确的浏览器投影验证。后端动态地址读取兼容、真实DHCP配置读取成功仍待独立修复和验收；不能通过改成静态地址、填默认字段或允许写入来绕过问题。

## 部署与保护

冻结bin/previews/9f31d4f，私有回退/root/quickstart-backups/home-0166-lan-settings-9f31d4f-r1。[部署](round-3/deployment.json)仅JS/CSS/英语资源及LuCI key替换，无后端重启。四份[公开资源SHA](round-3/public-resources.json)匹配；36份资产仅3份改变，[其余资产保护](round-3/asset-conservation.json)。[UI后保护](round-3/preservation-after-ui.json)严格确认20配置路径、LAN/default via .1不变；后端c9624a3、Quickstart/startdhns/FastNet进程、NetPolicy disabled/stopped及opkg记录保持。[11次运行的22个短期root会话](round-3/session-cleanup.json)均在finally销毁。

这是B前端快速替换验收；没有新包/SDK/push/其他机器部署或5180重建，opkg仍为0.16.5。当前视觉和交互目标完成，上述后端数据源问题单列保留。

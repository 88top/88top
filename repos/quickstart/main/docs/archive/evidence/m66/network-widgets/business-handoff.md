# 网络控件业务与后续开发交接

本轮只实施隔离原型。唯一布局交互规范仍为1.2，网络业务依据[原源码对齐设计](../../../product/quickstart-home-network-widget-business-alignment.md)。正式业务源文件的保留证据见[保护检查](../../../../evidence/m66/network-widgets/34-review/final/source-guard/report.json)。当前阶段结果见[status.md](status.md)。

| 落点 | 职责 |
|---|---|
| `networkBusiness.ts` | 原networkInfo状态、协议、DNS模式、接口在线秒数与独立端口状态的只读投影；不以缺失internetConnected推断断网 |
| `NetworkConnectionCard.vue` | 标准／摘要共用状态、IPv4／IPv6、DNS和详情；原设备入口；DNS／软件源异常动作 |
| `useAddressPrivacy.ts` | IPv4／IPv6独立60秒揭示租约；内容／形态变化、隐藏页、关闭详情及卸载恢复遮蔽／清理 |
| `NetworkInterfaceCard.vue` | 独立端口状态、最多两项首页投影、20项分页完整清单、MAC／双工／协商速率／包计数详情及接口配置入口 |
| `NetworkWidgetDialog.vue` | 共享详情外壳，收缩到视口内、键盘焦点循环、关闭恢复焦点和滚动状态 |
| `NetworkBusinessAction.vue` | 在同一Vue／Pinia上下文直接挂载原DNS／软件源组件；适配原型外观和关闭，不改原表单校验、请求或结果实现 |
| `networkFixtures.ts`、`fixtures.ts` | 对现有端点的合成响应与内存写入；真实请求被设计适配器阻断；失败与加载场景可复验 |
| `rowLayout.ts`、`widgetPresentation.ts`、`moduleCapability.ts` | 新networkInterface登记为独立可选模块，支持标准／摘要；保留原connection引用及既有全页唯一性 |
| `studioModel.ts` | 当前有序原型复用单一状态5秒／端口10秒读取；接口可见时消费端口，连接卡不再消费多余端口读取；旧比较页保持旧读取策略 |

模块身份映射为connection → 正式networkConnection，networkInterface → 正式networkInterface。旧布局补新模块默认显示偏好，但不擅自插行或改变已验收的位置；新“连接与接口独立”示例显式加入接口卡，旧布局可通过模块库添加。

显示解析补充：连接／接口的显式摘要在手机响应式拆行时为176px，变宽恢复保存的行高；这是运行时派生，不写回文档。标准形态、自动形态和桌面已有行高不因选择摘要被自动收缩。

**正式迁移注意**：本轮没有读取、覆盖真实ModuleSettings。原正式首页networkInterface默认显示；未来接入时必须遵循其原显隐值及默认语义，不能把原型旧布局中“尚未放入”机械转成正式用户隐藏。界面ID、原显隐键与服务端保存版本须明确映射，失败保留原配置。

地址与DNS主信息保持原含义；本机出口网关只放在连接详情，明确为补充信息，不增加设备上网路线或DHCP权限推断。IPv6缺地址使用“暂无地址”，不擅自解释为配置未启用。接口在线时长不代表互联网连续可用时长，链路UP不代表互联网正常。

没有启用旧源码中未实际生效的checkedPorts筛选，没有增加端口启停、接口配置写入或新的网络API。接口配置跳转在原型仍是安全目的页；设备入口复用隔离设备管理页。DNS／软件源“保存成功”仅证明fixture与原表单流程，刷新恢复合成示例，不代表真实配置成功。

其他首页控件仍按原业务清单逐项核对，不以本轮两组件通过推定NAS、存储服务、Docker、下载、远程域名、系统信息或应用安装流程全部等价。正式存储、服务端并发、ACL、当前路由器API、包／runtime一致性和实机安装验收另行完成，24小时观察继续延期。

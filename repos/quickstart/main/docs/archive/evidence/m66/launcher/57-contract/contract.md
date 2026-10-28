# M66.57 产品与原业务核对

当前工作树基线见baseline截图及protected-sources.json。旧视觉精修改动原样保留；不是重新验证历史发布或测试机。

| 默认入口 | 原来源：web/src/pages/index/nav/Item.vue | 能力／状态与动作 |
| --- | --- | --- |
| 内网配置 | onNetIP | 原action-netip向导，含DHCP／地址校验 |
| 终端 | onTTYD | feature(ttyd)，hostname＋配置TLS／port，默认7681，新页 |
| 固件更新 | onRenew／enableAutoCheckUpdate | feature(ota)，原LuCI ota入口；保留自动检查开关与needUpdate提示 |
| DNS配置 | onDNS | networkStatus.proto就绪后原action-dns |
| 软件源配置 | onSoftwareSource | 原action-softwaresource |
| 开启沙箱 | onOpenSandBox／onCloseSandBox／onNotSandBox | feature(sandbox)，stopped开启向导、running环境管理、unsupport说明 |
| 日志查看 | onLog | /cgi-bin/luci/admin/status/logs |
| 系统维护 | onsystem | /cgi-bin/luci/admin/store/pages/maintance（保留原路径拼写） |

现状差异：旧默认四应用，最多六项；工具列表仅假路由且不能收藏，编辑器为上／下按钮，无统一草稿拖动。

本轮目录只使用一个原型提供者，契约对应现有Quickstart /app/install-list/；不同时读LuCI /store/installed/。后端现有读取失败映射空列表的缺陷仍属正式集成前置，本原型明确区分错误与空且标合成，不宣称该API问题已解决。缓存随预览会话存在，读取仅首次／场景改变／主动重试，不新增轮询。

本轮原表单通过设计专用桥接复用。涉及重启／换地址的提交在原型拦截为明确模拟拒绝，避免原表单轮询真实地址；不修改原处理器。可安全在内存模拟的DNS、软件源及自动检查保留原请求契约。

24保存、当前显示容量、列数分开；默认推荐不覆盖旧收藏；卸载／未知入口保留位置；编辑独立历史上限30；两编辑器互斥。原布局／其他业务文件以当前工作树哈希保护。详见唯一规范R14／R18／R18A。

自检：八项动作来源、契约差异、允许改动与受保护清单已逐一核对。当前候选截图完成后标记M66.57技术通过；不代表后续交互或真实设备通过。

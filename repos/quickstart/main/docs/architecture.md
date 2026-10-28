# 代码结构

Quickstart 的正式页面由 LuCI 挂载，Vue 前端调用 Go 服务。LuCI 控制器、服务启动配置和
固件打包在独立的 [LuCI 集成仓库](https://github.com/linkease/nas-packages-luci/tree/main/luci/luci-app-quickstart)
维护，本仓库提供后端与 Web 资源。

| 位置 | 职责 |
| --- | --- |
| [`backend/cmd/backend/`](../backend/cmd/backend/) | 后端命令入口和 HTTP / Unix socket 服务启动 |
| [`backend/server/`](../backend/server/) | 网络、系统、存储、应用与首页配置等路由注册 |
| [`backend/modules/lancontrol/`](../backend/modules/lancontrol/) | 局域网设备管理接口 |
| [`backend/service/`](../backend/service/) | 业务逻辑与 OpenWrt 系统服务适配 |
| [`backend/internal/`](../backend/internal/) | 内部模块，包括首页配置存储 |
| [`backend/yamls/`](../backend/yamls/) | API 描述源；实际路由还需核对注册代码 |
| [`web/src/pages/`](../web/src/pages/) | 正式页面，首页入口为 `index/index.vue` |
| [`web/src/home/`](../web/src/home/) | 首页布局、组件、应用工具和配置客户端 |
| [`web/src/plugins/router/`](../web/src/plugins/router/) | 前端路由和 LuCI 基础路径 |
| [`scripts/`](../scripts/) | 构建、发布与验证工具 |

## 首页与设备管理

首页布局和应用工具配置由路由器端保存，相关接口在
[`home_config_routes.go`](../backend/server/home_config_routes.go) 注册，前后端测试共用
[`contracts/home-config.json`](contracts/home-config.json)。修改配置时应同步检查客户端、存储和契约样例。

设备管理正式页面位于 [`web/src/pages/device/`](../web/src/pages/device/)，提供设备、分组与计划、
局域网设置三个区域。后端由 `lancontrol` 模块注册接口，并调用系统适配逻辑。
网络编辑能力取决于本机 DHCP 分配权、系统权限和可选组件状态；页面不能只根据设备角色推断可写。

网络写入按用户任务划分事务，预览、应用和恢复状态由后端维护。相关约束见
[入口与迁移决策](adr/0001-single-product-surface-and-one-time-migration.md)和
[网络事务决策](adr/0002-task-scoped-network-transactions.md)。

## 预览与验证资料

`web/src/design/` 和独立 Vite 配置提供设计预览，正式构建入口为 `web/src/main.ts`。
仍在使用的浏览器检查脚本保留在 `docs/product/ui-design/`；历史输入与验证记录放在
`docs/archive/evidence/`，其中的设备状态只代表记录时刻。

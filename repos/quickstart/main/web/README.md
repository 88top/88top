# Quickstart Web

Quickstart 的 Vue 3 + TypeScript 前端，通过 LuCI 宿主页面接入 Go 后端。

依赖安装、构建、检查和 LuCI 联调方式见[开发指南](../docs/development.md)。
页面与数据流入口见[代码结构](../docs/architecture.md)。

`src/home/` 为首页组件，`src/pages/` 为正式页面；`src/design/` 是独立设计预览。
正式构建使用 `vite.config.ts`，设计预览使用 `vite.design.config.ts`。

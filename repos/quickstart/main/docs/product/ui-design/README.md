# 设计预览与浏览器检查工具

本目录保留仍被 `scripts/ops/` 调用的浏览器检查脚本，以及预览辅助文件。
当前 Vue 预览入口为 `web/src/design/` 与 `web/vite.design.config.ts`，运行方式见
[开发指南](../../development.md)。

过去的设计说明与逐轮评审已移入 `docs/archive/product/`；历史输入和输出位于
`docs/archive/evidence/`。部分检查需要 Playwright、已构建的 Web 资源或显式传入的测试设备参数，
不属于默认本地测试，也不能作为当前设备状态说明。

部分早期评审仍绑定历史规格版本，例如 `structure-spec-review.cjs` 要求布局规范 1.4，
而归档规范已更新为 1.7。这些脚本供追溯，不是当前版本的验收入口。

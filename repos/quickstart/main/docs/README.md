# 项目文档

面向使用者的项目介绍见 [README](../README.md)。参与开发可从以下文档开始：

- [开发指南](development.md)：环境、构建、检查和 LuCI 联调。
- [代码结构](architecture.md)：前后端入口、配置与系统集成边界。
- [架构决策](adr/)：单一设备管理入口和网络事务边界。
- [设备分类](device-brand-registry.md)与[图标来源](device-scene-icons.md)：识别规则和资源维护。

`contracts/` 中的 JSON 是测试共用样例；`product/ui-design/` 保留仍被工具调用的预览与检查脚本。

维护文档时，以当前源码、命令和契约为依据。阶段计划、部署流水、测试环境细节及外部产品调研放入
[历史归档](archive/README.md)，不作为当前功能说明。公开示例使用占位地址和虚构数据，不写入凭证、
真实设备清单或内部环境信息。

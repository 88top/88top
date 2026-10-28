# 本轮类型检查问题记录

来源为实际命令`rtk proxy /var/cache/build-cache/run.sh -- npm --prefix web run tsc`的工具输出，以下是人工整理，不冒充原始日志文件。

| 阶段 | 首次实际结果 | 修正及复验 |
|---|---|---|
| M66.21 | 退出2；旧MoveTarget含edge，不能传给仅接受Slot的选择器（TS2345） | 第1次优化收窄pendingSlot并在入口筛选；退出0 |
| M66.22 | 退出2；建议高度number或undefined，模板预览可能为null（TS2345、TS2531） | 第1次优化由有空值保护的方法处理；退出0 |
| M66.23 | 退出2；逻辑Column不含ActualColumn的source／slots／compact（TS2345） | 第1次优化样式函数只要求cards和split；退出0 |
| M66.24 | 当前候选退出0 | 第2次优化后再次运行退出0；第3次只改测试同步，无产品源码变化 |

每阶段优化总次数见status.md；类型和浏览器问题合并到同一次阶段优化，不分别扩展重试额度。

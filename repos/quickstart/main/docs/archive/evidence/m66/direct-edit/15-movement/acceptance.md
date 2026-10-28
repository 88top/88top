# M66.15 位置整理

任务树：统一命令→三类落点→整行排序→目标列表→取消/撤销/焦点→真实输入。验收：三种输入结果相同，五模板保持逻辑位置与ID；同时验证交换双方，失败不改变草稿；一次成功移动一步撤销，取消不留手势监听器。

实现：directLayout.ts只处理有限槽位/行间命令；OrderedHome的Pointer Events、点击和键盘共享此命令；编辑可见空槽保留逻辑slot索引，浏览态依旧隐藏；明确落点、目标列表、轻拖动浮层。没有拖动时自动拆列或递归嵌套，没有真实路由器请求。

检查：`rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules node docs/product/ui-design/direct-movement-review.cjs`。TypeScript退出0。首次测试在aria-disabled目标的Playwright自动可用性等待中超时；优化1将该拒绝场景改为实际坐标鼠标点击，产品规则未放宽。attempt-2通过20组；进一步补强五模板真实状态断言后，attempt-3仍通过20组，未修改产品源码。覆盖鼠标/点击/键盘等价、四示例行间、空位、紧凑摘要拒绝、自放回、Escape/pointercancel/失焦/resize和真实整行拖动，浏览器异常/外部请求0。M66.15自检通过，自动进入M66.16；后续输入完善与最终回归仍需在当前候选重跑。

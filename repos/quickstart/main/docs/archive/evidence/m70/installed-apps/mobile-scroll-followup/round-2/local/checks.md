# 第二候选本地验证

2026-10-19：通过SSD统一入口运行`node --test web/test/*.test.mjs`（128/128）、`npm --prefix web run tsc`（独立vue-tsc，exit 0）、`make build-web`（exit 0，只有原有v-deep弃用提示）。依赖链接仍位于SSD，显式Web产物在工作区web/dist，未声称wrapper自动迁移产物。

完整正式构建浏览器回归命令：`run.sh -- env NODE_PATH=/config/playwright-runner/node_modules QS_HOME_PINNED_REVIEW=1 QS_HOME_ENTRY_REVIEW=1 QS_HOME_NAVIGATION_REVIEW=1 QS_DESIGN_EVIDENCE_ROOT=docs/archive/evidence/m70/installed-apps/mobile-scroll-followup/round-2/local node docs/product/ui-design/home-production-review.cjs`。21组、7视图通过；包括实际生产布局/自然测量/返回代码、同数据5180参考、原业务弹窗、保存和失败草稿、布局撤销后读取恢复、后台停止读取。仅浏览器中模拟业务数据/配置响应，非当前设备验收，B另行记录。home-return截图已实际打开。

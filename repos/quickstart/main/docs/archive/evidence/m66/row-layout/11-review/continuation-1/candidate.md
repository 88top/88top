# M66.11 当前通过候选标识

2026-10-15，09:07 UTC完成本轮全部检查。源码仍在未提交工作树中，不能仅用Git HEAD代表候选。此文件只标识隔离Vue设计原型；不代表正式首页、软件包或设备版本。

- 公开入口：http://192.168.9.19:5180/
- 预览模式：`vue-design-built`，监听`0.0.0.0:5180`。
- 当前PID：21082；owner为本项目`docs/product/ui-design`。PID只表示此时服务，重启后应重新核验。
- 公开index脚本：`/assets/index.6686a018.js`。
- 实际下载脚本SHA256：`7936ad735ffe2e78e2dde20d450cf46611c5fd231d06f6184253b43753250800`。
- 前端源码变更后通过本项目生命周期脚本stop/start重建并预览，不依赖HMR；不触碰其他项目监听进程。
- 当前TypeScript、13组完整交互、24基准、42状态、9示例、13临界点、72权限点击、生命周期及48张PNG审计均通过，详情见[验收](acceptance.md)。
- 当前设计者人工审图通过；最终用户视觉/交互确认待完成，见[M66.12评审](../../12-design-signoff/review-guide.md)。

本轮UI改动仅为设计层权限说明弹层定位；取证脚本改为同宽扩展高度的真实内容捕获，正常视口图仍独立保留。既有用户工作树改动保留，未提交/推送、操作真实路由器、打包或发布。

## 本轮源码及检查工具摘要

```text
d2cad05bbed88e5211c445d8eb171e5a306384f6eb7f215e47630126e1f347aa  web/src/design/OrderedHome.vue
c06ac5b93effff415a8b33845b268255a767351e7cb0bf3b258478e8411de6d8  web/src/design/orderedHome.css
674f59114e55936be3d725390aaf8f9b3638fac984fc38bf66d47d8652fefdd1  web/src/design/orderedLayout.ts
f26ad36ea3888e1b627917af13d322f733226c0ecf84cda47b6c52192c1e7a19  web/src/design/CompactPreviewCard.vue
c75104f6d1cbaf776b94a8cf10323c54a9c93c64ecde24328f3ffb924bc8337d  web/src/design/LayoutPreviewCard.vue
c9e4ad8150d02423caa06cd2a13b413dfd6c58f13fdba7731e2d7fa094da0dba  web/src/design/layoutPreviewCard.css
06bb503b481070c722348fd00cb0662ba58eb37cda988a0e6c4186310fcdfbab  web/src/design/CanvasModule.vue
5174817953f205518932cfc3f153bc0ae7af2adf5e410273dbeac24d9ea327c8  web/src/design/HomeApplications.vue
21331e7b8069f74f761fab38e47eccfc5b8cc0d84d581a01afb412dfe465a03e  web/src/design/HomePreview.vue
0f5d58eb474da0432cc4166d69e06645b894d8887c9c6b9767f9d0334ed6bf1e  web/src/design/studioModel.ts
0abe31beb7ea20ed9ade7f3dbbf384e7ce18c8ed5e4d8201e006eaef52903662  web/src/design/fixtures.ts
63328f15e04773312ae1e3425d241a0c8984aec5e7fb0582548d7fcbc371d83f  web/src/design/devices.ts
c3697fd2ee0dcd0ba079f70e9605b41c20eb730357c42fa0cae97f7c4a975115  docs/product/ui-design/ordered-interaction-review.cjs
d79b19deeb888da4dfb01094c4834a0461fc32b43b796ae1588c2c0110751ebc  docs/product/ui-design/ordered-visual-review.cjs
a1c0eb9caeb448b606540d9f1b03e7cb4a09390b425946a3c4c3ab2842b74ed9  docs/product/ui-design/ordered-screenshot-audit.cjs
da64ce652d7c954439b41eecddfd47cefc6a3189714871adb43a84fc655eff96  docs/product/ui-design/ordered-authority-popover-review.cjs
08ef1a876221215468aa3790d37a75b00867c06fd4203c3880842669e3b98680  docs/product/ui-design/ordered-capture.cjs
9e4cde43b780b9e860902f7a1e6dc90727e0de5813d6f8818c69fa05a7613782  docs/product/ui-design/ordered-closeout-repro.cjs
```

# M66.18 当前就地编辑候选

2026-10-15。本轮功能/研究基线分别为3b2beca、d6860e3。标识采集时新变更尚在工作树，现已连同文档和证据归档为本地Git提交（未推送）；以包含本文件的本轮提交及下列源码摘要确定候选，不能用旧基线HEAD代指新界面。最终用户体验确认另行记录。

- 公开入口：http://192.168.9.19:5180/
- 实际health：mode=vue-design-built，PID=3302，owner为当前Quickstart仓库的docs/product/ui-design。
- 实际公开脚本：/assets/index.c2eb1cc1.js。
- 实际下载SHA256：4cad58b6fd59a7c6adb81e3396ef0e4a016863ba442c7b4ed00661499e1226a6。
- index.html当前只引用此入口脚本，设计CSS由构建入口打包；不声称生产runtime/IPK/API已更新。
- 构建输出：/var/cache/build-cache/users/911/projects/quickstart-df92025bd880/work/vue-preview，SSD backing /dev/nvme0n1p4；node_modules没有迁移。
- 服务生命周期通过本项目scripts/ui-design.sh管理，只停止归属当前项目的进程。修改源码后需stop/start重建，不依赖HMR。

最终技术检查见[验收](acceptance.md)及visual-final、current目录；原先候选的失败及通过记录保留。当前候选TypeScript、交互回归、24基准/42状态/13临界、72权限点击、48张PNG和采样/清理均通过；用户对新交互的最终体验确认仍未形成。

## 关键源码与验证工具SHA256

```text
5c5d1c433edcb4879416b5eed10a4e040b99ed3116ab8a0789fa40bb20a87eca  web/src/design/OrderedHome.vue
d876cc7a9e90a3aefcfeb71ca1344c16b8073f6a2c3499a88af4e8fac325f837  web/src/design/orderedLayout.ts
58330200baf7570b088837c7437f53b9a606241c5c326645b67fe2f8c055792d  web/src/design/directLayout.ts
815f348bbb706fd4e927baf030cc29131b6ef1287537ccbf99a120f083d75713  web/src/design/DirectEditPanel.vue
6d2c425bbbbafdc09e75d48267d0d19465c7e273eb0ee17ec49b48b49115ea4e  web/src/design/directEdit.css
c75104f6d1cbaf776b94a8cf10323c54a9c93c64ecde24328f3ffb924bc8337d  web/src/design/LayoutPreviewCard.vue
c9e4ad8150d02423caa06cd2a13b413dfd6c58f13fdba7731e2d7fa094da0dba  web/src/design/layoutPreviewCard.css
f26ad36ea3888e1b627917af13d322f733226c0ecf84cda47b6c52192c1e7a19  web/src/design/CompactPreviewCard.vue
5174817953f205518932cfc3f153bc0ae7af2adf5e410273dbeac24d9ea327c8  web/src/design/HomeApplications.vue
0f5d58eb474da0432cc4166d69e06645b894d8887c9c6b9767f9d0334ed6bf1e  web/src/design/studioModel.ts
0abe31beb7ea20ed9ade7f3dbbf384e7ce18c8ed5e4d8201e006eaef52903662  web/src/design/fixtures.ts
63328f15e04773312ae1e3425d241a0c8984aec5e7fb0582548d7fcbc371d83f  web/src/design/devices.ts
ee4dd3bd234b29c5ee331648c6bd3e93205c81300153f01e892868d847875c6b  docs/product/ui-design/direct-editor-review.cjs
29a61380e03f4850c00472e70dc9c4993e4c7fe3ebee920642dac7a72b2ed7a8  docs/product/ui-design/direct-movement-review.cjs
90ebcb8fb797423cf7615a1679f3d9bd32fc55f23ed84de56e9b9acc4b5a74e7  docs/product/ui-design/direct-layout-review.cjs
0f8646ddd0819ede3de245c75b7ba18903a5db7589e4eebab1fba5c9d53ed597  docs/product/ui-design/direct-input-review.cjs
11f7e6b6bd871013011bf91827f4bac20fad7acede655f193cc000b93c2ad2eb  docs/product/ui-design/direct-visual-review.cjs
95b95ca4510be74552bb68ec0f30ff91f28e50f4817ccb2ff03e196e7d876c4c  docs/product/ui-design/direct-resource-review.cjs
c1cb98705c083ef8138d21dec22199639352a280a2aa58fb7266ec137ee8996c  docs/product/ui-design/direct-final-regressions.cjs
bbd0381ea83da86f91ff15946d31294672880dff816c1b9d7ed1d51591d15aad  docs/product/ui-design/direct-test-utils.cjs
08ef1a876221215468aa3790d37a75b00867c06fd4203c3880842669e3b98680  docs/product/ui-design/ordered-capture.cjs
a1c0eb9caeb448b606540d9f1b03e7cb4a09390b425946a3c4c3ab2842b74ed9  docs/product/ui-design/ordered-screenshot-audit.cjs
da64ce652d7c954439b41eecddfd47cefc6a3189714871adb43a84fc655eff96  docs/product/ui-design/ordered-authority-popover-review.cjs
```

# M66.63～M66.68 当前候选验收

状态：全部阶段技术通过，等待用户人工美感与易用性确认。范围仍是5180隔离Vue原型；没有真实设备、持久化、软件包安装、发布或24小时观察的通过结论。

最终结果在[optimization-2/handoff-review.json](optimization-2/handoff-review.json)：28套318组当前浏览器检查、16组模型检查通过。341个当前冻结保护文件、64个原业务源码文件保持不变。TypeScript无输出检查、Git差异空白检查及文档本地链接检查通过。旧263组不作为本轮验收；原22套已对本轮实际静态候选重新执行。

| 里程碑 | 当前达成与证据 |
| --- | --- |
| M66.63 | 规范1.7 R18B～D、架构与任务树统一；[契约](../63-contract/contract.md)、源码保护清单、固定视口基线；0/1/6/8/24旧收藏在最终候选再次检查 |
| M66.64 | 来源与首页引用分开，同ID去重、稳定排序、全库查询；0/8/35/120完整库、命名空间、24/64/48边界由当前16组模型和浏览器验证 |
| M66.65 | 默认全部、宽浮层网格、全库搜索、轻筛选、单一滚动与分页；35/120、键盘／触摸与焦点通过；当前24屏宽／语言／主题矩阵无非预期溢出／缩字／菜单侵占 |
| M66.66 | 链接添加／编辑／删除与固定分离；取消无副作用、恢复默认保留库、删除同步清理固定引用；实际64次表单保存、65拒绝、释放容量及49项后定位通过 |
| M66.67 | 目录错误／权限／未知／卸载与恢复、异步过期、跨屏草稿与互斥、原收藏拖动回归；20次完整库循环和20次收藏循环、后台与卸载清理通过 |
| M66.68 | 新旧28套对同一冻结构建通过；公开3份资源与受测源码／脚本哈希一致；当前主要截图审图、覆盖映射、人工体验卡与正式交接已交付 |

[完整套件汇总](optimization-2/suite-results.json) · [当前模型](../../../../../evidence/m66/launchpad/68-review/optimization-2/model/report.json) · [24组新矩阵](../../../../../evidence/m66/launchpad/68-review/optimization-2/launchpad-matrix-review/report.json) · [真实容量边界](../../../../../evidence/m66/launchpad/68-review/optimization-2/launchpad-capacity-review/report.json) · [源码与资源指纹](optimization-2/candidate/candidate.json) · [规则覆盖](traceability.md) · [主要截图审图](visual-review.md)。

当前入口：http://192.168.9.19:5180/?layout=ordered 。点击应用与工具“全部”；35项示例加scenario=apps-35，120项加scenario=apps-120&favorites=24。PID25151，监听0.0.0.0:5180。入口/assets/index.3b9bda7d.js，SHA256为2fb65c96197f4ad1392ffd870ccd96a2ed6b385865787784ffe84922d8060ba7；其余CSS与业务分块校验见指纹。输出位于本工作树SSD work/vue-preview，正式web/dist未覆盖。

本阶段共2次优化：[优化1](optimization-1.md)修正42px点击区域并隔离用户链接身份；[优化2](optimization-2.md)修正第49条之后保存结果未定位。初始失败、前候选27套313组通过与扩展复现失败均保留，不覆盖成最终通过。前阶段截图工具、测试定位及原路由模块监听边界修订分别记录在各阶段，不伪装产品修复。

人工体验：[体验卡](review-guide.md)；正式开发：[交接](development-handoff.md)。当前自定义链接／收藏导航保留、刷新恢复示例；真实目录失败语义、ACL、持久化与实际安装入口必须在正式集成重新验证。用户已要求归档实现和证据；受测指纹保留提交前工作树状态，不是发布候选，见[提交说明](../commit-note.md)。

重复验证使用RTK＋SSD缓存入口：

```sh
rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules QS_DESIGN_EVIDENCE_ROOT='新的证据目录/candidate' node docs/product/ui-design/slot-candidate.cjs
rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules QS_DESIGN_EVIDENCE_ROOT='新的证据目录' node docs/product/ui-design/launchpad-final-runner.cjs
```

运行期间不得更改受测源码或重建服务。完整交付检查还需同目录model、protection、original-business报告后执行launchpad-handoff-review.cjs；所有脚本见docs/product/ui-design，新的证据目录保留旧报告。

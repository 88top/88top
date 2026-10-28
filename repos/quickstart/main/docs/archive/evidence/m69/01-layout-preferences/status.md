# M69.1 当前执行状态

起点：2026-10-18，`d1fa2a6`，工作区干净。此后新增证据只对应本轮候选。

- 已完成：读取交接产品/视觉/布局与历史证据，核对正式首页和原型分离现状；发现本地HEAD与交接hash不同。
- 当前重新核验：B只读系统/包/路由信息完成；系统24.10.1/6.6.86，包记录后端0.9.9-r1、LuCI0.8.17-r1，未列出netpolicy；运行版本/API/UI待核验。
- 尚未完成：正式持久化/迁移/编辑接入、十一控件真实数据/动作、当前登录态UI、runtime/SDK/安装。
- 已解决的重要决定：用户随后确认只有root登录，每台路由器共用一套自定义首页，所有登录者读写同一配置；不做账号/浏览器独立首页。此前相关暂停已解除。

任务树、标准和方案见[正式首页契约](../../../product/quickstart-home-production.md)。旧M66/M64证据不累计为本轮结果。

## 当前接入进展（后续状态）

M69.1/B 的生产 root 会话鉴权、路由、一次迁移、正式编辑器、独立域保存与恢复已编码并通过本地定向测试；当前首页已替换。下文“尚未注册/尚未接入”描述的是基础初检时间点，现由 [M69.2](../02-business/status.md) 和 [M69.3](../03-current-acceptance/status.md) 的较新状态覆盖。B 真实部署和包安装仍不能沿用基础结果。

## 基础初检与验证（历史时间点）

M69.1/A的配置基础实现及本地自检完成；**M69.1整体尚未完成**，没有注册生产路由或替换正式首页。

| 实现 | 当前证据与边界 |
|---|---|
| `backend/modules/homeconfig` | 布局/启动台类型化、严格字段与重复JSON键/体积/深度校验；独立域、generation+revision、flock并发、无变化不写、0600、fsync/rename、首份及后续有效备份；损坏/未来只读；显式备份恢复保留损坏文件并换generation |
| HTTP handler | 注入式授权且默认拒绝，HTTP状态及错误分层、请求大小、JSON类型/Origin检查、不返回底层敏感错误。尚无生产LuCI权限Adapter和路由注册；mock授权测试不能代替真实ACL验收 |
| `web/src/home/configContract.ts`、`configClient.ts` | 独立严格请求，不改变旧请求层；POST结果不明时仅GET核对，不重放写入，不修改调用方草稿；尚未接入正式编辑器 |
| 共享布局纯逻辑 | 8个模型从design抽到`web/src/home/layout`；design原路径再导出并保留示例/内存会话。生产模型不读URL、不导入fixtures或业务请求；默认五行与产品样例完全一致 |

测试结果：

- [后端全量](../../../../evidence/m69/01-layout-preferences/backend-all.log)通过；此后首份备份增强由[最终定向race测试](../../../../evidence/m69/01-layout-preferences/storage-http-tests-final.log)再次通过。目录内含26个共用契约子场景及存储/HTTP故障测试；只读/满盘等通过写入seam注入，不冒充实机掉电/满盘验收。
- [前端全量](../../../../evidence/m69/01-layout-preferences/frontend-all.log)100项通过，含新增35项配置契约/请求测试；[TypeScript](../../../../evidence/m69/01-layout-preferences/types.log)通过。
- [共用模型7组](../../../../evidence/m69/01-layout-preferences/shared-model-regression/report.json)、[边界10组](../../../../evidence/m69/01-layout-preferences/extraction-boundaries/report.json)、[结构交互8组](../../../../evidence/m69/01-layout-preferences/extraction-interactions/report.json)通过；后两套来自当前构建临时5181，共18组浏览器场景。只改变测试工具的可选base URL，不删除断言；不是新正式页面验收。
- [正式构建](../../../../evidence/m69/01-layout-preferences/production-build.log)与[设计构建](../../../../evidence/m69/01-layout-preferences/design-build.log)通过；正式产物为原Makefile指定的`web/dist`，设计产物为SSD `work/vue-preview`，依赖和Go缓存位于SSD。缓存wrapper不自动改变正式输出目录。
- `make test-ops`退出0，输出含主网关保护、实验室清理、候选安装回滚及ops contract通过；它不表示实际设备已安装。
- [当前候选指纹](candidate.json)：57份源码/测试/契约与3份实际公开资源已核对，正式业务原路径及backend/service/server保持HEAD原样。源码未提交/推送。构建现有的`:deep`弃用和设计CSS calc空格警告保留，不扩大修改无关组件。
- 实际打开了边界桌面/手机截图：手柄和原网络字段保持。手机边界图是在resize后的采样/动画中间态，不能据此证明曲线绘制；不以该图宣称图表或正式视觉完整验收。

## 当前设备事实

[B第三次预检](current-b-20261018-attempt3/preflight.json)和[UI报告](current-b-20261018-attempt3/ui.json)：

- 实际运行文件`quickstart version=0.9.9`，与旧包记录一致；CLI/Web/词典哈希已记录。
- 真正经LuCI cookie的设备清单/路由上下文/设备流量v2及新首页配置均404；应用目录200且为6项。
- 临时session补齐目标固件所需username/token、ubus/access-group/uci ACL后，1440/390首页和设备深链截图无过期遮罩/页面错误；设备深链仍没有当前设备管理产品界面，手机截图主体为空。**这是旧安装基线，未通过当前版本验收**。
- 已实际打开桌面首页、手机设备深链原图。所有临时session已销毁，没有修改密码、部署/重启、路由或网络策略；A/C/D未操作。
- 5180健康信息表明归属另一工作树`0153-device-lists-sho`，源码HEAD `82f9935`且工作树干净；未停止它。当前工作树仅使用独立5181做抽取回归，验证PID/cwd/cmdline归属后已停止临时服务。

失败与工具修正保留在[失败记录](failures.md)和各attempt目录，不合并为产品通过。

## 尚未完成与下一阶段

重要作用域问题已由用户答复：只有root，每路由器共享一套配置。真实会话过期与多个root会话并发仍需处理，无需新增角色/账号配置能力。

已完成上述模型、存储、请求及设备基线准备；下一步M69.1/B的依赖暂停已解除。用户本轮要求先查看当前5180产品并给出改动/实施方案；[实地复核](../production-plan-20261018/acceptance.md)与[细化实施工作包](../../../product/quickstart-home-production.md#5180当前产品复核与正式实施细化)已补充。按真实LuCI身份核验→路由注册→旧配置一次迁移→正式编辑保存/刷新/错误/恢复→M69.2十一控件真实业务与设备卡→M69.3同数据视觉对照和当前B验收→M70干净候选/包链路推进。

未完成正式配置存储启用、浏览器可信缓存、原组件显式外壳迁移、正式设备卡、当前候选安装、SDK/IPK/APK或24小时观察。没有推送/上传Release/触发Action；不能把本阶段基础测试记作完整实施收口。

# 模块形态原型到真实业务：开发交接

产品规则以[规范1.2](../../../../product/quickstart-home-layout-interaction-spec.md)为准，架构依据见[架构参考](../../../../product/quickstart-home-widget-presentation-architecture.md)。当前只是隔离原型；候选源指纹见[candidate.json](candidate.json)。

## 实际代码落点

| 文件 | 实际职责 | 正式接入建议 |
|---|---|---|
| `web/src/design/widgetPresentation.ts` | 十模块真实形态、位置角色、属性校验、容器解析、列宽与所需高度 | 抽取为正式前端共用纯逻辑，不另写选择器／CSS门槛 |
| `web/src/design/homeDocument.ts` | schemaVersion、revision、完整文档快照、迁移、DisplayPlan、摘要替代及失效检查 | 复用函数契约；将Vue内存session和纯模型分离，再接真实存储适配器 |
| `web/src/design/slotLayout.ts` | 唯一性、槽位命令、显式保留项和完成前整理 | 现有旧接口兼容；新展示预检使用统一契约，不只读旧固定minHeight |
| `web/src/design/OrderedHome.vue` | 子草稿、显示设置、三类放入协商、完整撤销、输入及原有行排序 | 生产页沿用事务边界；不要复制成第二套操作语义 |
| `PresentationSettings.vue`／`presentationEdit.css` | 形态缩略选择、类型化行数选项及影响说明 | 保留轻量交互与键盘／触摸语义 |
| `HomeApplications.vue`／`homeApplications.ts` | 启动条／网格、容量与更多、独立常用项清单 | 使用真实应用清单；URL favorites参数只是原型夹具，不能照搬为正式偏好加载 |
| `LayoutPreviewCard.vue`／`CanvasModule.vue`／`CompactPreviewCard.vue` | 依解析结果渲染，设备共享库存／状态／权限 | 接同一库存及DevicePresentation投影，避免新形态另起发现或流量请求 |
| `studioModel.ts`／`fixtures.ts` | 共享原型读取和合成状态 | 正式代码使用项目请求层及真实接口；fixture成功不是设备业务证据 |

这些文件中仍有设计会话、URL示例与旧渲染适配。可复用的是经过测试的规则和函数契约，不能整包复制设计入口到生产；正式抽取应解除对location／合成数据／设计session的依赖并重新验证。

## 实际契约及规格

- 文档为`{schemaVersion:1, revision, rows, widgetPreferences}`；WidgetId仍全页唯一，隐藏模块偏好保留。旧rows补默认偏好，未知版本／非法属性给诊断并保留原输入。
- 用户偏好为auto或明确形态及有限iconRows；当前普通槽自动采用应用grid／其他standard，上下小槽按已登记summary，需改变指定形态时给显式替代，不悄悄修改无关自动偏好。
- `resolvePresentation`与`presentationHeight`只计算；`planDocument`产生ready／needs-confirmation／blocked和候选文档；`applyPlan`检查revision、文档指纹及宽度／常用项上下文。普通库存刷新不改布局版本；真正影响适配的输入变化须重新预览。
- 完整文档最多30步撤销。常用项内容与顺序仍独立管理，显示行数不删除常用项。将来若把清单内容编辑纳入首页“完成”，必须一起扩展事务，不能只回滚布局。
- 实测图标网格：94px外壳空间、82px单元、12px间距；充足空间下双行270px、三行364px。启动条为横向56px单元、最低150px。它们是本轮Vue／CSS规格，换字体／间距后须重测。
- 设备摘要包含统计、必要状态及权限入口；最低为宽度≥450px时260px、窄于450px时280px，最小宽度240px。普通标准设备列表最多6项，并按容器有界减少。摘要不开放上下小槽。

## 正式开发前需确定，当前未冒充已决定

1. 偏好作用域：按路由器／账号／浏览器，是否多人共享及同步。原型内存模式不能决定它。
2. 真实保存：先检查已有设置能力，再定接口、ACL、服务端并发版本、schema支持范围、保存失败提示、损坏备份／恢复；不预造后端路径。
3. 兼容与迁移：旧后端及旧偏好如何局部可用、明确不兼容；旧配置一次迁移及回退；禁止把404当空清单。
4. 实际业务：正式设备身份、观察范围、在线状态、DHCP分配权、可选限速服务各用现有接口语义；需要当前版本、当前登录态和当前设备的证据。
5. 构建发布：干净已提交源码候选、前后端版本、runtime、IPK／APK及实际安装版本一致；按原SDK Builder流程构建，匹配架构安装并做API与真实页面Smoke。不得用原型、编译或包生成成功替代。

建议后续业务阶段单独拆分“偏好作用域及存储契约 → 正式共享模型／数据接入 → 页面集成及迁移兼容 → 打包安装与当前设备验收”。执行前解决需要产品决定的存储语义；本轮不授权推送／上传／Action，也不重启或部署任何路由器。24小时观察仍按用户要求独立延期。

## 可复用验证

纯契约、迁移、原子计划及过期拒绝用例可迁到正式模型；应用／设备／协商浏览器用例改用受控真实环境，再执行当前候选检查。新增真实存储失败、并发覆盖、权限及旧版升级用例；继续保留输入、响应式、资源和实际PNG审图。当前所有通过项仍是设计fixture环境。

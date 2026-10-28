# 系统资料阅读区验收

2026-10-20，第一轮产品候选通过。任务与验收标准见[任务树](status.md)，当前规则已替换[正式首页规范](../../../product/quickstart-home-production.md)中的旧横排时间对齐规则。

## 实施结果

- 四项资料均为上标签、下数值，型号/固件全宽，内核在固件下方；时间/时长按资料区域实际宽度296px拆列，窄时上下排。
- 标签12px、值14px、标签到值4px、组间16px，四个16px线条图标。型号蓝、固件绿，其余中性；去掉冒号、缩进及旧资料块的背景/边框规则。
- 组件拥有资料结构和样式，正式首页与完整信息弹窗共用；清理正式/设计正文CSS中的过时覆盖。业务脚本只增加纯图标组件导入，五项原绑定、三图模板、计算、动作、请求owner与定时器不变，见[business-protection](round-1/business-protection.json)。

## 当前候选验证

1. 单独vue-tsc与Web构建通过，SSD包装器已核验；实际产物仍在项目web/dist。与上一B候选5c1ecec相比，压缩包仅index.js/style.css变化，其余文件一致，见[build](round-1/build.json)。
2. 本地正常4组/8个首页与详情视图通过；另4组/8视图验证超长型号、版本、内核、带时区日期与999天时长。两套均检查280/295/296/340px拆列边界、字号/间距、文本与实际叠加背景对比度≥4.5、无横向溢出；见[正常](../../../../evidence/m70/system-facts-design/round-1/local-composited-background/report.json)、[长值](../../../../evidence/m70/system-facts-design/round-1/long-values/report.json)。
3. 当前B真实root登录态16组/32个首页与详情视图通过：中英×深浅×1440/768/390/320。完整形态和语言仅浏览器投影，不修改路由器偏好，不重放HTML；断言实际语言和可见文案，见[current-b](../../../../evidence/m70/system-facts-design/round-1/current-b/report.json)。菜单、Escape、滚动解锁、控制台及请求边界检查通过，无业务写入。已有kai.png404按既有明确白名单记录，不隐瞒为零HTTP错误。
4. 本地与B各五组延迟/部分加载/失败/显式重试通过，保留模糊结构、真实值返回后解除模糊、正常默认形态高度稳定；B宽屏标准271→271px，768标准454→454px，390摘要153.984→153.984px，320英文摘要183.984→183.984px，失败和重试仍271px。加载测试现也断言实际英文，见[本地](../../../../evidence/m70/system-facts-design/round-1/loading-local/report.json)、[当前B](../../../../evidence/m70/system-facts-design/round-1/loading-b/system-loading/report.json)。这不是任意长内容或窄屏强制完整形态绝不增高的承诺；长值保留完整显示并自然增高。
5. 已打开并审查当前B桌面完整卡片深浅主题、1440详情资料、390英文详情、320英文深色资料、加载模糊及手机摘要截图，也检查本地窄屏完整弹窗和超长值。桌面卡290→271px，桌面详情876.578→822.594px；320英文强制完整形态890.5→936.5px，因上下字段自然增长，默认手机摘要不变。未以削减字段或裁剪来控制高度。

## 失败与轮次

保留[首个local失败](../../../../evidence/m70/system-facts-design/round-1/local/report.json)及failure.png：测试脚本将rgba(136,136,136,.133)当作不透明灰色，误判深色弹窗内核文案对比度。修复为沿祖先背景alpha叠加，再按同一4.5阈值验证通过；没有为测试修改产品颜色或删除断言。只有一个产品候选，无第二/第三轮产品优化。

## 当前设备与交付边界

B为iStoreOS24.10.1/2025052311、kernel6.6.86、x86/64。已部署已提交前端67b6546a2a7f36b5ccf08d9fbba587d84eeeb363，资源键`0.16.6-test20261018-preview-67b6546-05afdb6a42d7`。后端c9624a3/0.16.6、opkg0.16.5记录保留；本次是快速前端替换，不是新包安装或SDK验收。私有回退备份路径见[deployment](round-1/deployment.json)，原文件和模板均保留。

四个公开资源SHA与冻结候选一致，见[public-resources](round-1/public-resources.json)。最终20项受保护路径、LAN地址和默认via192.168.30.1严格一致，无配置例外，见[preservation](round-1/preservation-final.json)。Quickstart serve9386/startdhns14546/FastNet10304、配置/脚本/二进制/包记录及LuCI语言zh_cn不变；NetPolicy仍disabled/stopped，见[runtime](round-1/runtime-final.json)。基线、正式UI和加载UI共6个短期root会话全部销毁，凭据未归档。

5180设计服务未重建，未触及后端、网络策略、其他设备、SDK、新安装包、Git push、Release或Action。旧原型/旧时间对齐证据完整保留，不作为此候选通过结论。

效果截图：[桌面](../../../../evidence/m70/system-facts-design/round-1/current-b/zh-light-1440-home.png)、[手机英文资料](../../../../evidence/m70/system-facts-design/round-1/current-b/en-light-390-detail-facts.png)、[深色](../../../../evidence/m70/system-facts-design/round-1/current-b/zh-dark-1440-home.png)。

# M66.81 当前候选收口

状态：通过。28套291组当前候选核心回归、额外41组可读性/复杂状态检查、交付核验及开发者实际审图通过。用户人工审美确认独立待完成。下方是本轮真实结果，不引用前轮380组替代。

## 当前实现与边界

七控件内部构图完成：系统指标/资料两区；存储/下载/远程紧凑原生服务选择；地址/目录完整宽度；Docker状态主体；网络地址分组；磁盘名称与操作同排、容量与用量成组。左菜单、五行默认结构、布局事务/形态/尺寸意图、原业务字段/条件/动作/请求节奏/图表保持。

运行文件仅正文CSS、网络展示类、设计Vite接入及新增无状态构建期 `widgetComposition.ts`。原64业务文件未写入；346冻结文件及8份原脚本/模板绑定核对通过。原型数据与偏好仍为合成/内存，未做真实设备、API集成、安装包或长期观察；未提交、推送或发布。

## 当前证据

- [28套291组结果](optimization-1/suite-results.json)：六宽×两语言×两主题、七控件形态/长值/异常、原生键盘、真实触屏、原业务/表单、网络隐私/修复、应用完整库、排序/边界/结构、原图表与资源回归。
- [额外41组可读性及状态复核](../../../../../evidence/m66/widget-composition/81-review/optimization-1/readability-and-states/report.json)：实际遍历正文文本校验至少12px与4.5:1对比度，六宽/两语言/两主题、加载/空/失败/旧快照/权限/能力缺失等场景，以及当前告警可读性；必要边界/焦点至少3:1、触屏44px另有核心检查。报告problems为空，不以截图代替可访问性核验。
- [源码与原绑定保护](../../../../../evidence/m66/widget-composition/81-review/optimization-1/protection/report.json)、[64原业务文件](../../../../../evidence/m66/widget-composition/81-review/optimization-1/original-business/report.json)。选项由div转为原生button只新增aria-pressed，原选择表达式/回调/条件保持；网络脚本和绑定逐字/逐项保持。
- [实际源码/测试/公开资源](optimization-1/candidate/candidate.json)及[交付核验](optimization-1/handoff-review.json)：当前PID15918、3份JS/CSS、SSD输出、源码/检查指纹、TypeScript及差异检查一致。
- [资源检查](../../../../../evidence/m66/widget-composition/81-review/optimization-1/widget-body-resource-review/report.json)：20轮真实切换后时钟2、visibility监听14、resize监听8、图表4维持基线；原一次读取仍为1，远程3秒/系统5秒节奏保持；后台暂停、实际卸载后全部归零，日志有界120项。
- [实际审图记录](optimization-1/visual-review.md)与[14张前后对照及体验任务卡](optimization-1/review-guide.md)。实际打开逐卡原图、整行、整页、长文本及失败/修正图，未以“截屏成功”代替审图。自然高度的增加/减少及原因均记录。

## 失败与修正

首轮真实粗指针检查发现多操作换行后的磁盘告警越出手机左侧，见[失败报告](../../../../../evidence/m66/widget-composition/81-review/access-initial/report.json)与原图。优化1仅调整该场景气泡锚点；[当前触屏检查](../../../../../evidence/m66/widget-composition/81-review/optimization-1/widget-composition-access-review/report.json)和[修正图](../../../../../evidence/m66/widget-composition/81-review/optimization-1/widget-composition-access-review/320-touch-disk-warning.png)通过。未删字段、改字号、取消断言或修改布局换取通过。

完整编排进程在26套通过后收到SIGTERM、退出143；原因未确定，不标为产品失败也不标为整体通过。保留[中断清单](optimization-1/interrupted-suite-results.json)和[中断记录](optimization-1/runner-interruption.json)，补跑前核对原候选所有运行源、各套测试实现和公开资源指纹完全一致，再完成原本缺失的整行排序/结构资源两套。最终28套291组均有实际通过报告，见 `continuation/` 与汇总，不采用历史候选拼接。

对照导出脚本只调整并列展示画布与原图宽度；未改运行源码或浏览器检查实现。保留[测试开始指纹](optimization-1/candidate/test-start.json)，交付时更新验证工具清单并核对所有运行源/实际资源仍一致，不重跑已通过且未变化的28套。

## 可重复入口

预览使用 `rtk proxy bash scripts/ui-design.sh start`，重建前先确认归属，再通过同脚本stop/start；不停止他人服务。开发机入口为 [5180首页](http://192.168.9.19:5180/?layout=ordered&scenario=business-all)。

```sh
rtk proxy /var/cache/build-cache/run.sh -- env NODE_PATH=/config/playwright-runner/node_modules QS_DESIGN_EVIDENCE_ROOT=docs/archive/evidence/m66/widget-composition/81-review/recheck node docs/product/ui-design/widget-composition-final-runner.cjs
rtk proxy /var/cache/build-cache/run.sh -- env QS_DESIGN_EVIDENCE_ROOT=docs/archive/evidence/m66/widget-composition/81-review/recheck/protection node docs/product/ui-design/widget-composition-protection.cjs
rtk proxy /var/cache/build-cache/run.sh -- env QS_DESIGN_EVIDENCE_ROOT=docs/archive/evidence/m66/widget-composition/81-review/recheck/original-business node docs/product/ui-design/business-source-review.cjs
```

长任务应使用项目归属明确的持久执行器，避免终端寿命导致中断；不要复制本次专用于恢复这两套的脚本来接受另一版本证据。后续新候选使用新的证据目录，不能覆盖当前基线或将历史结果认作当前通过。交付核验还需当前candidate、对照图与真实审图记录，不能只运行一个命令便宣称审美通过。

# M66.78 存储服务构图

状态：通过，优化1次。原服务Vue及脚本不写入；设计构建把三个原选择元素变为原生button，保留全部原表达式/回调，增加键盘和aria-pressed。选择区宽卡约95→57px，窄卡保留图标/名称/状态，地址字段改为上下结构。

初次浏览器构图7组、业务/表单32组、长数据3组通过，但实际审查[320px长SAMBA原图](../../../../../evidence/m66/widget-composition/78-storage/long/320-sharing-long.png)发现旧:is选择器优先级导致窄条目仍两列。视觉判定未通过，保留原图；优化1修正限定选择器，并加入“地址和目录必须上下且占完整宽度”的几何断言，未删除字段或减字号。

当前[构图/键盘7组](../../../../../evidence/m66/widget-composition/78-storage/optimization-1/report.json)、[长文本与真实上下条目3组](../../../../../evidence/m66/widget-composition/78-storage/optimization-1/long/report.json)通过；[业务与原表单32组](regression/suite-results.json)在同业务模板下已通过，最终阶段会对最终候选重跑。冻结346文件、七原脚本/绑定保护通过，最终候选再次核验。[当前版本指纹](optimization-1/candidate/candidate.json)。

实际打开宽卡、SAMBA切换、手机深色及[修正后长SAMBA](../../../../../evidence/m66/widget-composition/78-storage/optimization-1/long/320-sharing-long.png)：选择区不再压过正文；宽卡共享表可比较，手机每个共享按地址→目录阅读，无细长双列。只读地址与目录链接仍不同；标题组/完整清单/配置保持。自然高度由真实内容决定，不填假内容对齐磁盘卡。

视觉检查：主次、长值可读性改善；原动作与主题可读性保持。开发者审图通过，用户最终审美待确认。

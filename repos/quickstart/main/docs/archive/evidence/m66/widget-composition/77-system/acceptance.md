# M66.77 系统信息内部构图

状态：通过，未进入优化循环。当前候选[指纹](candidate/candidate.json)，隔离设计构建在SSD输出，原系统Vue文件未写入。

实现：原三个150px圆环集中，右侧设备型号、固件/单独内核行、时间与启动时长形成资料区；容器840px以下上下排列，已认可自动紧凑与显式完整保持。只通过设计构建重排模板及样式，未增加图表、业务计算或读取。

验证：[构图5组](../../../../../evidence/m66/widget-composition/77-system/report.json)、[原三图/阈值/形态/入口9组](../../../../../evidence/m66/widget-composition/77-system/functional/report.json)、[真实容器839/840/841及559/560/561/320px共7组](../../../../../evidence/m66/widget-composition/77-system/boundaries/report.json)、[浏览器合成长文本3组](../../../../../evidence/m66/widget-composition/77-system/long/report.json)通过。长数据仅在浏览器测试装饰原fixture响应，不修改请求节奏或产品源码。

实际打开浅/深色宽卡、手机显式完整与长型号原图。相比[基线](../../../../../evidence/m66/widget-composition/76-baseline/1440-light-system.png)，[新版宽卡](../../../../../evidence/m66/widget-composition/77-system/1440-light-zh-system.png)三指标形成稳定整体，资料不再在下方铺两层，正常数据卡高约420→291px；减少的是分散排布所需空间，不是删字段或缩字号。手机完整形态仍可自然增高，[原图](../../../../../evidence/m66/widget-composition/77-system/390-dark-system-full.png)无滚动或裁切；默认手机仍自动紧凑。

视觉复核：重心/阅读顺序改善，字段/动作可读性保持，浅深主题均可读；长型号会增高但不侵入指标区。开发者审图通过不等于用户最终审美确认。

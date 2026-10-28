# M66.51 当前基线与视觉规则

技术检查通过，2026-10-17。基线HEAD为`fc9df26`，工作树已有用户要求的里程碑规划文档。

任务完成：读取11控件与公共CSS；冻结121个实现文件；采集当前默认五行浅深主题／320px手机与旧services对照；补充唯一视觉规范VS08。未改运行源码。

当前[5组浏览器检查](../../../../../evidence/m66/visual-refinement/51-baseline/report.json)通过，页面／控制台错误和意外外部请求为零。默认11项唯一且按指定五行排列；手机不改写布局文档、不新增卡内滚动。[121文件保护](../../../../../evidence/m66/visual-refinement/51-baseline/source/report.json)通过。实际资源3项与SSD产物逐项SHA一致，77个运行源码指纹见[candidate](candidate/candidate.json)。截图为本次实际采集，浅深主题供后续同条件比较；已审看深色基线，原服务色块与系统彩色面板确有不协调问题。

11项映射及动作清单沿用[统一规范的接入对照](../../../../product/quickstart-home-widget-visual-standard.md)：traffic原曲线；connection／networkInterface独立网络卡；applications常用／全部；devices库存摘要；storage磁盘与RAID；sharing三共享服务；docker启停／迁移；downloads三下载服务；remote动态域名；system三图与系统字段。状态与API沿用各独立实现。

保护策略：所有列出的原业务文件及设计TS逐字节不变；设计Vue只允许style块变化／新增style引用，script及template必须不变。共享视觉令牌、边框／字体／间距由VS01～VS08定义，几何与行为检查随阶段执行。保护结果不是设备验收，人工审美尚待最终候选。

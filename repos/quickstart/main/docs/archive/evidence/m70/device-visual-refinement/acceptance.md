# 设备页业务点彩：第三候选通过并更新 B

2026-10-21。前端源码 `599bfa8a23d4d36065cdf9cf5b791abe18423cd8`，资源键 `0.16.6-test20261018-preview-599bfa8-4a5fa8493bf6`；目标 `192.168.30.244`。

## 实现与边界

按[已认可方案](../../../product/lan-device-visual-refinement.md)和[任务树](status.md)实施：轻底面三页签复用首页SVG，蓝色选中；设备标题16px，状态筛选/搜索/排序/刷新/添加组成统一工具区，更多筛选就近展开。名称与当前地址相邻，名称列≤320px、地址列≤230px；未知名称、品牌/类型和其他业务资料保留。表格清除重条纹，采用细分隔线和轻悬停；在线文字与点同绿，ready上传紫/下载蓝；普通详情轻描边，添加为主要操作。手机触控至少44px，内容≤980px用原资料卡，320px更多筛选另行，英文页签自然折行。

设备列表script字节、所有业务事件与v-model均与d3a7620相同；设备身份、地址/在线语义、权限、请求/轮询、全部详情业务子组件、分组和设置业务源码未改：[源码保护](round-3/source-protection.json)。主页面脚本仅增加纯SVG/主题CSS导入和替换装饰图标。原生系统菜单/顶部不改，不新增统计卡/业务接口/保存路径。

## 三轮记录

1. 第一候选桌面通过；768px主题默认select整行宽导致工具区偏高。检查脚本把关闭details内部未绘制控件当成可见，失败与截图保留在round-1。
2. 第二候选修正排序宽度与隐藏元素判定；390px英文All按钮43px，不满足44px，保留round-2。
3. 第三候选补足尺寸、收紧响应式表格边界并允许策略操作换行，四组候选投影通过。状态脚本误猜采集中译文为Collecting，实际既有译文Acquisition；修正为读取现有语言目录，不改产品译文。失败报告保留，最后使用已安装资源重新验证通过。没有第四个产品候选。

## 当前版本检查

- 独立vue-tsc、正式Web构建、19项设备业务保护检查以及全部135项前端测试通过：[类型/构建产物](round-3/build-checks.json)、[135项结果](../../../../evidence/m70/device-visual-refinement/round-3/web-tests.log)。构建输出web/dist，node_modules位于SSD，显式产物目录未被缓存wrapper偷偷迁移。
- [真实登录态32组](../../../../evidence/m70/device-visual-refinement/round-3/current-b/report.json)：中英×深浅×2560/1440/1280/1100/1024/768/390/320px，96个主业务页签已加载。每组通过搜索无结果/恢复、排序、状态筛选、展开高级筛选/清除、添加表单展开/取消、刷新真实读取、四项详情区域、键盘打开/Escape/焦点恢复；390px首页往返正常。没有页面脚本错误、HTTP错误或业务写请求。
- [六种补充状态](../../../../evidence/m70/device-visual-refinement/round-3/current-b-states/report.json)：长名称/完整IPv6、空、加载、503失败/重试、403/重试、采样缺失均通过。这些是已登录B页面的浏览器GET响应投影，验证展示和恢复；不冒充真实后端故障、真实权限变更或网络数据面验收。正常32组使用实际B数据和已安装静态资源，未替换候选资源。
- [前后对比](round-3/comparison.json)：同宽/语言/主题/首台deviceId；桌面20px、手机16px原生外间距及页面宽度保持，2560与1440地址列230px。实时流量可自然变化，不拿历史数值冒充当前数据。
- 已实际打开本轮基线、中文桌面1440/1280、英文深色桌面、英文390/320手机、中文深色手机设置，以及长IPv6/错误状态截图。工具区更集中、重灰条纹消失，名称/IP更易扫读；窄屏英文/长地址自然换行，无主操作遮挡。其他页签仍保留自身表单与只读引导，本轮没有全面重画这些表单。

## 部署与保护

冻结产物bin/previews/599bfa8，私有回退/root/quickstart-backups/home-0166-device-visual-599bfa8-r1。[部署](round-3/deployment.json)只替换index.js、style.css及LuCI资源键；四项[实际公开资源SHA](round-3/public-resources.json)匹配冻结候选。后端c9624a3、Quickstart/startdhns/FastNet进程、NetPolicy disabled/stopped、包记录保留；[最终保护](round-3/preservation-final.json)确认20配置路径、LAN及默认经192.168.30.1路由不变。[七次运行的14个短期root会话](round-3/session-cleanup.json)均在finally销毁。

本轮为B前端快速替换验收，没有后端重启、新软件包安装、SDK构建、push、其他设备部署或5180重建。opkg仍记录0.16.5，不能宣称新版安装包验收。目标、任务树与本次五项视觉实施均已完成；历史失败证据保留。

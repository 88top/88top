# 正式首页业务点彩验收

2026-10-20，第二份产品候选通过，已应用正式web并快速更新B192.168.30.244。[任务树与过程](status.md)，[当前配色规范](../../../product/quickstart-home-color-study.md)。

## 正式实现

`web/src/home/homeSemanticColors.css`是正式首页、完整信息弹窗和预览推荐方案共用的点彩契约。使用明确的`home-semantic-colors`作用域；正式构建不导入设计CSS、配色URL参数、演示请求或场景状态。预览classic/bold仅作隔离对照。

中性画布、白/深灰卡片、浅/中性标题操作；工具图标为彩色线条配浅底，下载/存储/域名的名称与图标按业务身份着色，重要系统资料与链接适度着色。业务状态单独表达：未启用保持中性，只有netSuccess状态文字为绿，接口在线时长保持中性及解释。系统指标的阈值、图表采样与原品牌图片/失败回退保持。正式蓝色顶部、LuCI系统菜单、字号/间距/布局/表单/权限/数据读取owner/URL返回逻辑没有改动。

首候选未部署：原正式页签选中与名称的高优先级覆盖主题，[失败报告](../../../../evidence/m70/semantic-colors-production/round-1/local/report.json)、[源码及产物指纹](round-1/failed-candidate.json)保留。第二候选针对既有三种页签class校正优先级，不以全局!important覆盖业务。

## 本地与预览

- [本地检查](round-2/local-checks.json)：133前端测试、vue-tsc、正式Web构建通过。SSD入口校验NVMe缓存，保留项目显式产物`web/dist`；没有宣称wrapper将该输出搬到SSD。既有v-deep废弃警告保留。
- [正式页面同数据对照](../../../../evidence/m70/semantic-colors-production/round-2/local/report.json)：深浅主题的颜色令牌、九项业务名称/图标/说明/背景与冻结的已确认预览逐项一致。7屏12组包括原蓝顶/编辑取消、隐藏恢复读取、四原业务向导、保存刷新、失败草稿保留、重新读取、链接持久化、响应式、图表实际像素和隐藏页停止读取。模拟API只在检查脚本中。
- [共用契约重建预览](../../../../evidence/m70/semantic-colors-production/round-2/shared-preview/report.json)：60组合三配色/中英/深浅/1440/1024/768/390/320，11控件尺寸与原设计相同、文档不改、系统菜单不变、无横向溢出，文字/服务名称/图标/说明及悬停对比度≥4.5，菜单/应用库/摘要/编辑可用。[自有预览PID16245及三资源与SSD匹配](round-2/shared-preview/resources.json)。
- [产物范围](round-2/asset-scope.json)：与原B前端zip逐成员比较，仅`index.js`和`style.css`改变；品牌、设备图片、语言与vendor等其他资产字节不变。

## 当前B真实登录态

[部署前基线](../../../../evidence/m70/semantic-colors-production/baseline-b/report.json)及[当前配色检查](../../../../evidence/m70/semantic-colors-production/round-2/current-b-recheck/report.json)：

- 中英×深浅×1440/1024/768/390/320，20组原已保存布局＋20组浏览器投影默认布局，共40视图。原配置按router GET读取并核对控件数；四组更新前基线的控件宽高与形态精确相同。投影仅改浏览器GET响应，展示隐藏控件以便检查，不写路由器配置；所有业务数据仍来自B。
- 24组完整信息弹窗（存储/下载/域名×中英/深浅×1440/320）：业务名称/图标/未启用说明、背景与悬停对比度、主操作/更多连体、44px触屏目标、Escape分层关闭、焦点及滚动释放保持。
- 实际加载的FastNet和Aria2品牌图片保持原色、无滤镜，原应用库打开/关闭可用；真实设备deviceId仍到完整管理抽屉并可返回。颜色UI场景没有业务写入，无pageerror；LuCI自己的只读RPC单独白名单核验。
- [真实应用与测速32组](../../../../evidence/m70/semantic-colors-production/round-2/navigation-b/fastnet/report.json)：1440中文浅色、390英文浅色、320英文深色，真实打开FastNet Web及浏览器Back、完整库搜索/窗口/焦点恢复、固定入口返回首页、错误/权限/非法URL/超时与显式重试、安装确认取消和原安装流程、迟到结果取消与目录单次读取保持。所有安装API由浏览器明确拦截，不执行真实安装/卸载，不点击FastNet开始检测。明确验证既有KAI缺失PNG使用SVG回退，仅接受该具体404，不忽略未知HTTP错误。
- 实际打开最终桌面首页、390中文/英文返回、320英文深色首页和下载详情、桌面深色详情及真实FastNet Web截图。原有320英文网络标题拥挤仍在；本任务验证配色/尺寸/操作，不将其伪装成所有手机视觉问题均已解决。

首次B检查在关闭测试context时仍有投影GET路由回调，导致`Request context disposed`，未生成完整报告；[失败记录](round-2/current-b/attempt.json)与当时截图保留，两个session已销毁。检查器改为关闭前等待路由处理完成，无产品修改或错误抑制；复验40/24通过。基线2＋失败2＋复验2＋导航2，共8个临时root session全部销毁，凭据未归档。

## 冻结、替换与保护

主实现本地提交`5d8c6d9`；冻结前端`a57a2971b2d8c9e775ead7394c765bebcbbc454f`，资源键`0.16.6-test20261018-preview-a57a297-f48f04cc82c7`。zip/MANIFEST/SHA256SUMS在忽略目录`bin/previews/a57a297`。后端仍c9624a3/0.16.6，opkg Quickstart/LuCI仍0.16.5；本次不是新包安装或SDK验收。

[任务专用替换脚本](deploy-web.py)要求干净冻结源码、核对原B前端、原子替换两资源及缓存键，失败时恢复前端私有备份。当前[部署记录](round-2/deploy.json)备份`/root/quickstart-backups/home-0166-semantic-a57a297-r2`；[公开四资源](round-2/public-assets.json)逐字节指纹匹配冻结MANIFEST。没有重启/重载任何业务服务。

[最终20路径保护](round-2/preservation-final.json)：布局/启动台/链接、网络、DHCP、防火墙、设备资料/分组等及LAN/default via192.168.30.1均保持，零例外。新基线私有备份`/root/quickstart-package-candidates/home-0166-semantic-20261020-r1`。

[最终运行保护](round-2/runtime-preservation-final.json)：Quickstart serve9386/startdhns14546、FastNet10304及配置/脚本/二进制、NetPolicy文件、opkg数据库保持；NetPolicy disabled/stopped。前端SHA：index`e38aac75…`、CSS`64065b86…`，完整指纹附在部署/公开资源报告中。

没有push、Release、Action、新SDK/包或A/C/D/APK部署。既有ARM/APK/24小时与独立标题视觉门禁不据此变化。

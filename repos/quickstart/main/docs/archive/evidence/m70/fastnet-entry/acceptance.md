# FastNet动态入口与首页测速验收

2026-10-19，已实施并快速更新B192.168.30.244。[任务树、标准与过程](status.md)，[产品契约](../../../product/quickstart-home-launcher-navigation.md)。

## 最终行为与实现

FastNet app-meta新增entry.sh、META_UCI=fastnet，配方meta release6→7，静态META_LUCI_ENTRY/href仍是原管理页。脚本通过可执行文件判断deployed，通过procd实例真实running判断运行，从该实例的实际`FastNet web --addr`读取端口；避免把尚未应用的UCI新端口当作实际入口。端口有界，服务读取失败/JSON损坏/运行命令不匹配/多运行实例端口歧义均失败；停止、未部署、loopback-only不发布可供LAN浏览器打开的Web。不读取或输出API token。app-hub本地提交`6a532f6`，未推送。

首页“测速”仍是两字及原前置业务图标，使用应用工具原有稳定激活宿主、软件中心installed单一读取owner、token GET及单个FastNet/强制新鲜status POST。初载不调用脚本；点击时等待现有目录首读，不重复读取。已安装且真实运行、有有效Web时同窗直达；不闪应用窗口。目录/脚本失败、权限、5秒解析超时显示原位重试/关闭，不误判成未安装、不改变卡片高度。

未安装时沿原checkAndInstallApp确认安装/安装接口/轮询。已安装但未运行、无Web或旧meta无动态能力时，用户确认后沿原检查/配置流程，已安装不重复安装、不自动启动。安装成功先到原配置，不声称服务已运行。原app工具新增可选proceed检查，只给测速使用，防止已取消的检查结果迟到弹出安装确认；原调用者默认流程保持。已经用户确认发起的安装仍由原流程负责，本次没有宣称取消提示会撤销已开始安装。

测速与固定/完整库共享去重、取消和最新来源；Escape、隐藏/离开、显式打开完整库均不接受晚跳转。返回记忆只为fastnet允许有界traffic来源，返回原首页测速焦点/滚动，不要求用户固定FastNet，不加panel、不保存Web URL或token。原完整库返回窗口/分类/搜索/焦点、固定入口返回首页均保留。

## 验证与真实设备边界

- [本地检查](round-1/local-checks.json)：133前端测试、vue-tsc、正式Web构建通过；app-hub三项包契约通过。SSD wrapper使用NVMe缓存，输出仍是项目显式web/dist。
- [脚本14场景](script-fixtures-2.json)通过：运行、实际自定义端口、IPv6通配、停止但文件仍在、loopback、非法/超限端口、命令不符、服务不存在、未部署、ubus失败、坏JSON、多实例歧义。真实B jshn配隔离ubus夹具；没有停止真实服务，临时目录均清理。
- [最终B UI报告](../../../../evidence/m70/fastnet-entry/round-1/current-b-final/fastnet/report.json)32组通过，尺寸/语言/主题为1440中文浅色、390英文浅色、320英文深色。每种均真实打开FastNet Web及浏览器Back、完整库和固定应用往返、503/403/非法URL/解析超时与显式重试/关闭。桌面另覆盖停止/旧meta确认、缺失取消/安装成功失败、目录失败、取消待处理status/安装检查、打开库取消旧测速及慢目录去重。
- 安装API所有请求在浏览器被明确拦截，验证真实前端的确认与原安装流程，但没有对B实际安装/卸载、停止/启动FastNet，也未点击FastNet“开始检测”执行吞吐/诊断。停止/缺失场景是夹具，不伪装成设备发生了这些状态。
- 已实际打开最终桌面FastNet/首页返回、390英文返回、320英文深色错误截图。测速错误浮层不增加卡片高度；原独立320英文连接卡标题问题不据此宣称解决。无Quickstart pageerror。控制台只接受明确注入403/503及既有`kai.png`404；KAI默认SVG回退在当前页面实际断言通过，不忽略未知错误，也未借机改动KAI。
- [最终设备指纹/进程](round-1/current-b-final/device.json)匹配冻结候选，NetPolicy仍disabled/stopped，startdhns568345保持，Quickstart serve930950。三次UI运行各销毁2个临时root会话，共6个，不记录凭据。
- [最终20路径保护](round-1/preservation-final.json)通过，含布局/启动台/链接/网络/设备资料，LAN及default via192.168.30.1保持，无例外。[FastNet最终保护](round-1/fastnet-preservation-final.json)确认配置SHA`c760d7f5…`、二进制SHA`f3be309f…`、PID919605保持。

## 冻结、安装与失败证据

前端`d189c25bc7f672d1397277e914728b7968ba56f8`；资源键`0.16.6-test20261018-preview-d189c25-b5ea248d12cc`；index SHA`c541d69822f7c8e0f8d373f951aa739e4e1cb436126fb6b8d4f043002c0b55ba`，CSS`9c3ab1551950f4ebfe498098eb3d0387a1ced8b79616dd8aa22ec626a7977bde`，vendor`2d10df1751d0d3e778744c01f8edf8db96082b8d0939cf65ef38ea05eea39867`。冻结zip/MANIFEST/SHA256SUMS在忽略目录bin/previews/d189c25。部署备份/root/quickstart-backups/home-0166-fastnet-d189c25-r1；当前配置新基线/root/quickstart-package-candidates/home-0166-fastnet-r1。

[脚本部署](script-deploy.json)只更新脚本及meta的uci/entrysh标记，脚本SHA`2cfb7147822538802930074838feb68b14d730c170c4663fa6050a5aa40ab8a1`，私有备份/root/quickstart-fastnet-entry-2cfb71478225；软件中心静态入口/已安装版本字段保留。真实meta包仍0.7.7-r5；本地配方r7不是已安装新包。Quickstart后端仍冻结c9624a3/0.16.6，opkg Quickstart/LuCI仍0.16.5；本次是快速候选替换，不是完整SDK/包安装验收。

脚本第一候选的[失败](script-fixtures-1.json)及[诊断](script-fixtures-diagnostic.json)保留：jshn缺对象警告写入stdout，且json_load基于eval可能吞坏JSON返回码；第二候选关闭警告并显式验证JSON后14组通过。Quickstart仅一个产品候选；[第一次UI失败](../../../../evidence/m70/fastnet-entry/round-1/current-b/fastnet/report.json)因取消早于POST而测试错误要求一次POST，[第二次](../../../../evidence/m70/fastnet-entry/round-1/current-b-recheck/fastnet/report.json)31业务组通过后被既有KAI图标404门禁阻止。修正测试边界并增加具体SVG回退断言，第三次32组通过；未删业务断言或改产品凑通过。

复验：`rtk proxy /var/cache/build-cache/run.sh -- env QS_EXPECT_MANIFEST=bin/previews/d189c25/MANIFEST QS_ACCEPT_RUNTIME_CANDIDATE=1 QS_EXPECT_PACKAGE_VERSION=0.16.5-test20261018 QS_ACCEPT_FASTNET=1 python3 scripts/ops/home-current-acceptance.py 新证据目录`。

未push/Release/Action，不更改canonical feed或公共Action，无A/C/D/APK部署和5180重建；ARM/APK/24小时观察仍是独立门禁。

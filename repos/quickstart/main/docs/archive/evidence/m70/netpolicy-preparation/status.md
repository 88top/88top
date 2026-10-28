# 安装后限速准备入口

## 当前结果

0.16.3/c78f62c修正已完成当前B匹配IPK安装与复验，优化1通过。旧eQoS选择保持，native已装/未运行的事实与当前执行方不可用分别表达；设备详情320px和原局域网设置中不再提供重复安装。两处实际截图已打开审查。没有写provider、策略或启用NetPolicy。

当前六个IPK均通过，精确输入见[归档](release-inputs-0163.md)，x64/ARM64解包报告及SDK输入校验报告在本目录。B完整九项业务断言、provider-2六项、触屏五项、英文四项、系统圆环四项、生命周期四项、重启后四项共七组通过；每组控制台/HTTP/pageerror为空、两个短期会话销毁。20次真实SPA往返，离开首页停止读取，回页一个图表，最后5500ms一次轮询。首页测试原内容已恢复；revision因真实保存合法推进。

当前构建compatibility-0163九组通过：未来schema、备份、损坏、403、503、仅布局失败、仅启动台失败、浏览器存储不可用、应用身份损坏。均为正式bundle加本地模拟异常，不冒充B文件损坏/未来schema实测。代表原始截图已打开审查；B实际使用真实API、真实登录态和真实设备ID。

0.16.3安装前/后及helper替换后，严格配置指纹无差异、无需DHNS单行例外。安装后显式重启Quickstart serve服务；发现旧startdhns别名进程还驻留，先补全进程门禁并保存reject-stale-dhns红灯，再校验唯一PID、旧hash及原dhns命名空间，仅TERM并替换该helper，无UCI/接口/路由操作。新serve/helper均为91a92aed…；不能把最初漏查别名的provider-1当全部进程通过。原包start/存活判断不保证替换旧helper，升级运维必须检查这两种进程。

保存测试结束后再次只重启B Quickstart serve服务，四份首页文件及network/DHCP/firewall/Quickstart/NetPolicy原文不变；b-after-restart-0163新会话正确加载持久布局、深浅主题圆环。实际sysupgrade -l/-b检查八条keep路径和四份当前首页归档字节，通过（b-sysupgrade-0163.json）；私有备份不入库，未执行系统恢复。

保留的未通过：补充DHNS恢复代理探测中，127.0.0.1因命名空间loopback未启用而不可达；现有192.168.100.1地址的有界HTTP探测也超时，根因未定，不宣称该代理业务通过。第一次wget超时包装器未捕获异常且-T按重试计时，已保存失败事实并清理唯一匹配命令的临时wget，之后单次有界请求退出；最后确认无wget残留。没有开启loopback、添加路由或更改恢复配置。这条独立旧恢复链路需隔离复现，不能用当前首页通过代替，也不能将其未经验证地归咎于新代码。

APK仍按既定三轮边界暂停；ARM64实装/数据面、故障恢复代理链路、实际系统恢复及延期24小时观察不计完成。未推送Git/发布Release/触发Action，A/C/D未操作。下面保留执行记录及早期“尚未安装”等历史状态。

任务树：保留B已装但未启用NetPolicy的状态 → 读取实际selected/provider/capability → 建立禁止重复安装的红灯 → 修正共用能力与设备/设置引导 → 新版本runtime/包 → B重新验收。

验收标准：原eQoS选择与所有规则不改；不启动引擎；已安装NetPolicy不再提供重复安装动作；现有执行方式可用时保持原能力；未安装时保留安装流程；引导用户进入原设置预览后再决定切换；真实B保护断言通过，包/资源/进程匹配新冻结版本。每个候选最多三轮优化；本子任务优化1开始。

原始证据 `../b-installed-0162-provider-guard-2/`：selected=eqos，eqos未装，quickstart-native已装但engine_unavailable，能力却给install quickstart-netpolicy，实际红灯。guard-1使用了错误provider ID，已保留并在guard-2修正夹具，不当作产品失败原因。假设按证据排序：选中执行方能力与固定安装目标不一致（源码已证实）；进程缓存过期（新登录仍重现，不支持）；安装包漏文件（包与设备原始字节匹配，排除）。

修正边界是准备状态/动作，不扩展数据面、策略迁移或服务控制。不得通过自动选择native或实际开启引擎使测试过关。

优化1：共用能力在原执行方不可用、native已装时提供独立selected_provider_unavailable诊断与retry，不再install/enable另一执行方。原执行方可用保持available；原生执行方保留其自身诊断；没有安装包仍可安装。设备详情与LAN设置说明和安装按钮共用该事实，中英文同步。没有新增布局、表单或另一执行方式编辑器。

本地make verify-lan-device-business通过：Go全量、105项前端、vue-tsc、部署契约和局域网确定性门。最初新增Go测试把CapabilityState写成string导致编译失败，修正测试类型后通过；不是服务端执行失败。gofmt只读差异检查为空。B红灯在修正前建立，新版本实机复验尚未执行。

冻结源码c78f62c1e6e0fd41d6572dc2ac64cf81ba2bd9fc，版本0.16.3-test20261018，干净源码make release三架构通过。归档SHA e202e9c3a8e8cc1e9d3c6bf20732597097e89609e975bda33580db8e45c32416，资源key release-a1548582564e，持久bin/releases/c78f62c。后续提交仅测试/文档，不重写该runtime。实际Go与runtime输出在SSD release-c78f62c；npm依赖为SSD链接，Web显式输出仍为当前web/dist，已核验并打入runtime，未宣称wrapper自动改变outDir。

本地正式页面formal-0163十项断言/七视图通过，原四业务弹窗、保存失败草稿、刷新持久化、曲线像素和隐藏暂停均验证；已打开截图。后续visual-0163按原型内容宽度、同数据单独比较，不将原型合成数据当实机结果。

App Hub a10b53b、nas测试工作树7e1a215、nas_luci 965e2f6；两项包契约通过。新输入patch 3cf7e96f16896ee7a244550e2e992bb39df9f93f81e58bae3fbc7052941d4769，在完整目录副本reverse dry-run通过；隔离builder d4048e929e67 release/deploy/verify通过。原构建器current仍runtime-linkease-176-source-date-fix-20260930。新归档精确校验后仅硬链接到缺失的下载缓存，没有覆盖旧版本。两个IPK构建串行，先x64 quickstart-home-x64-ipk-0163-20261018-1；APK暂停边界不重置。

SDK输入纠正：-1在编译前因路径缺少feeds/nas、feeds/nas_luci前缀失败，原reverse夹具也错用了目录结构。未忽略此失败；完整failed状态/输入持久保存在bin/releases/c78f62c/sdk/对应目录，诊断见sdk-input-path-0163.json。改为实际SDK目录夹具，校验通过；当前builder 9c4f01a26d9c，patch ccf15b74ac0e8cf3ac24128c43c82ce68dbba42877fdcbfa36aa0172cb3d4e79，重新release/deploy/verify通过，新x64 ID为quickstart-home-x64-ipk-0163-20261018-2。补丁已在实际构建内通过并进入依赖编译；不把此进度当最终通过。

同内容宽度、同数据的visual-0163八视图通过，截图已打开比较；实际地址随宿主生成的SMB主机名属于真实上下文差异，不靠原型演示导航替代。B新私有备份包含network原文、原包实际文件与元数据；b-backup-0163.json及b-before-install-check-0163.json通过，严格无归一化。普通opkg update八源签名通过，同一普通opkg用于后续安装。当前仍未安装0.16.3。

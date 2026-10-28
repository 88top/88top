# 首载一次与手动重试：当前B验收

用户已确认继续GET`/cgi-bin/luci/admin/store/installed`。第一候选`efbd8a61a3d7100b35a382fe5621e2328a04caa2`已快速直接替换B`192.168.30.244`，所有本轮验收通过，无第二产品优化轮次。当前页面可刷新查看。

改动范围：原launcher owner、单次首载、8秒Abort、按当前请求代次处理结果均保留；增加明确timeout状态和中英提示，超时/失败/无权限均可点击“重试”。加载中重试按钮不出现；不添加自动重试、后台轮询、第二目录来源或自建后端接口。关闭/再开启动台和切换分类不重新读取，其他控件不等待目录。读取及重试不改收藏、链接和布局。

当前验证：

- [114项前端测试](../../../../../evidence/m70/installed-apps/manual-retry/tests.log)、[vue-tsc](../../../../../evidence/m70/installed-apps/manual-retry/types.log)、[Web构建](../../../../../evidence/m70/installed-apps/manual-retry/build.log)通过；沿SSD缓存入口，实际输出仍在web/dist，不宣称缓存包装器移动了输出。
- [正式构建UI](../../../../../evidence/m70/installed-apps/manual-retry/round-1/local/report.json)5组/8视图通过，包括原头部、十一控件、320/390、深色、图表绘制、隐藏停止读取；390深色截图已打开。
- [B中文](../../../../../evidence/m70/installed-apps/manual-retry/round-1/b-current/installed-apps/report.json)和[B英文](../../../../../evidence/m70/installed-apps/manual-retry/round-1/b-english/installed-apps/report.json)各7组通过，真实语言分别zh-cn/en，各首载一次获得6个软件中心应用；开关启动台两次不新增读取；保留`/apps/`同源整页导航检查（截获目标页面，未执行应用内部动作）。
- 两种语言均注入403、503、异常200对象、10秒延迟和合法空数组。延迟在浏览器拦截器内，设备服务及网络未注入故障；真实8秒截止后显示超时及重试，期间设备地址已独立返回、系统工具可浏览。等待用户操作期间无追加目录请求，撤去注入后点一次重试只多一个GET并恢复真实6项。合法空数组显示未安装，经刷新恢复真实目录；失败/超时不显示未安装或没有匹配。
- 正常场景无控制台错误，只有刻意注入403/503的对应HTTP控制台记录；两组均pageerror=0，390无横向溢出、Escape恢复滚动。桌面/390正常、错误及中英超时实际截图已打开审查。
- [B中文资源/运行进程](round-1/b-current/device.json)、[B英文资源/运行进程](round-1/b-english/device.json)指纹匹配冻结候选，LuCI资源键均为`0.16.6-test20261018-preview-efbd8a6-5e45ac53284a`；共4个短期root会话均销毁。
- [保护检查](round-1/b-preservation.json)：20个首页/业务/网络配置路径状态和字节不变，LAN地址、默认路由via192.168.30.1不变，无归一化例外。备份记录见[b-prepare](round-1/b-prepare.json)，设备私有备份`/root/quickstart-backups/home-0166-app-manual-retry-efbd8a6-r1`。

前端index SHA`40750860f2f865afbf48d4d3f35c5771f25dce3de8d148db495f3a7c28fce95e`，CSS SHA`78d37adb13699cca4a7c1e1221ef84171888755215ab58ed4c0e80b845d226aa`；vendor及英文语言资源不变，完整MANIFEST/zip在`bin/previews/efbd8a6/`忽略目录，资源实际指纹见两个device.json。

这是用户已授权的快速Web直接替换；后端仍为`c9624a3`/0.16.6，opkg仍记录Quickstart/LuCI0.16.5，NetPolicy仍disabled/stopped。不是新软件包安装验收；没有SDK、APK设备部署、push/Release/Action，A/C/D未访问。此前[两机目录比较](../opkg-apk-analysis-20261019/analysis.md)的软件中心缓存/锁/缺目录空列表边界不变；本轮不宣称消除了后端缓存锁或完成APK全产品验收。

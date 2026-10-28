# M70 应用导航与动态入口：当前 B 验收

2026-10-19，用户要求的三项工作均完成并更新B192.168.30.244：先修复entry.sh，再URL与返回恢复，再点击时动态入口。任务树、验收条件、依赖顺序见[执行记录](../navigation/status.md)，正式行为见[导航契约](../../../../product/quickstart-home-launcher-navigation.md)。已确认的首页/左侧菜单未重新设计。

## 当前行为与版本

- 打开应用工具窗口产生`?panel=applications&tab=apps&page=1`；分类、搜索和分页替换当前项，搜索/滚动/焦点只存在该历史项，不写用户配置。从应用当前窗口返回恢复原窗口、分类、搜索、页码、滚动与焦点。刷新、Forward、直接书签关闭和未保存编辑离开保护均通过。
- 动态能力只来自安装元数据flags/uci。点击时单应用token GET加entrysh status POST，运行且Web有效才直达；静态应用保持原entry。未运行/无Web到原配置，错误/无权限/5秒超时留在窗口，允许手动重试或打开配置。同应用重复点击去重，关闭/离开/换应用丢弃晚结果；首页固定与完整库共用激活入口。不调用start/stop/install。
- 应用目录仍只在本次挂载首读一次软件中心installed GET，8秒目录超时/显式重试/本地图标保持；动态解析没有全库扫描、轮询、收藏或布局写入。
- KSpeeder的deployed依文件存在，running依procd真实实例；停止但二进制仍存在时不再误报，只有运行时返回Web，坏端口/读取失败明确失败。应用仓库main提交`afdc652`，meta源码0.8.4-r2。B只原子替换`/usr/libexec/istoree/istoreenhance.sh`，SHA`0d67a859adffacb04ff684acc3801f27b4412330f22e88a705445431430fc341`，原脚本私有备份保留，没有重启KSpeeder。

Quickstart URL阶段提交`d232290`、动态解析`5391738`、LuCI实际编码兼容修正`f56f47d`。当前前端冻结`f56f47d0ce78d1a32175f24ca209b8bb3905687d`，缓存键`0.16.6-test20261018-preview-f56f47d-2ca6ea733d92`，index SHA`3edf8f635953dd3e9fe1ea1fddc53e116975b284261b763260b28a0bb5cf6711`。CSS/vendor/英文资源与首候选一致，完整MANIFEST和zip保留在忽略目录`bin/previews/f56f47d/`。

后端继续使用冻结c9624a3/0.16.6，文件及serve/startdhns进程SHA均与原MANIFEST一致。opkg仍记录Quickstart0.16.5-test20261018-2/LuCI-r2；应用meta也没有通过软件包升级。这里是用户授权的快速候选替换，不是新IPK/APK包安装验收。B私有部署备份`/root/quickstart-backups/home-0166-launcher-entry-f56f47d-r2`。没有push、Release或Action。

## 通过证据

| 范围 | 结果与位置 |
| --- | --- |
| 应用脚本 | 应用仓库10项package contract测试；[script-round-2/report.json](../../../../../evidence/m70/installed-apps/entry-resolution/script-round-2/report.json)的B隔离10种状态/端口/失败场景通过，实际status匹配procd，配置/实例不变 |
| 前端逻辑 | 最新127项node前端测试、独立vue-tsc、make build-web通过；最终补充LuCI空错误表`[]`和`{}`兼容，非空/缺少/标量仍拒绝 |
| 正式构建本地UI | [round-2/local/report.json](../../../../../evidence/m70/installed-apps/entry-resolution/round-2/local/report.json)完整13组/7视图；URL、返回、动态失败与重试、原业务表单/配置保护、320～桌面和主题通过 |
| opkg/APK协议 | [protocol/report.json](../../../../../evidence/m70/installed-apps/entry-resolution/protocol/report.json)，B与9.140各一次真实单应用fresh status通过，状态匹配procd，配置不变，两个会话销毁；APK没有部署修复脚本或完整Quickstart UI验收 |
| 当前B中文桌面 | [round-2/b-current/launcher-entry/report.json](../../../../../evidence/m70/installed-apps/entry-resolution/round-2/b-current/launcher-entry/report.json)，11组通过：80项分页、URL/私有状态/刷新/Back/Forward/编辑保护，真实KSpeeder仪表盘与Back，停止/无Web/503/403/非法URL/超时、取消/换应用晚回调、首页固定入口 |
| 当前B英文触屏 | [round-2/b-english-touch/launcher-entry/report.json](../../../../../evidence/m70/installed-apps/entry-resolution/round-2/b-english-touch/launcher-entry/report.json)，12组通过，增加persisted pageshow生命周期路径；390px无溢出、Escape解除滚动锁 |
| 最终审图 | 上述实际Web、返回、错误、双语超时与分页恢复截图均已打开；手机返回快照拍到异步图标加载态，原图保留。另[最终手机明暗图](../../../../../evidence/m70/installed-apps/entry-resolution/round-2/b-final-visual/launcher-entry/report.json)等待6个真实PNG解码后截图并打开，英文错误/重试/配置及深色控件清楚可读，无运行时错误 |
| 配置保护 | [最终保护检查](round-2/b-final-preservation.json)：20配置路径（含缺失项）及LAN/默认路由保持不变；[b-entry-preservation.json](round-2/b-entry-preservation.json)：KSpeeder配置及原七项摘要不变，实际实例PID680369仍运行；NetPolicy仍disabled/stopped |

真实KSpeederWeb截图展示仪表盘内容，返回恢复不是仅HTTP200/DOM验证。停止/异常通过B设备脚本沙箱与浏览器网络隔离模拟，没有为测试停止真实应用。配置入口导航在测试浏览器截获，避免无意业务写入。首页固定测试仅覆盖浏览器GET结果，没有保存收藏。当前各组只见预期的合成图标404、故意403/503，真实页面无未解释控制台错误。

原生浏览器Back的pageshow.persisted在本次自动化为false，已验证完整重载；另显式PageTransitionEvent(persisted=true)验证恢复生命周期路径。没有声称实际命中原生BFCache。不会保证外部应用内部多次导航的历史栈，也没有验证KSpeeder登录后或Docker加速业务。

## 失败与优化轮数

脚本封装第一轮因目标无base64失败，改plain JSON后第二轮通过，产品脚本未反复部署。URL本地第一轮的晚恢复回调读null，第二轮修复代次/存活检查后通过。动态模板初次类型检查nullable回调失败，显式handler后通过，原输出保留。

B入口第一轮真实HTTP200返回`errors:{}`，本地只接纳`[]`导致正确运行结果被拒绝；[失败及诊断](round-1/failure.md)保留。修正并补真实编码测试后f56f47d第二轮全部通过，无第三次产品修订。两个失败/诊断B组及三个最终B组共10个临时root会话均销毁；另协议两会话亦销毁。未改用户密码或持久化会话凭据。

历史English320连接标题、旧家长控制404、APK打包、ARM安装及延期24小时观察仍沿原记录，本次不冒充解决或通过。

# M70 手机返回滚动续修：最终验收

2026-10-19用户重新授权继续手机问题后，本轮第三候选通过；旧三轮暂停记录、这轮前两候选失败均保留。仅关闭首页固定应用Back的手机滚动门禁，不把其他历史验收移作当前通过结果。[任务树](status.md)、[诊断与失败链](diagnosis.md)、[现行导航契约](../../../../product/quickstart-home-launcher-navigation.md)。

## 原因与实现

之前scrollTo与preventScroll焦点确实执行，但尚未返回的network/status会让上方连接卡从240.96875px增长到249.59375px（8.625px），浏览器锚定随后把1020改成1028。连续几帧相同不代表首轮数据已结束；详细测量探针又会改变这个竞态的时序，所以不能凭一次带探针通过收口。

数据owner现在提供各控件首轮成功/失败就绪状态，返回owner根据目标所在行及上方控件订阅相关结果与布局配置就绪，再确认几何稳定，恢复原scroll/焦点。页面保持各控件独立加载，不新增请求，不等待下方无关读取；异步等待由现有Vue状态唤醒，不轮询数据。自然高度测量临时改样式期间也屏蔽锚定并在finally精确还原。没有写回DOM高度、8px补偿或常驻禁用锚定。

恢复owner保留10秒总截止；用户pointer/touch/wheel/keyboard输入立即取消，成功/截止/卸载清除观察器、帧、监听与历史记忆，并恢复原scrollRestoration及inline overflow-anchor值和priority。首页不插入完整启动台、不生成panel历史项；显式查看全部的窗口/搜索/分类/焦点恢复保持。

## 当前冻结输入与设备

B `root@192.168.30.244`，实际iStoreOS24.10.1/kernel6.6.86/x86_64。前端`d74e6d4c41804aed61d3e7d4dc7497aa3093a153`，缓存键`0.16.6-test20261018-preview-d74e6d4-f85e5e3d7df4`。

- index SHA256：`55509d636b08796001c950d6af4998a83ae8f39a1afcf12c6eff534a40d92106`。
- CSS SHA256：`088e505b7a5c4429c5bcf91ce1cc2a51c3798c041c2cded80402e0bc57598716`。
- 后端仍为冻结c9624a3/0.16.6，二进制及serve/startdhns进程SHA256均`983a1c8b819e29a5ac7e053898afa66ccdc8653e535219482c92052b3a90ba11`。
- 冻结zip、MANIFEST和SHA256SUMS在忽略目录`bin/previews/d74e6d4/`；设备指纹见每组device.json。部署备份`/root/quickstart-backups/home-0166-mobile-scroll-d74e6d4-r3`。
- 这是用户授权的快速运行候选替换。opkg仍是Quickstart0.16.5-test20261018-2/LuCI-r2，**不是新的软件包安装验收**。

## 当前候选验证

前端128项、独立vue-tsc、正式make build-web均通过。完整正式构建本地21组/7视图通过，内容尺寸与第二候选同数据7视图逐项一致，见[本地报告](../../../../../evidence/m70/installed-apps/mobile-scroll-followup/round-3/local/report.json)、[尺寸比较](round-3/local/geometry-comparison.json)；截图已实际打开。

| 当前B真实登录态场景 | 首次模拟目标返回：离开→即时→稳定 | 真实KSpeeder返回：离开→即时→稳定 | 结果 |
| --- | --- | --- | --- |
| 390px英文触屏 | 1020→1020→1020 | 1020→1020→1020 | [11组通过](../../../../../evidence/m70/installed-apps/mobile-scroll-followup/round-3/b-390-en/pinned-entry/report.json) |
| 320px英文触屏 | 1086→1086→1086 | 1080→1080→1080 | [11组通过](../../../../../evidence/m70/installed-apps/mobile-scroll-followup/round-3/b-320-en/pinned-entry/report.json) |
| 1440px中文桌面 | 0→0→0 | 0→0→0 | [11组通过](../../../../../evidence/m70/installed-apps/mobile-scroll-followup/round-3/b-1440-zh/pinned-entry/report.json) |

上述完整检查无浏览器探针、无测量保护注入、无放宽scroll选项；仍使用小于4px的原断言，实际均零偏移。覆盖loading/失败/超时/重试/原配置、Escape、晚回调、源移除、自定义域名直达、显式全部应用和真实Web往返。预设503错误之外无控制台错误，无页面异常；请求断言禁止配置/启停等变更，只有单应用按需status允许POST。真实KSpeeder页面、390/320返回及深色错误、桌面完整库返回截图已打开审查。

原先明确失败的[最小复现](../../../../../evidence/m70/installed-apps/mobile-scroll-followup/round-3/minimized/scroll-trace/report.json)也通过：即时、网络稳定、再500ms均1020。增加network/status1200ms延迟和下方disk4000ms延迟的[定向回归](../../../../../evidence/m70/installed-apps/mobile-scroll-followup/round-3/delayed-network-and-below/scroll-trace/report.json)通过：约1449ms已恢复1020，磁盘结束约4741ms及5242ms仍1020，证明不以全页读取阻塞返回。诊断脚本保留有界时间线，但没有开启CSS或measure探针来让它通过。

[生命周期回归](../../../../../evidence/m70/installed-apps/mobile-scroll-followup/round-3/lifecycle/scroll-trace/report.json)三项通过：真实Web返回；延迟目录时wheel取消、清记忆/模式、后续无抢焦点；缺目标10秒截止并精确还原原auto!important及历史auto。这里覆盖真实完整重载和测试驱动生命周期，不宣称实际命中原生BFCache，也不代表实体iOS/Android浏览器矩阵。

复验入口均经SSD wrapper：`QS_EXPECT_MANIFEST=bin/previews/d74e6d4/MANIFEST QS_EXPECT_ENTRY_SHA=0d67a859adffacb04ff684acc3801f27b4412330f22e88a705445431430fc341 QS_ACCEPT_RUNTIME_CANDIDATE=1 QS_EXPECT_PACKAGE_VERSION=0.16.5-test20261018`，运行`python3 scripts/ops/home-current-acceptance.py 新证据目录`。完整场景加`QS_ACCEPT_PINNED_ENTRY=1`及语言/触屏/宽度；最小场景加`QS_ACCEPT_SCROLL_TRACE=1 QS_SCROLL_TRACE_EXISTING=1 QS_PIN_RETURN_ONLY=1`，延迟场景再加`QS_SCROLL_DELAY_NETWORK=1 QS_SCROLL_DELAY_BELOW=1`；生命周期单独加`QS_ACCEPT_SCROLL_TRACE=1 QS_SCROLL_LIFECYCLE=1`。不覆盖本目录既有输出。

## 保护、清理与边界

[最终保护检查](round-3/post-ui-preservation.json)：20份存在/缺失状态与字节摘要保持，含首页布局/收藏/链接、LAN/DHCP/防火墙/eQoS/VIP及设备资料；LAN .244和默认via.1不变，无例外。[应用保护](round-3/app-preservation.json)：KSpeeder配置/脚本摘要不变、PID680369持续运行，未启停。NetPolicy各device.json均disabled/stopped且包/二进制摘要不变。

本轮19次认证运行包含诊断与保留失败，38个临时root会话全部销毁；最终候选六次运行12个会话全部销毁。测试路由/内存状态随浏览器关闭，未保存测试收藏或链接。5180只读参考，本地5181测试服务已结束；生产包不含诊断探针。

源码已本地提交；没有push、Release、Action、新SDK或新包安装，没有操作A/C/D/APK。原独立320英文连接标题视觉门禁、APK实机、ARM数据面、24小时观察均不由本次滚动修复宣称通过。

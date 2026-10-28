# 首页刷新稳定性：当前验收

2026-10-19第一份产品候选17411e9已快速替换B并通过本次验收。[任务树](status.md)、[诊断](diagnosis.md)、[汇总](round-1/final-summary.json)。

## 确认的问题

当前旧候选d74e6d4正常刷新，两个临时配置loading条闪现：“首页布局：正在校验路由器配置…”与“应用工具：正在校验路由器配置…”。首行top232.59375→125.59375px，净上移107px。同时先呈现11个内置默认控件，再变成用户保存的10个及其顺序。原始失败见baseline；只隐藏提示条的单变量probe-hide-banners仍因默认布局闪现失败，两项都需处理。baseline-slow/pending.png已打开，截图把两条状态和错误默认布局一并捕获。

## 当前交互

- 首次只等待layout/launcher两份有8秒截止的首页设置，不等待设备/磁盘/服务/软件中心，业务读取仍独立并行。保留既有顶部，内容区静态中性占位，不显示假的业务值、默认控件、空首页或操作。
- 配置首读结束且容器实际宽度已测得后，一次呈现保存的布局与固定项，避免手机先按桌面宽度排列。占位800ms后才显示轻量“正在加载首页…”；文字不撑开布局，无闪烁动画。
- 首次结束状态锁存，显式重新读取不会重新用启动占位盖住整页。正常loading条不进入文档流；真正失败、无权限、损坏、未来版本保留原说明、只读和重读/恢复入口。
- 合法保存的空首页正常显示原空状态；未知/读取中不能先显示空状态或默认首页。失败后的既有临时默认兜底保留明确说明，不写回配置。

本轮不改变加载完成的正式外观。七个本地视图的控件尺寸与上轮逐项一致，见[比较](round-1/local/loaded-geometry.json)。没有引入浏览器配置缓存、身份猜测、额外读取/轮询或持久化DOM尺寸。下方业务卡片仍可随真实内容自然增高；本次不把局部高度变化伪称全部解决。

## 验证与实际设备

前端128项、独立vue-tsc、make build-web均通过；本地正式构建21组/7视图通过（[报告](../../../../evidence/m70/refresh-stability/round-1/local/report.json)）。SSD入口与实际产物位置见local/checks.md。

B192.168.30.244，实际iStoreOS24.10.1/kernel6.6.86/x86_64，11个当前刷新场景通过：桌面F5、桌面慢配置、390英文触屏F5、320英文触屏深色慢配置、合法空、HTTP503、HTTP403、损坏、未来版本、8秒超时、软件中心延迟3秒。每个原始报告在round-1/b-*/refresh/。正常及慢配置首行首次/最终均125.59375px；异常状态首次/最终均179.09375px，是真实错误说明的稳定占位。软件中心延迟时系统控件先呈现，无需等应用列表。

正常场景与延迟场景读取真实B的配置/业务响应；异常/空状态仅在浏览器中投影GET响应，未损坏文件、更改ACL或保存空布局。请求断言禁止首页配置POST。不是HTTP200/DOM存在验收：逐帧核对可见提示、控件ID顺序与位置，并检查空/错/权限/恢复入口及加载截止。桌面慢加载、320深色占位、390加载完成、合法空及损坏状态截图已实际打开。

第一次超时脚本失败保留在b-timeout：采样240帧约4秒，比接口8秒截止短。产品实际已退出占位；改720帧约12秒采样后，相同生产代码在b-timeout-recheck通过。[失败解释](round-1/timeout-harness.md)。原refresh-matrix.json保留当时中断结果，不能把它误读为全通过；以final-summary和逐场景原始结果为准。本轮没有第二份产品修订。

当前B390英文触屏完整应用往返11组通过，含真实KSpeeder、无中间窗口、错误/重试/超时/取消及完整库返回。首次模拟与真实Web返回均1020→1020→1020，CSS/history原模式正常归还，见[报告](../../../../evidence/m70/refresh-stability/round-1/b-pinned-390-en/pinned-entry/report.json)，实际返回截图已打开。原生BFCache命中、实体手机浏览器矩阵不由此宣称通过。

## 冻结输入、保护与清理

前端`17411e920083ef25e55d1519e0d1832371bfbe15`，缓存键`0.16.6-test20261018-preview-17411e9-8995b5589566`。index SHA256`11f289d16046653575477282bcc8e02b6b904674e7e3ad30e6ac1972c0eeaa69`；CSS`33fa66be0377cbbe957c201b2836387f4f7eba4b476432fe93a9679cd299277a`。冻结zip/MANIFEST/SHA256SUMS在忽略目录bin/previews/17411e9，B文件/进程/资源版本与之匹配，部署备份/root/quickstart-backups/home-0166-refresh-17411e9-r1。

后端仍为c9624a3/0.16.6，serve/startdhns二进制SHA均983a1c8b…，实际opkg仍Quickstart0.16.5-test20261018-2、LuCI-r2。本次为快速运行替换，不是新包安装验收。

[最终保护](round-1/post-ui-preservation.json)：20份配置存在/缺失及字节摘要保持，含布局、固定项、链接、网络、DHCP、防火墙和设备资料；LAN .244/default via.1保持，无例外。[应用保护](round-1/app-preservation.json)：KSpeeder配置/脚本/PID680369保持，未启停；NetPolicy各device.json均disabled/stopped且包/二进制不变。16次认证运行（包含原始失败）共32个临时root会话全部销毁，无凭据入库。本地测试5181结束，5180只读参考，诊断探针不进入生产构建。

无push/Release/Action/SDK/新包安装，不操作A/C/D/APK；其他独立历史门禁不由本次刷新修复宣称通过。复验用SSD wrapper运行scripts/ops/home-current-acceptance.py 新目录，QS_ACCEPT_REFRESH=1，匹配上述MANIFEST和既有entry SHA；QS_REFRESH_RELOAD/QS_REFRESH_DELAY、QS_ACCEPT_TOUCH/LANGUAGE/WIDTH/THEME、QS_REFRESH_MODE支持本页列出的场景，严禁覆盖既有证据。

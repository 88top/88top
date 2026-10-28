# 首页外壳调整实施与第三轮检查

已完成界面实施：旧正式顶部＋新产品控件区，删除新增品牌/概览/自建页脚；LuCI系统框架保持。设置图标打开原有新版布局编辑器；独立应用库宿主不再渲染页脚按钮。

**整体视觉验收未全部通过。** 最后打开英文320px触屏截图时发现网络连接标题被操作区压住，额外真实root只读测量确认约7.23px重叠。先前“第三轮全部通过”的结论范围过大；五组自动化通过不能代替这项人工检查。六份该控件/样式源码与修改前f72bac0逐份hash相同，本轮保留了它的原排版。按用户最多三轮要求，不进入第四轮修正；D/F视觉门禁保留此项，顶部/页脚实施和B安装结果独立保留。证据：round-3/b-english-title-320.png、b-english-title-bounds.json、english-body-source-boundary.json。

## 任务树结果

| 任务 | 结果与证据 |
|---|---|
| A 基线与规范 | 起点f72bac0干净且代码已提交；读取旧正式源码，产品契约明确覆盖旧品牌/hero保留条目 |
| B 恢复旧顶部 | 复用原QuickActions外观；官网/设置图标、网络向导、设备管理、FastNet安装引导、按安装状态显示家长控制、应用商店保留；旧click事件显式声明防止重复透传 |
| C 正文/页脚 | 十一控件、布局算法和持久化不变；无lab-header/lab-intro/lab-footer及浮动替代入口；末行仅24px内容留白；空正文通过旧设置重添应用控件，查看全部仍打开完整库 |
| D 本地验证 | Go、105前端、vue-tsc、正式构建及第三轮五组本地UI自动化通过；实际B英文320触屏标题重叠使完整视觉门禁未通过；第一轮LAN确定性门禁通过不冒充真实数据面 |
| E 构建/当前B | x64 SDK status=success，fresh feed，fetch全SHA、三包版本/架构/原始ELF/36资源/模板cache key/SMART依赖/八条keep路径通过；B普通opkg安装，包/文件/serve+helper进程/API/UI与9d74bd3一致 |
| F 清理/收口 | 5组B真实root UI共35项自动化检查，pageerror/console/HTTP错误全空，10组内会话及1诊断会话销毁；配置/备份/复启/地址/路线清理通过；完整视觉验收因上述问题暂停 |

## 三轮边界

1. 第一轮功能自动化通过，实际审图发现浅色设置白图标和手机深色快捷标题硬编码，视觉未通过；round-1保留原图/报告。
2. 第二轮普通主题通过，补充系统深色偏好后，旧全局SVG path color污染currentColor，图标颜色断言失败；round-2/system-dark保留失败。0.16.4虽SDK成功，未安装B，不算最终验收。
3. 第三轮仅图标fill绑定既有var(--c-text)，不改全局样式或正文；0.16.5自动化、安装、顶部/页脚检查通过，最后人工检查正文英文320触屏失败。没有第四轮产品修正；未通过证据保留。

相同API fixtures/同宽度/语言/主题对比：第二轮与修改前8视图共88控件的ID/形态/宽高一致，代表正文完整采集样式一致；第三轮相同场景继续一致。证据为round-2/content-comparison.json与round-3/content-comparison.json，不把总页面高度或原型HTTP200作为通过依据。

已实际打开：本地桌面/320系统深色，B桌面首页、末行系统卡与原生LuCI页脚、390触屏、320深色、英文及复启后的截图。旧快捷卡仍横向滚动；LuCI原生页脚保留，自建Quickstart/应用工具页脚已移除。取消编辑的提示是原操作反馈，新会话不会凭空出现。

## B 当前版本与真实检查

固件重新核验：iStoreOS24.10.1 / kernel6.6.86 / x86/64，N100/QEMU。当前：quickstart `0.16.5-test20261018-2`，luci-app-quickstart `0.16.5-test20261018-r2`，NetPolicy `0.2.0-test20260928-2`且enabled=0/无进程。业务冻结 `9d74bd3a0a04463b3503d67af3afff048619c3f4`，资源key `0.16.5-test20261018-release-8fe1a645ff1b`。

| 当前B证据目录（round-3下） | 断言数 | 业务结论 |
|---|---:|---|
| b-full | 11 | 未登录拒绝、root共享保存、两会话并发冲突/保留草稿、刷新、合法空正文、重新添加应用控件/保存/刷新/完整库、链接持久化、真实deviceId详情、主题 |
| b-shell | 7 | 键盘进入网络向导和完整设备管理；FastNet真实安装提示取消后零安装请求；应用库在响应式重排后保留，关闭恢复焦点/滚动 |
| b-touch | 6 | 中文、系统深色偏好、1024/768/390/320、44px操作目标、流量标签不与测速重叠、无横向页面溢出 |
| b-english | 6 | 实际LuCI英文登录态，同触屏/系统深色/四宽度检查 |
| b-after-restart | 5 | 备份清理并重启主服务后，新root会话从当前配置加载；旧顶部、新正文及主题/响应式仍通过 |

每组都先强制匹配安装包、五文件hash、真实进程、NetPolicy归档和LuCI资源key；不是candidate进程替换冒充opkg安装。两个root会话/组都销毁。额外只读字形测量的一个root会话亦销毁；它发现自动化没有覆盖文字实际越界，不计入35项自动化通过。

## 配置与清理

私有阶段 `/root/quickstart-package-candidates/home-0165-shell-r3`，备份目录700/文件600。安装前和安装后主/备首页、network/DHCP/firewall/Quickstart、设备资料及provider等严格指纹一致，无归一化例外。opkg保留既有/etc/config/quickstart并将新默认放quickstart-opkg，是原配置保留行为；没有force-depends、删除NAS依赖或开启NetPolicy。

安装后显式复启主服务；原startdhns别名helper仍映射旧0.16.3，先核对唯一PID、旧hash、完整命令及原dhns命名空间，仅TERM该旧helper并在同一已存在命名空间启动当前helper。两个进程均为当前564422a9…，无UCI/接口/路由命令。见b-process-refresh.json；不据此宣称独立DHNS HTTP恢复链路通过。

UI真实保存合法推进布局revision27→32、启动台15→17；主配置内容通过API恢复原值，不倒退并发版本。因正常保存将测试上一状态写入.bak，结束后验证主值/代次及全部文件指纹，短暂停主服务避免与保存竞争，原子恢复安装前两份.bak（0600），同步并复启。四份文件在复启和最后只读UI后字节一致；未丢弃用户主配置或回写旧revision。见b-test-backup-cleanup.json、b-final-preservation.json。

最终192.168.30.244/24与默认经192.168.30.1保持，20项配置文件/存在状态匹配。A/C/D未操作，未做真实限速/故障注入。自己的本地5181浏览器测试服务均在finally关闭；指定5180参考服务只读未动。私有安装包和备份作为回退证据保留，不含仓库凭据；未改密码。

## 产物与范围

本次[最终输入](release-inputs-0165.md)以及完整SDK输入/锁/包持久保存在bin/releases/9d74bd3（Git忽略）。Quickstart归档SHA256为947ecfb4…，SDK ID quickstart-home-x64-ipk-0165-20261018-1，builder03e39a514fa1，patch604c26e8…。App Hub16dfb8d与专用feed911b39f/97bf414仅本地提交，未push/公开Release/Action。

本报告记录顶部/页脚实施与B适用x64/IPK安装通过，保留英文320px触屏正文视觉未通过，不关闭全量视觉门禁。既有APK三轮暂停、独立DHNS恢复代理超时、ARM64实机和延期24h观察按原M70状态保留，不扩大为通过。

# 最终候选 0.16.5 输入

冻结业务 `9d74bd3a0a04463b3503d67af3afff048619c3f4`，版本0.16.5-test20261018；干净已提交源码通过标准make release，BUILD_DIR显式放SSD。三架构runtime与Web的MANIFEST、归档、SHA256SUMS及未改的两份NetPolicy归档持久保存bin/releases/9d74bd3。

Quickstart归档SHA256 `947ecfb4aac0737ba11464e2129f362a09f9f54a1f2764a44b3930678542321a`，资源key `0.16.5-test20261018-release-8fe1a645ff1b`。三份输入在builder缓存按精确hash读取；新归档独立命名，不覆盖0.16.4。NetPolicy二进制仍为0.2.0-test20260928，保持disabled。

App Hub main `16dfb8d`、专用nas `911b39f`、专用nas_luci `97bf414`；canonical基点及第三方feed pin保持。SDK builder `03e39a514fa1`，新patch SHA256 `604c26e8548ff991ec10005a55195c6dea1d4c6b96531027a86e87decca02b7d`；反向dry-run、13测试、preflight、release/deploy/verify通过。旧0.16.4构建使用其物理不可变runtime路径挂载，完成status=success，但UI因系统深色图标被拒绝，未安装，不是最终交付。

最终Build ID `quickstart-home-x64-ipk-0165-20261018-1`：PROFILE=quickstart-home-x64，fast、FEED_REFRESH=always、FORMATS=ipk、JOBS=4。status=success，fetch全SHA、SDK/feed锁、三包解包/原始ELF/36资源/cache key/依赖/保留路径通过，完整输入与产物持久保存bin/releases/9d74bd3/sdk/同名ID。本次只覆盖B适用的x64/IPK；不重开历史APK第四轮，不声明ARM64安装或24h观察通过。

最终B私有阶段 `/root/quickstart-package-candidates/home-0165-shell-r3`，备份实际程序/包记录/配置，目录700、归档600；此前0.16.4阶段仅备份与更新普通opkg索引，没有安装。原共享builder仍为runtime-linkease-176-source-date-fix-20260930，其他任务工作树未修改。未push、未公开Release、未触发Action。

B已安装0.16.5-2/r2，五组匹配版本的真实root UI自动化通过；测试主值/备份清理、主服务复启与最终保留检查通过。最后人工审查及只读字形测量发现英文320触屏网络连接标题重叠约7.23px，完整视觉门禁未通过；按三轮上限暂停，不将SDK成功扩大为全验收成功。详见[检查报告](acceptance.md)。

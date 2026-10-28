# 顶部恢复候选 0.16.4

历史输入：系统深色偏好检查失败后不安装。SDK构建最终status=success，但不能代替UI验收；最终候选见[0.16.5](release-inputs-0165.md)。

业务冻结提交 `250606049160352ff3262eb5b7dbdd789665ef6f`，版本 `0.16.4-test20261018`。三个架构runtime由干净已提交源码的 `make release` 生成；显式BUILD_DIR在SSD，web/dist为项目既有输出目录，归档/manifest及未改的两份NetPolicy归档持久保存 `bin/releases/2506060/`。

Quickstart归档SHA256：`78d9dd2838ea732c31276be861959f7d0541e28cca95daf97866707731ce2a41`。资源key：`0.16.4-test20261018-release-e32029eb8f9e`。NetPolicy x64/ARM64仍为a2602b4b…/d49ce90f…原版原字节，不启用执行服务。

App Hub `dc68dd7`；专用nas测试工作树 `89493c0`、nas_luci `76a9af0`，基点仍bee9750/a370c0b。隔离builder `49c002f85795`；输入patch SHA256 `b18b9098f8ab6e5e122be798f310d830e5e39ed11146ee4a30a595221d6f2a5e`。完整目录反向dry-run通过；builder 13测试、preflight、release/deploy/verify通过。原共享builder及其他任务工作树保持。

本次设备为x64/IPK，仅构建 `quickstart-home-x64-ipk-0164-20261018-1`，fast、FEED_REFRESH=always、FORMATS=ipk、JOBS=4；不重启历史APK的第四轮，也不声称ARM64实机通过。构建器测试输入机制明确记录未发布feed补丁及精确hash缓存，不冒充公开Release/canonical feed已同步。未推送、未上传Release、未触发Action。

B私有安装阶段：`/root/quickstart-package-candidates/home-0164-shell-r2`，备份权限700/600；待包核验后安装和严格配置保留检查。当前文档为输入冻结记录，尚不代表安装验收通过。

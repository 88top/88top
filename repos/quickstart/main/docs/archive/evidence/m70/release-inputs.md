# 0.16.2 未发布测试输入

这是历史0.16.2输入。当前0.16.3及六个IPK结果见[新冻结输入](netpolicy-preparation/release-inputs-0163.md)与[M70状态](status.md)，不要将此版本当当前发布候选。

当前 runtime 来源是干净提交 `eda99c4f5fcb03395024e09b8540a8da5464c6c9`；后续提交只记录测试工具、证据和文档，不改变此 runtime。当前设备业务验证见 M69.3，匹配包安装结果以本目录 status 为准。

| 归档 | SHA256 |
|---|---|
| quickstart-binary-0.16.2-test20261018.tar.gz | 4af68fb8009d1055a85c4ac7aa2e9d8c64a469b76a74b1751d8897ec74fc2ff4 |
| quickstart-netpolicy-0.2.0-test20260928-x86_64-unknown-linux-musl.tar.gz | a2602b4b4889ea306f50560302c38bdfb5582cc05f90abb22f4e7f8f51f07827 |
| quickstart-netpolicy-0.2.0-test20260928-aarch64-unknown-linux-musl.tar.gz | d49ce90f9093d903eefaef4bd801d93eade751d6145b6281192ec64250c13843 |

三份归档、MANIFEST、SHA256SUMS持久保存在业务仓库忽略目录 `bin/releases/eda99c4/`。NetPolicy为原版本原字节；没有据此确认ARM64数据面ready。

本地配方提交：App Hub main `29d1837`；nas专用测试分支 `quickstart-home-016` 的 `fcd6112`（基点bee9750）；nas_luci同名分支 `fde0e6a`（基点a370c0b）。原仓库主工作树分支未切换。SDK专用分支 `8f43e098f02b`，隔离runtime `runtime-8f43e098f02b`，输入补丁SHA256 `80084c4f78e0f09a81b45f8aae2550203cf3a00f8046b2f9185aa1e8806aaf88`。

通过验收的独立 IPK 构建参数（已在隔离实例运行，不需要Action）：

| 参数 | x64 | ARM64 |
|---|---|---|
| SDK_BUILDER_TARGET | quickstart-home-builder | quickstart-home-builder |
| BUILD_ID | quickstart-home-x64-ipk-0162-20261018-1 | quickstart-home-arm64-ipk-0162-20261018-1 |
| PROFILE | quickstart-home-x64 | quickstart-home-arm64 |
| BUILD_MODE / FEED_REFRESH | fast / always | fast / always |
| FORMATS / JOBS | ipk / 4 | ipk / 4 |

两组 build.status=success、fetch SHA256SUMS 与各三包完整 payload 校验通过。持久产物位于 `bin/releases/eda99c4/sdk/<BUILD_ID>/`。先前两个不含 `-ipk-` 的双格式构建仅作失败/中止证据，APK 在 unbound DNSTAP 配置时缺宿主 protoc/protoc-c；按三轮优化边界暂停，未产生通过验收的 APK。

后续若用户明确授权公开发布：先上传这三份精确归档到 `istoreos/istoreos-app-hub` 的新标签 `quickstart-runtime-v0.16.2-test20261018`，核对公开下载字节后再推进canonical feed的quickstart-0928分支和App Hub main。推送前重新检查远端基点并处理新增差异，不强推；当前测试patch不再重复叠到已含相同改动的feed。不要向旧0.15.0标签混入不同批次的Go runtime，也不要省略ARM64 NetPolicy资产。

本轮没有Git push、Release上传或Action触发。B已完成匹配 IPK 安装，实际元数据、进程、资源和真实 root UI 证据见本目录。B是IPK固件，不做APK原地安装。其他真实设备、ARM64数据面及延期的24小时观察另行记录。

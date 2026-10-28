# 0.16.3 冻结测试输入

业务c78f62c1e6e0fd41d6572dc2ac64cf81ba2bd9fc；版本0.16.3-test20261018。三份归档、MANIFEST和SHA256SUMS持久保存在bin/releases/c78f62c。NetPolicy引擎仍为原版原字节、未启用。

| 归档 | SHA256 |
|---|---|
| quickstart-binary-0.16.3-test20261018.tar.gz | e202e9c3a8e8cc1e9d3c6bf20732597097e89609e975bda33580db8e45c32416 |
| quickstart-netpolicy-0.2.0-test20260928-x86_64-unknown-linux-musl.tar.gz | a2602b4b4889ea306f50560302c38bdfb5582cc05f90abb22f4e7f8f51f07827 |
| quickstart-netpolicy-0.2.0-test20260928-aarch64-unknown-linux-musl.tar.gz | d49ce90f9093d903eefaef4bd801d93eade751d6145b6281192ec64250c13843 |

App Hub main a10b53b，nas专用测试分支7e1a215、nas_luci专用测试分支965e2f6；canonical基点与0.16.2相同，不切换原工作树主分支。builder测试分支9c4f01a26d9c、隔离runtime-9c4f01a26d9c，patch ccf15b74ac0e8cf3ac24128c43c82ce68dbba42877fdcbfa36aa0172cb3d4e79。

新构建仅FORMATS=ipk、JOBS=4、fast、FEED_REFRESH=always。x64 ID quickstart-home-x64-ipk-0163-20261018-2；其完成后串行执行ARM64 ID quickstart-home-arm64-ipk-0163-20261018-1。两组status=success，fetch SHA256SUMS、包内ELF/36资源/版本/架构/依赖/保留路径、SDK/feed锁/patch均通过，完整产物与输入持久保存在bin/releases/c78f62c/sdk/对应目录。x64 -1失败仅为补丁路径输入错误，完整失败输入也保留，不计通过。

不执行Git push、公开Release或Action。若后续获得公开发布授权，使用新标签quickstart-runtime-v0.16.3-test20261018与上述三份精确归档，公开下载验证后再推进canonical feed；不能把旧0.16.2或失败输入当当前发布候选。APK仍沿既定三轮边界暂停，没有APK验收结论。

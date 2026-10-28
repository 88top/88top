# 已安装应用图标：当前B验收

第一候选`e335ceb4709e750aeece35d0664f06e0c80bb69e`已直接替换B`192.168.30.244`并通过本轮验收。6个真实图标已显示，用户刷新即可查看。当前缓存键`0.16.6-test20261018-preview-e335ceb-0de9dd6eef66`。

来源：当前软件中心installed数组没有单独的icon字段；其已安装卡片按name读取`/luci-static/resources/app-icons/<name>.png`。本地openwrt-app-meta/meta.mk安装规则在opkg/APK上均将logo.png放入该公开目录。B旧软件中心自身也使用该路径，已读取实际前端代码确认，不是猜测远程图标地址。[两机资源指纹](source-assets.json)记录B和APK192.168.9.140各6个实际PNG的HTTP200、尺寸、大小、SHA；iStoreNAS原始PNG已打开检查。没有将图标复制或重绘进Quickstart。

实现：受限应用ID生成同源PNG路径；`ApplicationArtwork`统一完整启动台、首页固定项、排序预览和候选列表。保持原图标框、标题、业务入口和配置，contain显示、不拉伸、不滤色；装饰图片alt为空，不重复朗读按钮名称。工具/内置动作/自定义链接继续原glyph，不接受元数据或链接中的任意图片URL，不访问外网图标服务。图片失败切回原glyph，当前渲染不循环重试、不触发目录重读，图片不决定安装/运行/权限状态。

当前证据：

- [117项前端测试](../../../../../evidence/m70/installed-apps/icons/tests.log)、[类型检查](../../../../../evidence/m70/installed-apps/icons/types.log)、[快速Web构建](../../../../../evidence/m70/installed-apps/icons/build.log)通过。新路径测试含工具/链接隔离及越目录、URL、换行、超长ID；第一次路径检查也通过，保留[path-first](../../../../../evidence/m70/installed-apps/icons/path-first.log)。SSD入口使用原工具链，实际产物仍在web/dist。
- [本地正式页面](../../../../../evidence/m70/installed-apps/icons/round-1/local/report.json)5组/8视图通过，含原头部、十一控件、320/390/深色、图表绘制和隐藏停止读取；390截图已打开，八工具原图标尺寸正常。
- [B真实登录态UI](../../../../../evidence/m70/installed-apps/icons/round-1/b-current/app-icons/report.json)6组通过：6个PNG实际解码且ID/路径对应，首载仅一个软件中心GET；1440/768/390/320及深色无横向溢出；404、无效PNG及图片请求模拟断网分别回退SVG、tile/frame尺寸不变、每个失败仅请求一次，目录仍可用；重新打开后恢复真实图标。
- B首页固定、编辑排序预览及候选列表验证通过。仅在浏览器中覆盖一次配置GET响应以将已安装应用置于可见固定项；未保存到设备，没有修改用户固定顺序、数量或链接。系统工具仍为原SVG，图标处理/开关启动台未新增目录读取。
- 实际打开检查了B桌面、390浅/深色、缺图兜底、固定项和编辑预览截图。正常场景控制台无错误，后续仅有刻意注入图片404/断网记录，pageerror为0；未访问外部来源或软件中心写入/执行入口。
- [B候选文件/进程](round-1/b-current/device.json)验证index、CSS、vendor、语言和后端进程指纹匹配，LuCI缓存键匹配；两个短期root会话均销毁。NetPolicy保持disabled/stopped。
- [保护检查](round-1/b-preservation.json)：20个首页/业务/网络路径状态和字节、LAN地址及默认路由via192.168.30.1不变，无归一化例外。[私有备份记录](round-1/b-prepare.json)，部署备份`/root/quickstart-backups/home-0166-app-icons-e335ceb-r1`。

前端index SHA`fe022cd489261a9d3fd6e7f9f21bd5c15baa816ae129f8830275985d44258a61`，CSS SHA`93eba6a706d5635944223498b4c0bd84394c9f3855b44324430a932f8363b650`；vendor/英文语言资源不变，完整冻结MANIFEST/zip在忽略目录`bin/previews/e335ceb/`。后端保持c9624a3/0.16.6，opkg仍记录Quickstart/LuCI0.16.5，本次是授权的快速Web替换，不是新包安装验收。

未修改/部署APK设备，只验证其公开图标资源；不代表APK完整Quickstart验收。无SDK/push/Release/Action，A/C/D未访问。首载一次/8秒超时/手动重试继续沿用上阶段实现，本轮未重复声称新的超时故障场景通过。

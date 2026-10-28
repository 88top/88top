# 已安装应用目录修复验收

第一候选通过，源码`d2359750210e6604b10abfbc645f0b46528145b4`，B`192.168.30.244`。真实软件中心返回6项，首页从0项恢复到相同6项：linkeasefull、baidudrive、istorex、istoreenhance、kai、dockermanager。桌面与390px手机截图已实际打开审查，名称换行正常，无横向溢出；无权限和异常目录截图也已打开。

原因：旧`/cgi-bin/luci/istore/app/v1/catalog/`依赖B不存在的`/tmp/run/istore-meta/meta`，HTTP200中返回`success=-1000`。软件中心现有GET`/cgi-bin/luci/admin/store/installed`返回真实原始数组，读取软件中心维护的元数据及包状态。修复只改正式首页的读取适配，不改旧API或全局请求层，不创建临时目录伪装安装数据。

已实现：单一owner首载一次、有界超时/取消、显式重试，HTTP/JSON/网络错误不转换成空列表；401/403显示无权限，成功`[]`才显示未安装。失败时不再同时提示“没有匹配”。固定、链接、布局不因读取更新；无entry不猜路由。已安装应用按元数据执行同源整页导航，修复`/apps/`被错误当内部SPA路径的问题。系统工具保留原动作及内部导航。

当前证据：

- [基线失败](../../../../evidence/m70/installed-apps/baseline-b/installed-apps/report.json)：相同B真实登录态，软件中心6项/首页0项，原命令退出1；截图与旧业务错误保留。
- [114项前端测试](../../../../evidence/m70/installed-apps/tests.log)、[类型检查](../../../../evidence/m70/installed-apps/types.log)、[快速Web构建](../../../../evidence/m70/installed-apps/build.log)通过。构建经SSD入口，产物实际位于web/dist。
- [正式构建正常UI](../../../../evidence/m70/installed-apps/round-1/local/report.json)11组通过；[异常目录UI](../../../../evidence/m70/installed-apps/round-1/local-invalid/report.json)6组通过，保留各宽度/主题、原表单、布局保存/失败草稿、链接刷新和隐藏清理检查。两组顺序使用5181并关闭，不重建5180。
- [B当前目录及UI](../../../../evidence/m70/installed-apps/round-1/b-current/installed-apps/report.json)5组通过：实际6项ID、名称及可启动状态相同，首载1次GET/无旧目录请求；手机及滚动锁；`/apps/`整页导航（仅截获目标，未执行应用动作）；403/异常200对象/成功空数组注入后显示正确，撤去注入并显式重试或刷新恢复真实6项。所有软件中心请求均为installed GET，不访问configured/entrysh/install/remove/update等动作。正常场景无控制台错误，唯一后续403控制台记录来自刻意注入；pageerror为0。
- [B文件/进程/包记录](round-1/b-current/device.json)：index、CSS、vendor、语言及实际运行后端指纹匹配冻结候选，LuCI缓存键匹配；两个短期root会话已销毁。NetPolicy仍enabled=0且无进程。
- [保护检查](round-1/b-preservation.json)：20个首页/业务/网络配置路径状态和字节一致，LAN地址及默认路由via192.168.30.1不变。私有原文件备份见[b-prepare](round-1/b-prepare.json)，归档不含会话凭据或配置内容。

本轮按用户授权使用最快Web直接替换路径，未新装软件包。后端保持`c9624a3`/0.16.6；opkg仍Quickstart/LuCI0.16.5、NetPolicy0.2.0。当前前端键`0.16.6-test20261018-preview-d235975-118247342b18`，冻结资源：

| 文件 | SHA256 |
| --- | --- |
| index.js | `00bbef514d1fd6a71c499ca601f71000d305b8a06f09c927ff36cab45760411a` |
| style.css | `c4373029af1cbe4fdb2dcf9bae6f4fe42b3d164ea0837510d607cf497a5fcab1` |
| vendor.js | `80ff17f99caa1aa90cafe9a231c39ceabb2cdf1c543bf5dec3d44fcbcd184477` |
| i18n/en.json | `2da3ec81c6d15ca52a574576486e534acf4a040d61adbc34cad360b91af76a4f` |

冻结zip及MANIFEST位于忽略目录`bin/previews/d235975/`，私有设备备份`/root/quickstart-backups/home-0166-installed-apps-d235975-r1`。未push、发布或触发Action，不把本次读取/导航测试当成各应用内部业务健康证明。A/C/D未访问。

诊断方法：应用diagnosing-bugs技能，先建立真实B的“软件中心ID集合=首页ID集合”回归并取得红色结果，再更换唯一读取来源验证转绿。鉴于原接口已明确返回目录不可用而软件中心同会话返回6项，不再进行宽泛历史二分/额外日志探针；保留精确HTTP适配测试与真实调用方回归，防止仅测归一化函数而漏掉选错接口。

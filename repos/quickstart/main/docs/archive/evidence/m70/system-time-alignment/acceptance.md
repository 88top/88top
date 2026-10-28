# 系统时间字段对齐：当前B验收

2026-10-20，第二轮产品候选通过，源码5c1ecec；B前端资源版本`0.16.6-test20261018-preview-5c1ecec-2e154e2c9a93`。任务和失败记录见[status.md](status.md)。

## 处理与可见结果

仅修改SystemInfo.vue的时间字段容器和呈现样式：系统时间/已启动共用一个按语言自然计算的标签列，标签及冒号右对齐，数值左对齐，文本基线对齐。保留原全角冒号及其自身字面留白，去掉额外8px列间距；值允许自然换行，不用空格补齐、不固定中文标签宽度。专属system-time-row避免首页通用.item样式覆盖。

同设备1440px中文首页：两行数值起点原差14px，现在差0；额外列间距8→0px。系统完整卡高度290px保持。完整信息弹窗也使用同一组排版；原弹窗独立flex行在窄列可将时间值挤到下一行，新网格统一两行。1440弹窗自然高度868.578125→876.578125px（+8px），不将它伪称完全等高；时间字段更稳定地按键值阅读。见[按真实语言匹配的几何对照](round-2/comparison-verified.json)。

## 当前证据

- [四组本地检查](../../../../evidence/m70/system-time-alignment/round-2/local/report.json)：中英/深浅及1440/768/390/320代表组合，首页标准形态、详情各检查一次，8个呈现面均对齐无溢出。
- [五组加载回归](../../../../evidence/m70/system-time-alignment/round-2/loading-local/report.json)：状态/版本先后返回、加载模糊、全失败、显式重试；完整1440保持290px、768保持471px，摘要390保持153.984375px、320英文保持183.984375px。卡片实例不重建，原数据/未知占位规则保留。这是当前构建的本地验证，不冒充本轮B故障注入。
- [最终B16组](../../../../evidence/m70/system-time-alignment/round-2/current-b-languages-verified2/report.json)：中文/英文×浅/深×1440/768/390/320，共32个首页完整/详情呈现面。字段右/左边界一致、列间无额外空隙、两行不交叠、无横向溢出、真实时间及启动数据可见，关闭弹窗释放滚动锁；无页面异常或写请求。
- 当前B固件固定语言zh_cn，浏览器locale不能覆盖。最终测试仅在浏览器通过初始化访问器投影Quickstart语言/语言资源地址，原HTML、真实API、后端与路由器语言设置保留；逐例断言window.vue_lang和实际System Time/系统时间标签，保证英文确实被覆盖。布局仅浏览器投影系统为standard，避免窄屏自动摘要漏验，不保存布局。
- 已实际打开B当前1440中文首页/详情、390中文以及320英文深色首页/详情事实区截图，与用户问题及原基线对照。型号、固件、内核、图表和已有业务色未作为本轮重新设计对象。
- [业务保护](round-2/business-protection.json)：SFC script相对起点25e8399逐字节一致，系统时间、启动时长、型号/固件/内核绑定表达式保留。原业务保护边界随允许的展示改动更新，不使用原型时代整文件不可变条件。
- [构建](round-2/build.json)走SSD缓存，实际web/dist，仅index.js/style.css变更，无资源增删；[部署](round-2/deployment.json)只替换这两份前端文件及LuCI版本键，先做远端私有备份，无重启。[四份公开资源](round-2/public-assets.json)与冻结清单一致。
- [最终20条配置/LAN/路由保护](round-2/preservation-final.json)严格通过；[最终进程/文件核验](round-2/runtime-final.json)与部署前相同，包含Quickstart serve9386/startdhns14546、FastNet10304/配置/入口脚本、后端/NetPolicy/opkg文件。NetPolicy仍禁用，路由器语言仍zh_cn。8个临时root会话销毁，无凭据入库。

## 保留的失败及测试修正

1. round-1/local：本地独立构建错误访问LuCI路径，空页面超时；修正本地入口。
2. round-1/local-harness2：第一轮产品的通用.item被正式适配CSS覆盖，导致时间与启动分成左右两块。第二轮改用专属行名解决，未叠加!important。
3. round-2/current-b：初次16组几何通过，但审图发现所谓en组合仍为中文；这份报告只能证明实际中文页面，不能计作英文通过。原baseline-b的en320同样实际中文，不用于英文前后比较，早期comparison.json属于仅按请求语言匹配的中间记录，最终以comparison-verified.json为准。
4. round-2/current-b-languages-verified：尝试重放HTML设置语言后LuCI依赖未就绪，空壳超时；保留报告和截图，改为浏览器初始化变量投影、不拦截HTML。最终完整16组语言严格验证通过，无产品再改动或再部署。

本轮只一次远端前端替换，产品优化两轮。源码和证据本地提交、未推送。后端c9624a3/0.16.6、opkg0.16.5记录保持，本轮不是新包安装/SDK/APK/其他设备/长期观察或全站配色验收，不启动测速或写网络策略。

[当前中文效果](../../../../evidence/m70/system-time-alignment/round-2/current-b-languages-verified2/zh-light-1440-facts.png) · [当前英文手机效果](../../../../evidence/m70/system-time-alignment/round-2/current-b-languages-verified2/en-dark-320-facts.png)

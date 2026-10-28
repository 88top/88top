# 实施期编译反馈

这些属于首次浏览器候选冻结前的本地反馈，未部署设备，保留失败原因。

1. Go首次检查：`undefined: uci.GetDefaultConfigDir`。库没有该入口；使用与当前生产配置一致的`uci.NewTree("/etc/config")`，修正后service/routes测试通过。
2. Vue类型首次检查：旧DOM声明不支持NodeList/HTMLCollection展开及HTMLElement.inert；改用Array.from和原生inert属性保存/恢复。
3. 后续Vue检查：`HTMLElement.checkVisibility`类型缺失；改用getClientRects与visibility读取判断可聚焦元素。

所有修正仍为首个正式UI候选，实际浏览器检查另存round-1及后续目录。旧源码不变保护仅放宽组件入口、组件状态和启用自身配置；DHCP/路线/限速/断网任务事务不重写。

首次全量前端检查145项中141通过、4失败，均为原页面内必须存在capabilityActionV2/安装按钮/prepareSpeedService内重载的源码断言。M71已明确把安装移到复用抽屉并禁止全页重载覆盖草稿，测试已改为验证两个页面接入同一组件、预检/执行在共用客户端、详情只刷新观察值且不调用load/syncForms。行为由真实页面中的浏览器投影和实际安装验收继续覆盖，未删除业务保护断言。

浏览器round-1：缺少allowConfigure默认true，导致设置面板就绪后不显示预览切换，保留quick/failure.png。round-2：修复后quick及12组交互矩阵通过，但实际审图发现LuCI全局h2/h4浅底与阴影污染新抽屉，暗色标题对比度不足，以及新增入口缺翻译。第三候选定向隔离标题样式、补齐翻译，并增加标题装饰与文字对比度断言；旧截图保留。

第三轮矩阵和mobile-diagnostic截图仍显示手机原生菜单图标覆盖标题，自动文字对比度/命中检查没有发现该视觉遮挡。不视为通过；已询问用户是否允许一次定向追加修正，未收到答复前不再修改产品界面或部署新前端。

后端设备验收保留三个运行记录：backend-acceptance.json首次脚本误要求success字段必须存在，实际Go契约用omitempty省略零值；客户端原本兼容，修正验收脚本并新增契约回归测试。backend-acceptance-current.json首次启用后立即检查尚未就绪，已完整恢复；不能据几乎零等待判断引擎故障。backend-acceptance-startup.json增加60秒有界观察，约3秒后就绪、当前方式仍eqos，最终恢复原配置/停用/开机状态，检查通过。这些没有修改第四个UI候选，也未覆盖失败证据。

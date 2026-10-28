# 本轮失败记录

- 首次前端类型检查：`vue-tsc: not found`，环境缺依赖，未执行类型验证。随后使用SSD缓存入口在工作树专属SSD目录安装锁定依赖，显式链接原本不存在的web/node_modules；源码未搬迁。
- 首次新增配置测试直接使用Node strip-types：`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`，TypeScript parameter property不受strip-only支持。改为用项目Vite锁定的esbuild在内存编译实际生产模块，解析与正式Vite相同的扩展名省略导入；断言未减少。后续35项通过。
- 首次B只读预检工具：ubus的set/grant/destroy成功可以返回空stdout，工具误用json.loads('')，出现JSONDecodeError。finally仍执行了destroy命令（SSH退出0），会话没有保留；该次未采集API/UI结果。修正空stdout处理，用新目录重跑；不改设备认证/密码/配置。
- 初次共享源码抽取的apply_patch同时Delete/Add同一路径被工具拒绝，无文件改动；改成Update后抽取完成。
- B预检第二次的API采集成功，三个LAN v2及首页配置返回404，应用目录为6项；UI截图实际打开后发现LuCI的“Session expired”遮罩。工具原先仅按无密码框判loggedIn，属于不足的断言，不是登录态通过。补充过期状态检查，并按目标固件给临时管理员session授予LuCI读取所需ubus ACL；保留第二次原图/报告，第三次用新目录复测。未点击配置动作；退出销毁临时session。

以上是环境/测试工具问题，不记作产品通过；实际最终结果见对应日志。旧证据及失败目录不覆盖。

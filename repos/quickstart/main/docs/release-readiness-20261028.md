# Quickstart 上线候选验收（2026-10-28）

结论：`root@192.168.30.7` 已更新到 `0.17.1-rc20261028` 第 8 轮候选。**当前 Quickstart 登录/API 链路在本轮审查和负向测试范围内，未发现匿名绕过密码取得接口权限的路径**；专项 58 项检查通过。**固件的 uhttpd/ubus 存在已复现的未认证崩溃漏洞，完整正式上线验收仍未通过**。真实 root 密码成功登录、软件包级升级和可选组件真实数据面验证尚未完成。

用户已说明生产 WAN 默认 REJECT，测试环境为方便操作开放；按用户要求，本次不再将测试 WAN 配置列为上线阻塞项，不应用先前防火墙提案。

## 部署与回滚

- 上游冻结点：`cf483d45f455a96984b9f71848f76c4e3b04f245`，已包含本轮期间合入的温度回退、主机名提示修复；其上叠加本轮工作区修复，运行版本明确标记 `-dirty`。
- 最终运行二进制 SHA256：`6fa07b1301e709d5d56a6ef69fa2a58bb4d4bfc4815d666f71c33c7f30149574`；已与实际 `/proc/<pid>/exe` 核对。
- 前端缓存版本：`0.17.1-rc20261028-candidate-4e932da8ed11`，后端、前端资源和模板均通过部署校验。
- 原始版本备份：`/root/quickstart-backups/security-0.17.1-rc20261028-r1`，可恢复部署前的二进制、Web 和模板；最新一次部署前备份为同目录下的 `security-0.17.1-rc20261028-r8`。
- 持久产物：`bin/releases/security-20261028/r8/`，包含 x86_64 候选归档、原始二进制、Web zip、源码输入归档、逐文件 MANIFEST 和 SHA256SUMS；父目录保留第 7 轮产物。精确源码输入不只依赖旧提交号。
- 本轮是二进制与 Web 部署，**不是 IPK/APK 安装**。原 quickstart/opkg 和 LuCI 软件包版本记录保留，不能拿这些记录当作运行版本，也不能把本轮描述为正式 feed 发布。
- 新增 `/lib/upgrade/keep.d/quickstart-state`，保留 `/etc/quickstart/`；实际 `sysupgrade -l` 已包含首页配置、备份及现有 Quickstart 状态文件。安装失败与回滚会恢复原保留清单，或删除本轮新建的清单。

证据：[最终部署日志](evidence/release-20261028/deploy-r8.log)、[初轮运行状态](evidence/release-20261028/runtime.log)、[当前候选 manifest](evidence/release-20261028/candidate-manifest.json)。

## 已发现并修复的问题

| 问题 | 复现与修复 |
|---|---|
| 旧接口只判断转发会话 ID 非空 | 在目标机通过 SSH 直连 loopback，用伪造 ID 能进入旧接口；现在统一 HTTP 入口重新查询 rpcd，要求有效 root 身份及匹配令牌，覆盖旧模块和别名 |
| 跨站写请求 | 原目标机带真实会话的外站 `text/plain` POST 能进入业务解析；现在检查来源，限制写请求为 JSON，拒绝跨站来源、表单及纯文本类型 |
| LuCI 旧代理的拒绝响应兼容 | 提前关闭仍有请求体的连接会出现 TCP reset 和 LuCI 500；现在在有大小、时间上限的条件下处理被拒绝请求体，实机返回预期拒绝 |
| UCI 批处理命令替换 | 本地真实 shell 回归复现 UCI 值中的 `$()` 被 heredoc 执行；改为直接向 `uci batch` 标准输入传递数据，并检查 UCI 错误后才执行 reload |
| DDNS/DDNSTO 参数拼接 | 外部参数编码成单个 shell 参数；桩 UCI 测试同时确认命令未执行、原值未被改变 |
| 密码和 ubus JSON 参数损坏 | 用 JSON 编码密码，并只拆分 ubus 对象、方法和整个 JSON 参数；空格、引号、反斜杠和 Unicode 的测试通过，没有改动设备真实密码 |
| 改密接口未拒绝空密码和终止符 | 原先缺字段/null 会解码为空字符串并进入系统改密助手；现在拒绝空密码以及 NUL/CR/LF，避免异常请求清空密码或截断系统输入。实机 8 种无效请求被拒绝，shadow 哈希不变；这是认证后接口缺陷，不是已证明的匿名改密漏洞 |
| 多种 Cookie 并存时令牌错配 | 实机复现有效 HTTPS root 会话与旧 `sysauth` Cookie 并存时 getToken 取错会话；改为使用经过校验的转发会话，实机混合 Cookie 验证通过 |
| 旧前端调用未声明 JSON | 补齐统一请求层的写请求类型，回归覆盖旧密码、重启及模块设置调用，避免安全加固阻断旧业务 |
| 挂载成功提示的 HTML 注入 | 磁盘与挂载路径恢复默认 HTML 转义；确认弹窗使用文本渲染。恶意标签参数不再成为标签，保留原操作流程 |
| 资源及本地接口边界 | 请求体限制 1 MiB，增加读头/读取超时，敏感响应禁止缓存；Unix 目录与 socket 权限收紧为 0750/0600 |

该固件不会向 CGI 转发 `Sec-Fetch-*`，所以本轮没有把它当作实机唯一防线；实机验证的是 Origin 和 JSON 写入限制。策略参考 [OWASP CSRF 防护说明](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)。本轮没有声称对所有已认证 root 写接口完成了穷尽的输入审计或渗透测试。

## 验证结果

| 验证项 | 最终结果 |
|---|---|
| 后端全量测试 | `go test ./...` 通过 |
| 前端回归 | 164 项通过，类型检查和生产构建通过 |
| 部署及故障回滚 | 通过，包含旧模板、资源哈希错误拒绝及配置保留清单回滚 |
| 业务本地回归 | 身份/地址、能力降级、路线、迁移事务、分组计划、流量额度、IPv6 及高级工具全部通过；这些不是硬件数据面测试 |
| 产品覆盖矩阵 | 55 项，48 项迁移及 7 项新增验证通过 |
| 前端依赖扫描 | `npm audit` 从 21 项降至 0 项 |
| Go 漏洞扫描 | 原本 33 个关联漏洞 ID，其中 15 个有调用路径；Go 1.26.10 和相关依赖更新后，`govulncheck` 未再报告漏洞 |
| 实机安全检查 | 24 项通过，覆盖匿名、伪造、非 root、过期/撤销会话、三种 Cookie、混合 Cookie、来源/类型拒绝、体积限制和过期版本冲突 |
| 密码/Lua/反向代理专项 | 58 项通过：真实有效 root 转发头伪造及大小写/下划线/重复变体均不能越过 Lua；匿名和非 root 不能通过公开 ubus 创建、读取、修改或授权会话；错误/缺失密码被拒绝；实际 LuCI 退出销毁 rpcd 会话；改密无效输入被拒绝 |
| 匿名路径检查 | 169 个路径均被鉴权入口拒绝；这是路径拒绝检查，不等于各方法的业务操作验收 |
| 实机业务读取 | 31 个主要接口返回有效业务结果，覆盖系统、网络、磁盘、RAID、SMART、共享、Docker/下载/DDNS、应用、设备及迁移预览 |
| 实机写入验证 | 首页 layout/launcher 同值保存通过，版本/hash/inode/mtime 均不变；过期版本返回 409 |
| 页面 | 首页、设备和网络向导，1440/390/320 共 9 组加载通过；无脚本异常、异常 HTTP 响应或横向溢出，不代表所有表单和视觉细节都验收完成 |
| 会话清理 | 本轮脚本创建的临时会话全部销毁，过期会话按已不存在处理 |

ECharts 和构建工具安全升级按 [ECharts 6 迁移说明](https://echarts.apache.org/handbook/en/basics/release-note/v6-upgrade-guide/)及 [Vite 7 迁移说明](https://v7.vite.dev/guide/migration)调整，采用官方 v5 主题保留原图表外观。

最终实机证据：[安全与接口](evidence/release-20261028/round-8/security.json)、[页面](evidence/release-20261028/round-8/ui.json)、[专项鉴权检查](evidence/release-20261028/auth-chain/results.json)、[组件与迁移预览](evidence/release-20261028/runtime-capabilities.json)。此前轮次属于诊断过程，以第 8 轮及专项检查为当前验收结果。

## 密码登录、Lua 与接口权限的实际逻辑

1. 浏览器向 LuCI 提交用户名和密码。设备实际使用 ucode dispatcher 调用本地 rpcd `session.login`；缺字段不会跳过密码校验。rpcd 的 root 登录配置引用系统 shadow，当前 root 已有密码哈希。按对应 [rpcd 源码](https://github.com/openwrt/rpcd/blob/9f4b86e7/session.c)，公开 login 处理器要求字符串用户名/密码，匹配系统密码后才创建随机会话。
2. LuCI 成功后才设置会话 token 与 `sysauth_https` Cookie；HTTPS Cookie 带 Secure、HttpOnly、SameSite=strict。后续接口依靠会话身份，而不是每次重传密码。获得有效 root 会话的人可以代用该身份，因此 Cookie/SID 应按凭据保护。
3. `/istore` 的 Lua 控制器本身没有 LuCI admin 页面的登录门禁。它从三种 Cookie 查 rpcd，会过滤外来包含 `FORWARDED` 的 CGI 请求头，再自行注入 SID/token，转发到 `127.0.0.1:3038`。**不能把 Lua 路由存在当作已经授权，也不能把客户端转发头非空当作有效身份。** 当前 Go 总入口会再次查询 rpcd，检查 SID 格式、非零、有效期、root 用户和匹配 token；无鉴权缓存。Unix 内部接口不注册在 TCP 路由中。
4. `/ubus` 和 LuCI 的 ubus 别名允许匿名调用 login/access 等少数公开能力，但敏感调用先做 rpcd ACL 检查。专项测试中，匿名 session.create/list/get/set/grant、以参数指定 root SID、非 root 读取会话均失败；没有发现以公开 RPC 修改用户名/权限的路径。
5. 实际请求 LuCI logout 后，rpcd 会话已不存在，原 root Cookie 再访问 Quickstart 被拒绝；这一步使用临时 SSH 构造会话完成，不代表已验证当前密码成功登录。

实机代码快照和来源：[Lua 控制器](evidence/release-20261028/auth-chain/lua-proxy.lua)、[LuCI dispatcher](evidence/release-20261028/auth-chain/luci-dispatcher.uc)、[退出/RPC 控制器](evidence/release-20261028/auth-chain/luci-admin-index.uc)、[来源与哈希](evidence/release-20261028/auth-chain/source-review.json)。测试不将临时 Cookie/token 或密码写入证据。

## 固件层已确认问题：未登录请求导致 uhttpd 崩溃

目标安装 `uhttpd` / `uhttpd-mod-ubus` 为 `2023.06.25~34a8a74d-r4`。OpenWrt 官方公布 [GHSA-2mpg-6wp5-435p](https://github.com/openwrt/uhttpd/security/advisories/GHSA-2mpg-6wp5-435p)：REST ubus 调用没有验证 params 容器类型，会造成越界访问，已证明未认证拒绝服务；公告未证明可控内存破坏或代码执行，列出的已修补版本为 None。本轮也没有据此声称绕过密码或取得 root 权限。

本轮使用目标机同一二进制/插件，另起仅监听 `127.0.0.1:19437` 的临时 uhttpd，关闭 core dump 并限制内存。正常错误密码请求返回 Permission denied，单个畸形请求后临时进程退出 139（SIGSEGV）；正式管理服务测试前后 PID 均为 17304，没有重启或替换正式 uhttpd。证据：[隔离复现](evidence/release-20261028/auth-chain/uhttpd-isolation.json)。

此请求在进入 Quickstart/Lua 前由 uhttpd 自己处理，所以 Go 鉴权无法修复它。需在正式固件的 uhttpd-mod-ubus 源码中回移植类型检查，或使用明确包含修复并验证过的固件。已准备[对应修订的补丁](evidence/release-20261028/auth-chain/uhttpd-params-type.patch)，核验能应用到对应上游代码；**未编译、未部署到设备**，也不代表覆盖 uhttpd 的其他安全问题。见[补丁状态](evidence/release-20261028/auth-chain/uhttpd-patch-status.json)。

## 旧业务移植结论

按用户提供的 `/projects/workspace-linkease-ubuntu/linkease-github/quick-start/istore-backend`，使用 Go AST 提取注册方法和路径，排除注释和条件分支重复项：旧版有 **135 个公开方法/路径组合，132 个在新版保留，3 个有明确替代设计**。另有 7 个 Unix 内部接口保留。新版字面量登记有 194 个组合，首页动态注册另有 8 个组合。

被替代的三个接口为 `/nas/samba/create`、`/nas/webdav/create` 和 `/nas/webdav/status/`。对应 [UniShare 替代设计](superpowers/plans/2026-07-01-unishare-quickstart-replacement.md)和禁止旧入口的回归测试；新版用户、共享和协议 API 仍在，不判定为业务遗漏。旧 LAN 功能的归属参见[入口迁移契约](lan-device-management-entry-migration.md)；兼容接口的保留与新页面归属应分别看待。

**接口和本地回归层面未发现其他未替代的入口遗漏，但尚不能认定所有旧业务都完成真实设备验收。** `.7` 的迁移预览没有现存旧规则条目，冲突和未知项均为 0，只能证明空规则场景；非空旧规则、失败恢复由本地 fixture 覆盖。真实磁盘格式化、RAID 重建、密码修改、WiFi/网络切换以及限速、浮动网关数据面未在本机执行。

逐项清单：[迁移表](evidence/release-20261028/migration-map.md)、[机器可读映射](evidence/release-20261028/migration-map.json)。

## 正式上线前的剩余条件

1. **真实密码成功登录尚未验证。** 已验证登录源码、错误/缺失密码被拒绝、有效 root 会话、实际退出、过期与撤销。没有取得当前密码，因此未执行输入真实密码成功登录及真实密码修改，不能把 SSH 构造会话等同于这两项验收。
2. **修复正式固件的 uhttpd/ubus 未认证拒绝服务漏洞。** 详见上节。本次已按用户要求排除测试 WAN 策略；固件漏洞仍会影响能访问管理服务的攻击者。设备还保留明文 HTTP10000 管理入口，生产密码登录应使用 HTTPS，以防凭据或会话被窃取；这属于传输风险，不是本轮发现的密码验证绕过。
3. **正式包发布及可选组件验收尚未完成。** 当前是具备 manifest 和回滚的候选部署，旧 opkg 元数据不变；不能用它代替正式 IPK/APK 的升级、安装钩子、依赖和版本记录验收。原生限速、eqos 和 floatip 在 `.7` 均未安装，目前只证明缺组件时能正常降级，没有宣称实际限速或浮动切换成功。长期 soak 也不在本轮通过项内。

所有 `/etc/config/*`、账号数据库、软件包数据库及 Quickstart init 脚本哈希保持一致，默认路由未变。期间另有 `kai-ms-desktop-opt-20261028` 容器创建 Docker 网桥，完整路由表因此增加一项；本轮没有执行 Docker 写操作，也没有恢复该容器状态。见[状态保留记录](evidence/release-20261028/preservation.json)。

第 8 轮补充部署与专项审计另核验 82 个配置、账号、软件包及固件服务文件，全部未变；包含 `/etc/shadow`、uhttpd 二进制和 ubus 插件。见[补充保留记录](evidence/release-20261028/auth-chain/preservation.json)。

## 复测与恢复

在已授权目标上复测：

```sh
rtk proxy python3 scripts/ops/release-security-audit.py --host 192.168.30.7 --output /tmp/quickstart-security-recheck --ui
```

恢复部署前二进制、Web 和模板（新 JSON 配置不删除）：

```sh
rtk proxy env ENV_DIR="$PWD/bin/security-env" ROLLBACK_RELEASE=security-0.17.1-rc20261028-r1 ./scripts/ops/rollback.sh
```

原始备份产生于保留清单机制引入之前，回退到 r1 会保留新增的 sysupgrade 清单；这是保留用户新配置的保守行为，不是删除或恢复 Quickstart JSON 数据。没有执行回退，也没有推送代码或创建公开 Release。

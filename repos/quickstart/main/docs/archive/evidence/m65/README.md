# M65 当前版本核验

日期：2026-10-14；完整解释见 [接手记录](../../quickstart-m65-m70-takeover.md)。

- `current/current-api.json`：最后一次当前读取。B 含超时与 404，C 有业务 result 但库存 partial。
- `current/*-ui.json`：最后一次只读浏览器检查。B 导航超时，未通过；C 三端导航通过。
- `current/192.168.30.244-*.png`：较早同日检查的旧 UI 截图，后续失败未覆盖全部截图；不是新版验收截图。
- `current/192.168.30.93-*.png`：当前新版管理页只读截图。
- `release-assets.json`：实时 GitHub Release 资产列表，未上传任何资产。
- `coverage-current.json`：55 项历史矩阵与当前回归/实机状态的叠加记录，不重写历史 verified。
- `local-business.log`、`local-web-build.log`、`local-netpolicy-test.log`：当前本地成功门禁输出。
  RTK 可能对长日志做折叠；判定同时依据命令退出码 0，不从截断日志推断完整实机通过。

可重复只读入口：

```sh
rtk python3 scripts/ops/lan-device-takeover-check.py /tmp/quickstart-current-check
```

当前 B 未通过时退出码为 1 是正确结果；不修改版本期待或重启服务把它变绿。
不写用户凭据，临时会话自动销毁。A 不包含在此脚本中。
24 小时观察未运行，真实 ARM64 数据面未验收，新包安装/发布未执行。

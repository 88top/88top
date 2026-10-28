# B 首轮真实入口验收

5391738已部署。URL/80项分页/搜索滚动焦点/刷新/Back/Forward/直接关闭/编辑离开保护通过，但真实KSpeeder解析停在错误提示；没有导航、启停或配置写入。见b-current/launcher-entry/report.json及实际打开审查的failure.png。两临时会话均销毁。

单应用浏览器诊断b-diagnostic确认HTTP200/code200/running=true/web=:5003，错误空表实际为`errors:{}`，而本地协议假设为`[]`。Python协议探针的空值判断不能证明浏览器结构兼容。修正仅接受这两种空容器，非空/缺少/标量错误仍拒绝；增加针对真实编码的单元回归，再冻结下一候选。首轮证据保留，不把诊断标为完整验收通过。

修正后127项前端测试通过、vue-tsc通过、make build-web通过；后两项分别执行，Web产物仍在web/dist。构建仅有已有v-deep弃用提示。一次误用npm test因仓库无该入口退出，实际按Makefile中的node --test web/test/*.test.mjs执行并通过。

# M66.42 当前候选自检

2026-10-16。技术检查通过，人工体验待用户进行。入口`http://192.168.9.19:5180/?layout=ordered`。当前候选见[指纹](final/candidate/candidate.json)：PID11002、入口`index.08273127.js`，SHA256 `0d8315dd8612ead09cf40adb662f26db7bcd5832250b7fc9e7affe117f2709af`。三份公开JS/CSS与SSD构建文件一致，72个运行源文件留有指纹；不是发布包或实机验收。

## 当前构建结果

| 检查 | 结果 | 证据 |
|---|---|---|
| `npm --prefix web run tsc` | exit 0 | 本轮命令执行结果；SSD入口加载环境 |
| 独立设计构建、5180归属和资源 | 成功 | [candidate](final/candidate/candidate.json) |
| v1／旧rows到v2、身份／顺序／偏好、不支持堆叠、过期计划 | 5组 | [contract](../../../../../evidence/m66/natural-home/42-review/final/contract/report.json) |
| 系统自动／显式完整、原字段／信息概览、局部失败恢复 | 7组 | [system](../../../../../evidence/m66/natural-home/42-review/final/system/report.json) |
| 五模板等高、上下组合、固定图表、窄屏往返、采样稳定 | 8组 | [layout](../../../../../evidence/m66/natural-home/42-review/final/layout/report.json) |
| 标题菜单、有限磁盘／异常提示、原详情、无行高控件、撤销取消 | 7组 | [interaction](../../../../../evidence/m66/natural-home/42-review/final/interaction/report.json) |
| 6宽×明暗×中英24基准，559／560／561px往返，9种局部状态、3组指标口径 | 37组 | [matrix](../../../../../evidence/m66/natural-home/42-review/final/matrix/report.json) |
| 六个原组件、页签／字段／状态／原向导及错误 | 19组 | [business-widgets](../../../../../evidence/m66/natural-home/42-review/final/business-widgets/report.json) |
| 原表单提交字段、安装检查、拒绝反馈、磁盘双确认 | 13组 | [business-actions](../../../../../evidence/m66/natural-home/42-review/final/business-actions/report.json) |
| 网络独立状态、隐私租约、原DNS／源表单、完整端口和DNS分页 | 14组 | [network](../../../../../evidence/m66/natural-home/42-review/final/network/report.json) |
| 320／390px中英触屏、焦点陷阱、接口独立添加／撤销 | 6组 | [input](../../../../../evidence/m66/natural-home/42-review/final/input/report.json) |
| 鼠标、键盘、原生触摸整行排序，中断清理，20次排序撤销 | 9组 | [row-sort](../../../../../evidence/m66/natural-home/42-review/final/row-sort/report.json) |
| 20次显示／总览切换，后台停止、实际Vue卸载清理、日志／历史上限 | 3组 | [resources](../../../../../evidence/m66/natural-home/42-review/final/resources/report.json) |
| 原首页、请求、路由、store及向导等64文件未修改 | 通过 | [source](../../../../../evidence/m66/natural-home/42-review/final/source/report.json) |
| `git diff --check` | exit 0 | 本轮命令执行结果 |

所有浏览器报告均无控制台error、pageerror和外部请求。资源读者在20次切换前后未重复；磁盘／RAID／共享／Docker／下载／版本各1次，远程3s、系统5s有界读取。实际卸载后1s时钟、文档visibility/click/keydown监听、ResizeObserver、MutationObserver均归零；后台不保留原卡片实例。

## 修正记录（最多3次）

1. 初检24基准结束后，测试没有打开“更多”面板就寻找宽度滑杆，超时。修正为真实打开面板并驱动滑杆；审图同步修正暗色紧凑系统图标对比度。保留[matrix attempt 1](../../../../../evidence/m66/natural-home/42-review/matrix/attempt-1.json)。
2. 完整矩阵发现320px英文DDNSTO地址区把Dashboard挤出17px。为原地址链接增加可收缩空间和省略显示，保留完整href／title及原目标；补充可选的系统缺失／零值／高负载和24共享场景。保留[matrix attempt 2](../../../../../evidence/m66/natural-home/42-review/matrix/attempt-2.json)；最终37组通过。
3. 加强资源检查时，把历史长度断言放在Vue卸载之后，调试接口已按设计清理，导致测试自身失败。移至卸载之前；监听、观察器和请求断言不放宽。保留[resource attempt 1](../../../../../evidence/m66/natural-home/42-review/final/resources/attempt-1.json)，[attempt 2](../../../../../evidence/m66/natural-home/42-review/final/resources/attempt-2.json)通过。没有增加新的产品语义。

## 视觉审阅与边界

已实际查看最终固定视口PNG：[桌面明色](../../../../../evidence/m66/natural-home/42-review/final/matrix/top-1440-light-zh-cn.png)、[桌面暗色](../../../../../evidence/m66/natural-home/42-review/final/matrix/middle-1440-dark-zh-cn.png)、[320px英文服务](../../../../../evidence/m66/natural-home/42-review/final/matrix/services-320-light-en.png)。确认原曲线、同排外框、紧凑系统、标题操作、自然内容及暗色图标；窗口几何断言覆盖未截取的其余组合。原翻译中部分文案仍中英混用，按原业务基线保留。图片自检不代表用户美感验收。

原代码`memAvailablePercentage || 100`的零值口径、缺失温度显示0等均保持并明确列为既有问题，本轮未暗中修复；因此system-zero并不证明真实内存用尽时显示正确。DDNSTO外部认证使用明确合成回调。没有访问实际路由器、制作安装包、推送或发布；24小时观察仍延期。

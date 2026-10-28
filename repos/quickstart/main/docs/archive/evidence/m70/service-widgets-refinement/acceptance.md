# 当前结果：未通过，未部署

历史报告：本次暂停后用户明确恢复，现已通过并部署a2861dd。最新结果见[续修验收](followup/acceptance.md)，以下保留原失败链，不代表当前候选状态。

2026-10-21。已按[明确目标和任务树](status.md)实施三个控件正文优化，但第三轮最终视觉检查仍失败。按用户上限停止后续产品修改，保持B原已验收前端67b6546。不能报告本次已完整完成或当前设备已通过。

## 已实现及已验证

代码包含Docker轻量状态行/完整根目录、下载去重复状态/保留全部业务字段与原配置入口/辅助链接降级、远程完整地址独占下一行/独立控制台和编辑入口/去重复状态。配置地址仅标为已配置；未运行、未安装、未知、未配置、未启用通过小型共享解释函数区分，摘要复用。没有新增读取owner、后台探测或轮询；系统菜单、蓝色顶部、布局文件和其他控件未修改。

单独vue-tsc、Web构建通过；全部135前端测试通过，其中新增两个状态契约测试。六个业务SFC原脚本除展示导入和双语辅助函数外字节一致，见[保护检查](round-2/business-protection.json)。原Docker切换请求、配置弹窗处理器、下载目录/Web/AriaNg认证/原账号提示、域名配置与编辑目标均保留。

第二候选的四组本地正式首页/详情检查通过（中英、深浅、1440/768/390/320；不是完整16组合）；另九组状态测试通过：未运行、未安装、未知、空地址及Stopped/Disabled、长值/警告、延迟、503、403/重试、原操作。Docker键盘切换的两个POST被本地浏览器拦截，正文三项原配置表单可打开/取消，无真实服务写入。见[本地报告](../../../../evidence/m70/service-widgets-refinement/round-2/local/report.json)、[状态报告](../../../../evidence/m70/service-widgets-refinement/round-2/state-cases/report.json)。这些属于第二候选，不直接沿用为第三候选通过证据。

本地桌面整行、320英文深色远程详情、第一/第三轮失败截图均已实际打开。第二轮基础检查未断言运行状态应为绿色，视觉审查发现遗漏后第三轮补上，未掩盖该缺口。

## 三轮失败链与当前剩余问题

1. [第一轮](../../../../evidence/m70/service-widgets-refinement/round-1/local/report.json)：旧共享path规则把根目录覆盖回灰底框，未通过，未部署。
2. [第二轮](../../../../evidence/m70/service-widgets-refinement/round-2/local/report.json)：基础检查和功能状态通过，视觉审查发现运行文字仍灰色，部分选择项几何仍由旧规则控制，因此未批准部署。
3. [第三轮](../../../../evidence/m70/service-widgets-refinement/round-3/local/report.json)：补强选择器仍未打破同优先级覆盖，新增绿色断言失败。实际rgb(91,104,122)，期望rgb(0,126,52)；见[实际截图](../../../../evidence/m70/service-widgets-refinement/round-3/local/zh-light-1440-normal-downloads-home.png)。

原因已定位：旧`homeSemanticColors.css`中通用服务状态选择器与新`serviceWidgetBody.css`状态选择器均为(0,7,0)，通用规则后加载；选择项通用布局也发生同类覆盖。下一次继续应明确新正文作用域/通用规则排除边界，并保留绿色、对比度≥4.5、悬停和字号断言。既有`--c-good`绿色在浅色悬停背景的对比度约4.394，候选采用已有`--color-icon-green`保证对比度，不改全局色板。未实施第四轮。

## 当前设备保护与未验收边界

B当前iStoreOS24.10.1/2025052311、kernel6.6.86；基线两个真实root登录态视图已归档，2个会话销毁。仍是前端67b6546、后端c9624a3/0.16.6、opkg0.16.5；不是新包安装结论。

最后复核20项既有保护配置/LAN/defaultvia.1、额外dockerd/ddnsto/ddns三项配置、Quickstart/startdhns/FastNet进程及配置/二进制/包记录不变。四个公开前端资源仍与67b6546匹配，见[配置](round-3/preservation-final.json)、[当前B未变化](round-3/current-b-unchanged.json)。本次没有前端部署、后端重启、SDK/新包安装、其他设备、push/Release/Action或5180重建。第三候选只做过首组失败检查；其完整状态矩阵、真实登录态UI、当前安装与整体视觉均未通过，不能用旧结果代替。

# 规则到验证的覆盖

唯一规范：[交互规范1.7](../../../../product/quickstart-home-layout-interaction-spec.md)。以下检查以optimization-2中的当前报告为准，未通过不得由本表宣称通过。

| 目标 | 实现边界 | 当前验证 |
| --- | --- | --- |
| 首页24／全库独立 | homeApplicationSession / launcherLibrary | model、launchpad-browser-review、launcher-home-review |
| 默认全部／混合来源 | launcherCatalog / HomeApplications | launchpad-browser-review、launchpad-matrix-review |
| 完整35／120、分页48 | queryLibrary | model、launchpad-browser-review、launchpad-resource-review |
| 身份、去重、安装不自动固定 | normalizeInstalled / mergeLibrary | model、launchpad-states-review、launcher-states-review |
| 新增／编辑链接、64预算及安全地址 | LauncherLinkForm / saveLink | model、launchpad-links-review、launchpad-matrix-review、launchpad-capacity-review |
| 固定／取消固定／删除分离 | 收藏ID序列 / deleteLink | launchpad-links-review、launcher-editor-review |
| 草稿互斥／取消／撤销／跨屏 | 稳定宿主 / 收藏编辑器 / 链接表单 | launchpad-states-review、launcher-editor-review、launcher-resource-review |
| 加载／空／失败／权限／恢复／卸载 | catalog状态与最后快照 | launchpad-states-review、launcher-states-review、launcher-overflow-state-review |
| 鼠标／键盘／触摸／焦点与返回 | launcherBrowserHost / HomeApplications | launchpad-browser-review、launcher-editor-review、launcher-matrix-review |
| 六宽度×双语×浅深24矩阵 | 独立启动台样式 | launchpad-matrix-review、launcher-matrix-review |
| 有界资源／后台／卸载 | catalog单一owner、取消与generation、分页／历史预算 | launchpad-resource-review、launcher-resource-review、structure-resource-review |
| 原八工具与其他控件／行布局／图表 | 原动作与其他源码不改 | 原有22套适用回归、protection、original-business |
| 源码／脚本／构建／实际5180一致 | candidate哈希与owner | candidate/candidate.json、handoff-review.json |

原分类选择由role=tab改为轻量按钮组，旧4个测试只调整明确被替代的分类选择器；原“内置单独分类3项”断言改为工具筛选包含8工具＋3内置，并继续检查3个原内置ID，未删除旧收藏／原动作／布局保护断言。

技术检查不代替用户审美确认，不覆盖真实后端、ACL、持久化、设备安装或长期观察。

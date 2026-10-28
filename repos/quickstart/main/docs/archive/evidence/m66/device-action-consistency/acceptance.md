# 设备“查看全部”标题按钮统一

状态：当前隔离Vue原型通过自检，待用户查看。未提交、未推送，未操作真实路由器。

## 确认差异及修正

实际浏览器[修正前计算样式](before/computed.json)确认：设备按钮字体、尺寸、图标尺寸和边框已经与其他控件一致，但文字和图标为蓝色`rgb(66,99,158)`，其他控件为正文色`rgb(37,50,71)`。[修正前分段及悬停检查](../../../../evidence/m66/device-action-consistency/before/group/report.json)确认分段间距为0，无需改布局。

`CanvasModule.vue`设备主按钮移除旧链接类`module-more`；`canvasModules.css`普通按钮悬停色排除共用`WidgetPrimaryAction`。复用共用样式，保留原业务图标、四字名称、更多菜单及目标，不新增设备专属外观规则。其他工作区改动保留，图表“测速”保持。

## 当前验证

- [样式、主题与原目标7组](../../../../evidence/m66/device-action-consistency/after/style/report.json)：1440/390/320px×深浅主题，设备、应用和网络接口主按钮的文字色、字体、间距、内边距、高度、图标、分段边框及悬停计算样式相同；设备更多仍进入`/parental`，查看全部仍进入`/devicemanagement`。
- [标题14组](../../../../evidence/m66/device-action-consistency/after/regression/home-widget-header-review/report.json)：多宽度、中英、主题及标准/摘要形态。
- [交互6组](../../../../evidence/m66/device-action-consistency/after/regression/header-action-interaction-review/report.json)：原目标、菜单独立、键盘、焦点恢复及真实触屏44px点击区域。
- 已实际打开修正前后[设备桌面](../../../../evidence/m66/device-action-consistency/after/style/1440-light-devices.png)、[应用桌面](../../../../evidence/m66/device-action-consistency/after/style/1440-light-applications.png)与[深色手机](../../../../evidence/m66/device-action-consistency/after/style/390-dark-devices.png)截图；修正后按钮共用正文色，图标前置、文字与更多分段保持。

本次共27组通过，无优化重试。未用历史结果替代当前验证。仅外观局部变更，未重跑未变化的后端、打包或实机矩阵。

[当前候选源码/公开资源指纹](after/candidate/candidate.json)：本项目预览进程PID9460，3份实际公开JS/CSS与SSD构建结果一致，入口`/assets/index.472c5a1e.js`。属于工作区候选，非已提交发布版本。

[访问预览](http://192.168.9.19:5180/?layout=ordered&scenario=business-all)。

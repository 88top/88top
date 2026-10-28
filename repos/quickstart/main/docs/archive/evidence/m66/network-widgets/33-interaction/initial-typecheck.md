# M66.33 初检失败

初次`npm --prefix web run tsc`退出2：旧版vue-tsc未从模板v-if收窄可空actionKind，另有timer按键索引未收窄undefined。未修改原业务表单。

进入优化1：动作入口接受可空值并提前返回，计时清理使用局部变量收窄；重新类型检查及当前候选交互检查。不得将此失败记为初检通过。

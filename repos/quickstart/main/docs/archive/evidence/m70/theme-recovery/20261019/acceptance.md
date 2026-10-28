# B主题包恢复

2026-10-19用户明确要求在root@192.168.30.244安装缺失的luci-theme-istorenas，然后自行确认。只操作B，未修改业务源码或其他机器。

使用同一is-opkg包装器更新索引、预演并安装软件源的luci-theme-istorenas1.0.0，无force-depends；仅新增此包，未升级/删除其他包。header.htm/footer.htm→../argon对应模板链接及sysauth.htm已恢复。原mediaurlbase仍是/luci-static/istorenas。私有备份和安装日志：/root/quickstart-theme-install-20261019T094128Z。

[实际核验](../../../../../evidence/m70/theme-recovery/20261019/report.json)：主题、网络/DHCP/防火墙、首页布局/启动台、FastNet配置，以及Quickstart/FastNet二进制和当前前端index摘要保持；默认路由逐字比较通过。设备无diff命令，已在本机比较安装前后包列表，确认只有目标主题新增。真实短期root认证页面重新加载后，首页网络流量/设备均渲染，原fallback错误文本和THEME FALLBACK标识消失，无pageerror，主题仍使用istorenas资源；已打开[实际截图](../../../../../evidence/m70/theme-recovery/20261019/homepage.png)审查。该临时会话已销毁，不影响用户会话。未重启设备或网络服务。用户人工确认留待其操作。

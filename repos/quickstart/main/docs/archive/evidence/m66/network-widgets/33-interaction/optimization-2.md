# M66.33 优化2：计时测试安装顺序

优化1类型检查退出0。首轮浏览器报告保留于`browser/attempt-1.json`：页面加载后才安装Playwright clock，导致既有事件／定时器受到干扰。

独立复现：不安装clock时显隐按钮正常；先安装clock再加载页面，两次点击得到true／false。测试改为导航前安装clock，并显式推进事件帧，60秒隐私要求不变。POST计数仅统计DNS／软件源写入，不将App.Check的只读POST算业务变更。此轮未修改产品代码。

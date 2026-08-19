---
layout: home

hero:
  name: NaviHive
  text: 现代化个人导航站
  tagline: 基于 Cloudflare Workers 的轻量级导航管理系统
  image:
    src: /logo.svg
    alt: NaviHive
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 在线演示
      link: https://navihive.chatbot.cab/
    - theme: alt
      text: GitHub
      link: https://github.com/zqq-nuli/Cloudflare-Navihive

features:
  - icon: 📚
    title: 智能分组管理
    details: 按类别组织网站，支持无限分组和嵌套管理，让你的书签井然有序
  - icon: 🔄
    title: 拖拽排序
    details: 可视化调整分组和网站顺序，所见即所得的交互体验
  - icon: 🌍
    title: 访客模式
    details: 支持公开/私密内容控制，未登录用户可浏览公开内容
  - icon: 🔐
    title: 企业级安全
    details: JWT + bcrypt 加密，HttpOnly Cookie，多层安全防护
  - icon: ⚡
    title: 极致性能
    details: Cloudflare 全球 CDN 加速，毫秒级响应
  - icon: 💰
    title: 零成本部署
    details: 基于 Cloudflare Workers 免费套餐，永久免费使用
  - icon: 🎨
    title: 高度自定义
    details: 自定义 CSS、背景图、主题，打造专属导航站
  - icon: 📱
    title: 完美响应式
    details: 从桌面到移动端，各种屏幕完美适配
  - icon: 🌓
    title: 暗色模式
    details: 深色/浅色主题自由切换，呵护双眼
---

## 快速部署

::: code-group

```bash [小白用户]
# 1. Fork 项目到你的 GitHub
# 2. 点击 Deploy to Cloudflare Workers 按钮
# 3. 按照向导完成部署

# 详细步骤见：快速开始指南
```

```bash [开发者]
# 克隆项目
git clone https://github.com/zqq-nuli/Cloudflare-Navihive.git
cd Cloudflare-Navihive

# 安装依赖
pnpm install

# 登录 Cloudflare
wrangler login

# 创建数据库
wrangler d1 create navigation-db

# 部署
pnpm deploy
```

:::

## 版本信息

当前版本：**v1.1.0** | [更新日志](/guide/migration) | [GitHub Release](https://github.com/zqq-nuli/Cloudflare-Navihive/releases)

### v1.1.0 新特性

- ✨ 访客模式：支持公开/私密内容控制
- 🛡️ 登录速率限制：防暴力破解
- 🔐 增强安全：全面的安全加固

---

<div style="text-align: center; margin-top: 48px;">

Made with ❤️ by [zqq-nuli](https://github.com/zqq-nuli)

[⭐ 给项目点个 Star](https://github.com/zqq-nuli/Cloudflare-Navihive) · [📝 提交问题](https://github.com/zqq-nuli/Cloudflare-Navihive/issues) · [🤝 参与贡献](https://github.com/zqq-nuli/Cloudflare-Navihive/pulls)

</div>

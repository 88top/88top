# 快速开始

本指南将帮助你在 **5 分钟内**部署你的 NaviHive 导航站。

## 在线演示

在开始之前，你可以先体验一下：[在线演示站点](https://navihive.chatbot.cab/)

```
演示账号：admin
演示密码：NaviHive2025!
```

## 选择部署方式

NaviHive 提供两种部署方式：

::: tip 选择建议
- **不熟悉编程**：选择小白用户方式，通过网页界面完成全部部署
- **开发者/程序员**：选择开发者方式，获得更好的开发体验
:::

## 方式一：小白用户部署

### 第一步：准备账号

你需要注册以下两个免费账号：

1. **Cloudflare 账号**：用于部署应用
   - 访问 [Cloudflare 注册页面](https://dash.cloudflare.com/sign-up)
   - 使用邮箱完成注册（完全免费）

2. **GitHub 账号**：用于托管代码
   - 访问 [GitHub 注册页面](https://github.com/signup)
   - 完成注册（完全免费）

### 第二步：Fork 项目

1. 访问 [NaviHive GitHub 页面](https://github.com/zqq-nuli/Cloudflare-Navihive)
2. 点击右上角的 **Fork** 按钮
3. 等待 Fork 完成

<!-- 图片占位符：Fork 项目示意图 -->
<!-- ![Fork 项目示意图](/images/screenshots/fork-project.png) -->

### 第三步：一键部署

::: warning 即将推出
一键部署功能正在开发中，目前请使用开发者部署方式。
:::

详细步骤请参考 [部署指南](./deployment)。

---

## 方式二：开发者部署

### 环境要求

在开始之前，请确保你的开发环境满足以下要求：

- **Node.js** 18+ 或 20+（推荐 20.x LTS 版本）
- **pnpm** 9+（推荐）或 npm
- **Git** 用于代码管理
- **Cloudflare 账号**（免费）

::: tip 检查环境
运行以下命令检查是否已安装：
```bash
node --version   # 应显示 v18.x 或 v20.x
pnpm --version   # 应显示 9.x 或更高
git --version    # 应显示 git 版本
```
:::

### 快速部署步骤

#### 1. 克隆项目

```bash
# 克隆项目到本地
git clone https://github.com/zqq-nuli/Cloudflare-Navihive.git

# 进入项目目录
cd Cloudflare-Navihive
```

#### 2. 安装依赖

```bash
# 使用 pnpm 安装（推荐）
pnpm install

# 或使用 npm
npm install
```

#### 3. 登录 Cloudflare

```bash
# 登录你的 Cloudflare 账号
wrangler login
```

这会打开浏览器，要求你授权 Wrangler CLI 访问你的 Cloudflare 账号。

#### 4. 创建 D1 数据库

```bash
# 创建名为 navigation-db 的数据库
wrangler d1 create navigation-db
```

执行后，你会看到类似以下的输出：

```
✅ Successfully created DB 'navigation-db'!

[[d1_databases]]
binding = "DB"
database_name = "navigation-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

::: warning 重要
**复制** 输出中的 `database_id`，下一步会用到！
:::

#### 5. 配置 wrangler.jsonc

打开项目根目录的 `wrangler.jsonc` 文件，找到 `d1_databases` 部分：

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "navigation-db",
      "database_id": "你的数据库ID" // [!code --]
      "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" // [!code ++]
    }
  ]
}
```

将 `database_id` 替换为上一步复制的值。

#### 6. 配置环境变量（可选）

在 `wrangler.jsonc` 中修改环境变量：

```jsonc
{
  "vars": {
    "AUTH_ENABLED": "true",              // 是否启用认证
    "AUTH_REQUIRED_FOR_READ": "false",   // 访客模式（false=允许公开访问）
    "AUTH_USERNAME": "admin",            // 管理员用户名
    "AUTH_PASSWORD": "$2a$10$...",       // 管理员密码（bcrypt 哈希）
    "AUTH_SECRET": "your-secret-key"     // JWT 密钥（建议修改）
  }
}
```

::: tip 生成密码哈希
使用以下命令生成密码的 bcrypt 哈希：
```bash
pnpm hash-password yourPassword
```
然后将输出复制到 `AUTH_PASSWORD` 字段。
:::

#### 7. 初始化数据库

```bash
# 执行数据库初始化 SQL
wrangler d1 execute navigation-db --file=init_table.sql
```

#### 8. 部署到 Cloudflare

```bash
# 构建并部署
pnpm deploy
```

部署成功后，你会看到类似以下的输出：

```
✨ Deployment complete!
🌍 https://cloudflare-navihive.your-subdomain.workers.dev
```

::: tip 成功
恭喜！你的 NaviHive 导航站已经部署成功！
:::

---

## 首次登录

1. 访问部署成功后显示的 URL
2. 点击右上角的**登录**按钮
3. 使用配置的用户名和密码登录
   - 默认用户名：`admin`
   - 默认密码：查看 `wrangler.jsonc` 中的配置

登录后，你就可以开始添加分组和网站了！

---

## 下一步

现在你已经成功部署了 NaviHive，接下来可以：

- 📚 [学习使用教程](./usage) - 了解如何添加分组和网站
- 🎨 [自定义设置](/features/customization) - 个性化你的导航站
- 🔐 [配置安全设置](/security/best-practices) - 增强安全性
- 🌐 [绑定自定义域名](./deployment#自定义域名) - 使用自己的域名

---

## 常见问题

### 部署失败怎么办？

1. 检查 Node.js 版本是否满足要求（18+ 或 20+）
2. 确认 `wrangler.jsonc` 中的 `database_id` 配置正确
3. 查看 [故障排除](/advanced/troubleshooting) 文档

### 忘记密码怎么办？

1. 重新生成密码哈希：`pnpm hash-password newPassword`
2. 更新 `wrangler.jsonc` 中的 `AUTH_PASSWORD`
3. 重新部署：`pnpm deploy`

### 如何更新到新版本？

详见 [版本迁移指南](./migration)。

---

## 需要帮助？

- 📖 查看 [完整文档](/guide/)
- 💬 在 [GitHub Issues](https://github.com/zqq-nuli/Cloudflare-Navihive/issues) 提问
- 🐛 [报告 Bug](https://github.com/zqq-nuli/Cloudflare-Navihive/issues/new)

# 文档站点部署指南

本指南说明如何为 NaviHive 项目启用 GitHub Pages 文档站点。

## 前置条件

- 已将代码推送到 GitHub 仓库
- 有仓库的管理员权限

## 启用 GitHub Pages

### 步骤 1：配置 GitHub Pages

1. 进入你的 GitHub 仓库
2. 点击 **Settings**（设置）
3. 在左侧菜单中找到 **Pages**
4. 在 **Source** 部分选择：
   - Source: **GitHub Actions**
5. 点击 **Save** 保存

![GitHub Pages 配置](https://docs.github.com/assets/cb-47267/images/help/pages/pages-source-github-actions.png)

### 步骤 2：触发首次部署

有两种方式触发首次部署：

#### 方式一：推送代码（自动触发）

```bash
# 提交并推送文档文件
git add docs/ .github/workflows/deploy-docs.yml package.json .gitignore README.md
git commit -m "docs: 添加 VitePress 文档站点"
git push origin main
```

#### 方式二：手动触发

1. 进入 GitHub 仓库的 **Actions** 页面
2. 选择 **Deploy Documentation** 工作流
3. 点击 **Run workflow** 按钮
4. 选择 `main` 分支
5. 点击 **Run workflow** 确认

### 步骤 3：等待部署完成

1. 在 **Actions** 页面查看部署进度
2. 部署通常需要 2-3 分钟
3. 成功后会显示绿色的 ✓ 标记

### 步骤 4：访问文档站点

部署成功后，访问：

```
https://<你的GitHub用户名>.github.io/Cloudflare-Navihive/
```

例如：`https://zqq-nuli.github.io/Cloudflare-Navihive/`

## 自动部署

配置完成后，每次推送以下内容到 `main` 分支时，文档会自动重新部署：

- `docs/**` 目录下的任何文件
- `.github/workflows/deploy-docs.yml` 工作流文件

## 本地开发

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm docs:dev
```

访问 `http://localhost:5174/Cloudflare-Navihive/`

### 构建文档

```bash
pnpm docs:build
```

构建产物位于 `docs/.vitepress/dist/`

### 预览构建结果

```bash
pnpm docs:preview
```

访问 `http://localhost:4173/Cloudflare-Navihive/`

## 自定义域名（可选）

如果你想使用自定义域名（如 `docs.navihive.com`）：

### 步骤 1：创建 CNAME 文件

在 `docs/public/` 目录下创建 `CNAME` 文件：

```bash
echo "docs.navihive.com" > docs/public/CNAME
```

### 步骤 2：配置 DNS

在你的域名管理面板添加 CNAME 记录：

```
类型: CNAME
名称: docs
值: <你的GitHub用户名>.github.io
```

### 步骤 3：更新 VitePress 配置

编辑 `docs/.vitepress/config.ts`：

```typescript
export default defineConfig({
  base: '/', // 从 '/Cloudflare-Navihive/' 改为 '/'
  // ... 其他配置
});
```

### 步骤 4：重新部署

```bash
git add docs/public/CNAME docs/.vitepress/config.ts
git commit -m "docs: 配置自定义域名"
git push origin main
```

等待 DNS 生效（通常需要 10-30 分钟）。

## 故障排除

### 部署失败

查看 GitHub Actions 日志：

1. 进入 **Actions** 页面
2. 点击失败的工作流运行
3. 查看具体的错误信息

常见问题：

- **权限错误**：确保 Settings > Actions > General > Workflow permissions 设置为 "Read and write permissions"
- **依赖安装失败**：检查 `package.json` 中的依赖是否正确
- **构建失败**：本地运行 `pnpm docs:build` 查看详细错误

### 404 错误

如果访问文档站点显示 404：

1. 确认 GitHub Pages 已启用（Settings > Pages）
2. 检查 `base` 路径配置是否正确
3. 等待几分钟让部署完全生效

### 样式丢失

如果页面显示但样式不正常：

1. 检查浏览器控制台的错误信息
2. 确认 `base` 路径与仓库名称匹配
3. 清除浏览器缓存后重试

## 更新文档内容

### 编辑现有文档

1. 在 `docs/zh/` 或 `docs/en/` 目录下找到要编辑的文件
2. 使用 Markdown 编辑器修改内容
3. 本地预览：`pnpm docs:dev`
4. 提交并推送：
   ```bash
   git add docs/
   git commit -m "docs: 更新XXX文档"
   git push origin main
   ```

### 添加新文档

1. 在对应目录下创建新的 `.md` 文件
2. 在 `docs/.vitepress/zh.ts` 或 `en.ts` 中添加侧边栏配置
3. 编写文档内容
4. 提交并推送

## 需要帮助？

- [VitePress 官方文档](https://vitepress.dev/)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [NaviHive Issues](https://github.com/zqq-nuli/Cloudflare-Navihive/issues)

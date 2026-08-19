# API 文档

NaviHive 提供了完整的 RESTful API，用于管理导航站的所有功能。

## API 基础信息

### Base URL

```
https://your-app.workers.dev
```

### 认证方式

NaviHive 使用 **JWT (JSON Web Token)** 进行身份认证：

- Token 存储在 **HttpOnly Cookie** 中（主要方式）
- 也支持 `Authorization` Header（备用方式）

```http
Authorization: Bearer <your-jwt-token>
```

### 通用响应格式

#### 成功响应

```json
{
  "data": { /* 数据内容 */ },
  "message": "操作成功"
}
```

#### 错误响应

```json
{
  "error": "错误信息",
  "code": "ERROR_CODE",
  "details": { /* 详细信息（可选） */ }
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| `200` | 成功 |
| `201` | 创建成功 |
| `400` | 请求参数错误 |
| `401` | 未认证或认证失败 |
| `403` | 无权限访问 |
| `404` | 资源不存在 |
| `429` | 请求频率过高 |
| `500` | 服务器内部错误 |

---

## API 分类

### 🔐 认证相关

- [认证 API](./authentication) - 登录、登出、状态验证

### 📁 分组管理

- [分组 API](./groups) - 创建、读取、更新、删除分组

### 🔗 站点管理

- [站点 API](./sites) - 创建、读取、更新、删除站点

### ⚙️ 配置管理

- [配置 API](./configs) - 全局配置、自定义 CSS

### 📦 类型定义

- [类型定义](./types) - TypeScript 类型定义

---

## 快速示例

### 登录获取 Token

```javascript
const response = await fetch('https://your-app.workers.dev/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'your-password',
    rememberMe: true,
  }),
  credentials: 'include', // 重要：包含 Cookie
});

const data = await response.json();
console.log('Token:', data.token);
```

### 获取所有分组

```javascript
const response = await fetch('https://your-app.workers.dev/api/groups', {
  credentials: 'include', // 自动发送 Cookie
});

const groups = await response.json();
console.log('分组列表:', groups);
```

### 创建新站点

```javascript
const response = await fetch('https://your-app.workers.dev/api/sites', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    group_id: 1,
    name: 'GitHub',
    url: 'https://github.com',
    icon: 'https://github.com/favicon.ico',
    description: '全球最大的代码托管平台',
    is_public: 1,
  }),
  credentials: 'include',
});

const newSite = await response.json();
console.log('创建成功:', newSite);
```

---

## 访客模式说明

当 `AUTH_REQUIRED_FOR_READ=false` 时（访客模式），API 行为如下：

### 只读接口（无需认证）

以下接口允许未认证用户访问，但只返回 `is_public=1` 的内容：

- `GET /api/groups` - 获取公开分组
- `GET /api/sites` - 获取公开站点
- `GET /api/groups-with-sites` - 获取公开分组及站点
- `GET /api/configs` - 获取公开配置

### 写入接口（需要认证）

以下接口始终需要认证：

- `POST /api/groups` - 创建分组
- `PUT /api/groups/:id` - 更新分组
- `DELETE /api/groups/:id` - 删除分组
- `POST /api/sites` - 创建站点
- `PUT /api/sites/:id` - 更新站点
- `DELETE /api/sites/:id` - 删除站点
- 所有配置相关的写入操作

### 认证用户权限

已认证的管理员用户可以：

- 查看所有内容（包括 `is_public=0` 的私密内容）
- 执行所有写入操作
- 管理公开/私密状态

---

## 速率限制

### 登录接口限制

- **限制规则**：5 次/15 分钟/IP
- **超限响应**：`429 Too Many Requests`
- **重试时间**：15 分钟后自动重置

```json
{
  "error": "登录尝试次数过多，请稍后再试"
}
```

### 其他接口

目前其他接口暂无速率限制，但建议：

- 合理控制请求频率
- 使用批量接口（如 `/api/groups-with-sites`）
- 避免频繁轮询

---

## 错误处理最佳实践

### 1. 检查 HTTP 状态码

```javascript
if (!response.ok) {
  const error = await response.json();
  console.error('API 错误:', error);
  throw new Error(error.error || '请求失败');
}
```

### 2. 处理认证失败

```javascript
if (response.status === 401) {
  // Token 过期或无效，重定向到登录页
  window.location.href = '/login';
}
```

### 3. 处理速率限制

```javascript
if (response.status === 429) {
  // 等待一段时间后重试
  await new Promise(resolve => setTimeout(resolve, 60000)); // 等待 1 分钟
  return retryRequest();
}
```

---

## SDK 和工具

### TypeScript 客户端

NaviHive 内置了 TypeScript 客户端，位于 `src/API/client.ts`：

```typescript
import { NavigationClient } from './API/client';

const client = new NavigationClient('https://your-app.workers.dev');

// 登录
await client.login('admin', 'password');

// 获取分组
const groups = await client.getGroups();

// 创建站点
const site = await client.createSite({
  group_id: 1,
  name: 'Example',
  url: 'https://example.com',
  is_public: 1,
});
```

### Postman 集合

你可以导入以下 JSON 文件到 Postman 进行 API 测试：

::: tip 即将推出
Postman 集合文件正在准备中。
:::

---

## 下一步

- [认证 API 详解](./authentication)
- [分组 API 详解](./groups)
- [站点 API 详解](./sites)
- [配置 API 详解](./configs)
- [类型定义参考](./types)

## 需要帮助？

如果在使用 API 时遇到问题：

- 查看 [故障排除](/advanced/troubleshooting)
- 在 [GitHub Issues](https://github.com/zqq-nuli/Cloudflare-Navihive/issues) 提问

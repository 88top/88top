import { DefaultTheme } from 'vitepress';

export const zhConfig: DefaultTheme.Config = {
  nav: [
    { text: '首页', link: '/' },
    { text: '指南', link: '/guide/' },
    { text: '功能', link: '/features/' },
    { text: 'API', link: '/api/' },
    { text: '部署', link: '/deployment/' },
    {
      text: '更多',
      items: [
        { text: '安全', link: '/security/' },
        { text: '高级', link: '/advanced/' },
        { text: '贡献', link: '/contributing/' },
      ],
    },
    { text: '在线演示', link: 'https://navihive.chatbot.cab/' },
  ],

  sidebar: {
    '/guide/': [
      {
        text: '用户指南',
        items: [
          { text: '概览', link: '/guide/' },
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '安装配置', link: '/guide/installation' },
          { text: '部署指南', link: '/guide/deployment' },
          { text: '使用教程', link: '/guide/usage' },
          { text: '版本迁移', link: '/guide/migration' },
        ],
      },
    ],
    '/features/': [
      {
        text: '功能特性',
        items: [
          { text: '功能概览', link: '/features/' },
          { text: '认证系统', link: '/features/authentication' },
          { text: '访客模式', link: '/features/guest-mode' },
          { text: '拖拽排序', link: '/features/drag-drop' },
          { text: '自定义设置', link: '/features/customization' },
          { text: '数据导入导出', link: '/features/import-export' },
          { text: '主题系统', link: '/features/themes' },
        ],
      },
    ],
    '/api/': [
      {
        text: 'API 文档',
        items: [
          { text: 'API 概览', link: '/api/' },
          { text: '认证 API', link: '/api/authentication' },
          { text: '分组 API', link: '/api/groups' },
          { text: '站点 API', link: '/api/sites' },
          { text: '配置 API', link: '/api/configs' },
          { text: '类型定义', link: '/api/types' },
        ],
      },
    ],
    '/deployment/': [
      {
        text: '部署文档',
        items: [
          { text: '部署概览', link: '/deployment/' },
          { text: 'Cloudflare Workers', link: '/deployment/cloudflare' },
          { text: 'D1 数据库设置', link: '/deployment/database' },
          { text: '环境变量配置', link: '/deployment/environment' },
          { text: '自定义域名', link: '/deployment/custom-domain' },
        ],
      },
    ],
    '/security/': [
      {
        text: '安全文档',
        items: [
          { text: '安全概览', link: '/security/' },
          { text: '认证安全', link: '/security/authentication' },
          { text: '最佳实践', link: '/security/best-practices' },
          { text: '已知问题', link: '/security/vulnerabilities' },
        ],
      },
    ],
    '/advanced/': [
      {
        text: '高级主题',
        items: [
          { text: '架构设计', link: '/advanced/architecture' },
          { text: '数据库结构', link: '/advanced/database-schema' },
          { text: '本地开发', link: '/advanced/development' },
          { text: '故障排除', link: '/advanced/troubleshooting' },
        ],
      },
    ],
    '/contributing/': [
      {
        text: '贡献指南',
        items: [
          { text: '贡献概览', link: '/contributing/' },
          { text: '代码风格', link: '/contributing/code-style' },
          { text: 'PR 流程', link: '/contributing/pull-request' },
          { text: '测试指南', link: '/contributing/testing' },
        ],
      },
    ],
  },

  docFooter: {
    prev: '上一页',
    next: '下一页',
  },

  outline: {
    label: '页面导航',
    level: [2, 3],
  },

  lastUpdated: {
    text: '最后更新于',
    formatOptions: {
      dateStyle: 'short',
      timeStyle: 'medium',
    },
  },

  darkModeSwitchLabel: '主题',
  sidebarMenuLabel: '菜单',
  returnToTopLabel: '回到顶部',

  editLink: {
    pattern: 'https://github.com/zqq-nuli/Cloudflare-Navihive/edit/main/docs/:path',
    text: '在 GitHub 上编辑此页面',
  },
};

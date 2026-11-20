import type { Product } from './types.ts';

/**
 * US-013：独立开发并发布的软件产品。
 *
 * 【待用户确认】以下 4 款为 agent 按 PRD US-013 与 profile 背景起草的示例草稿，
 * 名称、功能、状态、链接均为占位，不代表真实发布事实（PRD §8.3 不虚构）。
 * 用户提供真实产品后，只需逐条替换本文件的字段即可，组件与页面零硬编码。
 *
 * status 严格四值：Released | Beta | In Development | Discontinued。
 * url / repo 省略时不渲染对应入口（AC4：链接不可用不显示无效入口）。
 * logo / cover 省略时用统一 CSS 渐变占位（AC5）。
 */
export const products: Product[] = [
  {
    slug: 'airspace-lab',
    name: 'Airspace Lab',
    description: {
      zh: '面向动态空域配置研究的轻量可视化实验台，用于快速查看扇区重构与流量分布。',
      en: 'A lightweight visualization workbench for dynamic airspace configuration research.',
    },
    features: [
      { zh: '扇区结构化展示', en: 'Sector structure visualization' },
      { zh: '流量热力叠加', en: 'Traffic heatmap overlay' },
      { zh: '参数对比', en: 'Parameter comparison' },
    ],
    detail: {
      zh: '【待用户确认】将真实产品的研发背景、解决的问题与使用场景写在这里。',
      en: '【To be confirmed】Describe the real product background, problems solved and use cases here.',
    },
    status: 'In Development',
    featured: true,
    repo: 'George-102/airspace-lab',
    public: true,
  },
  {
    slug: 'focus-flow',
    name: 'Focus Flow',
    description: {
      zh: '一款极简专注计时与任务流工具，帮助学生在备考与科研之间保持节奏。',
      en: 'A minimal focus timer and task-flow tool for students balancing study and research.',
    },
    features: [
      { zh: '番茄钟与长任务流', en: 'Pomodoro and long-task flow' },
      { zh: '本地数据统计', en: 'Local usage statistics' },
      { zh: '键盘优先操作', en: 'Keyboard-first controls' },
    ],
    status: 'Beta',
    featured: true,
    url: 'https://example.com/focus-flow',
    public: true,
  },
  {
    slug: 'note-weaver',
    name: 'Note Weaver',
    description: {
      zh: '把零散笔记编织为结构化知识网络的个人工具，支持双向链接与标签检索。',
      en: 'A personal tool that weaves scattered notes into a structured knowledge network.',
    },
    features: [
      { zh: '双向链接', en: 'Bidirectional links' },
      { zh: '标签与全文检索', en: 'Tags and full-text search' },
      { zh: '本地 Markdown 存储', en: 'Local Markdown storage' },
    ],
    status: 'Released',
    featured: false,
    url: 'https://example.com/note-weaver',
    repo: 'George-102/note-weaver',
    public: true,
  },
  {
    slug: 'daily-brief',
    name: 'Daily Brief',
    description: {
      zh: '早期尝试的每日摘要聚合实验，因维护成本停止迭代，保留为产品实践记录。',
      en: 'An early daily-digest experiment, discontinued due to maintenance cost and kept as a practice record.',
    },
    features: [
      { zh: '信息聚合', en: 'Information aggregation' },
      { zh: '每日摘要生成', en: 'Daily digest generation' },
    ],
    status: 'Discontinued',
    featured: false,
    public: true,
  },
];

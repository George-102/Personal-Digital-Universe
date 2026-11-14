import type { JourneyEntry } from './types.ts';

/**
 * 成长时间线数据。
 *
 * ⚠️ 当前为【模板清单】：每条 title 都以「示例 · 」开头，用于结构验证与联调。
 * 替换为真实经历时：
 *   1. 删掉「示例 · 」前缀，改写 title / summary / detail；
 *   2. date 用 `YYYY` 或 `YYYY-MM`，区间用 endDate（结束时间不得早于 date）；
 *   3. 没有更多细节的条目直接删掉 detail，页面只展示摘要（不会出现空面板）；
 *   4. link 只允许站内路径（如 `/writing/fayuan`）或 https 外链；
 *   5. category 只能是 education / research / opensource / product / competition / work / writing；
 *   6. 不想公开的条目设 public: false（至少保留一条 true，否则构建期拒绝）。
 *
 * 英文文案目前是起草稿（标注【待用户确认】），可按需改写。
 */
export const journey: JourneyEntry[] = [
  {
    date: '2023-09',
    endDate: '2027-06',
    title: { zh: '示例 · 本科入学', en: 'Template · Undergraduate enrollment' },
    summary: {
      zh: '开始计算机科学本科学习，奠定算法、系统与数学基础。',
      en: 'Began undergraduate study in computer science, building foundations in algorithms, systems and mathematics.',
    },
    category: 'education',
    detail: [
      {
        zh: '本科阶段主要课程覆盖数据结构、操作系统、计算机网络、概率论与线性代数。【示例文本，待替换】',
        en: 'Coursework covered data structures, operating systems, computer networks, probability and linear algebra. [Template text — replace me]',
      },
    ],
    public: true,
  },
  {
    date: '2026-06',
    title: { zh: '示例 · 实习经历（进行中）', en: 'Template · Internship (ongoing)' },
    summary: {
      zh: '在实习中把研究中的方法落到真实工程问题上。',
      en: 'Applying research methods to real engineering problems during an internship.',
    },
    category: 'work',
    detail: [
      {
        zh: '负责的具体方向、团队与产出待补充。【示例文本，待替换】',
        en: 'Team, scope and outcomes to be filled in. [Template text — replace me]',
      },
    ],
    public: true,
  },
  {
    date: '2025-11',
    title: {
      zh: '示例 · 独立开发并发布软件产品',
      en: 'Template · Shipped an independent software product',
    },
    summary: {
      zh: '从需求、设计到实现与发布，独立完成一个可用的软件产品。',
      en: 'Designed, built and released a usable software product end to end.',
    },
    category: 'product',
    // 无 detail：用于验证「没有详细信息的节点仍可展示基本内容」
    public: true,
  },
  {
    date: '2025-08',
    title: { zh: '示例 · 开始创作《法渊》', en: 'Template · Started writing "Fayuan"' },
    summary: {
      zh: '开始长篇玄幻小说《法渊》的创作，以世界观与人物弧线为主线持续推进。',
      en: 'Started the fantasy novel "Fayuan", developing its worldbuilding and character arcs.',
    },
    category: 'writing',
    detail: [
      {
        zh: '写作节奏、连载平台与当前进度待补充。【示例文本，待替换】',
        en: 'Publishing platform, cadence and current progress to be filled in. [Template text — replace me]',
      },
    ],
    public: true,
  },
  {
    date: '2025-06',
    title: {
      zh: '示例 · 参与 GitHub 开源项目',
      en: 'Template · Contributed to open source on GitHub',
    },
    summary: {
      zh: '参与开源项目，从 issue 复现到提交可合并的改动。',
      en: 'Contributed to open-source projects, from reproducing issues to landing mergeable changes.',
    },
    category: 'opensource',
    link: 'https://github.com/',
    public: true,
  },
  {
    date: '2025-05',
    title: { zh: '示例 · 编程竞赛经历', en: 'Template · Programming contest' },
    summary: {
      zh: '在限时竞赛中训练算法设计与工程实现能力。',
      en: 'Trained algorithm design and implementation under time pressure.',
    },
    category: 'competition',
    // 无 detail
    public: true,
  },
  {
    date: '2025-03',
    title: {
      zh: '示例 · 开始研究 LLM、MARL 与动态空域配置',
      en: 'Template · Started research on LLM, MARL and dynamic airspace configuration',
    },
    summary: {
      zh: '围绕大语言模型与多智能体强化学习，探索动态空域配置问题。',
      en: 'Exploring dynamic airspace configuration with large language models and multi-agent reinforcement learning.',
    },
    category: 'research',
    detail: [
      {
        zh: '研究问题：在空域需求动态变化时如何给出可解释的配置方案。【示例文本，待替换】',
        en: 'Problem: producing interpretable configuration plans under shifting airspace demand. [Template text — replace me]',
      },
      {
        zh: '方法与阶段性结论待补充。【示例文本，待替换】',
        en: 'Methods and interim findings to be filled in. [Template text — replace me]',
      },
    ],
    public: true,
  },
];

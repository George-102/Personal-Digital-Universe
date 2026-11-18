import type { Project } from './types.ts';

/**
 * US-012 精选 GitHub 开源项目。
 * 【待用户确认】以下仓库选择、分类与双语介绍为 agent 按 GitHub 公开信息与 PRD 起草的草稿。
 * 私有科研仓库（repoPrivate: true）不渲染 GitHub 按钮——访客点击会 404。
 * stars 字段可由 github-cache.json 在构建期覆盖（US-012c）。
 */
export const projects: Project[] = [
  {
    slug: 'aics-learning-guide',
    repo: 'George-102/AICS_Learning_Guide',
    name: 'AICS Learning Guide',
    description: {
      zh: '面向 CS 学生与开发者的 AI 时代开源学习路线与资源索引。',
      en: 'An open-source roadmap and resource hub for CS students and developers in the age of AI.',
    },
    detail: {
      zh: '按学习阶段整理计算机科学核心课程、AI 与机器学习资源、工具链和实践项目，帮助读者从基础到进阶建立完整路径。仓库带 ai / cs / guide 等主题标签，社区可继续补充资源。',
      en: 'A staged guide covering core CS courses, AI and machine learning resources, tooling and hands-on projects, helping readers build a path from fundamentals to advanced topics. Tagged with ai / cs / guide topics so the community can keep extending it.',
    },
    stack: ['HTML', 'Markdown', 'GitHub'],
    category: 'ai-ml',
    status: 'active',
    featured: true,
    stars: 1,
    public: true,
  },
  {
    slug: 'personal-digital-universe',
    repo: 'George-102/Personal-Digital-Universe',
    name: 'Personal Digital Universe',
    description: {
      zh: '本站源码：以 Next.js、R3F 与双语内容驱动的个人数字空间。',
      en: 'Source of this site: a bilingual personal digital space built with Next.js and R3F.',
    },
    detail: {
      zh: '一个持续演进的个人数字空间：3D 首页、内容区块、双语中英文案与内容校验流水线。采用静态导出与 GitHub Actions 自动部署到 Cloudflare Pages，是工程实践与内容组织的综合示例。',
      en: 'An evolving personal digital space: a 3D landing page, content sections, bilingual copy and a validated content pipeline. Statically exported and deployed to Cloudflare Pages through GitHub Actions as a combined example of engineering and content organization.',
    },
    stack: ['Next.js', 'React Three Fiber', 'TypeScript', 'Tailwind CSS'],
    category: 'web',
    status: 'active',
    featured: true,
    stars: 0,
    public: true,
  },
  {
    slug: 'my-harness-file',
    repo: 'George-102/My-Harness-File',
    name: 'My Harness File',
    description: {
      zh: '用于 AI 编程代理的 harness 配置文件集合。',
      en: 'A collection of harness files for AI coding agents.',
    },
    detail: {
      zh: '记录并复用 AI 代理在开发中的工作流约束、任务拆分与验证规则，让不同项目共享一致的工程纪律。',
      en: 'Records and reuses workflow constraints, task breakdowns and verification rules for AI coding agents, so different projects share a consistent engineering discipline.',
    },
    stack: ['PowerShell', 'Markdown'],
    category: 'dev-tools',
    status: 'active',
    featured: true,
    stars: 0,
    public: true,
  },
  {
    slug: 'what-to-do',
    repo: 'George-102/What_To_Do',
    name: 'What To Do',
    description: {
      zh: '从多个候选中挑选每日三件事的轻量 Android / Windows 小应用。',
      en: 'A tiny Android / Windows app that picks three daily tasks from a list of options.',
    },
    detail: {
      zh: '面向个人使用的极简任务挑选工具：输入候选清单，快速决定当天专注的三件事，减少选择成本。',
      en: 'A minimal personal task picker: enter a list of candidates and quickly decide the three things to focus on today, reducing decision overhead.',
    },
    stack: ['Dart', 'Flutter'],
    category: 'dev-tools',
    status: 'maintained',
    featured: false,
    stars: 0,
    public: true,
  },
  {
    slug: 'toy-os',
    repo: 'George-102/toyOS',
    name: 'toyOS',
    description: {
      zh: '用于学习操作系统原理的玩具内核实验项目。',
      en: 'A toy kernel project for learning operating system fundamentals.',
    },
    detail: {
      zh: '从零起步的操作系统学习记录，围绕引导、内存与调度等核心机制做小型实现与验证。',
      en: 'A from-scratch OS learning project with small implementations and experiments around booting, memory and scheduling.',
    },
    stack: ['C', 'Assembly'],
    category: 'other',
    status: 'archived',
    featured: false,
    stars: 0,
    public: true,
  },
  {
    slug: 'george-102-github-io',
    repo: 'George-102/George-102.github.io',
    name: 'Personal Blog',
    description: {
      zh: '个人博客站点仓库，记录技术学习、思考与项目笔记。',
      en: 'Personal blog repository for technical learning, thoughts and project notes.',
    },
    detail: {
      zh: '以静态站点形式承载长期写作，覆盖技术实践、阅读笔记与阶段性总结。',
      en: 'A static site for long-form writing on technical practice, reading notes and periodic summaries.',
    },
    stack: ['HTML', 'CSS', 'GitHub Pages'],
    category: 'web',
    status: 'maintained',
    featured: false,
    stars: 0,
    public: true,
  },
  {
    slug: 'learning-game-development',
    repo: 'George-102/Learning-Game-Development',
    name: 'Learning Game Development',
    description: {
      zh: '记录游戏开发学习过程与实验性原型的仓库。',
      en: 'A repository recording the game development learning process and experimental prototypes.',
    },
    detail: {
      zh: '按学习进度保存练习项目与小型原型，覆盖玩法设计、场景与脚本实现。',
      en: 'Keeps exercises and small prototypes by learning stage, covering gameplay design, scenes and scripting.',
    },
    stack: ['GDScript', 'Godot'],
    category: 'other',
    status: 'active',
    featured: false,
    stars: 0,
    public: true,
  },
  {
    slug: 'llm-marl-dac',
    repo: 'George-102/LLM-MARL-DAC',
    name: 'LLM-Guided MARL for DAC',
    description: {
      zh: 'LLM 引导的离线约束参数化研究代码：面向动态空域配置的安全多智能体强化学习。',
      en: 'Research code for LLM-guided offline constraint parameterization in safe MARL for dynamic airspace configuration.',
    },
    detail: {
      zh: '围绕动态空域配置中的安全约束，研究用大语言模型辅助生成离线约束参数，并结合多智能体强化学习做安全决策。仓库当前为私有，仅展示研究信息，不提供公开代码入口。',
      en: 'Studies using LLMs to assist offline constraint parameterization for safety in dynamic airspace configuration, combined with multi-agent reinforcement learning. The repository is currently private; only research information is shown and no public code link is provided.',
    },
    stack: ['Python', 'LLM', 'Multi-Agent RL'],
    category: 'research',
    status: 'active',
    featured: true,
    repoPrivate: true,
    public: true,
  },
  {
    slug: 'llm-marl-atm',
    repo: 'George-102/LLM_MARL_ATM',
    name: 'LLM + MARL for ATM',
    description: {
      zh: '面向空中交通管理的 LLM 与多智能体强化学习研究代码。',
      en: 'Research code on LLM and multi-agent reinforcement learning for air traffic management.',
    },
    detail: {
      zh: '探索将大模型推理能力与多智能体强化学习结合，用于空管场景下的协同决策与智能辅助。仓库当前为私有，仅展示研究信息。',
      en: 'Explores combining large-model reasoning with multi-agent reinforcement learning for collaborative decision support in air traffic management. The repository is currently private; only research information is shown.',
    },
    stack: ['Python', 'LLM', 'Multi-Agent RL'],
    category: 'research',
    status: 'active',
    featured: false,
    repoPrivate: true,
    public: true,
  },
];

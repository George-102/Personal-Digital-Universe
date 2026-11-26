import type { Skill } from './types.ts';

/**
 * US-007：技术能力清单——【待用户确认】
 *
 * 由 agent 按 PRD 六领域起草，只记录有客观依据的技能与使用场景，
 * 不写任何熟练度百分比或自评等级（DoD 硬约束）。
 * 维护方式：改本文件的条目即可；新增分类需同步 SKILL_CATEGORIES 与 lib/skills.ts。
 * related 可缺省；缺省时技能仍正常展示（AC3）。
 */
export const skills: Skill[] = [
  // ── Computer Science ──────────────────────────────────────────────────────
  {
    slug: 'data-structures-algorithms',
    name: 'Data Structures & Algorithms',
    category: 'computer-science',
    description: {
      zh: '以数据结构与算法作为编程与科研问题求解的基础。',
      en: 'Data structures and algorithms as the basis for programming and research problem-solving.',
    },
    detail: {
      zh: '计算机科学本科核心训练，用于课程实践、竞赛与科研代码中的复杂度分析和实现取舍。',
      en: 'Core undergraduate training, applied in coursework, contests, and research code for complexity analysis and implementation trade-offs.',
    },
    tags: ['C++', 'Python', 'Complexity Analysis'],
    featured: false,
    public: true,
  },
  {
    slug: 'operating-systems',
    name: 'Operating Systems',
    category: 'computer-science',
    description: {
      zh: '理解进程、内存与文件系统等操作系统基础机制。',
      en: 'Understanding processes, memory, and file systems as operating-system fundamentals.',
    },
    detail: {
      zh: '通过 toyOS 等系统方向实践熟悉底层机制，并把相关理解用于工程调试与性能判断。',
      en: 'Explored low-level mechanisms through systems projects such as toyOS, and applied that understanding to debugging and performance reasoning.',
    },
    tags: ['Linux', 'Systems Programming'],
    related: [
      { label: { zh: '相关项目', en: 'Related projects' }, href: '/projects/' },
    ],
    featured: false,
    public: true,
  },
  {
    slug: 'computer-networks',
    name: 'Computer Networks',
    category: 'computer-science',
    description: {
      zh: '掌握 Web 应用与分布式协作所依赖的网络基础。',
      en: 'Networking fundamentals behind web applications and distributed collaboration.',
    },
    detail: {
      zh: '把 HTTP、DNS 与客户端—服务端通信知识用于全栈开发、接口调试和部署排查。',
      en: 'Applied HTTP, DNS, and client–server communication knowledge in full-stack development, API debugging, and deployment troubleshooting.',
    },
    tags: ['HTTP', 'DNS', 'Web'],
    featured: false,
    public: true,
  },

  // ── Software Engineering ──────────────────────────────────────────────────
  {
    slug: 'typescript',
    name: 'TypeScript',
    category: 'software-engineering',
    description: {
      zh: '用静态类型约束前端组件接口与数据结构。',
      en: 'Using static types to constrain front-end component interfaces and data structures.',
    },
    detail: {
      zh: '本站的内容类型、组件参数与跨模块接口均由 TypeScript 定义，构建期类型检查是日常验证的一部分。',
      en: 'This site defines content types, component props, and cross-module interfaces in TypeScript; build-time type checking is part of the routine verification.',
    },
    tags: ['JavaScript', 'TypeScript', 'Type Safety'],
    related: [
      { label: { zh: '开源项目', en: 'Open-source projects' }, href: '/projects/' },
    ],
    featured: true,
    public: true,
  },
  {
    slug: 'python',
    name: 'Python',
    category: 'software-engineering',
    description: {
      zh: '用于科研仿真、数据处理与自动化脚本的主力语言。',
      en: 'Primary language for research simulation, data processing, and automation scripts.',
    },
    detail: {
      zh: '在 LLM + MARL 与动态空域配置相关的原型实验中编写仿真与评估脚本，也用于内容校验与抓取工具。',
      en: 'Used for simulation and evaluation scripts in LLM + MARL and dynamic airspace configuration prototypes, as well as content validation and fetching tools.',
    },
    tags: ['NumPy', 'Scripting', 'Automation'],
    related: [
      { label: { zh: '科研方向', en: 'Research areas' }, href: '/research/' },
    ],
    featured: false,
    public: true,
  },
  {
    slug: 'git-collaboration',
    name: 'Git & Open Source Workflow',
    category: 'software-engineering',
    description: {
      zh: '以 Git 分支、评审与自动化验证组织协作开发。',
      en: 'Organizing collaborative development with Git branches, reviews, and automated verification.',
    },
    detail: {
      zh: '本站采用分支保护与云端验证流水线，提交前需通过本地门禁；开源项目维护沿用同类工作流。',
      en: 'This site uses branch protection and a cloud verification pipeline with a local pre-push gate; open-source maintenance follows a similar workflow.',
    },
    tags: ['GitHub', 'CI/CD', 'Code Review'],
    related: [
      { label: { zh: '开源项目', en: 'Open-source projects' }, href: '/projects/' },
    ],
    featured: false,
    public: true,
  },

  // ── Full-Stack Development ────────────────────────────────────────────────
  {
    slug: 'nextjs-react',
    name: 'Next.js & React',
    category: 'full-stack',
    description: {
      zh: '以 Next.js 与 React 构建静态导出的双语站点。',
      en: 'Building a statically exported bilingual site with Next.js and React.',
    },
    detail: {
      zh: '本站使用 Next.js 静态导出与 next-intl 双语路由，内容区以服务端渲染保证无 JS 可读，3D 层按需加载。',
      en: 'This site uses Next.js static export with next-intl bilingual routing; content is server-rendered for no-JS readability while 3D layers load on demand.',
    },
    tags: ['Next.js', 'React', 'next-intl'],
    related: [
      { label: { zh: '开源项目', en: 'Open-source projects' }, href: '/projects/' },
    ],
    featured: true,
    public: true,
  },
  {
    slug: 'nodejs-services',
    name: 'Node.js & API Design',
    category: 'full-stack',
    description: {
      zh: '使用 Node.js 设计接口与构建期数据处理流程。',
      en: 'Designing APIs and build-time data pipelines with Node.js.',
    },
    detail: {
      zh: '为内容维护与数据同步编写可重复执行的脚本，使页面由结构化数据自动生成，而不是手工改页面代码。',
      en: 'Wrote repeatable scripts for content maintenance and data synchronization so pages are generated from structured data instead of hand-edited markup.',
    },
    tags: ['Node.js', 'REST', 'Build Scripts'],
    featured: false,
    public: true,
  },
  {
    slug: 'responsive-css',
    name: 'Responsive CSS & Accessibility',
    category: 'full-stack',
    description: {
      zh: '把响应式布局与可访问性作为界面实现的基础要求。',
      en: 'Treating responsive layout and accessibility as baseline UI requirements.',
    },
    detail: {
      zh: '站点覆盖多档视口与触摸设备，键盘可达、对比度与减少动态效果均有专项验收。',
      en: 'The site is verified across viewport tiers and touch devices, with dedicated checks for keyboard access, contrast, and reduced motion.',
    },
    tags: ['CSS', 'a11y', 'Mobile'],
    featured: false,
    public: true,
  },

  // ── Artificial Intelligence ───────────────────────────────────────────────
  {
    slug: 'large-language-models',
    name: 'Large Language Models',
    category: 'artificial-intelligence',
    description: {
      zh: '研究大语言模型在复杂决策与协同任务中的作用。',
      en: 'Researching the role of large language models in complex decision-making and collaborative tasks.',
    },
    detail: {
      zh: '关注 LLM 与多智能体强化学习结合，用于动态空域配置中的语义理解、决策解释与协同机制。',
      en: 'Focused on combining LLMs with multi-agent reinforcement learning for semantic understanding, decision explanation, and coordination in dynamic airspace configuration.',
    },
    tags: ['LLM', 'Prompting', 'Reasoning'],
    related: [
      { label: { zh: '科研方向', en: 'Research areas' }, href: '/research/' },
    ],
    featured: true,
    public: true,
  },
  {
    slug: 'multi-agent-rl',
    name: 'Multi-Agent Reinforcement Learning',
    category: 'artificial-intelligence',
    description: {
      zh: '以多智能体强化学习研究分布式协同决策。',
      en: 'Studying distributed cooperative decision-making with multi-agent reinforcement learning.',
    },
    detail: {
      zh: '围绕动态扇区化与管制员工作负载均衡等问题，构建多主体仿真与策略评估的原型流程。',
      en: 'Built prototype pipelines for multi-agent simulation and policy evaluation around dynamic sectorization and controller workload balancing.',
    },
    tags: ['MARL', 'Simulation', 'Policy Evaluation'],
    related: [
      { label: { zh: '科研方向', en: 'Research areas' }, href: '/research/' },
    ],
    featured: true,
    public: true,
  },
  {
    slug: 'agentic-ai',
    name: 'Agentic AI',
    category: 'artificial-intelligence',
    description: {
      zh: '探索具备工具调用与任务分解能力的智能体系统。',
      en: 'Exploring agent systems with tool use and task decomposition.',
    },
    detail: {
      zh: '把智能体视为可组合的工作流单元，关注任务拆解、工具边界与可验证的执行结果。',
      en: 'Treats agents as composable workflow units, focusing on task decomposition, tool boundaries, and verifiable execution results.',
    },
    tags: ['Agents', 'Tool Use', 'Workflows'],
    related: [
      { label: { zh: '科研方向', en: 'Research areas' }, href: '/research/' },
    ],
    featured: false,
    public: true,
  },

  // ── Research & Scientific Computing ───────────────────────────────────────
  {
    slug: 'airspace-simulation',
    name: 'Air Traffic Simulation & DAC',
    category: 'research-computing',
    description: {
      zh: '围绕动态空域配置构建可复现的仿真实验环境。',
      en: 'Building reproducible simulation environments for dynamic airspace configuration.',
    },
    detail: {
      zh: '研究动态交通需求、空域结构重构、容量与安全性约束，并把仿真结果用于对照实验与指标比较。',
      en: 'Studies dynamic traffic demand, airspace restructuring, capacity and safety constraints, and uses simulation outputs for controlled comparisons.',
    },
    tags: ['DAC', 'Simulation', 'Metrics'],
    related: [
      { label: { zh: '科研方向', en: 'Research areas' }, href: '/research/' },
    ],
    featured: false,
    public: true,
  },
  {
    slug: 'research-methods',
    name: 'Research Methods & Evaluation',
    category: 'research-computing',
    description: {
      zh: '用对照实验与明确指标评估方法有效性。',
      en: 'Evaluating methods with controlled experiments and explicit metrics.',
    },
    detail: {
      zh: '在研究原型中记录基线、变量与评价指标，避免只凭单次运行或主观印象下结论。',
      en: 'Records baselines, variables, and evaluation metrics in research prototypes to avoid conclusions from single runs or subjective impressions.',
    },
    tags: ['Baselines', 'Experiments', 'Metrics'],
    featured: false,
    public: true,
  },
  {
    slug: 'scientific-writing',
    name: 'Scientific Writing',
    category: 'research-computing',
    description: {
      zh: '把研究问题、方法与结果整理为可复述的论述。',
      en: 'Structuring research questions, methods, and results into reproducible arguments.',
    },
    detail: {
      zh: '通过文献梳理与技术写作训练，把复杂方法写成有边界、有依据的说明，而非笼统概述。',
      en: 'Uses literature review and technical writing practice to describe complex methods with explicit scope and evidence rather than vague summaries.',
    },
    tags: ['Literature Review', 'Technical Writing'],
    related: [
      { label: { zh: '科研方向', en: 'Research areas' }, href: '/research/' },
    ],
    featured: false,
    public: true,
  },

  // ── Tools & Technologies ──────────────────────────────────────────────────
  {
    slug: 'threejs-r3f',
    name: 'Three.js & React Three Fiber',
    category: 'tools-technologies',
    description: {
      zh: '用 WebGL 构建可降级、按需挂载的 3D 场景。',
      en: 'Building degradable, on-demand 3D scenes with WebGL.',
    },
    detail: {
      zh: '本站 3D 层均为概念示意：进入视口、设备与性能门槛满足后才挂载，失败时退回静态视觉，信息主体始终是 DOM。',
      en: 'The 3D layers on this site are conceptual illustrations: they mount only after viewport, device, and performance gates pass, and fall back to static visuals on failure. DOM remains the information source of truth.',
    },
    tags: ['Three.js', 'R3F', 'WebGL'],
    related: [
      { label: { zh: '开源项目', en: 'Open-source projects' }, href: '/projects/' },
    ],
    featured: false,
    public: true,
  },
  {
    slug: 'automated-testing',
    name: 'Automated Testing',
    category: 'tools-technologies',
    description: {
      zh: '以单元测试、E2E 与质量门禁保障改动可回归。',
      en: 'Using unit tests, E2E tests, and quality gates to keep changes verifiable.',
    },
    detail: {
      zh: '本站的验证链覆盖类型检查、Vitest 单测与覆盖率、Playwright 四项目与 Lighthouse 门禁；本地轻验证与云端重验证分工执行。',
      en: 'The verification chain covers type checking, Vitest units with coverage, four Playwright projects, and Lighthouse gates; light local checks and heavy cloud checks are split.',
    },
    tags: ['Vitest', 'Playwright', 'Lighthouse'],
    featured: false,
    public: true,
  },
  {
    slug: 'data-visualization',
    name: 'Data Visualization',
    category: 'tools-technologies',
    description: {
      zh: '用空间化图形表达数据结构与关联关系。',
      en: 'Expressing data structures and relationships with spatial graphics.',
    },
    detail: {
      zh: '在科研示意与站点视觉中使用节点、轨迹、扇区等元素表达抽象关系，并明确区分概念示意与真实数据。',
      en: 'Uses nodes, trajectories, and sectors to express abstract relationships in research illustrations and site visuals, with clear labels separating concepts from real data.',
    },
    tags: ['Visualization', 'SVG', '3D'],
    related: [
      { label: { zh: '科研方向', en: 'Research areas' }, href: '/research/' },
    ],
    featured: false,
    public: true,
  },
];

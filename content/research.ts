import type { ResearchArea } from './types.ts';

/**
 * US-010b：研究方向内容。
 *
 * 【待用户确认】以下中英文案由 agent 按 docs/PRD.md US-010 详述与用户背景
 * （LLM / MARL / Dynamic Airspace Configuration）起草，措辞刻意保守——
 * 不虚构论文、获奖与仿真结果（PRD §8.3 内容真实性）。请替换为真实研究描述。
 */
export const research: ResearchArea[] = [
  {
    slug: 'dynamic-airspace-configuration',
    title: {
      zh: '动态空域配置与扇区化',
      en: 'Dynamic Airspace Configuration & Sectorization',
    },
    overview: {
      zh: '面向动态交通需求，探索动态空域配置（DAC）与动态扇区化，在容量、安全与管制员负载间取得平衡。',
      en: 'Exploring DAC and dynamic sectorization to balance capacity, safety and controller workload under changing traffic demand.',
    },
    problems: [
      {
        zh: '动态交通需求与静态空域结构之间的错配',
        en: 'Mismatch between dynamic traffic demand and static airspace structures',
      },
      {
        zh: '空域结构重构的时机与方式决策',
        en: 'When and how to reconfigure airspace structures',
      },
      {
        zh: '空域容量与安全性保障',
        en: 'Maintaining airspace capacity and safety',
      },
      {
        zh: '管制员工作负载均衡',
        en: 'Balancing controller workload',
      },
    ],
    methods: [
      'Multi-Agent Reinforcement Learning',
      '空域扇区化建模 / Airspace Sectorization Modeling',
      '仿真评估 / Simulation-based Evaluation',
    ],
    detail: [
      {
        zh: '研究以动态空域配置与动态扇区化为核心方向，关注交通流随时间变化时，如何对空域结构进行灵活调整，而不是沿用固定的扇区划分。当前处于方法探索阶段，相关可视化为概念性示意。',
        en: 'This direction focuses on Dynamic Airspace Configuration and dynamic sectorization: adjusting airspace structures as traffic flows evolve over time, instead of relying on fixed sector boundaries. Work is at the exploratory stage; related visuals are conceptual illustrations.',
      },
      {
        zh: '关键技术围绕多智能体强化学习的建模与训练展开，并结合仿真平台进行方案评估；数据与实验结果以真实可核验来源为准，未公开前不在本站展示具体数值。',
        en: 'Key techniques center on Multi-Agent Reinforcement Learning formulation and training, with evaluation on simulation platforms. Data and results are only shown when backed by verifiable public sources.',
      },
    ],
    keywords: [
      'Dynamic Airspace Configuration',
      'Dynamic Airspace Sectorization',
      'Air Traffic Management',
    ],
    status: 'In Progress',
    public: true,
  },
  {
    slug: 'llm-marl',
    title: {
      zh: 'LLM + 多智能体强化学习',
      en: 'LLM + Multi-Agent Reinforcement Learning',
    },
    overview: {
      zh: '探索 LLM 与多智能体强化学习（MARL）结合，用于复杂约束下的动态决策与协同优化。',
      en: 'Combining LLMs with MARL for dynamic decision-making and multi-agent coordination under complex constraints.',
    },
    problems: [
      {
        zh: '复杂约束下的动态决策',
        en: 'Dynamic decision-making under complex constraints',
      },
      {
        zh: '多智能体之间的协同优化',
        en: 'Collaborative optimization across multiple agents',
      },
      {
        zh: '语言模型与强化学习的结合方式',
        en: 'How to integrate language models with reinforcement learning',
      },
    ],
    methods: [
      'Large Language Models',
      'Multi-Agent Reinforcement Learning',
      'Agentic AI',
    ],
    detail: [
      {
        zh: '该方向是当前研究的探索重点之一：尝试利用大语言模型的先验知识与推理能力，辅助多智能体强化学习在动态、多约束场景中的策略学习与协同。目前以方法探索与原型实验为主。',
        en: 'This is one of the current research focuses: using the prior knowledge and reasoning abilities of large language models to assist MARL policy learning and coordination in dynamic, highly constrained settings. The work is currently at the method-exploration and prototype-experiment stage.',
      },
      {
        zh: '与动态空域配置方向的关系：LLM + MARL 是实现动态决策和协同优化的候选技术路径之一，二者共同服务于空域智能决策这一长期目标。',
        en: 'Relation to the DAC direction: LLM + MARL is one candidate technical route toward dynamic decision-making and collaborative optimization; both serve the long-term goal of intelligent airspace decision support.',
      },
    ],
    keywords: [
      'Large Language Models',
      'Multi-Agent Reinforcement Learning',
      'Agentic AI',
    ],
    status: 'In Progress',
    public: true,
  },
  {
    slug: 'ai-for-air-traffic-management',
    title: {
      zh: '面向空管的智能决策（Agentic AI）',
      en: 'Intelligent Decision Support for ATM (Agentic AI)',
    },
    overview: {
      zh: '研究人工智能（含 Agentic AI）在空中交通管理中的应用，关注智能决策支持与人机协同。',
      en: 'Applying AI and Agentic AI to air traffic management, focusing on decision support and human-machine collaboration.',
    },
    problems: [
      {
        zh: '空管场景中的智能决策支持',
        en: 'Intelligent decision support in air traffic management scenarios',
      },
      {
        zh: '人机协同与管制员工作负荷',
        en: 'Human-machine collaboration and controller workload',
      },
      {
        zh: '安全关键环境下的方法可靠性',
        en: 'Method reliability in safety-critical environments',
      },
    ],
    methods: [
      'AI for Air Traffic Management',
      'Agentic AI',
      '概念性建模 / Conceptual Modeling',
    ],
    detail: [
      {
        zh: '空中交通管理是典型的安全关键领域，任何智能方法都必须在可解释、可核验的前提下引入。本方向以概念性探索为主，关注 Agentic AI 在空管决策链路中的定位与边界。',
        en: 'Air traffic management is a safety-critical domain: any intelligent method must be introduced under explainable and verifiable premises. This direction is mainly conceptual, examining the role and boundaries of Agentic AI within ATM decision chains.',
      },
    ],
    keywords: ['AI for Air Traffic Management', 'Agentic AI'],
    status: 'In Progress',
    public: true,
  },
];

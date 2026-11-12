import type { Profile } from './types.ts';

export const profile: Profile = {
  name: { zh: '苏子豪', en: 'Christopher Chang' },
  tagline: {
    zh: 'Computer Scientist · Researcher · Developer · Writer · Explorer',
    en: 'Computer Scientist · Researcher · Developer · Writer · Explorer',
  },
  status: { zh: 'Building, Researching, Creating.', en: 'Building, Researching, Creating.' },
  email: 'zhangchaowen@stu.scu.edu.cn',
  links: [],
  public: true,
  /**
   * US-006 个人介绍正文。
   * 来源：docs/PRD.md §1.1 与 US-006 详述 4 的七项事实；遵循 §8.3 内容真实性
   * （不虚构论文/获奖/产品数据，准备中与进行中的事项按原状态表述）。
   * 【待用户确认】以下中英文案为 agent 起草草稿，用户可直接改本文件替换。
   * portrait / cvUrl 省略 → 不显示照片与无效下载入口（US-006d / US-006f）。
   */
  about: {
    bio: [
      {
        zh: '我是苏子豪（Christopher Chang），一名计算机科学专业本科大三学生。这个网站不是一份简历，而是一座仍在搭建的数字空间：把我正在学习、研究、创造和阅读的一切，放进同一个可以慢慢探索的坐标系里。',
        en: 'I am Christopher Chang (苏子豪), a third-year undergraduate studying computer science. This site is not a résumé but a digital space still under construction — a place to put everything I am learning, researching, making and reading into one slowly explorable coordinate system.',
      },
      {
        zh: '眼下我在准备研究生考试与实习，同时把主要精力放在大语言模型（LLM）、多智能体强化学习（MARL）与动态空域配置（DAC）的交叉研究上：语言模型如何参与空域结构的动态决策，是我最想弄清的问题。研究之外，我在 GitHub 上参与开源项目，也独立开发并发布自己的软件产品，把想法变成别人真的能用的东西。',
        en: 'Right now I am preparing for graduate entrance examinations and internship opportunities, while focusing my research on the intersection of large language models (LLM), multi-agent reinforcement learning (MARL) and dynamic airspace configuration (DAC): how language models can take part in dynamic decisions about airspace structure is the question I most want to answer. Alongside research I contribute to open source projects on GitHub and independently build and release software products, turning ideas into things people can actually use.',
      },
      {
        zh: '我也创作《法渊》这样的玄幻小说，并在阅读、数学、哲学与经济学之间来回游走。这些看似分散的兴趣有一个共同底色：好奇复杂系统如何运作，以及人该如何描述它们。这里记录的多是进行时——准备中的、探索中的、尚未完成的，都会被如实标注。',
        en: 'I also write xuanhuan fiction such as 《法渊》, and move between reading, mathematics, philosophy and economics. These seemingly scattered interests share one motivation: curiosity about how complex systems work, and about how we describe them. Much of what is recorded here is work in progress — anything being prepared, explored or left unfinished is labelled honestly as such.',
      },
    ],
    highlights: [
      { zh: '计算机科学 · 本科大三', en: 'Computer Science · 3rd-year undergraduate' },
      { zh: '准备研究生考试与实习', en: 'Preparing for graduate exams & internships' },
      {
        zh: '研究 LLM × MARL × 动态空域配置',
        en: 'Researching LLM × MARL × Dynamic Airspace Configuration',
      },
      { zh: '参与 GitHub 开源项目', en: 'Contributing to open source on GitHub' },
      { zh: '独立开发与发布软件产品', en: 'Independently building & shipping software' },
      { zh: '创作《法渊》等玄幻文学（写作中）', en: 'Writing xuanhuan fiction incl. 《法渊》 (in progress)' },
      { zh: '阅读 · 数学 · 哲学 · 经济学', en: 'Reading · Mathematics · Philosophy · Economics' },
    ],
  },
};
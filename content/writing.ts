import type { WritingWork } from './types.ts';

/**
 * US-014：文学作品清单。
 * 【待用户确认】以下为按 PRD §3 US-014 与 §1.1 起草的示例内容，非已核实事实；
 * 用户提供真实作品信息后，只改本文件即可（title/description/详情字段双语）。
 * 创作时间使用模糊表述，不虚构已发表或已完结状态。
 */
export const writing: WritingWork[] = [
  {
    slug: 'fayuan',
    title: { zh: '法渊', en: 'Fayuan' },
    type: 'novel',
    status: 'In Progress',
    description: {
      zh: '一部以法与深渊为主题的玄幻长篇，围绕秩序的代价与个人选择展开。',
      en: 'An epic fantasy about law and the abyss, exploring the cost of order and personal choice.',
    },
    featured: true,
    writtenAt: '2023—至今',
    worldview: {
      zh: '世界由成文法典维系，但法典之下另有深渊；每一次裁决都在两端之间摆动。',
      en: 'A world held together by written law, beneath which lies an abyss; every judgement sways between the two.',
    },
    background: [
      { zh: '故事发生在一座以判例为信仰的城邦，法官同时是仲裁者与修行者。', en: 'Set in a city-state that worships precedent, where judges are both arbiters and cultivators.' },
      { zh: '深渊并非邪恶之地，而是被法典排除的另一种秩序。', en: 'The abyss is not evil but another order excluded by the code.' },
    ],
    characters: [
      { zh: '主角：一名在法典与深渊之间寻找第三条路的年轻判官。', en: 'Protagonist: a young judge searching for a third path between code and abyss.' },
    ],
    concept: {
      zh: '想写一部关于规则与自由的幻想作品：真正的正义不在于站在哪一端，而在于是否愿意承担选择的重量。',
      en: 'A fantasy about rules and freedom: real justice lies not in which side you take, but in bearing the weight of choice.',
    },
    public: true,
  },
  {
    slug: 'starfall-letters',
    title: { zh: '坠星书简', en: 'Starfall Letters' },
    type: 'novel',
    status: 'Writing',
    description: {
      zh: '一组以书信体写成的短篇幻想，讲述旅人、星图与未能寄出的告别。',
      en: 'A collection of epistolary fantasy shorts about travellers, star maps, and farewells never sent.',
    },
    featured: true,
    writtenAt: '2024—至今',
    worldview: {
      zh: '每封写在流星夜的信都会抵达某个平行的人生，只是收信人永远无法回信。',
      en: 'Every letter written on a meteor night reaches a parallel life, though its recipient can never reply.',
    },
    concept: {
      zh: '用书信体练习克制叙事：把情绪藏在细节与留白里。',
      en: 'A practice in restrained storytelling: hiding emotion in detail and negative space.',
    },
    public: true,
  },
  {
    slug: 'ink-and-echo',
    title: { zh: '墨与回声', en: 'Ink and Echo' },
    type: 'article',
    status: 'Completed',
    description: {
      zh: '关于阅读、写作与技术工作的短章，记录从计算机科学走向文学的过程。',
      en: 'Short essays on reading, writing, and technical work, recording a path from computer science to literature.',
    },
    featured: false,
    writtenAt: '2022',
    detail: [
      { zh: '文字与代码都需要反复重写；差别在于代码有测试，文字只有时间。', en: 'Both prose and code need rewriting; code has tests, prose only has time.' },
    ],
    public: true,
  },
];

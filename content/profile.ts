import type { Profile } from './types.ts';

// 占位数据：真实笔名/英文名与联系方式在 T-002b 由所有者确认后填入
export const profile: Profile = {
  name: { zh: '笔名待确认', en: 'Pen Name TBD' },
  tagline: {
    zh: 'Computer Scientist · Researcher · Developer · Writer · Explorer',
    en: 'Computer Scientist · Researcher · Developer · Writer · Explorer',
  },
  status: { zh: 'Building, Researching, Creating.', en: 'Building, Researching, Creating.' },
  links: [],
  public: true,
};
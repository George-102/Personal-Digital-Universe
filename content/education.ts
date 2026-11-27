import type { EducationEntry } from './types.ts';

/**
 * US-009 教育背景。
 *
 * ⚠️【待用户确认】以下为 agent 按 PRD §1.1 / US-009 已知事实起草的草稿：
 *   - 计算机科学本科大三（2026-11）、准备研究生考试（PRD 明确）；
 *   - 本科起止时间参照 journey.ts 的 2023-09 ~ 2027-06 草稿区间；
 *   - 学校与学院名称 PRD 未提供，标【待确认】占位，用户替换后即可上线；
 *   - 研究生备考条目只表达「备考中，尚未入学」，不得改为 Completed（构建期拒绝）。
 * 用户只需改本文件；组件零硬编码。
 */
export const education: EducationEntry[] = [
  {
    slug: 'undergraduate-cs',
    school: { zh: '【待确认】本科院校', en: 'Undergraduate university [to confirm]' },
    college: { zh: '【待确认】学院', en: 'School [to confirm]' },
    major: { zh: '计算机科学与技术', en: 'Computer Science and Technology' },
    degree: { zh: '本科（在读）', en: 'Bachelor (in progress)' },
    degreeLevel: 'undergraduate',
    status: 'In Progress',
    startDate: '2023-09',
    endDate: '2027-06',
    courses: [
      { zh: '数据结构与算法', en: 'Data Structures and Algorithms' },
      { zh: '操作系统', en: 'Operating Systems' },
      { zh: '计算机网络', en: 'Computer Networks' },
    ],
    experiences: [
      {
        zh: '本科阶段以算法、系统与数学为基础，逐步进入 LLM × MARL × 动态空域配置的研究方向。【待用户确认】',
        en: 'Undergraduate study built foundations in algorithms, systems and mathematics, leading into LLM × MARL × dynamic airspace configuration research. [To confirm]',
      },
    ],
    detail: [
      {
        zh: '入学与预计毕业时间、学校与学院名称待用户核实后替换。',
        en: 'Enrollment dates, university and school names to be verified and replaced by the owner.',
      },
    ],
    featured: true,
    public: true,
  },
  {
    slug: 'graduate-exam-preparation',
    degree: { zh: '硕士研究生（备考中）', en: 'Master (preparing)' },
    degreeLevel: 'graduate',
    status: 'In Progress',
    startDate: '2026',
    // 学校 / 学院 / 预计毕业时间未配置：页面不渲染空字段（AC2）
    statusNote: {
      zh: '备考中，尚未入学；研究生学历尚未获得。',
      en: 'Preparing for graduate entrance exams — not enrolled; no graduate degree has been awarded.',
    },
    experiences: [
      {
        zh: '目前准备研究生考试与实习，同时进行科研探索。',
        en: 'Currently preparing for graduate entrance exams and internships while continuing research exploration.',
      },
    ],
    featured: true,
    public: true,
  },
];

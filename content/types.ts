export type LocaleText = { zh: string; en: string };

export type PublicationStatus = 'Published' | 'Preprint' | 'In Progress';
export type ProductStatus = 'Released' | 'Beta' | 'In Development' | 'Discontinued';
export type WritingStatus = 'Writing' | 'In Progress' | 'Completed';

export interface SocialLink {
  label: string;
  url: string;
}

/**
 * US-018：公开联系方式。
 * links 为空是合法状态——不渲染任何无效入口（PRD 验收 4）。
 */
export type ContactKind = 'github' | 'blog' | 'social' | 'other';

export interface ContactLink {
  id: string;
  kind: ContactKind;
  label: LocaleText;
  url: string;
  public: boolean;
}

export interface ContactContent {
  email?: string;
  links: ContactLink[];
  collaborations: LocaleText[];
}

/**
 * US-006：个人介绍内容。正文/要点为双语数组，资源路径为站内静态资源。
 * portrait / cvUrl 省略时页面不渲染对应入口（不显示无效链接）。
 */
export interface AboutContent {
  bio: LocaleText[];
  highlights: LocaleText[];
  portrait?: string;
  cvUrl?: string;
}

export interface Profile {
  name: LocaleText;
  tagline: LocaleText;
  status: LocaleText;
  email?: string;
  links: SocialLink[];
  public: boolean;
  /** 可选：缺失时 About 区域安全降级，不崩溃（T-002c 缺字段容错） */
  about?: AboutContent;
  /** 可选：联系方式；缺失或 links 为空时只渲染已配置的真实入口 */
  contact?: ContactContent;
}

export type JourneyCategory =
  | 'education'
  | 'research'
  | 'opensource'
  | 'product'
  | 'competition'
  | 'work'
  | 'writing';

export interface JourneyEntry {
  /** 开始时间：`YYYY` 或 `YYYY-MM` */
  date: string;
  /** 可选结束时间，用于区间经历（如 2023 - 2026） */
  endDate?: string;
  title: LocaleText;
  summary: LocaleText;
  category: JourneyCategory;
  /** 可选多段详情；缺省时节点只展示摘要（US-008 验收 5：无详情仍展示基本内容） */
  detail?: LocaleText[];
  /** 可选详情链接：站内路径或 https 外链 */
  link?: string;
  public: boolean;
}

export type ResearchStatus = 'In Progress' | 'Completed';

export interface ResearchArea {
  slug: string;
  title: LocaleText;
  /** 详情页概述（US-010a） */
  overview: LocaleText;
  problems: LocaleText[];
  methods: string[];
  /** 可选详细段落，缺省时详情页只展示概述/问题/方法 */
  detail?: LocaleText[];
  keywords: string[];
  /** 可选相关链接：站内路径或 https 外链 */
  link?: string;
  status: ResearchStatus;
  public: boolean;
}

export interface Publication {
  title: string;
  authors: string[];
  year: number;
  status: PublicationStatus;
  links?: { label: string; url: string }[];
  public: boolean;
}

/** US-012：PRD 五分类（AI & ML / Web Applications / Developer Tools / Research Projects / Other） */
export type ProjectCategory = 'ai-ml' | 'web' | 'dev-tools' | 'research' | 'other';
/** US-012：开源项目状态（区别于 ProductStatus，两套枚举不混用） */
export type ProjectStatus = 'active' | 'maintained' | 'archived' | 'completed';

export interface Project {
  /** US-012a：DOM 锚点与测试选择器用的小写 kebab-case 标识 */
  slug: string;
  repo: string;
  name: string;
  description: LocaleText;
  /** US-012f：内联展开面板的完整介绍（缺省时不渲染空面板） */
  detail?: LocaleText;
  stack: string[];
  category: ProjectCategory;
  status: ProjectStatus;
  featured: boolean;
  stars?: number;
  image?: string;
  /** US-012b：私有科研仓库；不渲染 GitHub 按钮（访客点击会 404） */
  repoPrivate?: boolean;
  public: boolean;
}

export interface Product {
  /** US-013a：DOM 锚点与测试选择器用的小写 kebab-case 标识 */
  slug: string;
  name: string;
  description: LocaleText;
  /** US-013a：核心功能列表（双语），不虚构客观熟练度 */
  features: LocaleText[];
  /** US-013a：内联展开面板的完整介绍（缺省时用 description） */
  detail?: LocaleText;
  status: ProductStatus;
  featured: boolean;
  logo?: string;
  cover?: string;
  url?: string;
  repo?: string;
  public: boolean;
}

export interface WritingWork {
  /** US-014a：小写 kebab-case，DOM 锚点与详情路由 slug */
  slug: string;
  title: LocaleText;
  type: 'novel' | 'article';
  status: WritingStatus;
  description: LocaleText;
  /** US-014a：精选上首页 compact 卡 */
  featured: boolean;
  /** US-014a：创作时间，模糊字符串（如「2023—至今」/「2024」） */
  writtenAt?: string;
  /** US-014a：详情内容——世界观 / 背景设定 / 人物介绍 / 创作理念 / 补充段落 */
  worldview?: LocaleText;
  background?: LocaleText[];
  characters?: LocaleText[];
  concept?: LocaleText;
  detail?: LocaleText[];
  cover?: string;
  externalUrl?: string;
  /** US-014a：阅读入口，站内路径或 https 外链 */
  readingUrl?: string;
  public: boolean;
}

export interface ReadingBook {
  title: string;
  author: string;
  rating?: number;
  note?: LocaleText;
  public: boolean;
}

export interface Interest {
  field: string;
  description?: LocaleText;
  related?: string[];
  public: boolean;
}

/** US-007：PRD 六领域；kebab-case 同时作为 DOM 标识与分组键 */
export type SkillCategory =
  | 'computer-science'
  | 'software-engineering'
  | 'full-stack'
  | 'artificial-intelligence'
  | 'research-computing'
  | 'tools-technologies';

/** US-007：可选关联入口，指向站内已有内容（不新建技能详情路由） */
export interface SkillRelated {
  label: LocaleText;
  href: string;
}

/**
 * US-007：技能只记录客观事实。
 * 刻意不设 proficiency / level / percent 等字段——DoD 禁止熟练度百分比，
 * 类型层和构建期校验双重拒绝（FORBIDDEN_PROFICIENCY_FIELDS）。
 */
export interface Skill {
  slug: string;
  name: string;
  category: SkillCategory;
  description: LocaleText;
  detail: LocaleText;
  /** 客观技术标签（技术名词无需双语） */
  tags: string[];
  /** 缺省时技能仍正常展示（AC3） */
  related?: SkillRelated[];
  featured: boolean;
  public: boolean;
}

export type ContentCategory =
  | 'profile'
  | 'journey'
  | 'research'
  | 'publications'
  | 'projects'
  | 'products'
  | 'writing'
  | 'reading'
  | 'interests'
  | 'skills';
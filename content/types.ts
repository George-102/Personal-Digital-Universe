export type LocaleText = { zh: string; en: string };

export type PublicationStatus = 'Published' | 'Preprint' | 'In Progress';
export type ProductStatus = 'Released' | 'Beta' | 'In Development' | 'Discontinued';
export type WritingStatus = 'Writing' | 'In Progress' | 'Completed';

export interface SocialLink {
  label: string;
  url: string;
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
  date: string;
  title: LocaleText;
  summary: LocaleText;
  category: JourneyCategory;
  detail?: LocaleText;
  public: boolean;
}

export interface ResearchArea {
  slug: string;
  title: LocaleText;
  problems: LocaleText[];
  methods: string[];
  status: 'In Progress' | 'Completed';
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

export interface Project {
  repo: string;
  name: string;
  description: LocaleText;
  stack: string[];
  featured: boolean;
  stars?: number;
  image?: string;
  public: boolean;
}

export interface Product {
  name: string;
  description: LocaleText;
  status: ProductStatus;
  logo?: string;
  cover?: string;
  url?: string;
  repo?: string;
  public: boolean;
}

export interface WritingWork {
  slug: string;
  title: LocaleText;
  type: 'novel' | 'article';
  status: WritingStatus;
  description: LocaleText;
  cover?: string;
  externalUrl?: string;
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

export type ContentCategory =
  | 'profile'
  | 'journey'
  | 'research'
  | 'publications'
  | 'projects'
  | 'products'
  | 'writing'
  | 'reading'
  | 'interests';
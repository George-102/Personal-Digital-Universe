import type { MetadataRoute } from 'next';
import { research } from '@/content/index';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, lastModified: new Date() },
    { url: `${SITE_URL}/en/`, lastModified: new Date() },
    { url: `${SITE_URL}/research/`, lastModified: new Date() },
    { url: `${SITE_URL}/en/research/`, lastModified: new Date() },
    // US-012e：开源项目列表页双语收录
    { url: `${SITE_URL}/projects/`, lastModified: new Date() },
    { url: `${SITE_URL}/en/projects/`, lastModified: new Date() },
    // US-010e：研究详情页双语收录
    ...research.map((item) => ({
      url: `${SITE_URL}/research/${item.slug}/`,
      lastModified: new Date(),
    })),
    ...research.map((item) => ({
      url: `${SITE_URL}/en/research/${item.slug}/`,
      lastModified: new Date(),
    })),
    { url: `${SITE_URL}/contact/`, lastModified: new Date() },
    { url: `${SITE_URL}/en/contact/`, lastModified: new Date() },
  ];
}
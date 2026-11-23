import type { MetadataRoute } from 'next';
import { research, writing } from '@/content/index';
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
    // US-013d：独立软件产品列表页双语收录
    { url: `${SITE_URL}/products/`, lastModified: new Date() },
    { url: `${SITE_URL}/en/products/`, lastModified: new Date() },
    // US-014d：文学作品列表页双语收录
    { url: `${SITE_URL}/writing/`, lastModified: new Date() },
    { url: `${SITE_URL}/en/writing/`, lastModified: new Date() },
    // US-010e：研究详情页双语收录
    ...research.map((item) => ({
      url: `${SITE_URL}/research/${item.slug}/`,
      lastModified: new Date(),
    })),
    ...research.map((item) => ({
      url: `${SITE_URL}/en/research/${item.slug}/`,
      lastModified: new Date(),
    })),
    // US-014e：作品详情页双语收录
    ...writing.map((item) => ({
      url: `${SITE_URL}/writing/${item.slug}/`,
      lastModified: new Date(),
    })),
    ...writing.map((item) => ({
      url: `${SITE_URL}/en/writing/${item.slug}/`,
      lastModified: new Date(),
    })),
    { url: `${SITE_URL}/contact/`, lastModified: new Date() },
    { url: `${SITE_URL}/en/contact/`, lastModified: new Date() },
  ];
}
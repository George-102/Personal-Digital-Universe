import { filterPublic } from './validate.ts';
import { sortJourney } from '../lib/journey.ts';
import { profile as rawProfile } from './profile.ts';
import { journey as rawJourney } from './journey.ts';
import { research as rawResearch } from './research.ts';
import { publications as rawPublications } from './publications.ts';
import { projects as rawProjects } from './projects.ts';
import { products as rawProducts } from './products.ts';
import { writing as rawWriting } from './writing.ts';
import { reading as rawReading } from './reading.ts';
import { interests as rawInterests } from './interests.ts';
import { skills as rawSkills } from './skills.ts';
import { githubCache, mergeGithubCache } from '../lib/github-cache.ts';

export function publicOnly<T extends { public: boolean }>(_category: string, items: T[]): T[] {
  return filterPublic(items);
}

export const profile = rawProfile;
/** US-006：About 内容走统一出口，页面不直接 import content/profile.ts */
export const about = rawProfile.about ?? null;
/** US-018：联系方式走统一出口；links 为空时页面不渲染任何无效入口 */
export const contact = rawProfile.contact ?? null;
/** US-008：时间线统一在出口排序（最新在前），UI 不再各自排序 */
export const journey = sortJourney(filterPublic(rawJourney));
export const research = filterPublic(rawResearch);
export const publications = filterPublic(rawPublications);
/** US-012c：公开项目走统一出口；动态字段（stars/language/archived）由构建期 github-cache.json 覆盖 */
export const projects = mergeGithubCache(filterPublic(rawProjects), githubCache);
export const products = filterPublic(rawProducts);
export const writing = filterPublic(rawWriting);
export const reading = filterPublic(rawReading);
export const interests = filterPublic(rawInterests);
/** US-007：技能统一出口（已过滤 public），页面不直接 import content/skills.ts */
export const skills = filterPublic(rawSkills);
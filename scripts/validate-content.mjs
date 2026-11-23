import { validateEntry } from '../content/validate.ts';
import { profile } from '../content/profile.ts';
import { journey } from '../content/journey.ts';
import { research } from '../content/research.ts';
import { publications } from '../content/publications.ts';
import { projects } from '../content/projects.ts';
import { products } from '../content/products.ts';
import { writing } from '../content/writing.ts';
import { reading } from '../content/reading.ts';
import { interests } from '../content/interests.ts';
import { heroInteractiveObjects, validateInteractiveObjects } from '../lib/interactive.ts';
import { transitionSegments, validateTransitionSegments } from '../lib/transitions.ts';
import { navItems, validateNavItems } from '../lib/nav.ts';
import { validateJourneyEntries } from '../lib/journey.ts';
import { validateContact } from '../lib/contact.ts';
import { validateResearchList } from '../lib/research.ts';
import { validateProjectList } from '../lib/projects.ts';
import { validateProductList } from '../lib/products.ts';
import { validateWritingList } from '../lib/writing.ts';

const journeyErrors = validateJourneyEntries(journey);
if (journeyErrors.length > 0) {
  console.error(`journey 配置校验失败：\n${journeyErrors.join('\n')}`);
  process.exit(1);
}

const interactiveErrors = validateInteractiveObjects(heroInteractiveObjects);
if (interactiveErrors.length > 0) {
  console.error(`interactive 配置校验失败：\n${interactiveErrors.join('\n')}`);
  process.exit(1);
}

const transitionErrors = validateTransitionSegments(transitionSegments);
if (transitionErrors.length > 0) {
  console.error(`transitions 配置校验失败：\n${transitionErrors.join('\n')}`);
  process.exit(1);
}

const navErrors = validateNavItems(navItems);
if (navErrors.length > 0) {
  console.error(`nav 配置校验失败：\n${navErrors.join('\n')}`);
  process.exit(1);
}

// US-018a：联系方式整表校验（空 links 合法；非法 URL / 单语标签 / 重复 id 在构建期拒绝）
const contactErrors = validateContact(profile.contact ?? {});
if (contactErrors.length > 0) {
  console.error(`contact 配置校验失败：\n${contactErrors.join('\n')}`);
  process.exit(1);
}


// US-010a：研究方向整表校验（slug 唯一、至少一条 public、非法链接构建期拒绝）
const researchErrors = validateResearchList(research);
if (researchErrors.length > 0) {
  console.error(`research 配置校验失败：\n${researchErrors.join('\n')}`);
  process.exit(1);
}

// US-012a：开源项目整表校验（slug/repo 唯一、至少一条 public、featured 必须 public）
const projectErrors = validateProjectList(projects);
if (projectErrors.length > 0) {
  console.error(`projects 配置校验失败：\n${projectErrors.join('\n')}`);
  process.exit(1);
}

// US-013a：独立产品整表校验（slug 唯一、四态枚举、至少一条 public、featured 必 public、链接白名单）
const productErrors = validateProductList(products);
if (productErrors.length > 0) {
  console.error(`products 配置校验失败：\n${productErrors.join('\n')}`);
  process.exit(1);
}

// US-014a：文学作品整表校验（slug 唯一、三态枚举、至少一条 public、featured 必 public、链接白名单）
const writingErrors = validateWritingList(writing);
if (writingErrors.length > 0) {
  console.error(`writing 配置校验失败：\n${writingErrors.join('\n')}`);
  process.exit(1);
}

const data = {
  journey,
  research,
  publications,
  projects,
  products,
  writing,
  reading,
  interests,
};

validateEntry('profile', profile);
let count = 1;
for (const [category, items] of Object.entries(data)) {
  for (const item of items) {
    validateEntry(category, item);
    count += 1;
  }
}
console.log(`content 校验通过（${count} 条数据）`);
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

const interactiveErrors = validateInteractiveObjects(heroInteractiveObjects);
if (interactiveErrors.length > 0) {
  console.error(`interactive 配置校验失败：\n${interactiveErrors.join('\n')}`);
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
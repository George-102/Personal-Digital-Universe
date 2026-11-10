import { filterPublic } from './validate.ts';
import { profile as rawProfile } from './profile.ts';
import { journey as rawJourney } from './journey.ts';
import { research as rawResearch } from './research.ts';
import { publications as rawPublications } from './publications.ts';
import { projects as rawProjects } from './projects.ts';
import { products as rawProducts } from './products.ts';
import { writing as rawWriting } from './writing.ts';
import { reading as rawReading } from './reading.ts';
import { interests as rawInterests } from './interests.ts';

export function publicOnly<T extends { public: boolean }>(_category: string, items: T[]): T[] {
  return filterPublic(items);
}

export const profile = rawProfile;
export const journey = filterPublic(rawJourney);
export const research = filterPublic(rawResearch);
export const publications = filterPublic(rawPublications);
export const projects = filterPublic(rawProjects);
export const products = filterPublic(rawProducts);
export const writing = filterPublic(rawWriting);
export const reading = filterPublic(rawReading);
export const interests = filterPublic(rawInterests);
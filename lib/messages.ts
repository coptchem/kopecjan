/** Shapes of the array-valued entries in messages/*.json, used with t.raw(). */

export type Step = { title: string; desc: string };

export type ProjectItem = {
  name: string;
  badge: string;
  desc: string;
  tags: string[];
  linkLabel: string;
  href: string;
};

export type SkillGroup = { name: string; tags: string[] };

export type Job = { title: string; org: string; period: string; bullets: string[] };

export type Education = { degree: string; school: string };

/** Shapes of the array-valued entries in messages/*.json, used with t.raw(). */

export type Step = { title: string; desc: string };

export type ProjectItem = {
  name: string;
  badge: string;
  desc: string;
  tags: string[];
  /** Optional: a project without a public URL shows no link. */
  linkLabel?: string;
  href?: string;
  /** Optional public source code, shown as a GitHub link next to the main link. */
  repo?: string;
};

export type SkillGroup = { name: string; tags: string[] };

export type ExternalLink = { label: string; href: string };

export type Job = {
  title: string;
  org: string;
  period: string;
  bullets: string[];
  /** Optional link shown next to the organisation, e.g. Jan's company site. */
  link?: ExternalLink;
};

export type Education = { degree: string; school: string };

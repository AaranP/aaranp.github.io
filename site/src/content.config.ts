// Content collections mirroring ../../schema.md (SITE_SPEC.md §3) so builds
// fail on malformed frontmatter. The data lives at the repo root, outside
// this Astro project — glob/file loader `base` paths reach up one level.
//
// Hard rule (SITE_SPEC.md §3): every page query must filter
// `data.visibility === 'public'`. Private entries are still validated here
// but must never reach built output.
import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { parse } from 'yaml';

/** SCHEMA.md convention 5: dates are YYYY-MM. */
const yyyymm = z.string().regex(/^\d{4}-\d{2}$/, 'expected YYYY-MM');

const outcome = z.object({
  text: z.string(),
  evidence: z.string().optional().default(''),
});

const mediaItem = z.object({
  file: z.string(),
  caption: z.string().optional().default(''),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../projects' }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['course', 'capstone', 'personal', 'work', 'hackathon']),
    course: z.string().optional(),
    client: z.string().optional(),
    start: yyyymm,
    end: yyyymm.or(z.literal('present')),
    status: z.enum(['completed', 'ongoing', 'archived']),
    team_size: z.number().int().min(1),
    my_role: z.string(),
    domains: z.array(z.string()),
    tech: z.array(z.string()),
    repo: z.string(),
    demo: z.string().optional().default(''),
    summary: z.string(),
    problem: z.string(),
    outcomes: z.array(outcome),
    media: z.array(mediaItem).optional().default([]),
    related_experience: z.array(z.string()).default([]),
    resume_bullets: z.array(z.string()),
    featured: z.boolean().default(false),
    visibility: z.enum(['public', 'private']),
  }),
});

const experience = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../experience' }),
  schema: z.object({
    id: z.string(),
    company: z.string(),
    title: z.string(),
    employment_type: z.enum(['coop', 'contract', 'full-time', 'part-time', 'volunteer']),
    location: z.string(),
    // SCHEMA.md shows a boolean; the data also uses 'hybrid', which is real
    // information worth keeping — allowed here rather than flattened to a bool.
    remote: z.boolean().or(z.literal('hybrid')),
    // '' = TODO-skeleton entry whose dates the user hasn't supplied yet
    // (teaching-parttime, ubc-ta-elec391). Tighten to plain yyyymm once filled.
    // Rendering code must treat '' as "date unknown".
    start: yyyymm.or(z.literal('')),
    end: yyyymm.or(z.enum(['present', ''])),
    domains: z.array(z.string()),
    tech: z.array(z.string()),
    summary: z.string(),
    responsibilities: z.array(z.string()),
    achievements: z.array(outcome),
    related_projects: z.array(z.string()).default([]),
    resume_bullets: z.array(z.string()),
    references: z.object({ manager: z.string().default('') }).optional(),
    links: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    visibility: z.enum(['public', 'private']),
  }),
});

// profile/ holds two differently-shaped markdown files (about, education);
// the union keeps each one strictly validated.
const aboutSchema = z.object({
  name: z.string(),
  headline: z.string(),
  intro: z.string(),
  location: z.string(),
  citizenship: z.string().optional(),
  links: z.object({
    github: z.string().url(),
    linkedin: z.string().url(),
    email: z.string().email(),
  }),
});

const educationSchema = z.object({
  school: z.string(),
  degree: z.string(),
  location: z.string(),
  start: yyyymm,
  end: yyyymm,
  status: z.string(),
  eit: z.object({ issuer: z.string(), date: z.coerce.number() }),
  coursework_dv: z.array(z.string()),
  coursework_eit: z.array(z.string()),
});

const profile = defineCollection({
  loader: glob({ pattern: '*.md', base: '../profile' }),
  schema: z.union([aboutSchema, educationSchema]),
});

// skills.yaml is one document, loaded as a single entry with id 'skills' —
// the canonical tag list the Skills section (SITE_SPEC.md §5.5) renders from.
const skills = defineCollection({
  loader: file('../profile/skills.yaml', {
    parser: (text) => [{ id: 'skills', ...parse(text) }],
  }),
  schema: z.object({
    languages: z.array(z.string()),
    verification: z.array(z.string()),
    hardware: z.array(z.string()),
    embedded: z.array(z.string()),
    ml: z.array(z.string()),
    tools: z.array(z.string()),
    domains: z.array(z.string()),
    certifications: z.array(
      z.object({
        name: z.string(),
        issuer: z.string(),
        date: z.coerce.number(),
      }),
    ),
  }),
});

export const collections = { projects, experience, profile, skills };

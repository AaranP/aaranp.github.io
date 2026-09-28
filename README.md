# Portfolio Data

Live site: https://aaranp.github.io/

Single source of truth for all of Aaran Poon's experience, projects, and
skills. The portfolio website (and resume tailoring) are generated **from**
this data — never edit the website directly without updating this first.
Full schema and conventions: [SCHEMA.md](schema.md).

## Layout

```
profile/        about.md, education.md, skills.yaml (canonical tag list)
experience/     one Markdown+YAML file per role, slug = id
projects/       one Markdown+YAML file per project, slug = id
assets/         media per entry: assets/{projects,experience}/<slug>/
Information/    grounding sources: experience_bank.md (the ONLY source for
                resume claims) and resume.tx (current master resume)
```

## Adding or editing an entry

1. Ground the fact first. Anything resume-bound must trace to
   `Information/experience_bank.md` — update the bank before (or with) the
   entry. Never invent tools, metrics, or employers (bank guardrails,
   including the NEVER-claim list).
2. Copy the relevant template from [SCHEMA.md](schema.md). Filename slug is
   permanent kebab-case and doubles as the `id`.
3. Use canonical skill names from `profile/skills.yaml` in `tech:` fields.
4. Every achievement/outcome gets an `evidence:` note saying where the
   claim comes from.
5. Dates are `YYYY-MM`. Media files go in `assets/<kind>/<slug>/` and are
   referenced by filename in the entry's `media:` list.
6. `visibility: private` excludes an entry from the site build but keeps it
   for resume tailoring. No PII beyond what already appears on the resume.

## Status

Entries generated 2026-06 from the public GitHub repos + resume; remaining
gaps are marked inline with `TODO`. Find them all with:

```sh
grep -rn TODO projects/ experience/ profile/
```

## Web analytics

The Astro site uses Cloudflare Web Analytics on production builds when a site
token is configured. Add `aaranp.github.io` in Cloudflare Web Analytics, then
set the repository Actions variable `CLOUDFLARE_WEB_ANALYTICS_TOKEN` to the
token from its JavaScript snippet. The GitHub Pages workflow passes it to the
build; local development does not send analytics.

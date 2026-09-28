# Portfolio warm redesign implementation plan

> For agentic workers: use subagent-driven development. User requested GPT-6 Sol with low reasoning for implementation and explicitly requested starting after the plan.

**Goal:** Preserve this personal electrical engineering portfolio's substantive content while implementing the supplied warm editorial mockup and a single interactive glass pane.

**Architecture:** Retain Astro, content collections, public-content queries, base-aware routes and existing project details. Restyle existing components and isolate Three.js in a lazy-loaded hero enhancement. Existing content remains authoritative; the screenshot supplies visual direction only.

**Tech stack:** Astro, TypeScript, CSS, Three.js, existing npm lockfile.

**Spec:** User's detailed redesign brief and mockup in this session; supersedes site_spec.md on typography, light appearance, section order and permitted animation. Preserve that document's content/privacy/accessibility constraints.

## Global constraints
- Native system font stack; warm cream, near-black headings, readable gray copy, restrained monochrome controls.
- Hero: actual portrait, name, role/headline, grounded short bio, social/contact controls, one glass rectangle.
- Experience retains all public roles and meaningful bullets; no invented dates, UVM claims or company imagery.
- Project descriptions, technologies and all public detail routes remain accessible. Two-column desktop, single-column mobile cards. Use actual media and honest graphical fallbacks.
- Retain full skills and existing About content. No fabricated personal details.
- No published resume PDF currently exists; label a contact action Request resume rather than linking to a missing file.
- No deployment, push or external communications. Work on codex/portfolio-warm-redesign.

## Review focus
- Mobile at 390px and 768px: no overflow, readable copy and usable navigation/filter targets.
- Reduced motion, no JavaScript or unavailable WebGL: content visible, static pane fallback, no autoplay motion when reduced motion requested.
- Filter/hash state and project links: existing URLs continue working, empty/invalid hashes safe, all projects reachable.
- Offscreen/hidden tab and dragging: pause rendering, resume without jumps, pointer capture released, keyboard alternative supplied.
- Asset accuracy and privacy: no synthetic photos masquerading as actual work, no TODO/private content rendered, no broken resume download.

## Task 1: Complete cohesive redesign
Files: site/src/styles/global.css; site/src/layouts/Base.astro; site/src/pages/index.astro; existing components Hero, Nav, Timeline, ProjectCard, ProjectsSection, Skills, Footer; new GlassPane.astro and isolated glass renderer module; package.json/package-lock.json; minimal profile schema/data additions if needed for grounded hero copy.

- [ ] Baseline: npm run build (already passed, 18 routes plus privacy check).
- [ ] Apply shared visual tokens, typography, responsive containers, button/tag/card primitives, focus states and progressive scroll reveals. Remove font imports and theme toggle conflicting with the warm light brief.
- [ ] Restructure landing page: hero, editorial experience, featured projects/full project collection with filters, skills, About, contact. Keep existing content and detail pages working.
- [ ] Hero uses actual portrait and source-grounded bio; implement consistent social controls and truthful resume request action.
- [ ] Timeline uses date rail and company/role hierarchy, retaining bullets and technologies. Scope list CSS to avoid nested-list timeline styling.
- [ ] Cards use authentic images, readable summaries, technology tags and whole-card links; provide understated non-photographic fallback for missing media.
- [ ] Implement a thin beveled pane with MeshPhysicalMaterial transmission, thickness, environment reflections and subtle spectral highlights. Use a procedural/local environment rather than external runtime assets. Slowly rotate all three axes, support drag and keyboard rotation, and pause/resume. Lazy-load renderer; cap pixel ratio; handle resize, visibility, reduced-motion changes and WebGL failures. Keep a static CSS fallback until rendering succeeds.
- [ ] Run npm run build, privacy check and git diff --check. Report exact results and limitations.

## Task 2: Review and browser verification
- [ ] Independent code review against brief and review focus; return concrete defects only.
- [ ] Serve local preview, inspect desktop and mobile screenshots, check project filtering and a detail page.
- [ ] Check reduced motion, fallback, pane rendering/dragging, console errors and horizontal overflow.
- [ ] Send defects to original implementation agent; rebuild and recheck affected behavior.
- [ ] Deliver local preview URL, plan link, completed changes and honest verification limitations. Do not claim real-device or Lighthouse results without running them.

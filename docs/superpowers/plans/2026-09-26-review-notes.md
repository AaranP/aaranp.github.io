# Redesign review notes

The user explicitly requested implementation after receiving the plan, using Sol low. Work is on a local feature branch in the existing checkout. No deployment or push is authorized.

Baseline: Astro build produced 18 routes and passed the privacy check.

Initial review requested corrections to preserve the supplied circular portrait/full-name composition, keep personal copy in canonical data, bevel the glass, add spectral highlights and a pause control, improve fallback semantics and context-loss handling, fix pointer ownership, preserve URL query parameters during filtering, make contact usable without JavaScript, retain 44px mobile targets, add progressive scroll reveals, and format source for maintainability.

User explicitly chose to continue without browser verification after host permissions blocked both browser-harness and computer-use. Do not claim screenshots, visual responsiveness, interactive runtime checks, real-device testing or Lighthouse scores. Initial localhost HTTP audit checked 22 local links (all returned 200), 10 images (all had alt attributes), no duplicate IDs, and no TODO marker in the home HTML.

Decision: preserve actual public project assets and use abstract graphics where imagery is absent; no invented project photography. Cost: some cards are less visually specific until the user supplies additional media.

Decision: use a labeled resume-request contact link because the repository has no published PDF. Cost: resume access requires an email request until a PDF is provided.

Final review: initial findings resolved. A follow-up found stale readiness after WebGL failure; implementation now resets readiness, releases pointer capture and blocks keyboard interaction after fallback. Root inspected the final fix. Final production build passed with 18 routes and privacy guard; TypeScript and diff checks passed. HTTP audit passed 22 local links, four direct mailto actions, image alt presence and unique IDs. Visual/browser checks remain explicitly skipped. Three.js is lazy-loaded and approximately 553 KB minified / 140 KB gzip; Vite emits a bundle-size warning.

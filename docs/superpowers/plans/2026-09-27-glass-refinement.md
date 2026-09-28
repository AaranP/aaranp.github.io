# Glass appearance and inertia refinement

The user reported that the pane looked opaque/plastic-like and requested inertia proportional to drag speed. Preserve the existing single-pane design and rest of the portfolio.

Source investigation found a uniform transmission background with no refraction cues, broad reflections, a clearcoat/iridescent film, mismatched background/transmission tone mapping, and double-sided transmission on closed geometry. The appearance correction uses consistent untone-mapped sRGB output, a neutral PMREM studio with narrow reflection sources, an opaque cream backdrop with restrained tonal variation, thin beveled geometry with matching optical thickness, clearcoat/iridescence disabled, and front-side rendering. The CSS fallback is also lighter. These are source-grounded corrections; appearance still requires visual verification.

Interaction requirements:
- Dragging directly rotates the pane; recent angular velocity determines released momentum.
- Faster flicks yield faster and longer coast, with bounded maximum speed.
- Exponential damping is elapsed-time based, not frame-count based.
- A new grab, pause, reduced-motion preference, cancellation or renderer failure clears momentum.
- A hold before release must not launch stale momentum.
- Hidden/offscreen time must not cause a large rotation jump on return.
- Pause/reduced motion permit deliberate drag/key changes but no autonomous spin.
- Retain subtle idle rotation after a throw settles.

Verification: pure motion tests, TypeScript check, Astro production build/privacy check and diff check. Internal-browser connection was retried and remains unavailable. Do not claim visual/interaction browser verification.

## Screenshot-driven correction

The user's screenshot shows the enhancement running, but the result is a pale landscape card with a broad grey stripe, barely perceptible rim and visually dominant pause pill. Revise the scene rather than treating successful compilation as evidence of appearance: remove the stripe, use portrait proportions and an upright oblique starting pose, give cap and bevel surfaces appropriate separate optical treatments, position studio sources to catch the initial surface normal, and retain clear center/visible polished perimeter. Replace the large text pill with a discreet accessible 44px icon control and remove the editorial caption. Preserve the tested inertia, fallbacks and motion preferences. Browser rendering remains unavailable; the next visual acceptance must be based on the user's refreshed view.

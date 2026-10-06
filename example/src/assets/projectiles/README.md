# Projectile materials

These six SVGs are original vector artwork authored for this demo. They use hand-drawn paths, facets, and self-contained color/opacity gradients; no copied assets, external images, fonts, dependencies, or SVG filters are used. The background is transparent.

| File | Dimensions | Role |
| --- | --- | --- |
| `bolt-head.svg` | 128 × 64 | Pointed cyan bolt with a tight white center and gradient halo |
| `fire-core.svg` | 96 × 64 | White-hot teardrop with a yellow edge; bright mass centered at (48, 32) |
| `fire-shell.svg` | 128 × 96 | Orange/red envelope centered at (64, 48), with uneven rear flame tongues |
| `meteor-rock.svg` | 96 × 96 | Solid faceted rock centered at (48, 48), with cracks, craters, and a narrow warm right rim |
| `energy-ribbon.svg` | 128 × 64 | Cyan outer ribbon and narrow neutral white inner lines |
| `flame-ribbon.svg` | 128 × 64 | Orange wisps around a yellow hot ribbon |

Heads face local +X (right). Flame tongues extend toward -X (left). Ribbon x=0 / u=0 is the oldest tail; x=128 / u=1 is the newest connection to the head. Both ribbons taper their silhouette and opacity toward x=0, with a broad, bright open connection at x=128. This taper is baked into the artwork because the trail mesh keeps a constant geometry width. No circular endpoint is painted into either ribbon.

These are static-art approximations. Layered transparent gradients suggest a soft halo and feathered heat; the SVGs do not implement bloom, animated noise, scrolling flame shaders, or dynamic flame deformation. The bolt and fire core retain neutral white highlights for use with white model tint.

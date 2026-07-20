# Aniket Dev Roy — Portfolio

A single-page, dark-only portfolio (HTML / CSS / vanilla JS). Only external dependency is MapLibre GL (CDN) with the CARTO dark-matter style for the hero map.

## Structure
```
index.html    — page structure, intro, about
style.css     — design system, cursor, glow, animations
script.js     — cross-field background, map, clock, projects, embeds
assets/       — resume.pdf, portrait.jpg, figures, poster/paper PDFs
```

## Editing content
- **Featured projects** — the `PROJECTS` array in `script.js`. Each has Problem / Methods / Results, 2–4 `findings`, `tools`, links, and either an `image` (hero figure) or an animated `visual` placeholder. When the food desert and training figures are ready, drop the files in `assets/` and fill in that project's `image` field (src, alt, caption); the placeholder animation is replaced automatically.
- **StoryMap embeds** — the `EMBEDS` array in `script.js`. To make an embed open at a specific section (e.g. "Areas Considered"), get the section link from the StoryMaps builder (hover the heading block, copy its link — it ends in `#ref-n-XXXXXX`) and paste the full URL into `embedUrl`, keeping `?cover=false` before the `#`.

## Deploy on GitHub Pages
Push these files to the **root** of the `adevroy569.github.io` repo, `main` branch.

## Notes
- Map tiles: Imagery © Esri, Maxar, Earthstar Geographics — keep the attribution in the map corner.
- `?cover=false` on the StoryMap URLs skips the cover page so embeds land on content.

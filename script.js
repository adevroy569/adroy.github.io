/* =========================================================
   Aniket Dev Roy — Portfolio
   World-tree (Yggdrasil) layout: scroll-grown SVG trunk,
   realm nodes, particle field, survey map
   ========================================================= */

"use strict";

/* ---------- Helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------- Animated placeholder visuals ----------
   Used until a hero figure exists for a project; swap by
   filling that project's `image` field below. */
const VISUALS = {
  /* Live scrolling seismograph: P coda then S-wave burst, looping */
  seis: `
    <svg viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden="true">
      <g class="seis-feed">
        <path class="seis-trace" d="M0,45 H40 l3,-5 4,8 3,-5 3,2 H90 l3,-6 3,9 3,-3 H140 l3,-16 4,26 4,-30 4,32 4,-28 4,22 4,-16 4,12 4,-8 5,6 6,-4 8,4 H250 l3,-8 4,12 4,-9 5,5 H305 l3,-4 3,6 3,-4 3,2 H400" />
        <path class="seis-trace" transform="translate(400,0)" d="M0,45 H40 l3,-5 4,8 3,-5 3,2 H90 l3,-6 3,9 3,-3 H140 l3,-16 4,26 4,-30 4,32 4,-28 4,22 4,-16 4,12 4,-8 5,6 6,-4 8,4 H250 l3,-8 4,12 4,-9 5,5 H305 l3,-4 3,6 3,-4 3,2 H400" />
      </g>
    </svg>`,

  /* Cyclone spinning while tracking across the basin, recurving poleward */
  cyclone: `
    <svg viewBox="0 0 400 110" aria-hidden="true">
      <path id="tcTrackPath" class="tc-track" d="M18,96 C100,88 180,72 250,50 C300,34 350,24 384,15" />
      <g class="tc-system">
        <g class="tc-spin">
          <circle class="tc-eye" r="4" />
          <path class="tc-arm" d="M3,-14 C13,-11 15,-1 9,7" />
          <path class="tc-arm" d="M-3,14 C-13,11 -15,1 -9,-7" />
          <path class="tc-arm" d="M-14,-3 C-11,-13 -1,-15 7,-9" />
        </g>
        <animateMotion dur="9s" repeatCount="indefinite" calcMode="linear">
          <mpath href="#tcTrackPath" />
        </animateMotion>
      </g>
      <text class="viz-label" x="18" y="108">genesis</text>
      <text class="viz-label viz-label-end" x="384" y="12">recurvature →</text>
    </svg>`,

  /* Euclidean distance: household A to grocery store B */
  euclid: `
    <svg viewBox="0 0 400 110" aria-hidden="true">
      <text class="viz-label" x="200" y="30" text-anchor="middle">euclidean distance</text>
      <g class="eu-house">
        <path d="M28,68 v-16 l15,-13 15,13 v16 z" />
        <rect x="38" y="58" width="9" height="10" />
      </g>
      <g class="eu-cart">
        <path d="M338,46 h7 l5,16 h19 l6,-12 h-27" />
        <circle cx="353" cy="69" r="2.6" />
        <circle cx="366" cy="69" r="2.6" />
      </g>
      <line class="eu-line" x1="68" y1="58" x2="328" y2="58" />
      <circle class="eu-dot" cy="58" r="3.5">
        <animate attributeName="cx" values="68;328" dur="2.6s" repeatCount="indefinite" />
      </circle>
      <text class="viz-label" x="43" y="86" text-anchor="middle">A</text>
      <text class="viz-label" x="356" y="86" text-anchor="middle">B</text>
    </svg>`,

  /* Six training modules lighting up in sequence */
  modules: `
    <div class="mod-grid" aria-hidden="true">
      <span class="mod-tile" style="--i:0">Collect</span><span class="mod-tile" style="--i:1">Manage</span><span class="mod-tile" style="--i:2">Curate</span>
      <span class="mod-tile" style="--i:3">Analyze</span><span class="mod-tile" style="--i:4">Visualize</span><span class="mod-tile" style="--i:5">Case study</span>
    </div>`,

  /* Correlation meters from the three study counties */
  corr: `
    <div class="visual-corr" aria-hidden="true">
      <div class="corr-row"><span class="corr-name mono">Los Angeles</span><div class="corr-bar"><i style="--v:0.67; --cd:0s"></i></div><span class="corr-val mono">r&nbsp;=&nbsp;0.67</span></div>
      <div class="corr-row"><span class="corr-name mono">Marion, IN</span><div class="corr-bar"><i style="--v:0.36; --cd:0.15s"></i></div><span class="corr-val mono">r&nbsp;=&nbsp;0.36</span></div>
      <div class="corr-row"><span class="corr-name mono">Miami-Dade</span><div class="corr-bar"><i style="--v:0.02; --cd:0.3s"></i></div><span class="corr-val mono">r&nbsp;≈&nbsp;0</span></div>
    </div>`,

  /* Drifting air-flow streamlines */
  air: `
    <svg viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden="true">
      <path class="air-line" style="--dur:5s" d="M-10,20 Q 50,10 110,20 T 230,20 T 350,20 T 470,20" />
      <path class="air-line" style="--dur:7s" d="M-10,45 Q 50,35 110,45 T 230,45 T 350,45 T 470,45" />
      <path class="air-line" style="--dur:6s" d="M-10,70 Q 50,60 110,70 T 230,70 T 350,70 T 470,70" />
    </svg>`,
};

/* ---------- Featured projects ----------
   `image` (src / alt / caption) renders a hero figure;
   leave it null to fall back to the animated `visual`. */
const PROJECTS = {
  food: {
    title: "Food Desert Analysis",
    categoryLabel: "GIS & Analysis",
    year: "2025",
    image: {
      src: "assets/food-figure.jpg",
      alt: "Maps of distance to the nearest supermarket for Indiana and Florida, with store locations from 2019",
      caption: "Distance to nearest supermarket: Indiana and Florida validation runs (stores: 2019)",
    },
    anim: "euclid",
    visual: "",
    problem:
      "USDA's Food Access Research Atlas, the authoritative food-desert dataset, is frozen at 2019 and built on proprietary store directories researchers can't re-run.",
    methods:
      "Reproduces the USDA LILA methodology entirely from open sources: Census API demographics, TIGER boundaries, and OpenStreetMap supermarkets time-pinned to 2019, allocated to the same half-km grid USDA uses.",
    results:
      "Validated tract-by-tract against the official 2019 Atlas for Indiana and Florida: on average ~93% agreement on low-income, 75% on low-access, and 86% on LILA designations.",
    findings: [
      "Fully parameterized: change two variables and the identical analysis runs for any of the 50 states, every input fetched live",
      "Open data nearly matches the proprietary product, with built-in validation quantifying the gap tract by tract",
      "Time-pinned store snapshots compute years USDA never published, turning a static atlas into a change-over-time instrument",
    ],
    tools: ["Python", "GeoPandas", "ArcGIS Pro", "Census API", "OpenStreetMap"],
    links: [
      { label: "Case study ↗", url: "https://spatialturn.github.io/CaseStudyFoodDesert/introduction.html" },
    ],
  },
  seismic: {
    title: "Shallow Seismic Velocity & Hazard Potential",
    categoryLabel: "Research",
    year: "2023–24",
    image: {
      src: "assets/seismic-figure.jpg",
      alt: "Map of grid-search shear-wave velocities at 60 seismic stations across Northern California",
      caption: "Grid-search shear-wave velocities, 60 stations across Northern California",
    },
    anim: "seis",
    visual: "",
    problem:
      "Where will the ground shake hardest? Soft shallow sediments amplify earthquake damage.",
    methods:
      "Benchmarked PCA against a custom grid-search on earthquake particle motion: 500+ synthetic datasets, then broadband records from 60 Northern California stations.",
    results:
      "Shear-wave velocity maps flagging high ground-shaking risk zones.",
    findings: [
      "Velocities as low as 1.8 km/s mark high-shaking soft-sediment zones",
      "Grid-search resolves PCA's covariance bias at inconsistent wavelet arrivals",
      "Grid-search returns systematically lower velocities than PCA",
      "Presented at AGU Fall Meeting 2024",
    ],
    tools: ["MATLAB", "Linux / Bash", "PCA", "Seismology"],
    links: [
      { label: "AGU abstract ↗", url: "https://ui.adsabs.harvard.edu/abs/2024AGUFMT53A...32K/abstract" },
      { label: "Poster (PDF)", url: "assets/seismic-poster.pdf" },
    ],
  },
  tc: {
    title: "Global Tropical Cyclone Intensity Trends",
    categoryLabel: "Research",
    year: "2025",
    image: {
      src: "assets/tc-figure.jpg",
      alt: "Global maps comparing HURSAT and IBTrACS tropical cyclone wind-intensity trends, 1980 to 2016",
      caption: "HURSAT vs. IBTrACS wind-intensity trends (Theil–Sen), 1980–2016",
    },
    anim: "cyclone",
    visual: "",
    problem:
      "Are tropical cyclones actually getting stronger, or only some of them?",
    methods:
      "45 years of IBTrACS and HURSAT records gridded at 4°×4°; Theil–Sen trends with bootstrap confidence intervals across storm-strength thresholds and time periods.",
    results:
      "Intensification isolated to the strongest storms, not the full population.",
    findings: [
      "Major hurricanes (≥64 kt) show the clearest intensification, led by the North Atlantic",
      "The signal largely disappears when weaker systems (≥34 kt) are included",
      "Trends emerge strongest after 2000, tracking rapid ocean warming",
      "Homogenized HURSAT mutes trends relative to best-track IBTrACS",
    ],
    tools: ["Python", "xarray", "SciPy", "Cartopy", "NetCDF"],
    links: [{ label: "Paper (PDF)", url: "assets/tc-intensity-paper.pdf" }],
  },
  training: {
    title: "GIS Training & NSF Workshop",
    categoryLabel: "Teaching",
    year: "2025–26",
    image: {
      src: "assets/nsf-figure.jpg",
      alt: "NDWI flood classification map of Sindh Province, Pakistan, from the 2022 flood, taught in the remote-sensing module",
      caption: "NDWI flood analysis, Sindh Province 2022, from the remote-sensing module",
    },
    anim: "modules",
    visual: "",
    problem:
      "Geospatial skills are a bottleneck for researchers whose work needs them.",
    methods:
      "Authored six open Carpentries-based modules covering the geospatial data lifecycle; taught hands-on QGIS, remote sensing, and Python at the two-day Purdue–NSF workshop.",
    results:
      "An open curriculum in active statewide use.",
    findings: [
      "6 open-source modules published via GitHub Pages",
      "Used by 100+ researchers statewide",
      "40+ GIS professionals trained at the workshop",
    ],
    tools: ["QGIS", "Python", "Remote Sensing", "Carpentries", "GitHub Pages"],
    links: [
      { label: "Training site ↗", url: "https://spatialturn.github.io" },
      { label: "Workshop ↗", url: "https://spatialturn.github.io/workshop2026.html" },
    ],
  },
};

/* ---------- Embedded StoryMaps ----------
   To make an embed open at a specific section: in the StoryMaps
   builder, hover that section's heading, copy its section link
   (it ends in #ref-n-XXXXXX), and paste the full URL into
   `embedUrl` below, keeping `?cover=false` before the #. */
const EMBEDS = {
  ozone: {
    title: "Ozone vs. COVID-19",
    year: "2024",
    anim: "corr",
    description:
      "Three climate zones, three answers: the correlation collapses from LA (0.67) to Miami (≈0). Shown here: the areas considered.",
    url: "https://storymaps.arcgis.com/stories/498888cea683436899d8674de15b058e",
    embedUrl: "https://storymaps.arcgis.com/stories/498888cea683436899d8674de15b058e?cover=false",
  },
  air: {
    title: "How Does Climate Influence Air Quality?",
    year: "2024",
    anim: "air",
    description:
      "How climate itself shapes the air we breathe. Shown here: the approach.",
    url: "https://storymaps.arcgis.com/stories/9d728e05416c415cadaff7971d91125a",
    embedUrl: "https://storymaps.arcgis.com/stories/9d728e05416c415cadaff7971d91125a?cover=false",
  },
};

/* ---------- Realm architecture: the levels of the tree ----------
   Canopy = upper air / climate signal, Midgard = human layer,
   Roots = deep earth. About sits at the base as the taproot. */
const REALMS = [
  {
    id: "canopy",
    label: "Canopy",
    nodes: [
      { type: "project", key: "tc" },
      { type: "embed", key: "air" },
    ],
  },
  {
    id: "midgard",
    label: "Midgard",
    nodes: [
      { type: "project", key: "food" },
      { type: "embed", key: "ozone" },
      { type: "project", key: "training" },
    ],
  },
  {
    id: "roots",
    label: "Roots",
    nodes: [{ type: "project", key: "seismic" }],
  },
];

/* ---------- Background particle system (vanilla Canvas) ----------
   A lightweight motes field on its own <canvas>. Behaviour morphs across the
   realms in lockstep with the mood layer: light-teal motes rise slowly in
   Canopy, wind pushes them sideways in Midgard, warm sediment sinks in Roots.
   This mirrors a React useEffect lifecycle — setup, one rAF loop, and a
   resize/teardown path — but written for this vanilla site.
   Perf: DPR capped at 2, particle count throttled (<=66 desktop / <=42 touch),
   and motion is delta-timed so speed is identical at 60 / 120 / 144 Hz. */
function initParticles() {
  const canvas = $("#particles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const TAU = Math.PI * 2;

  /* Per-realm velocity field (px/second) + colour + horizontal sway amplitude. */
  const FIELDS = {
    canopy: { vx: 7, vy: -15, col: [125, 205, 214], sway: 11 }, /* light teal, rising    */
    midgard: { vx: 20, vy: -1, col: [150, 172, 195], sway: 6 }, /* misty steel-blue wind, sideways */
    roots: { vx: -4, vy: 15, col: [208, 150, 92], sway: 5 }, /* warm amber, sinking      */
  };
  const seq = ["canopy", "midgard", "roots"]
    .map((k) => ({ el: document.querySelector(`[data-realm="${k}"]`), f: FIELDS[k] }))
    .filter((o) => o.el && o.f);
  const fallbackField = FIELDS.canopy;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let pool = [];
  let rafId = 0;
  let last = 0;

  const rand = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);

  /* Throttle count by viewport area, hard-capped for perf. */
  function targetCount() {
    const n = Math.round((w * h) / 15000);
    const cap = finePointer ? 100 : 58; /* denser field, still light on touch */
    return clamp(n, 40, cap);
  }

  function makeParticle() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      radius: rand(1.0, 3.0),
      alpha: rand(0.32, 0.72),
      speed: rand(0.55, 1.4), /* personal multiplier on the field velocity */
      swayFreq: rand(0.4, 1.1), /* rad/s for the horizontal wobble          */
      swayPhase: Math.random() * TAU,
      tint: rand(-0.14, 0.14), /* subtle brightness variance               */
    };
  }

  function sizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* Grow/shrink the pool to the throttled target without discarding existing
     particles (keeps motion continuous through a resize). */
  function fitPool() {
    const target = targetCount();
    while (pool.length < target) pool.push(makeParticle());
    if (pool.length > target) pool.length = target;
  }

  /* Blend the three fields by the SAME anchors the mood layer uses, so the
     motion turns over exactly when the background colour does. */
  const anchor = (el) =>
    el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.45;

  function currentField() {
    if (seq.length < 2) return fallbackField;
    const y = window.scrollY;
    const a = seq.map((s) => anchor(s.el));
    if (y <= a[0]) return seq[0].f;
    if (y >= a[a.length - 1]) return seq[seq.length - 1].f;
    for (let i = 0; i < seq.length - 1; i++) {
      if (y >= a[i] && y <= a[i + 1]) {
        const t = smooth(clamp((y - a[i]) / (a[i + 1] - a[i] || 1), 0, 1));
        const f = seq[i].f;
        const g = seq[i + 1].f;
        return {
          vx: lerp(f.vx, g.vx, t),
          vy: lerp(f.vy, g.vy, t),
          sway: lerp(f.sway, g.sway, t),
          col: [
            lerp(f.col[0], g.col[0], t),
            lerp(f.col[1], g.col[1], t),
            lerp(f.col[2], g.col[2], t),
          ],
        };
      }
    }
    return fallbackField;
  }

  const MARGIN = 8;
  function step(field, dt, now) {
    for (const p of pool) {
      const swayX = field.sway * Math.sin(now * p.swayFreq + p.swayPhase);
      p.x += (field.vx * p.speed + swayX) * dt;
      p.y += field.vy * p.speed * dt;
      /* wrap on every edge so density holds whichever way the field drifts */
      if (p.x < -MARGIN) p.x = w + MARGIN;
      else if (p.x > w + MARGIN) p.x = -MARGIN;
      if (p.y < -MARGIN) p.y = h + MARGIN;
      else if (p.y > h + MARGIN) p.y = -MARGIN;
    }
  }

  function draw(field) {
    ctx.clearRect(0, 0, w, h);
    const [r, g, b] = field.col;
    for (const p of pool) {
      const tr = clamp(r + p.tint * 60, 0, 255) | 0;
      const tg = clamp(g + p.tint * 60, 0, 255) | 0;
      const tb = clamp(b + p.tint * 60, 0, 255) | 0;
      const rgb = `${tr},${tg},${tb}`;
      /* soft halo → atmospheric glow */
      ctx.fillStyle = `rgba(${rgb},${(p.alpha * 0.3).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2.6, 0, TAU);
      ctx.fill();
      /* bright core */
      ctx.fillStyle = `rgba(${rgb},${p.alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, TAU);
      ctx.fill();
    }
  }

  function frame(ts) {
    const now = ts / 1000;
    let dt = now - last;
    last = now;
    if (dt > 0.05) dt = 0.05; /* clamp after tab-switch/stalls → refresh-rate safe */
    if (dt < 0) dt = 0;
    const field = currentField();
    step(field, dt, now);
    draw(field);
    rafId = requestAnimationFrame(frame);
  }

  /* --- lifecycle: setup + graceful resize (mirrors mount/cleanup) --- */
  let resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      sizeCanvas();
      fitPool();
      if (prefersReducedMotion) draw(currentField());
    }, 150);
  }

  sizeCanvas();
  fitPool();
  window.addEventListener("resize", onResize);

  if (prefersReducedMotion) {
    draw(currentField()); /* single static frame, no animation */
    return;
  }
  last = performance.now() / 1000;
  rafId = requestAnimationFrame(frame);
}
const PURDUE_LNGLAT = [-86.9212, 40.4237];

function initHeroMap() {
  const container = $("#hero-map");
  if (!container || typeof window.maplibregl === "undefined") return;

  let map;
  try {
    map = new maplibregl.Map({
      container,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [-96.0, 39.5],
      zoom: 3,
      attributionControl: { compact: true },
    });
  } catch {
    return; /* WebGL unavailable: the fallback panel stays visible */
  }

  /* Decorative map: no zooming or rotating; pan on desktop only */
  map.scrollZoom.disable();
  map.doubleClickZoom.disable();
  map.boxZoom.disable();
  map.keyboard.disable();
  map.dragRotate.disable();
  map.touchZoomRotate.disable();
  map.touchPitch.disable();
  if (!finePointer) map.dragPan.disable();

  /* Glowing survey dot */
  const dot = document.createElement("span");
  dot.className = "pulse-dot";
  new maplibregl.Marker({ element: dot }).setLngLat(PURDUE_LNGLAT).addTo(map);

  /* Neighborhood-level zoom, not street level */
  const TARGET_ZOOM = 14;

  if (prefersReducedMotion) {
    map.jumpTo({ center: PURDUE_LNGLAT, zoom: TARGET_ZOOM });
  } else {
    map.on("load", () => {
      setTimeout(() => {
        map.flyTo({
          center: PURDUE_LNGLAT,
          zoom: TARGET_ZOOM,
          duration: 3400,
          essential: false,
        });
      }, 900);
    });
  }
}

/* ---------- Live local time (Eastern) with day / night icon ---------- */
function initClock() {
  const clock = $("#map-clock");
  const timeEl = $("#clock-time");
  if (!clock || !timeEl) return;

  const timeFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Indiana/Indianapolis",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
  const hourFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Indiana/Indianapolis",
    hour: "numeric",
    hourCycle: "h23",
  });

  const tick = () => {
    const now = new Date();
    timeEl.textContent = timeFmt.format(now);
    const hour = parseInt(hourFmt.format(now), 10);
    clock.classList.toggle("is-night", hour < 6 || hour >= 18);
  };
  tick();
  setInterval(tick, 30000);
}

/* ---------- Node inner markup (features + embeds unchanged) ---------- */
function featureInner(p) {
  const anim = p.anim
    ? `<div class="visual-anim anim-${p.anim}">${VISUALS[p.anim]}</div>`
    : "";
  const visual = p.image
    ? `<a class="figure" href="${p.image.src}" target="_blank" rel="noopener" aria-label="Open full-size figure: ${p.image.caption}">
         <img src="${p.image.src}" alt="${p.image.alt}" loading="lazy" />
       </a>
       <p class="figure-cap mono">${p.image.caption}</p>
       ${anim}`
    : VISUALS[p.visual] || "";

  return `
    <div class="feature">
      <div class="feature-visual${p.image ? " has-figure" : ""}">${visual}</div>
      <div class="feature-body">
        <div class="card-top">
          <span class="card-cat">${p.categoryLabel}</span>
          <span class="card-year">${p.year}</span>
        </div>
        <h3>${p.title}</h3>
        <dl class="pmr">
          <div class="pmr-row"><dt class="mono">Problem</dt><dd>${p.problem}</dd></div>
          <div class="pmr-row"><dt class="mono">Methods</dt><dd>${p.methods}</dd></div>
          <div class="pmr-row"><dt class="mono">Results</dt><dd>${p.results}</dd></div>
        </dl>
        <ul class="findings">
          ${p.findings.map((f) => `<li>${f}</li>`).join("")}
        </ul>
        <div class="card-foot">
          <div class="card-tools">
            <span class="tools-label mono">Tools</span>
            ${p.tools.map((t) => `<span class="tag">${t}</span>`).join("")}
          </div>
          <div class="card-links">${p.links
            .map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`)
            .join("")}</div>
        </div>
      </div>
    </div>`;
}

function embedInner(e) {
  return `
    <div class="embed-card">
      <div class="embed-head">
        <div class="embed-title">
          <h3>${e.title}</h3>
          <p class="card-desc">${e.description}</p>
        </div>
        <div class="embed-meta">
          <span class="card-year">${e.year}</span>
          <a href="${e.url}" target="_blank" rel="noopener">Open StoryMap ↗</a>
        </div>
      </div>
      ${e.anim ? `<div class="embed-anim">${VISUALS[e.anim]}</div>` : ""}
      <div class="embed-frame">
        <iframe src="${e.embedUrl}" title="${e.title} — ArcGIS StoryMap" loading="lazy" allowfullscreen allow="geolocation"></iframe>
      </div>
    </div>`;
}

/* ---------- HUD viz panels: which tiles get a side visualization ----------
   Keyed by project slug. Each appears once; the panel sits in the tile's outer
   gap (tc/food/training → right, seismic → left, following node alternation). */
const HUD_VIZ = {
  tc: {
    type: "cyclo",
    label: "ATLANTIC CYCLOGENESIS",
    foot: "GENESIS \u00b7 TROPICAL ATLANTIC",
    desc: "Each glowing point is a tropical cyclone forming over the warm tropical Atlantic. From genesis the storms drift west and northwest across the basin, carried by the prevailing trade winds — some recurve poleward and head back out to sea, while others track far enough west to make landfall on North America. The fading trails are the kind of storm tracks a 45-year record of cyclone intensity is built from.",
  },
  food: {
    type: "decay",
    label: "EUCLIDEAN DECAY RASTER",
    foot: "ACCESS FIELD \u00b7 LIVE RECOMPUTE",
    desc: "The box is a region — think a county or census tract — divided into equal-area grid cells. Each cell is shaded by its straight-line (Euclidean) distance to the glowing point, which stands in for a supermarket. Cells farther from the store are darker; cells closer to it are lighter. A lighter cell means that patch of the region has better access to healthy food, and the whole field recomputes as the store location moves.",
  },
  training: {
    type: "sdi",
    label: "SDI LAYER STACK",
    foot: "4 LAYERS \u00b7 WGS84",
    desc: "A map is assembled as a stack of aligned layers sharing one footprint, shown here as four panes. <b>A</b> is the base map: reference terrain and coastlines. <b>B</b> is a raster layer of gridded, continuous data such as satellite imagery or a heatmap. <b>C</b> is a polygon vector layer of bounded areas like regions or zones. <b>D</b> is a point vector layer of discrete locations. Registered to the same coordinate system, the four layers combine into a single map: the core idea behind a Spatial Data Infrastructure (SDI).",
  },
  seismic: {
    type: "wavefront",
    label: "HYPOCENTER WAVEFRONT",
    foot: "V_S 1.8 km/s \u00b7 REFLECT",
    desc: "Seismic waves originate deep within the earth at the hypocenter, an earthquake's point of origin. They radiate outward, and when they reach the surface they bounce (reflect) back down, making the ground shake. Measuring that shaking lets us work out what kind of sediments lie beneath the surface — soft, slow layers amplify the shaking and flag a higher ground-shaking hazard.",
  },
};

function vizStage(type) {
  return `<canvas id="viz-${type}" class="viz-canvas"></canvas>`;
}

function vizPanel(viz) {
  return `
    <aside class="hud-viz hud-viz--${viz.type}" aria-hidden="true">
      <div class="hud-viz-frame">
        <span class="hud-viz-corner c-tl"></span>
        <span class="hud-viz-corner c-br"></span>
        <div class="hud-viz-head">
          <span class="hud-viz-title mono">${viz.label}</span>
          <span class="hud-viz-live mono">\u25cf LIVE</span>
        </div>
        <div class="hud-viz-stage">${vizStage(viz.type)}</div>
        <div class="hud-viz-foot mono" data-viz-foot>${viz.foot}</div>
        ${viz.desc ? `<p class="hud-viz-desc">${viz.desc}</p>` : ""}
      </div>
    </aside>`;
}

/* ---------- Render realms: nodes alternate left / right ---------- */
function renderRealms() {
  let side = "left"; /* global alternation so the trunk snakes consistently */
  REALMS.forEach((realm) => {
    const host = $(`#realm-${realm.id}`);
    if (!host) return;
    host.innerHTML = realm.nodes
      .map((n, i) => {
        const isEmbed = n.type === "embed";
        const inner = isEmbed ? embedInner(EMBEDS[n.key]) : featureInner(PROJECTS[n.key]);
        const num = String(i + 1).padStart(2, "0");
        const node = `
          <article class="tree-node ${side === "left" ? "node-left" : "node-right"}${isEmbed ? " is-embed" : ""} glow reveal" data-side="${side}">
            <i class="node-corner c-tl" aria-hidden="true"></i>
            <i class="node-corner c-br" aria-hidden="true"></i>
            <span class="node-tag mono">${realm.label} · N-${num}${isEmbed ? " · StoryMap" : ""}</span>
            <span class="node-port" aria-hidden="true"></span>
            <div class="node-body">${inner}</div>
          </article>`;
        const viz = !isEmbed ? HUD_VIZ[n.key] : null;
        const html = viz
          ? `<div class="node-row" data-side="${side}">${node}${vizPanel(viz)}</div>`
          : node;
        side = side === "left" ? "right" : "left";
        return html;
      })
      .join("");
  });
}

/* =========================================================
   World tree: full-page SVG trunk + twigs, grown by scroll

   Coordinate math, step by step:
   1. Waypoints are gathered in DOCUMENT pixel space: for each
      node, the trunk bends AWAY from the node's side (a left
      node pushes the trunk to centerX + sway, a right node to
      centerX − sway), so the alternation itself produces the
      organic left/right snake.
   2. Waypoints become a Catmull-Rom spline converted to cubic
      Béziers — a single smooth <path>.
   3. Curve length ≠ vertical distance, so we sample
      getPointAtLength() into a monotonic (length, y) table.
      lenAtY(docY) binary-searches it: "how much path exists
      above this document y".
   4. Each frame the draw head is lenAtY(scrollY + 0.78·vh),
      eased toward smoothly, and applied via
      stroke-dashoffset = totalLength − head. Growth therefore
      tracks scroll position exactly, with fluid inertia.
   5. Twigs store the trunk arc-length of their junction and
      sprout proportionally once the head passes it.
   6. Hover glow to the roots: for junction length s, the glow
      overlay gets stroke-dasharray "0 s (total−s) total" — a
      lit dash from the junction all the way to the trunk's
      end at the roots.
   ========================================================= */
function initWorldTree() {
  const layer = $("#tree-layer");
  if (!layer) return;

  const NS = "http://www.w3.org/2000/svg";
  const mq = window.matchMedia("(min-width: 901px)");
  const ANCHOR_Y = 84; /* twig plugs in this far below each node's top (matches .node-port) */

  let svg = null;
  let trunkDraw = null;
  let trunkGlow = null;
  let twigs = []; /* per-node: { node, draw, glow, junction, attachLen, length, span } */
  let limbs = []; /* decorative canopy branches + root strands */
  let samples = [];
  let total = 0;
  let head = 0;
  let target = 0;
  let built = false;
  let rafId = 0;
  let hoverMap = new Map();
  let hoverNode = null;

  const svgEl = (tag, attrs, cls) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (cls) el.setAttribute("class", cls);
    return el;
  };

  /* Layout-space position (offset chain): immune to reveal transforms */
  const docPos = (el) => {
    let x = 0;
    let y = 0;
    let cur = el;
    while (cur) {
      x += cur.offsetLeft;
      y += cur.offsetTop;
      cur = cur.offsetParent;
    }
    return { x, y };
  };

  /* Catmull-Rom spline through pts → smooth cubic-Bézier path */
  function splinePath(pts) {
    if (pts.length < 2) return "";
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  }

  /* Sample the trunk into a monotonic (length, y) lookup table */
  function sampleTrunk(path) {
    total = path.getTotalLength();
    const n = clamp(Math.round(total / 6), 120, 1100);
    samples = [];
    let maxY = -Infinity;
    for (let i = 0; i <= n; i++) {
      const len = (total * i) / n;
      const pt = path.getPointAtLength(len);
      maxY = Math.max(maxY, pt.y);
      samples.push({ len, y: maxY });
    }
  }

  /* Binary search: arc length of the trunk at document y */
  function lenAtY(y) {
    if (!samples.length) return 0;
    const last = samples[samples.length - 1];
    if (y <= samples[0].y) return 0;
    if (y >= last.y) return total;
    let lo = 0;
    let hi = samples.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (samples[mid].y < y) lo = mid;
      else hi = mid;
    }
    const a = samples[lo];
    const b = samples[hi];
    const t = b.y === a.y ? 0 : (y - a.y) / (b.y - a.y);
    return a.len + (b.len - a.len) * t;
  }

  function twigD(j, ax, ay) {
    const dx = ax - j.x;
    return `M ${j.x.toFixed(1)} ${j.y.toFixed(1)} C ${(j.x + dx * 0.32).toFixed(1)} ${(j.y + 26).toFixed(1)}, ${(ax - dx * 0.3).toFixed(1)} ${(ay - 20).toFixed(1)}, ${ax.toFixed(1)} ${ay.toFixed(1)}`;
  }

  function teardown() {
    built = false;
    if (svg) svg.remove();
    svg = null;
    trunkDraw = null;
    trunkGlow = null;
    twigs = [];
    limbs = [];
    samples = [];
    total = 0;
  }

  function build() {
    teardown();
    if (!mq.matches) return;

    const nodes = $$(".tree-node");
    if (!nodes.length) return;

    const W = document.documentElement.clientWidth;
    const H = Math.ceil(document.documentElement.scrollHeight);
    layer.style.height = `${H}px`;

    svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H });

    const cx = W * 0.5;
    const sway = clamp(W * 0.07, 70, 150);

    /* Gather node geometry in document space */
    const info = nodes.map((el) => {
      const pos = docPos(el);
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const side = el.dataset.side || "left";
      return {
        el,
        side,
        top: pos.y,
        bottom: pos.y + h,
        left: pos.x,
        right: pos.x + w,
        anchorX: side === "left" ? pos.x + w : side === "right" ? pos.x : pos.x + w / 2,
        anchorY: pos.y + ANCHOR_Y,
      };
    });
    const branchNodes = info.filter((n) => n.side !== "center");
    const aboutNode = info.find((n) => n.side === "center");

    /* --- Step 1: trunk waypoints, bending away from each node --- */
    const pts = [[cx, -20]];
    const firstY = branchNodes.length ? branchNodes[0].anchorY : H * 0.3;
    if (firstY > 500) {
      pts.push([cx + sway * 0.35, firstY * 0.45]);
      pts.push([cx - sway * 0.3, firstY * 0.78]);
    }
    const GAP = 80; /* clearance between trunk and a node's near edge = twig length */
    branchNodes.forEach((n, i) => {
      const dir = n.side === "left" ? 1 : -1;
      const jitter = ((i * 73) % 13) - 6; /* deterministic, organic wobble */
      /* Bend away from the node — and never pass beneath it */
      let tx = cx + dir * (sway * 0.7) + jitter;
      tx = n.side === "left" ? Math.max(tx, n.right + GAP) : Math.min(tx, n.left - GAP);
      pts.push([clamp(tx, 40, W - 40), n.anchorY]);
      /* relief bend between distant nodes keeps the S-curve alive */
      const next = branchNodes[i + 1];
      if (next && next.anchorY - n.anchorY > 760) {
        pts.push([cx - dir * sway * 0.3, (n.anchorY + next.anchorY) / 2]);
      }
    });
    let endPt;
    if (aboutNode) {
      pts.push([cx + sway * 0.2, aboutNode.top - 40]);
      endPt = [cx, Math.min(aboutNode.bottom + 26, H - 60)];
    } else {
      endPt = [cx, H - 80];
    }
    pts.push(endPt);

    /* --- Step 2: one smooth spline --- */
    const d = splinePath(pts);
    const trunkBase = svgEl("path", { d }, "trunk-base");
    trunkDraw = svgEl("path", { d }, "trunk-draw");
    trunkGlow = svgEl("path", { d, "stroke-dasharray": "0 999999" }, "trunk-glow");
    svg.append(trunkBase, trunkDraw, trunkGlow);
    layer.appendChild(svg);

    /* --- Step 3: length↔y lookup table --- */
    sampleTrunk(trunkDraw);
    trunkDraw.setAttribute("stroke-dasharray", `${total}`);
    trunkDraw.style.strokeDashoffset = total;

    /* --- Decorative canopy branches (draw early, near the top) --- */
    const canopySpecs = [
      { dir: -1, f: 0.16, spread: 0.32, rise: 180, sag: 46 },
      { dir: 1, f: 0.24, spread: 0.28, rise: 140, sag: 36 },
      { dir: -1, f: 0.36, spread: 0.22, rise: 100, sag: 28 },
      { dir: 1, f: 0.46, spread: 0.17, rise: 78, sag: 22 },
    ];
    canopySpecs.forEach((s) => {
      const aY = firstY * s.f;
      const attachLen = lenAtY(aY);
      const p = trunkDraw.getPointAtLength(attachLen);
      const ex = clamp(cx + s.dir * W * s.spread, 30, W - 30);
      const ey = Math.max(36, p.y - s.rise);
      const bd = `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} C ${(p.x + s.dir * W * s.spread * 0.35).toFixed(1)} ${(p.y + s.sag).toFixed(1)}, ${(ex - s.dir * 46).toFixed(1)} ${(ey + 44).toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`;
      const el = svgEl("path", { d: bd }, "limb limb-canopy");
      svg.appendChild(el);
      const len = el.getTotalLength();
      el.setAttribute("stroke-dasharray", `${len}`);
      el.style.strokeDashoffset = len;
      limbs.push({ el, attachLen, length: len, span: len * 1.1 });
    });

    /* --- Root strands: unfurl at the very base, in copper --- */
    const rootSpecs = [
      { off: -0.26, drop: 96 },
      { off: -0.11, drop: 150 },
      { off: 0.1, drop: 132 },
      { off: 0.25, drop: 104 },
    ];
    rootSpecs.forEach((s) => {
      const ex = clamp(cx + s.off * W, 30, W - 30);
      const ey = Math.min(H - 28, endPt[1] + s.drop);
      const rd = `M ${endPt[0].toFixed(1)} ${endPt[1].toFixed(1)} C ${(endPt[0] + s.off * W * 0.2).toFixed(1)} ${(endPt[1] + 34).toFixed(1)}, ${(ex - s.off * W * 0.25).toFixed(1)} ${(ey - 26).toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`;
      const el = svgEl("path", { d: rd }, "limb limb-root");
      svg.appendChild(el);
      const len = el.getTotalLength();
      el.setAttribute("stroke-dasharray", `${len}`);
      el.style.strokeDashoffset = len;
      limbs.push({ el, attachLen: Math.max(total - 50, 0), length: len, span: len * 1.15 });
    });

    /* --- Twigs: junction on the trunk → each node's port --- */
    const twigGroup = svgEl("g", {}, "twigs");
    svg.appendChild(twigGroup);
    branchNodes.forEach((n) => {
      const attachLen = lenAtY(n.anchorY);
      const j = trunkDraw.getPointAtLength(attachLen);
      const td = twigD(j, n.anchorX, n.anchorY);
      const base = svgEl("path", { d: td }, "twig-base");
      const draw = svgEl("path", { d: td }, "twig-draw");
      const glow = svgEl("path", { d: td }, "twig-glow");
      const junction = svgEl("circle", { cx: j.x.toFixed(1), cy: j.y.toFixed(1), r: 4.5 }, "junction");
      twigGroup.append(base, draw, glow, junction);
      const length = draw.getTotalLength();
      draw.setAttribute("stroke-dasharray", `${length}`);
      draw.style.strokeDashoffset = length;
      twigs.push({ node: n.el, draw, glow, junction, attachLen, length, span: length * 1.25 });
    });

    /* About taproot: no twig — the trunk itself plunges into it */
    if (aboutNode) {
      const attachLen = lenAtY(aboutNode.top - 40);
      const j = trunkDraw.getPointAtLength(attachLen);
      const junction = svgEl("circle", { cx: j.x.toFixed(1), cy: j.y.toFixed(1), r: 4.5 }, "junction");
      svg.appendChild(junction);
      twigs.push({ node: aboutNode.el, draw: null, glow: null, junction, attachLen, length: 1, span: 60 });
    }

    /* --- Hover map: node element → its twig entry (wired once, below) --- */
    hoverMap = new Map(twigs.map((t) => [t.node, t]));

    built = true;

    if (prefersReducedMotion) {
      /* Fully grown, no scroll animation */
      head = target = total;
      apply(total);
    } else {
      head = target = currentTarget();
      apply(head);
    }
  }

  /* --- Step 4: scroll → draw-head arc length --- */
  const currentTarget = () => lenAtY(window.scrollY + window.innerHeight * 0.78);

  function apply(h) {
    trunkDraw.style.strokeDashoffset = Math.max(total - h, 0);
    for (const t of twigs) {
      const p = clamp((h - t.attachLen) / t.span, 0, 1);
      if (t.draw) t.draw.style.strokeDashoffset = t.length * (1 - p);
      t.junction.classList.toggle("lit", p > 0.02);
      t.node.classList.toggle("grown", p > 0.5);
    }
    for (const l of limbs) {
      const p = clamp((h - l.attachLen) / l.span, 0, 1);
      l.el.style.strokeDashoffset = l.length * (1 - p);
    }
  }

  function frame() {
    rafId = requestAnimationFrame(frame);
    if (!built || prefersReducedMotion) return;
    target = currentTarget();
    head += (target - head) * 0.14;
    if (Math.abs(target - head) < 0.4) head = target;
    apply(head);
  }

  /* --- Step 6: hover glow — twig + trunk down to the roots --- */
  function setHover(nodeEl) {
    hoverNode = nodeEl;
    if (!built || !trunkGlow) return;
    const entry = nodeEl ? hoverMap.get(nodeEl) : null;
    for (const t of twigs) {
      if (t.glow) t.glow.classList.toggle("on", entry === t);
    }
    if (entry) {
      trunkGlow.setAttribute(
        "stroke-dasharray",
        `0 ${entry.attachLen.toFixed(1)} ${Math.max(total - entry.attachLen, 1).toFixed(1)} ${total.toFixed(1)}`
      );
      trunkGlow.classList.add("on");
    } else {
      trunkGlow.classList.remove("on");
    }
  }

  document.addEventListener("pointerover", (e) => {
    const nodeEl = e.target.closest ? e.target.closest(".tree-node") : null;
    if (nodeEl !== hoverNode) setHover(nodeEl);
  });
  document.addEventListener("mouseleave", () => setHover(null));

  /* Rebuild when layout genuinely changes */
  let rebuildTimer = 0;
  const requestRebuild = () => {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(build, 180);
  };
  window.addEventListener("resize", requestRebuild);
  window.addEventListener("load", requestRebuild);
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", requestRebuild);
  } else if (typeof mq.addListener === "function") {
    mq.addListener(requestRebuild);
  }
  if ("ResizeObserver" in window) {
    let lastH = document.documentElement.scrollHeight;
    new ResizeObserver(() => {
      const h = document.documentElement.scrollHeight;
      if (Math.abs(h - lastH) > 8) {
        lastH = h;
        requestRebuild();
      }
    }).observe(document.body);
  }

  build();
  if (!prefersReducedMotion) rafId = requestAnimationFrame(frame);
}

/* ---------- Scroll reveals ---------- */
function initReveals() {
  const targets = $$(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );
  targets.forEach((el) => observer.observe(el));
}

/* ---------- Footer year ---------- */
function initFooter() {
  $("#footer-year").textContent = new Date().getFullYear();
}

/* ---------- Boot ---------- */
/* ---------- Environmental mood transitions (GSAP ScrollTrigger) ----------
   As each realm scrolls into view, the ambient .env layer's base colour and
   corner/edge glows blend to that realm's mood. A SINGLE ScrollTrigger reads
   the live scroll position and writes the palette itself: one writer means the
   background can never be stamped by two competing tweens (which caused the
   opening frame to flash the wrong realm's colour). Blend points track each
   section's real offset, so colour changes land as that realm takes over —
   regardless of how tall each section is. */
function initEnvTransition() {
  const base = document.querySelector(".env-base");
  const glowTop = document.querySelector(".env-glow--canopy");
  const glowBot = document.querySelector(".env-glow--roots");
  if (!base || !glowTop || !glowBot) return;

  /* One palette per realm: mood base colour + how strongly each glow shows. */
  const PALETTE = {
    canopy: { base: "#0a1626", top: 1.0, bottom: 0.0 }, /* rich navy, teal top corners   */
    midgard: { base: "#242b35", top: 0.08, bottom: 0.0 }, /* muted slate blue / deep steel  */
    roots: { base: "#05080b", top: 0.0, bottom: 1.0 }, /* midnight-black, amber bottom  */
  };

  /* Realms in scroll order. NOTE: the canopy section's id is #work (kept from
     the original nav anchor), so we target realms by their data-realm attribute
     rather than by id — the mapping is immune to what the ids happen to be. */
  const seq = ["canopy", "midgard", "roots"]
    .map((k) => ({ el: document.querySelector(`[data-realm="${k}"]`), p: PALETTE[k] }))
    .filter((o) => o.el && o.p);

  const applyPalette = (p) => {
    base.style.backgroundColor = p.base;
    glowTop.style.opacity = p.top;
    glowBot.style.opacity = p.bottom;
  };

  /* CDN blocked or too few realms → paint the opening palette and stop. */
  if (!window.gsap || !window.ScrollTrigger || seq.length < 2) {
    applyPalette(seq[0] ? seq[0].p : PALETTE.canopy);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const blend = gsap.utils.interpolate; /* interpolates hex colours and numbers */
  const clamp01 = gsap.utils.clamp(0, 1);
  const smooth = (t) => t * t * (3 - 2 * t); /* ease-in-out for a soft handover */

  /* Scroll position at which a realm should be fully "in mood": when its top
     sits at 45% of the viewport. Read live so it survives resizes/reflows. */
  const anchor = (el) =>
    el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.45;

  /* The single source of truth: current scroll → palette. */
  const render = () => {
    const y = window.scrollY;
    const a = seq.map((s) => anchor(s.el));
    if (y <= a[0]) return applyPalette(seq[0].p); /* above the first realm  */
    if (y >= a[a.length - 1]) return applyPalette(seq[seq.length - 1].p); /* past the last */
    for (let i = 0; i < seq.length - 1; i++) {
      if (y >= a[i] && y <= a[i + 1]) {
        const t = smooth(clamp01((y - a[i]) / (a[i + 1] - a[i] || 1)));
        const from = seq[i].p;
        const to = seq[i + 1].p;
        base.style.backgroundColor = blend(from.base, to.base, t);
        glowTop.style.opacity = blend(from.top, to.top, t);
        glowBot.style.opacity = blend(from.bottom, to.bottom, t);
        return;
      }
    }
  };

  /* Reduced motion: snap to the nearest realm instead of continuous blending. */
  const renderSnap = () => {
    const y = window.scrollY;
    const a = seq.map((s) => anchor(s.el));
    let idx = 0;
    for (let i = 0; i < seq.length; i++) if (y >= a[i]) idx = i;
    applyPalette(seq[idx].p);
  };

  const draw = prefersReducedMotion ? renderSnap : render;

  /* Paint the opening state, then let one trigger drive the whole page. */
  applyPalette(seq[0].p);
  ScrollTrigger.create({
    start: 0,
    end: () => ScrollTrigger.maxScroll(window),
    onUpdate: draw,
    onRefresh: draw,
    invalidateOnRefresh: true,
  });
  draw();

  /* Fonts, the hero map, and the world-tree all settle after load and can
     shift section offsets — recompute once that's done. */
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

/* =========================================================
   HUD viz engine — 4 mini-visualizations beside the tiles.
   Shared harness fits the canvas for DPR, gates the rAF loop
   with an IntersectionObserver (only runs while on screen),
   refits on resize, and draws one static frame under
   prefers-reduced-motion. Keeps page scroll perfectly smooth.
   ========================================================= */
function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

function mountViz(canvas, factory) {
  if (!canvas) return;
  let dims = fitCanvas(canvas);
  let draw = factory(dims);
  let raf = 0;
  let last = 0;
  let visible = false;
  const frame = (ts) => {
    const dt = last ? Math.min(ts - last, 50) : 16;
    last = ts;
    draw(dt, ts);
    raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };
  const stop = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
  const refit = () => {
    if (canvas.getBoundingClientRect().width < 1) return; /* hidden (< xl) */
    dims = fitCanvas(canvas);
    draw = factory(dims);
    if (prefersReducedMotion) draw(0, performance.now());
  };
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        visible = e.isIntersecting;
        if (!visible) return stop();
        refit(); /* ensure correct size when first shown */
        if (prefersReducedMotion) draw(0, performance.now());
        else start();
      });
    },
    { rootMargin: "220px 0px" }
  );
  io.observe(canvas);
  let rt = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(refit, 160);
  });
}

/* --- 1. CANOPY N-01: Atlantic cyclogenesis & landfall simulation --- */
function cycloFactory({ ctx, w, h }) {
  const TAU = Math.PI * 2;
  const D2R = Math.PI / 180;
  const foot = document.querySelector(".hud-viz--cyclo [data-viz-foot]");

  /* Stylized continent outlines in normalized [0,1] canvas space (Atlantic view) */
  const CONT = {
    na: [[0.02,0.10],[0.10,0.05],[0.20,0.06],[0.28,0.10],[0.34,0.08],[0.40,0.12],[0.42,0.20],[0.38,0.24],[0.40,0.30],[0.35,0.34],[0.33,0.40],[0.30,0.42],[0.30,0.49],[0.26,0.46],[0.24,0.40],[0.20,0.36],[0.14,0.34],[0.10,0.28],[0.06,0.22],[0.04,0.16]],
    sa: [[0.30,0.50],[0.36,0.52],[0.40,0.58],[0.44,0.66],[0.44,0.74],[0.42,0.82],[0.38,0.90],[0.34,0.96],[0.32,0.90],[0.30,0.80],[0.28,0.70],[0.27,0.60],[0.28,0.54]],
    eu: [[0.64,0.14],[0.70,0.10],[0.76,0.06],[0.82,0.04],[0.80,0.10],[0.78,0.14],[0.74,0.16],[0.72,0.20],[0.68,0.20],[0.66,0.16]],
    af: [[0.66,0.22],[0.72,0.20],[0.80,0.22],[0.86,0.28],[0.90,0.36],[0.90,0.46],[0.86,0.56],[0.82,0.66],[0.78,0.74],[0.74,0.82],[0.70,0.80],[0.68,0.72],[0.64,0.62],[0.60,0.52],[0.58,0.44],[0.60,0.36],[0.62,0.28]],
  };
  const NA = CONT.na;
  const mx = (nx) => nx * w;
  const my = (ny) => ny * h;

  const contPath = (pts) => {
    ctx.beginPath();
    pts.forEach(([nx, ny], i) => {
      const X = mx(nx), Y = my(ny);
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    });
    ctx.closePath();
  };
  /* ray-casting point-in-polygon (normalized space) for landfall over N. America */
  const inNA = (px, py) => {
    const x = px / w, y = py / h;
    let inside = false;
    for (let i = 0, j = NA.length - 1; i < NA.length; j = i++) {
      const xi = NA[i][0], yi = NA[i][1], xj = NA[j][0], yj = NA[j][1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };

  const storms = [];
  let spawnAcc = 0;
  const SPAWN = 1500;
  const MAX = 6;
  const spawn = () => {
    const oy = 0.40 + Math.random() * 0.10;
    const ox = 0.50 + Math.random() * 0.02; /* over the tropical Atlantic, west of the African coast */
    const speed = Math.min(w, h) * (0.00010 + Math.random() * 0.00006);
    const turn = 0.006 + Math.random() * 0.020; /* deg per ms, steers N then NE */
    storms.push({
      x: mx(ox), y: my(oy),
      theta: 190 + Math.random() * 15, /* 0=E 90=down 180=W 270=up → WNW start */
      speed, turn,
      willLandfall: Math.random() < 0.5,
      wob: Math.random() * TAU, wobSp: 0.002 + Math.random() * 0.003,
      trail: [], age: 0, life: 9000 + Math.random() * 4000,
      alpha: 0, state: "grow",
      hue: Math.random() < 0.25 ? "o" : "t",
    });
  };

  return (dt, now) => {
    ctx.clearRect(0, 0, w, h);

    /* faint HUD graticule */
    ctx.strokeStyle = "rgba(120,180,190,0.07)";
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx <= 1.001; gx += 0.125) { ctx.beginPath(); ctx.moveTo(mx(gx), 0); ctx.lineTo(mx(gx), h); ctx.stroke(); }
    for (let gy = 0; gy <= 1.001; gy += 0.16) { ctx.beginPath(); ctx.moveTo(0, my(gy)); ctx.lineTo(w, my(gy)); ctx.stroke(); }

    /* continents */
    for (const k in CONT) {
      contPath(CONT[k]);
      ctx.fillStyle = "rgba(63,184,191,0.045)";
      ctx.fill();
      ctx.strokeStyle = "rgba(130,185,195,0.28)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* genesis marker over the tropical Atlantic */
    const gpx = mx(0.50), gpy = my(0.45);
    ctx.beginPath();
    ctx.arc(gpx, gpy, 3 + Math.sin(now * 0.004) * 1.2, 0, TAU);
    ctx.strokeStyle = "rgba(214,150,90,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    spawnAcc += dt;
    if (spawnAcc > SPAWN && storms.length < MAX) { spawnAcc = 0; spawn(); }

    for (const s of storms) {
      s.age += dt;
      if (s.state === "grow") s.alpha = Math.min(1, s.alpha + dt * 0.003);
      s.theta += s.turn * dt * (s.willLandfall ? 0.35 : 1); /* landfall storms curve less */
      s.wob += s.wobSp * dt;
      const th = (s.theta + Math.sin(s.wob) * 6) * D2R; /* squiggle */
      s.x += Math.cos(th) * s.speed * dt;
      s.y += Math.sin(th) * s.speed * dt;
      s.trail.push([s.x, s.y]);
      if (s.trail.length > 36) s.trail.shift();

      const landed = inNA(s.x, s.y);
      const off = s.x < -6 || s.y < -6 || s.y > h + 6;
      if ((landed || off || s.age > s.life) && s.state === "grow") s.state = "die";
      if (s.state === "die") s.alpha -= dt * 0.004;

      const col = s.hue === "o" ? "214,150,90" : "63,184,191";
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = `rgba(${col},${(0.5 * s.alpha).toFixed(3)})`;
      ctx.beginPath();
      s.trail.forEach(([tx, ty], i) => (i ? ctx.lineTo(tx, ty) : ctx.moveTo(tx, ty)));
      ctx.stroke();
      if (s.alpha > 0.02) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.4, 0, TAU);
        ctx.fillStyle = `rgba(${col},${Math.min(1, s.alpha).toFixed(3)})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(${col},0.9)`;
        ctx.fill();
        ctx.shadowBlur = 0;
        if (landed) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, 6, 0, TAU);
          ctx.strokeStyle = `rgba(255,180,120,${(0.6 * s.alpha).toFixed(2)})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }
    for (let i = storms.length - 1; i >= 0; i--) {
      if (storms[i].state === "die" && storms[i].alpha <= 0) storms.splice(i, 1);
    }

    /* continent labels (drawn last so they stay legible above the tracks) */
    ctx.fillStyle = "rgba(150,196,206,0.82)";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const LBL = [["NA", 0.19, 0.22], ["SA", 0.35, 0.72], ["EUROPE", 0.72, 0.11], ["AFRICA", 0.75, 0.50]];
    for (const [txt, lx, ly] of LBL) ctx.fillText(txt, mx(lx), my(ly));
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    if (foot) {
      const land = storms.filter((s) => inNA(s.x, s.y)).length;
      foot.textContent = `TRACKING ${storms.length} \u00b7 LANDFALL ${land}`;
    }
  };
}

/* --- 2. MIDGARD N-01: dynamic Euclidean distance decay grid --- */
function decayFactory({ ctx, w, h }) {
  const TAU = Math.PI * 2;
  const foot = document.querySelector(".hud-viz--decay [data-viz-foot]");
  const pad = 8;
  const gx = pad, gy = pad, gw = w - pad * 2, gh = h - pad * 2;
  const cols = Math.max(8, Math.round(gw / 26));
  const rows = Math.max(8, Math.round(gh / 26));
  const cw = gw / cols, ch = gh / rows;
  const maxD = Math.hypot(gw, gh);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);

  /* migration waypoints: four corners + dead centre */
  const WP = [
    [gx + cw * 0.5, gy + ch * 0.5],
    [gx + gw - cw * 0.5, gy + ch * 0.5],
    [gx + gw - cw * 0.5, gy + gh - ch * 0.5],
    [gx + cw * 0.5, gy + gh - ch * 0.5],
    [gx + gw * 0.5, gy + gh * 0.5],
  ];
  const pt = WP[0].slice();
  let from = WP[0], to = WP[4];
  let prog = 0, pauseT = 0;
  const MOVE = 2200, PAUSE = 1100;

  /* near → bright light teal, far → dim dark navy (access → food-desert decay) */
  const ramp = (v) => {
    const e = Math.pow(v, 1.4);
    const r = lerp(10, 190, e), g = lerp(22, 235, e), b = lerp(38, 240, e);
    const a = 0.1 + e * 0.72;
    return `rgba(${r | 0},${g | 0},${b | 0},${a.toFixed(3)})`;
  };

  return (dt, now) => {
    if (prog < 1) {
      prog = Math.min(1, prog + dt / MOVE);
      const t = smooth(prog);
      pt[0] = lerp(from[0], to[0], t);
      pt[1] = lerp(from[1], to[1], t);
    } else {
      pauseT += dt;
      if (pauseT > PAUSE) {
        pauseT = 0;
        prog = 0;
        from = to;
        let n;
        do { n = (Math.random() * WP.length) | 0; } while (WP[n] === to);
        to = WP[n];
      }
    }

    ctx.clearRect(0, 0, w, h);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ccx = gx + c * cw + cw / 2, ccy = gy + r * ch + ch / 2;
        const d = Math.hypot(ccx - pt[0], ccy - pt[1]);
        const v = 1 - Math.min(1, d / maxD);
        ctx.fillStyle = ramp(v);
        ctx.fillRect(gx + c * cw + 0.5, gy + r * ch + 0.5, cw - 1, ch - 1);
      }
    }

    ctx.strokeStyle = "rgba(63,184,191,0.1)";
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= cols; c++) { const xx = gx + c * cw; ctx.beginPath(); ctx.moveTo(xx, gy); ctx.lineTo(xx, gy + gh); ctx.stroke(); }
    for (let r = 0; r <= rows; r++) { const yy = gy + r * ch; ctx.beginPath(); ctx.moveTo(gx, yy); ctx.lineTo(gx + gw, yy); ctx.stroke(); }

    /* supermarket source: glowing dot + pulsing access ring */
    const px = pt[0], py = pt[1];
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, TAU);
    ctx.fillStyle = "rgba(200,245,248,0.95)";
    ctx.shadowBlur = 14;
    ctx.shadowColor = "rgba(63,184,191,0.9)";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(px, py, 8 + (Math.sin(now * 0.005) * 0.5 + 0.5) * 6, 0, TAU);
    ctx.strokeStyle = "rgba(63,184,191,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (foot) foot.textContent = `SRC ${(px / w).toFixed(2)},${(py / h).toFixed(2)} \u00b7 \u0394 recompute`;
  };
}

/* --- 4. ROOTS N-01: hypocenter wavefront reflection cross-section --- */
function wavefrontFactory({ ctx, w, h }) {
  const TAU = Math.PI * 2;
  const foot = document.querySelector(".hud-viz--wavefront [data-viz-foot]");
  const surfaceY = h * 0.26;
  const hx = w * 0.5, hy = h * 0.7;
  const mirrorY = 2 * surfaceY - hy; /* image source above surface (mirror method) */
  const speed = Math.min(w, h) * 0.00018;
  const maxR = Math.hypot(w, h);
  const rings = [];
  let acc = 0;
  const INTERVAL = 850;
  const bands = 4;

  return (dt, now) => {
    acc += dt;
    if (acc > INTERVAL) { acc = 0; rings.push({ r: 0 }); }
    for (const rg of rings) rg.r += speed * dt;
    for (let i = rings.length - 1; i >= 0; i--) if (rings[i].r > maxR) rings.splice(i, 1);

    ctx.clearRect(0, 0, w, h);

    /* earth body + sediment bands */
    ctx.fillStyle = "rgba(20,14,10,0.35)";
    ctx.fillRect(0, surfaceY, w, h - surfaceY);
    ctx.strokeStyle = "rgba(214,150,90,0.1)";
    ctx.lineWidth = 0.6;
    for (let b = 1; b <= bands; b++) {
      const yy = surfaceY + ((h - surfaceY) * b) / (bands + 1);
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.lineTo(w, yy);
      ctx.stroke();
    }

    /* wavefronts, clipped to the earth (below the surface line) */
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, surfaceY, w, h - surfaceY);
    ctx.clip();
    for (const rg of rings) {
      const r = rg.r;
      const fade = Math.max(0, 1 - r / maxR);
      ctx.beginPath();
      ctx.arc(hx, hy, r, 0, TAU);
      ctx.strokeStyle = `rgba(214,150,90,${(0.55 * fade).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      if (r > hy - surfaceY) {
        /* reflected wavefront = same radius from the mirror source, bouncing down */
        ctx.beginPath();
        ctx.arc(hx, mirrorY, r, 0, TAU);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = `rgba(120,200,210,${(0.4 * fade).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();

    /* surface line + ticks */
    ctx.strokeStyle = "rgba(180,240,244,0.7)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, surfaceY);
    ctx.lineTo(w, surfaceY);
    ctx.stroke();
    ctx.strokeStyle = "rgba(134,176,182,0.3)";
    ctx.lineWidth = 0.6;
    for (let x = 0; x < w; x += 18) { ctx.beginPath(); ctx.moveTo(x, surfaceY); ctx.lineTo(x, surfaceY - 4); ctx.stroke(); }

    /* hypocenter */
    ctx.beginPath();
    ctx.arc(hx, hy, 3 + (Math.sin(now * 0.006) * 0.5 + 0.5) * 2.5, 0, TAU);
    ctx.fillStyle = "rgba(255,190,120,0.95)";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(214,150,90,0.9)";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,200,140,0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hx - 7, hy);
    ctx.lineTo(hx + 7, hy);
    ctx.moveTo(hx, hy - 7);
    ctx.lineTo(hx, hy + 7);
    ctx.stroke();

    ctx.fillStyle = "rgba(180,240,244,0.8)";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText("SURFACE", 4, surfaceY - 6);
    ctx.fillStyle = "rgba(214,150,90,0.85)";
    ctx.fillText("HYPOCENTER", hx + 10, hy + 3);

    if (foot) {
      const amp = (Math.abs(Math.sin(now * 0.002)) * 4 + 2).toFixed(1);
      foot.textContent = `WAVEFRONTS ${rings.length} \u00b7 AMP ${amp}`;
    }
  };
}

/* --- 3. MIDGARD N-03: SDI flat 2x2 layer grid --- */
function sdiFactory({ ctx, w, h }) {
  const TAU = Math.PI * 2;
  const foot = document.querySelector(".hud-viz--sdi [data-viz-foot]");

  /* --- flat 2x2 grid geometry: A top-left, B top-right, C bottom-left, D bottom-right --- */
  const pad = 10;      /* outer padding around the whole grid  */
  const gap = 12;      /* gap between the four panes           */
  const headH = 17;    /* header strip (letter + caption)      */
  const inset = 8;     /* content inset inside each pane        */
  const cellW = (w - pad * 2 - gap) / 2;
  const cellH = (h - pad * 2 - gap) / 2;

  const PANES = [
    { key: "A", cap: "BASE MAP", col: 0, row: 0 },
    { key: "B", cap: "RASTER", col: 1, row: 0 },
    { key: "C", cap: "POLYGON", col: 0, row: 1 },
    { key: "D", cap: "POINTS", col: 1, row: 1 },
  ];
  PANES.forEach((p) => {
    p.x = pad + p.col * (cellW + gap);
    p.y = pad + p.row * (cellH + gap);
    p.bx = p.x + inset;            /* content box (below the header) */
    p.by = p.y + headH;
    p.bw = cellW - inset * 2;
    p.bh = cellH - headH - inset;
  });
  /* normalized [-1,1] -> a pane's content-box pixels */
  const NX = (p, u) => p.bx + (u * 0.5 + 0.5) * p.bw;
  const NY = (p, v) => p.by + (v * 0.5 + 0.5) * p.bh;

  /* stylized geometry in [-1,1] space, reused per layer */
  const CONT = [
    [[-0.8, -0.5], [-0.4, -0.6], [-0.2, -0.4], [-0.3, -0.1], [-0.6, -0.1], [-0.8, -0.3]],
    [[0.1, 0.0], [0.4, -0.1], [0.6, 0.2], [0.4, 0.5], [0.1, 0.5], [0.0, 0.2]],
    [[-0.2, 0.4], [0.1, 0.5], [0.0, 0.8], [-0.3, 0.8]],
  ];
  const POLY = [
    [[-0.6, -0.3], [-0.2, -0.4], [-0.1, 0.0], [-0.5, 0.1]],
    [[0.1, -0.5], [0.5, -0.4], [0.5, 0.0], [0.2, 0.0]],
    [[-0.1, 0.3], [0.3, 0.3], [0.35, 0.7], [-0.05, 0.7]],
  ];
  const PTS = Array.from({ length: 9 }, () => [
    (Math.random() * 2 - 1) * 0.82,
    (Math.random() * 2 - 1) * 0.82,
    Math.random() * TAU,
  ]);
  const RN = 6; /* raster cells per side inside pane B */
  let t = 0;

  const tracePoly = (p, poly) => {
    ctx.beginPath();
    poly.forEach(([u, v], i) => {
      const X = NX(p, u), Y = NY(p, v);
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    });
  };

  /* faint reference graticule inside a pane's content box */
  const graticule = (p, n) => {
    ctx.strokeStyle = "rgba(130,185,195,0.12)";
    ctx.lineWidth = 0.5;
    for (let k = 1; k < n; k++) {
      const gx = p.bx + (p.bw * k) / n;
      const gy = p.by + (p.bh * k) / n;
      ctx.beginPath(); ctx.moveTo(gx, p.by); ctx.lineTo(gx, p.by + p.bh); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.bx, gy); ctx.lineTo(p.bx + p.bw, gy); ctx.stroke();
    }
  };

  /* pane frame + corner bracket + header (letter + caption) */
  const chrome = (p) => {
    ctx.fillStyle = "rgba(10,22,38,0.55)";
    ctx.fillRect(p.x, p.y, cellW, cellH);
    ctx.strokeStyle = "rgba(130,185,195,0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(p.x + 0.5, p.y + 0.5, cellW - 1, cellH - 1);
    /* top-left corner bracket for the HUD feel */
    ctx.strokeStyle = "rgba(63,184,191,0.7)";
    ctx.lineWidth = 1.3;
    const tk = 8;
    ctx.beginPath();
    ctx.moveTo(p.x + 2, p.y + 2 + tk);
    ctx.lineTo(p.x + 2, p.y + 2);
    ctx.lineTo(p.x + 2 + tk, p.y + 2);
    ctx.stroke();
    /* dashed header divider */
    ctx.strokeStyle = "rgba(63,184,191,0.2)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(p.x + 6, p.y + headH - 2);
    ctx.lineTo(p.x + cellW - 6, p.y + headH - 2);
    ctx.stroke();
    ctx.setLineDash([]);
    /* label letter + small caption */
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(170,216,226,0.95)";
    ctx.font = "bold 12px monospace";
    ctx.fillText(p.key, p.x + 14, p.y + headH * 0.5 + 1);
    ctx.fillStyle = "rgba(134,176,182,0.6)";
    ctx.font = "7px monospace";
    ctx.fillText(p.cap, p.x + 26, p.y + headH * 0.5 + 1);
  };

  return (dt, now) => {
    t += dt;
    ctx.clearRect(0, 0, w, h);

    PANES.forEach((p) => {
      chrome(p);
      ctx.save();
      ctx.beginPath();
      ctx.rect(p.bx, p.by, p.bw, p.bh);
      ctx.clip();

      if (p.key === "A") {
        /* base map: graticule + glowing continent line art */
        graticule(p, 4);
        ctx.strokeStyle = "rgba(63,184,191,0.6)";
        ctx.lineWidth = 1.1;
        ctx.shadowBlur = 3;
        ctx.shadowColor = "rgba(63,184,191,0.5)";
        for (const poly of CONT) {
          tracePoly(p, poly);
          ctx.closePath();
          ctx.fillStyle = "rgba(63,184,191,0.06)";
          ctx.fill();
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      } else if (p.key === "B") {
        /* raster: shimmering multicolored grid cells */
        const cw = p.bw / RN, ch = p.bh / RN;
        for (let i = 0; i < RN; i++) {
          for (let j = 0; j < RN; j++) {
            const hue = (i * 40 + j * 23 + t * 0.02) % 360;
            const sh = 0.32 + 0.16 * Math.sin(t * 0.004 + i + j);
            ctx.fillStyle = `hsla(${hue | 0},60%,55%,${sh.toFixed(2)})`;
            ctx.fillRect(p.bx + i * cw + 0.4, p.by + j * ch + 0.4, cw - 0.8, ch - 0.8);
          }
        }
      } else if (p.key === "C") {
        /* polygon vectors: hollow glowing polygons over a faint grid */
        graticule(p, 4);
        const glow = 5 + 3 * (0.5 + 0.5 * Math.sin(t * 0.004));
        for (const poly of POLY) {
          tracePoly(p, poly);
          ctx.closePath();
          ctx.fillStyle = "rgba(63,184,191,0.07)";
          ctx.fill();
          ctx.strokeStyle = "rgba(63,184,191,0.75)";
          ctx.lineWidth = 1.4;
          ctx.shadowBlur = glow;
          ctx.shadowColor = "rgba(63,184,191,0.6)";
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      } else {
        /* point vectors: pulsing glowing nodes over a faint grid */
        graticule(p, 4);
        for (const pt of PTS) {
          const X = NX(p, pt[0]), Y = NY(p, pt[1]);
          const pulse = 0.5 + 0.5 * Math.sin(t * 0.005 + pt[2]);
          ctx.beginPath();
          ctx.arc(X, Y, 2 + pulse * 2, 0, TAU);
          ctx.fillStyle = `rgba(200,245,248,${(0.5 + 0.4 * pulse).toFixed(2)})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = "rgba(63,184,191,0.8)";
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      ctx.restore();
    });

    if (foot) foot.textContent = `SDI \u00b7 ${PTS.length} NODES \u00b7 2\u00d72 GRID`;
  };
}

function initHudViz() {
  mountViz(document.getElementById("viz-cyclo"), cycloFactory);
  mountViz(document.getElementById("viz-decay"), decayFactory);
  mountViz(document.getElementById("viz-sdi"), sdiFactory);
  mountViz(document.getElementById("viz-wavefront"), wavefrontFactory);
}

document.addEventListener("DOMContentLoaded", () => {
  initParticles();
  renderRealms();
  initHudViz();
  initReveals();
  initWorldTree();
  initEnvTransition();
  initFooter();
  initHeroMap();
  initClock();
});

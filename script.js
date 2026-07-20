/* =========================================================
   Aniket Dev Roy — Portfolio
   World-tree (Yggdrasil) layout: scroll-grown SVG trunk,
   realm nodes, cross-field background, survey map, cursor
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

/* ---------- Cross-field background ---------- */
function initCrossField() {
  const canvas = $("#cross-field");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const SPACING = 52;
  const ARM = 4;
  const RADIUS = 170;
  const BASE = { r: 122, g: 140, b: 146, a: 0.13 };
  const GLOW = { r: 63, g: 184, b: 191, a: 0.95 };

  let crosses = [];
  let w = 0;
  let h = 0;
  let mx = -9999;
  let my = -9999;
  const reactive = finePointer && !prefersReducedMotion;

  function build() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    crosses = [];
    for (let y = SPACING / 2; y < h + SPACING; y += SPACING) {
      for (let x = SPACING / 2; x < w + SPACING; x += SPACING) {
        crosses.push({ x, y, t: 0 });
      }
    }
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    for (const c of crosses) {
      const t = c.t;
      const r = BASE.r + (GLOW.r - BASE.r) * t;
      const g = BASE.g + (GLOW.g - BASE.g) * t;
      const b = BASE.b + (GLOW.b - BASE.b) * t;
      const a = BASE.a + (GLOW.a - BASE.a) * t;
      const arm = ARM * (1 + t * 0.5);

      ctx.save();
      ctx.translate(c.x, c.y);
      if (t > 0.004) ctx.rotate(t * Math.PI * 0.5);
      ctx.strokeStyle = `rgba(${r | 0},${g | 0},${b | 0},${a.toFixed(3)})`;
      if (t > 0.05) {
        ctx.shadowColor = `rgba(63,184,191,${(t * 0.8).toFixed(3)})`;
        ctx.shadowBlur = 7 * t;
      }
      ctx.beginPath();
      ctx.moveTo(-arm, 0);
      ctx.lineTo(arm, 0);
      ctx.moveTo(0, -arm);
      ctx.lineTo(0, arm);
      ctx.stroke();
      ctx.restore();
    }
  }

  function frame() {
    for (const c of crosses) {
      const d = Math.hypot(c.x - mx, c.y - my);
      const target = d < RADIUS ? 1 - d / RADIUS : 0;
      c.t += (target - c.t) * 0.14;
      if (c.t < 0.004) c.t = 0;
    }
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", build);
  build();

  if (reactive) {
    window.addEventListener("pointermove", (e) => {
      mx = e.clientX;
      my = e.clientY;
    });
    document.addEventListener("mouseleave", () => {
      mx = -9999;
      my = -9999;
    });
    requestAnimationFrame(frame);
  }
}

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
    midgard: { vx: 20, vy: -1, col: [150, 186, 176], sway: 6 }, /* misty wind, sideways  */
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

/* ---------- Custom survey-reticle cursor ---------- */
function initCursor() {
  const cursor = $("#cursor");
  if (!cursor || !finePointer) {
    if (cursor) cursor.remove();
    return;
  }
  document.documentElement.classList.add("has-cursor");

  let tx = -100, ty = -100;
  let cx = -100, cy = -100;
  const ease = prefersReducedMotion ? 1 : 0.22;

  window.addEventListener("pointermove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
    cursor.classList.add("is-visible");
  });

  document.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));
  document.addEventListener("mouseenter", () => cursor.classList.add("is-visible"));

  document.addEventListener("pointerover", (e) => {
    /* Hide the reticle over iframes: their documents own the pointer there */
    if (e.target.tagName === "IFRAME") {
      cursor.classList.remove("is-visible");
      return;
    }
    const interactive = e.target.closest("a, button, #hero-map");
    cursor.classList.toggle("is-active", Boolean(interactive));
  });

  /* When the pointer crosses into an iframe (StoryMap embeds), the parent
     document stops receiving pointer events, which used to strand the
     reticle at the frame's edge. Catch the crossing via mouseout. */
  document.addEventListener("mouseout", (e) => {
    const to = e.relatedTarget;
    if (!to || to.tagName === "IFRAME") {
      cursor.classList.remove("is-visible");
    }
  });

  window.addEventListener("pointerdown", () => cursor.classList.add("is-down"));
  window.addEventListener("pointerup", () => cursor.classList.remove("is-down"));

  (function loop() {
    cx += (tx - cx) * ease;
    cy += (ty - cy) * ease;
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(loop);
  })();
}

/* ---------- Spotlight glow following the cursor ---------- */
function initGlow() {
  if (!finePointer) return;
  $$(".glow").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--gx", `${e.clientX - rect.left}px`);
      el.style.setProperty("--gy", `${e.clientY - rect.top}px`);
    });
  });
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
  tc: { type: "globe", label: "ORBITAL TRACK // 1980\u20132016", foot: "1980 \u25b8 INIT" },
  food: { type: "grid", label: "GRID RESOLUTION MATRIX", foot: "USDA ATLAS \u27f7 OPEN CENSUS" },
  training: { type: "pipeline", label: "PIPELINE DEP. TREE", foot: "STDOUT // GEOSPATIAL CLI" },
  seismic: { type: "wave", label: "DUAL-WAVEFORM MONITOR", foot: "V_S TARGET 1.80 km/s" },
};

function vizStage(type) {
  if (type === "globe") return `<canvas id="viz-globe" class="viz-canvas"></canvas>`;
  if (type === "grid")
    return `<canvas id="viz-grid" class="viz-canvas"></canvas>
      <div class="grid-legend mono"><span class="gl gl-usda">USDA \u00b7 LO-RES</span><span class="gl gl-open">OPEN \u00b7 HI-RES</span></div>`;
  if (type === "wave") return `<canvas id="viz-wave" class="viz-canvas"></canvas>`;
  if (type === "pipeline")
    return `<div class="pipe" id="viz-pipeline"></div><div class="pipe-term mono" id="viz-term"></div>`;
  return "";
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
    midgard: { base: "#16291b", top: 0.08, bottom: 0.0 }, /* dark jungle green, glows calm  */
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

/* ---------- HUD minimap: active-realm detection + leaf slide ----------
   IntersectionObserver flags which realm containers cross the viewport centre;
   the one nearest the centre wins (handles About nested inside Roots). The
   active node glows and the leaf slides onto it; clicking scrolls there. */
function initHud() {
  const hud = $(".hud");
  if (!hud) return;
  const leaf = $(".hud-leaf", hud);
  const targets = $$(".hud-node", hud)
    .map((node) => ({ node, id: node.dataset.target, el: document.getElementById(node.dataset.target) }))
    .filter((t) => t.el);
  if (!targets.length) return;

  /* Click → smooth-scroll to the realm (honours scroll-padding + reduced motion). */
  targets.forEach((t) => {
    t.node.addEventListener("click", () => {
      t.el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    });
  });

  let activeId = null;
  const moveLeaf = (node) => {
    const y = node.offsetTop + node.offsetHeight / 2; /* layout-space: transform-proof */
    leaf.style.transform = `translate(-50%, calc(${y}px - 50%))`;
  };
  const setActive = (id) => {
    if (id === activeId) return;
    activeId = id;
    targets.forEach((t) => {
      const on = t.id === id;
      t.node.classList.toggle("is-active", on);
      if (on) {
        t.node.setAttribute("aria-current", "true");
        moveLeaf(t.node);
      } else {
        t.node.removeAttribute("aria-current");
      }
    });
    /* let decorative modules (telemetry HUD) follow the active realm */
    document.dispatchEvent(new CustomEvent("realm:change", { detail: { id } }));
  };

  /* Among realms crossing the centre band, pick the one nearest the centre. */
  const state = new Map();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => state.set(e.target.id, e.isIntersecting));
      const mid = window.innerHeight / 2;
      let best = null;
      let bestD = Infinity;
      for (const t of targets) {
        if (!state.get(t.id)) continue;
        const r = t.el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) {
          bestD = d;
          best = t.id;
        }
      }
      if (best) setActive(best);
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
  );
  targets.forEach((t) => io.observe(t.el));

  /* Seed a default before the first scroll, keep the leaf aligned on resize. */
  requestAnimationFrame(() => {
    if (!activeId) setActive(targets[0].id);
  });
  window.addEventListener("resize", () => {
    const cur = targets.find((t) => t.id === activeId);
    if (cur) moveLeaf(cur.node);
  });
}

/* ---------- Telemetry HUD: realm-driven geo-data readouts ----------
   Decorative sci-fi sidebars. On each realm change (broadcast by the minimap)
   the coordinates + metric + 3x3 matrix "spin" via a left-to-right digit
   decode, then jitter in real time to feel live. Purely cosmetic, hidden
   below xl, and skips all work when off-screen or reduced-motion. */
function initTelemetry() {
  const panelL = $(".telemetry-l");
  const tagR = $(".telemetry-r");
  if (!panelL && !tagR) return;

  const el = {
    lat: panelL && panelL.querySelector('[data-tlm="lat"]'),
    lon: panelL && panelL.querySelector('[data-tlm="lon"]'),
    mk: panelL && panelL.querySelector('[data-tlm="mk"]'),
    mv: panelL && panelL.querySelector('[data-tlm="mv"]'),
    cells: panelL ? $$(".tlm-cell", panelL) : [],
    sys: tagR && tagR.querySelector('[data-tlm="sysref"]'),
  };

  /* Per-realm readout. Third metric shifts meaning: satellite ALT (Canopy) ->
     land ELEV (Midgard) -> shear-wave V_S (Roots). Coords tie to each realm's
     project region (tropical basin / Purdue / a seismic zone). */
  const TLM = {
    canopy: { lat: [24.5551, "N"], lon: [81.78, "W"], m: ["ALT", 705.0, "km", 1], seed: 3, sys: "SYS_REF: HURSAT/NETCDF" },
    midgard: { lat: [40.4237, "N"], lon: [86.9212, "W"], m: ["ELEV", 187.0, "m", 0], seed: 7, sys: "SYS_REF: GEOPANDAS/OSM" },
    roots: { lat: [34.0522, "N"], lon: [118.2437, "W"], m: ["V_S", 1.85, "km/s", 2], seed: 5, sys: "SYS_REF: SEISMIC/V_S" },
    about: { lat: [40.4237, "N"], lon: [86.9212, "W"], m: ["MODE", "LOG", "", 0], seed: 9, sys: "SYS_REF: SURVEY/LOG" },
  };

  const mq = window.matchMedia("(min-width: 1280px)");
  const canAnimate = () => mq.matches && !prefersReducedMotion;

  /* Left-to-right decode: punctuation/spaces reveal in place; letters and
     digits scramble through glyphs until their slot is reached. Reads as a
     clean HUD "spin" to the new value. */
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const isAlnum = (c) =>
    (c >= "0" && c <= "9") || (c >= "A" && c <= "Z") || (c >= "a" && c <= "z");
  function spinTo(node, finalText) {
    if (!node) return;
    if (!canAnimate()) {
      node.textContent = finalText;
      return;
    }
    const start = performance.now();
    const dur = 460;
    const stepFn = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const reveal = Math.floor(t * finalText.length);
      let out = "";
      for (let i = 0; i < finalText.length; i++) {
        const c = finalText[i];
        if (i < reveal || !isAlnum(c)) out += c;
        else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      node.textContent = out;
      if (t < 1) requestAnimationFrame(stepFn);
      else node.textContent = finalText;
    };
    requestAnimationFrame(stepFn);
  }

  let cur = null;
  const fmtLat = () => `${cur.lat.toFixed(4)}\u00b0 ${cur.latH}`;
  const fmtLon = () => `${Math.abs(cur.lon).toFixed(4)}\u00b0 ${cur.lonH}`;
  const fmtM = () =>
    typeof cur.mv === "number" ? `${cur.mv.toFixed(cur.mdec)} ${cur.mu}`.trim() : cur.mv;

  function setRealm(id) {
    const d = TLM[id] || TLM.canopy;
    cur = {
      baseLat: d.lat[0], lat: d.lat[0], latH: d.lat[1],
      baseLon: d.lon[0], lon: d.lon[0], lonH: d.lon[1],
      mk: d.m[0], baseMv: d.m[1], mv: d.m[1], mu: d.m[2], mdec: d.m[3],
    };
    spinTo(el.lat, fmtLat());
    spinTo(el.lon, fmtLon());
    spinTo(el.mk, cur.mk);
    spinTo(el.mv, fmtM());
    el.cells.forEach((cell, i) =>
      spinTo(cell, String((d.seed * 37 + i * 53) % 1000).padStart(3, "0"))
    );
    spinTo(el.sys, d.sys);
  }

  /* Real-time jitter around each base value → a "live sensor" feel. */
  let drift = 0;
  let cellClk = 0;
  let lastTs = 0;
  function loop(ts) {
    const dt = lastTs ? ts - lastTs : 0;
    lastTs = ts;
    if (cur && canAnimate()) {
      drift += dt;
      if (drift >= 110) {
        drift = 0;
        cur.lat = cur.baseLat + (Math.random() - 0.5) * 0.0032;
        cur.lon = cur.baseLon + (Math.random() - 0.5) * 0.0032;
        if (typeof cur.mv === "number") {
          const jit = cur.mdec === 2 ? 0.03 : cur.mdec === 1 ? 0.6 : 1.6;
          cur.mv = cur.baseMv + (Math.random() - 0.5) * jit;
        }
        if (el.lat) el.lat.textContent = fmtLat();
        if (el.lon) el.lon.textContent = fmtLon();
        if (el.mv) el.mv.textContent = fmtM();
      }
      cellClk += dt;
      if (cellClk >= 850 && el.cells.length) {
        cellClk = 0;
        const i = (Math.random() * el.cells.length) | 0;
        el.cells[i].textContent = String((Math.random() * 1000) | 0).padStart(3, "0");
      }
    }
    requestAnimationFrame(loop);
  }

  setRealm("canopy");
  document.addEventListener("realm:change", (e) => setRealm(e.detail && e.detail.id));
  requestAnimationFrame(loop);
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

/* --- 1. CANOPY N-01: spinning wireframe globe + hurricane pathways --- */
function globeFactory({ ctx, w, h }) {
  const TAU = Math.PI * 2;
  const D2R = Math.PI / 180;
  const R = Math.min(w, h) * 0.4;
  const cx = w / 2;
  const cy = h * 0.5;
  const tilt = 0.4;
  let rot = -1.2;
  const Y0 = 1980;
  const Y1 = 2016;
  let year = Y0;
  let yAcc = 0;
  const foot = document.querySelector(".hud-viz--globe [data-viz-foot]");

  /* [startYear, hue, waypoints[lat,lon]] — sample historical basins */
  const TRACKS = [
    [1980, "o", [[12, -40], [15, -52], [19, -63], [24, -72], [29, -79], [33, -82]]],
    [1985, "t", [[10, -30], [13, -44], [17, -56], [22, -66], [27, -73]]],
    [1990, "t", [[14, -46], [18, -58], [23, -68], [28, -74], [32, -77]]],
    [1995, "o", [[9, -24], [12, -38], [16, -50], [21, -61], [26, -70], [31, -75]]],
    [1999, "t", [[15, -55], [20, -64], [25, -71], [30, -76], [34, -79]]],
    [2004, "o", [[11, -33], [15, -47], [20, -59], [25, -68], [29, -73]]],
    [2008, "t", [[13, -42], [17, -54], [22, -64], [27, -71], [31, -75]]],
    [2012, "t", [[16, -58], [21, -67], [26, -73], [31, -77]]],
    [2016, "o", [[10, -28], [14, -42], [19, -55], [24, -65], [28, -71], [32, -75]]],
    [1988, "t", [[12, -110], [15, -122], [19, -133], [23, -142]]],
    [2010, "t", [[14, -105], [18, -116], [22, -127], [26, -136]]],
  ];

  const proj = (latD, lonD) => {
    const lat = latD * D2R;
    const lon = lonD * D2R + rot;
    const cosc = Math.sin(tilt) * Math.sin(lat) + Math.cos(tilt) * Math.cos(lat) * Math.cos(lon);
    const x = cx + R * Math.cos(lat) * Math.sin(lon);
    const y = cy - R * (Math.cos(tilt) * Math.sin(lat) - Math.sin(tilt) * Math.cos(lat) * Math.cos(lon));
    return [x, y, cosc > 0];
  };
  const poly = (points) => {
    ctx.beginPath();
    let started = false;
    for (const [la, lo] of points) {
      const [x, y, vis] = proj(la, lo);
      if (!vis) {
        started = false;
        continue;
      }
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  return (dt, now) => {
    rot += dt * 0.00026;
    yAcc += dt;
    if (yAcc > 120) {
      yAcc = 0;
      year = year + 1 > Y1 ? Y0 : year + 1;
      if (foot) foot.textContent = `${year} \u25b8 ${year === Y0 ? "REWIND" : "ATL/PAC BASINS"}`;
    }

    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
    g.addColorStop(0, "rgba(16,32,48,0.75)");
    g.addColorStop(1, "rgba(7,16,26,0.92)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(63,184,191,0.4)";
    ctx.stroke();

    ctx.lineWidth = 0.6;
    ctx.strokeStyle = "rgba(120,180,190,0.14)";
    for (let lo = -180; lo < 180; lo += 30) {
      const pts = [];
      for (let la = -80; la <= 80; la += 6) pts.push([la, lo]);
      poly(pts);
    }
    for (let la = -60; la <= 60; la += 30) {
      const pts = [];
      for (let lo = -180; lo <= 180; lo += 6) pts.push([la, lo]);
      poly(pts);
    }

    for (const [sy, hue, pts] of TRACKS) {
      const active = sy <= year;
      const col = hue === "o" ? "214,150,90" : "63,184,191";
      ctx.lineWidth = active ? 1.6 : 0.8;
      ctx.strokeStyle = `rgba(${col},${active ? 0.75 : 0.13})`;
      ctx.shadowBlur = active ? 8 : 0;
      ctx.shadowColor = `rgba(${col},0.7)`;
      poly(pts);
      ctx.shadowBlur = 0;
      if (active) {
        const seg = (now * 0.00012) % 1;
        const idx = seg * (pts.length - 1);
        const i0 = Math.floor(idx);
        const f = idx - i0;
        const a = pts[i0];
        const b = pts[Math.min(i0 + 1, pts.length - 1)];
        const [x, y, vis] = proj(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f);
        if (vis) {
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, TAU);
          ctx.fillStyle = `rgba(${col},0.95)`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgba(${col},0.9)`;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = "rgba(63,184,191,0.22)";
    ctx.stroke();
  };
}

/* --- 2. MIDGARD N-01: async grid resolution matrix + scan bar --- */
function gridFactory({ ctx, w, h }) {
  const pad = 10;
  const gx = pad;
  const gy = pad;
  const gw = w - pad * 2;
  const gh = h - pad * 2;
  const midX = gx + gw / 2;
  const Lc = 4;
  const Lr = 6;
  const Rc = 12;
  const Rr = 18;
  let scan = -0.12;
  let seedL = 1;
  let seedR = 1;
  const foot = document.querySelector(".hud-viz--grid [data-viz-foot]");
  const rnd = (s) => {
    const x = Math.sin(s * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  const cells = (x0, cols, rows, resolvedX, warm) => {
    const cw = gw / 2 / cols;
    const ch = gh / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const xp = x0 + c * cw;
        const passed = xp < resolvedX;
        const seed = r * cols + c + (warm ? seedL : seedR) * 0.37;
        const v = rnd(seed);
        let a;
        if (warm) a = 0.12 + v * 0.5;
        else a = passed ? 0.1 + v * 0.62 : 0.05 + v * 0.14;
        ctx.fillStyle = `rgba(${warm ? "214,150,90" : "63,184,191"},${a.toFixed(3)})`;
        ctx.fillRect(xp + 0.5, gy + r * ch + 0.5, cw - 1, ch - 1);
      }
    }
    ctx.strokeStyle = warm ? "rgba(214,150,90,0.22)" : "rgba(63,184,191,0.22)";
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= cols; c++) {
      const xx = x0 + c * cw;
      ctx.beginPath();
      ctx.moveTo(xx, gy);
      ctx.lineTo(xx, gy + gh);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      const yy = gy + r * ch;
      ctx.beginPath();
      ctx.moveTo(x0, yy);
      ctx.lineTo(x0 + gw / 2, yy);
      ctx.stroke();
    }
  };

  return (dt) => {
    scan += dt * 0.00017;
    if (scan > 1.12) {
      scan = -0.12;
      seedL++;
      seedR++;
    }
    const scanX = gx + scan * gw;
    ctx.clearRect(0, 0, w, h);
    cells(gx, Lc, Lr, gx + gw, true);
    cells(midX, Rc, Rr, scanX, false);

    ctx.strokeStyle = "rgba(230,237,234,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(midX, gy);
    ctx.lineTo(midX, gy + gh);
    ctx.stroke();

    if (scanX > midX && scanX < gx + gw) {
      const grad = ctx.createLinearGradient(scanX - 24, 0, scanX + 4, 0);
      grad.addColorStop(0, "rgba(63,184,191,0)");
      grad.addColorStop(1, "rgba(63,184,191,0.3)");
      ctx.fillStyle = grad;
      ctx.fillRect(scanX - 24, gy, 24, gh);
      ctx.strokeStyle = "rgba(180,240,244,0.9)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(scanX, gy);
      ctx.lineTo(scanX, gy + gh);
      ctx.stroke();
    }

    if (foot) {
      const pct = Math.max(0, Math.min(100, Math.round(((scanX - midX) / (gw / 2)) * 100)));
      foot.textContent = `RESOLVE ${String(pct).padStart(3, " ")}%  \u00b7  \u0394res \u00d73`;
    }
  };
}

/* --- 4. ROOTS N-01: dual-waveform particle loop --- */
function waveFactory({ ctx, w, h }) {
  const TAU = Math.PI * 2;
  const pad = 12;
  const x0 = pad;
  const x1 = w - pad;
  const ww = x1 - x0;
  const topY = h * 0.34;
  const botY = h * 0.72;
  const amp = Math.min(h * 0.12, 26);
  let t = 0;
  const foot = document.querySelector(".hud-viz--wave [data-viz-foot]");
  const scat = Array.from({ length: 46 }, (_, i) => ({
    p: i / 46,
    off: Math.random() - 0.5,
    amp: 0.5 + Math.random(),
    sp: 0.6 + Math.random() * 0.9,
  }));
  const axis = (y) => {
    ctx.strokeStyle = "rgba(134,176,182,0.14)";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
  };

  return (dt) => {
    t += dt * 0.004;
    ctx.clearRect(0, 0, w, h);
    axis(topY);
    axis(botY);

    ctx.strokeStyle = "rgba(63,184,191,0.5)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let i = 0; i <= ww; i += 2) {
      const u = i / ww;
      const y =
        topY +
        Math.sin(u * 22 + t * 2.4) * amp * 0.5 +
        Math.sin(u * 51 - t * 3.1) * amp * 0.28 +
        Math.sin(u * 9 + t * 1.6) * amp * 0.3;
      i === 0 ? ctx.moveTo(x0 + i, y) : ctx.lineTo(x0 + i, y);
    }
    ctx.stroke();
    for (const s of scat) {
      const u = (s.p + t * 0.03 * s.sp) % 1;
      const px = x0 + u * ww;
      const y = topY + Math.sin(u * 40 + t * 3) * amp * s.amp * 0.6 + s.off * amp * 0.8;
      const a = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2 + s.p * 20));
      ctx.fillStyle = `rgba(120,220,228,${a.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(px, y, 1.3, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(63,184,191,0.85)";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText("PCA METHOD \u00b7 scatter", x0, topY - amp - 6);

    const vs18 = botY + amp * 0.9;
    ctx.strokeStyle = "rgba(214,150,90,0.75)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i <= ww; i += 2) {
      const u = i / ww;
      const settle = u < 0.6 ? 0 : Math.min(1, (u - 0.6) / 0.25);
      const centerY = botY + settle * (vs18 - botY);
      const y = centerY + Math.sin(u * 16 - t * 2.0) * amp * (0.6 - settle * 0.4);
      i === 0 ? ctx.moveTo(x0 + i, y) : ctx.lineTo(x0 + i, y);
    }
    ctx.stroke();
    ctx.strokeStyle = "rgba(214,150,90,0.4)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, vs18);
    ctx.lineTo(x1, vs18);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(214,150,90,0.9)";
    ctx.font = "9px monospace";
    ctx.fillText("1.8 km/s", x1 - 46, vs18 - 4);
    ctx.fillStyle = "rgba(214,150,90,0.85)";
    ctx.fillText("GRID-SEARCH \u00b7 stable", x0, botY - amp - 6);

    if (foot) {
      const v = (1.8 + Math.sin(t) * 0.02).toFixed(2);
      foot.textContent = `V_S ${v} km/s \u00b7 \u0394offset ${(Math.abs(Math.sin(t * 1.3)) * 3).toFixed(1)} ms`;
    }
  };
}

/* --- 3. MIDGARD N-03: terminal pipeline dependency tree --- */
function initPipeline() {
  const host = document.getElementById("viz-pipeline");
  const term = document.getElementById("viz-term");
  if (!host || !term) return;

  const STEPS = [
    { name: "INGEST", cmd: "gdalinfo srtm_dem.tif", out: "Size 4001\u00d74001 \u00b7 EPSG:4326" },
    { name: "REPROJECT", cmd: "gdalwarp -t_srs EPSG:5070 in.tif out.tif", out: "Creating output\u2026 100%" },
    { name: "VECTORIZE", cmd: "ogr2ogr -f GPKG tracts.gpkg tracts.shp", out: "6218 features written" },
    { name: "ANALYZE", cmd: "qgis_process run native:buffer", out: "buffer(250m) \u2192 mask.gpkg" },
    { name: "PUBLISH", cmd: "rio cogeo create out.tif cog.tif", out: "Valid COG \u2713 ovr:5" },
  ];

  const nodes = STEPS.map((s) => {
    const el = document.createElement("div");
    el.className = "pipe-node";
    el.innerHTML = `<span class="pipe-dot"></span><span class="pipe-name mono">${s.name}</span>`;
    host.appendChild(el);
    return el;
  });
  const packet = document.createElement("span");
  packet.className = "pipe-packet";
  host.appendChild(packet);

  const queue = [];
  let typing = false;
  const pump = () => {
    if (typing || !queue.length) return;
    typing = true;
    const line = queue.shift();
    const div = document.createElement("div");
    div.className = "term-line";
    term.appendChild(div);
    while (term.children.length > 6) term.removeChild(term.firstChild);
    let i = 0;
    const speed = line.instant ? 0 : 14;
    const tick = () => {
      div.textContent = (line.prefix || "") + line.text.slice(0, i);
      i++;
      if (i <= line.text.length) setTimeout(tick, speed);
      else {
        typing = false;
        pump();
      }
    };
    tick();
  };
  const emit = (s) => pump(queue.push({ prefix: "$ ", text: s.cmd }, { prefix: "  ", text: s.out }));

  let raf = 0;
  let startT = 0;
  let cycle = 0;
  let fired = STEPS.map(() => false);
  const centers = () => nodes.map((n) => n.offsetTop + n.offsetHeight / 2);

  const frame = (ts) => {
    if (!startT) startT = ts;
    const T = (ts - startT) / 4200;
    const p = T % 1;
    if (Math.floor(T) > cycle) {
      cycle = Math.floor(T);
      fired = STEPS.map(() => false);
    }
    const ys = centers();
    const top = ys[0] - 6;
    const bot = ys[ys.length - 1] + 6;
    const y = top + (bot - top) * p;
    packet.style.transform = `translate(-50%, ${y}px)`;
    packet.style.opacity = p < 0.02 || p > 0.98 ? "0" : "1";
    ys.forEach((ny, i) => {
      if (!fired[i] && y >= ny) {
        fired[i] = true;
        nodes[i].classList.add("hit");
        setTimeout(() => nodes[i].classList.remove("hit"), 600);
        emit(STEPS[i]);
      }
    });
    raf = requestAnimationFrame(frame);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !prefersReducedMotion && !raf) {
          startT = 0;
          raf = requestAnimationFrame(frame);
        } else if (!e.isIntersecting && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      });
    },
    { rootMargin: "220px 0px" }
  );
  io.observe(host);

  if (prefersReducedMotion) {
    STEPS.slice(0, 3).forEach((s) =>
      queue.push({ prefix: "$ ", text: s.cmd, instant: true }, { prefix: "  ", text: s.out, instant: true })
    );
    pump();
  }
}

function initHudViz() {
  mountViz(document.getElementById("viz-globe"), globeFactory);
  mountViz(document.getElementById("viz-grid"), gridFactory);
  mountViz(document.getElementById("viz-wave"), waveFactory);
  initPipeline();
}

document.addEventListener("DOMContentLoaded", () => {
  initCrossField();
  initParticles();
  renderRealms();
  initHudViz();
  initReveals();
  initWorldTree();
  initEnvTransition();
  initHud();
  initTelemetry();
  initFooter();
  initGlow();
  initCursor();
  initHeroMap();
  initClock();
});

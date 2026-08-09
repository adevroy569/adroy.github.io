/* ============================================================
   Geospatial Training Tutorials, app.js

   ARCHITECTURE (read this before editing)
   ------------------------------------------------------------
   Content lives in content-data.js (window.GEO_TREE) and is the
   only file you edit to change lessons. This file renders it in
   one of two modes.

   GRAPH MODE (containers wider than 1180px)
     A compact node map that fits inside one screen. Nothing
     stacks below the fold: when a node opens, its children are
     placed BESIDE it, radiating outward from the route hub.

     Layout is solved, not hard coded, in three passes:

       1. HUBS are pinned, one per route, left and right.
       2. TOPICS sit on a ring around their hub at fixed angles
          that reproduce the wireframe: QGIS puts one node west,
          one north, and three south; Python fans clockwise from
          northeast around to southwest.
       3. FANS are placed by a short search. For an open node we
          take the outward direction (hub to node), then try a
          spread of candidate angles around it. Each candidate
          lays the children out in ranks perpendicular to that
          direction and is scored on how far it pushes items out
          of bounds and how much it overlaps everything already
          placed. Lowest score wins, with a small bias toward
          staying outward so ties look natural.

     A separation relaxation then runs over every rect: overlaps
     are resolved along the axis of least penetration while each
     node springs back toward its ideal spot and hubs stay
     pinned. That is what keeps a wide fan from landing on a
     neighbouring topic, generically, instead of by hand tuned
     coordinates.

     Because the whole solve is a pure function of the open set
     and the measured sizes, the same code runs headless in the
     test suite to prove there are no collisions.

   LIST MODE (narrower containers)
     The same tree as native <details> disclosure groups, one
     open sibling per group.

   Shared modules sit in their own panel after the map with no
   connectors, since they belong to neither route.

   Bootstrapping happens in boot() at the very bottom, after
   every definition, so load order can never produce undefined
   text in the page.
   ============================================================ */

(function () {
    'use strict';

    /* ────────────────────────────────────────────────────────
       CONFIG
       ──────────────────────────────────────────────────────── */

    var GRAPH_MIN = 1240;    /* px of container needed for graph mode */
    var SOLVE_W   = 1340;    /* minimum canvas the solver lays out on  */
    var SOLVE_H   = 700;     /* narrower containers scale the map down */
    var RING      = 188;     /* hub to topic radius                   */
    var RING_OPEN = 174;     /* an open topic pulls in toward its hub  */
    var FAN_GAP   = 32;      /* clearance from a parent to its fan     */
    var BOUND_PAD = 14;      /* keep everything inside the stage       */
    var SEP_PAD   = 13;      /* breathing room between any two cards   */
    var RELAX     = 90;      /* relaxation iterations                  */

    /* Nominal sizes, used before the DOM is measurable and by the
       headless audit. Real layout measures the live elements. */
    var SIZES = {
        hub:   { w: 130, h: 130 },
        topic: { w: 158, h: 58 },
        sub:   { w: 138, h: 48 },
        leaf:  { w: 138, h: 46 }
    };

    var HUB_X = { qgis: 0.305, python: 0.695 };   /* fraction of width */
    var HUB_Y = 0.45;                              /* fraction of height */

    /* Degrees, clockwise from east, matching the wireframe. */
    var TOPIC_ANGLE = {
        'qgis-start':      -90,   /* vertical node north            */
        'qgis-carto':      179,   /* lateral node west              */
        'qgis-collection': 133,   /* three south facing nodes       */
        'qgis-raster':      91,
        'qgis-cases':       45,

        'py-collection':   -54,   /* clockwise starburst, northeast */
        'py-analysis':       2,
        'py-intro':         54,
        'py-viz':          101,
        'py-cases':        147
    };

    var START_TAG = { 'qgis-start': true, 'py-intro': true };

    /* Candidate offsets, in degrees, searched around the outward
       direction when placing a fan. */
    var CANDIDATES = [0, 24, -24, 48, -48, 74, -74, 100, -100, 128, -128, 156, -156, 180];

    /* ────────────────────────────────────────────────────────
       SHARED STATE
       ──────────────────────────────────────────────────────── */

    var tree, reg = {}, order = [];
    var open = {};
    var mode = null;
    var reduceMotion = false;

    var stage, gcanvas, gnodes, wires, mtree, tipEl, liveEl;
    var viewScale = 1;
    var pool = {};
    var ticking = false;
    var spawnTimers = {};
    var lastSolve = {};

    var DEG = Math.PI / 180;

    /* ────────────────────────────────────────────────────────
       SMALL UTILITIES
       ──────────────────────────────────────────────────────── */

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function el(tag, cls, html) {
        var node = document.createElement(tag);
        if (cls) node.className = cls;
        if (html != null) node.innerHTML = html;
        return node;
    }

    function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

    /* Icons are pure functions of local literals, so they are safe
       at any point in the load order and always produce full svg. */
    function icon(kind) {
        var head = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
        var tail = '</svg>';
        var body = {
            chev:   '<path d="M6 9l6 6 6-6"/>',
            arrow:  '<path d="M7 17L17 7M9 7h8v8"/>',
            lesson: '<path d="M12 5.5C10.5 4.3 8.6 3.8 6.5 3.8c-1.2 0-2.4.2-3.5.6v14.2c1.1-.4 2.3-.6 3.5-.6 2.1 0 4 .5 5.5 1.7 1.5-1.2 3.4-1.7 5.5-1.7 1.2 0 2.4.2 3.5.6V4.4c-1.1-.4-2.3-.6-3.5-.6-2.1 0-4 .5-5.5 1.7z"/><path d="M12 5.5v14.2"/>',
            colab:  '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M10 8.6l5 3.4-5 3.4z"/>',
            doc:    '<path d="M14 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3.5V8h4.5M9 12.5h6M9 16h6"/>',
            soon:   '<circle cx="12" cy="12" r="8.5" stroke-dasharray="3.4 3.4"/><path d="M12 8v4.4l2.8 1.7"/>'
        }[kind] || '';
        return head + body + tail;
    }

    function chipsOf(node) {
        var out = [];
        if (node.lesson) out.push({ label: 'Open the full lesson', kind: 'lesson', href: node.lesson });
        (node.links || []).forEach(function (l) { out.push(l); });
        return out;
    }

    function countLabel(node) {
        if (node.children && node.children.length) {
            var t = node.children.length;
            return t + (t === 1 ? ' topic' : ' topics');
        }
        var chips = chipsOf(node);
        if (!chips.length) return '';
        var kinds = {};
        chips.forEach(function (c) { kinds[c.kind || 'doc'] = true; });
        var n = chips.length;
        if (kinds.colab && !kinds.lesson && !kinds.doc) return n + (n === 1 ? ' notebook' : ' notebooks');
        if (kinds.lesson && !kinds.colab && !kinds.doc) return n + (n === 1 ? ' lesson' : ' lessons');
        return n + (n === 1 ? ' resource' : ' resources');
    }

    /* ────────────────────────────────────────────────────────
       REGISTRY
       Nodes and leaf chips both live here, so layout, edges and
       visibility can treat them uniformly.
       ──────────────────────────────────────────────────────── */

    function buildRegistry() {
        tree.routes.forEach(function (route) {
            add(route.id, { data: route, parentId: null, routeId: route.id, depth: 0, kind: 'hub' });
            walk(route.children, route.id, route.id, 1);
        });
        tree.shared.children.forEach(function (node) {
            add(node.id, { data: node, parentId: 'foundation', routeId: 'shared', depth: 1, kind: 'shared' });
        });

        function walk(list, parentId, routeId, depth) {
            (list || []).forEach(function (node) {
                add(node.id, {
                    data: node, parentId: parentId, routeId: routeId,
                    depth: depth, kind: depth === 1 ? 'topic' : 'sub'
                });
                walk(node.children, node.id, routeId, depth + 1);
                chipsOf(node).forEach(function (chip, i) {
                    var id = leafId(node.id, i);
                    add(id, {
                        data: chip, parentId: node.id, routeId: routeId,
                        depth: depth + 1, kind: 'leaf'
                    });
                });
            });
        }

        function add(id, entry) {
            reg[id] = entry;
            order.push(id);
        }
    }

    function leafId(parentId, i) { return 'L:' + parentId + ':' + i; }

    function siblingsOf(id) {
        var parentId = reg[id].parentId;
        return order.filter(function (other) {
            return other !== id && reg[other].parentId === parentId && reg[other].kind !== 'leaf';
        });
    }

    function descendantsOf(id) {
        var out = [];
        order.forEach(function (other) {
            var cursor = reg[other].parentId;
            while (cursor) {
                if (cursor === id) { out.push(other); break; }
                cursor = reg[cursor] ? reg[cursor].parentId : null;
            }
        });
        return out;
    }

    /* Fan order: child nodes first, then the parent's own chips. */
    function fanItems(id) {
        var entry = reg[id];
        if (!entry || entry.kind === 'leaf') return [];
        var out = [];
        (entry.data.children || []).forEach(function (c) { out.push(c.id); });
        chipsOf(entry.data).forEach(function (chip, i) { out.push(leafId(id, i)); });
        return out;
    }

    function isExpandable(id) {
        return reg[id] && reg[id].kind !== 'leaf' && fanItems(id).length > 0;
    }

    /* A node shows when every ancestor is open. */
    function visible(id, state) {
        state = state || open;
        var entry = reg[id];
        if (!entry) return false;
        if (entry.kind === 'hub') return true;
        if (entry.kind === 'shared') return true;
        var cursor = entry.parentId;
        while (cursor && cursor !== 'foundation') {
            if (!state[cursor]) return false;
            cursor = reg[cursor] ? reg[cursor].parentId : null;
        }
        return true;
    }

    /* ────────────────────────────────────────────────────────
       STATE + ACCORDION
       ──────────────────────────────────────────────────────── */

    function setOpen(id, value, state) {
        state = state || open;
        if (value) {
            if (reg[id].depth > 0) {
                siblingsOf(id).forEach(function (sib) {
                    if (state[sib]) closeBranch(sib, state);
                });
            }
            state[id] = true;
        } else {
            closeBranch(id, state);
        }
    }

    function closeBranch(id, state) {
        state = state || open;
        delete state[id];
        descendantsOf(id).forEach(function (d) { delete state[d]; });
    }

    function toggle(id) {
        var was = !!open[id];
        var focusId = document.activeElement ? document.activeElement.id : null;
        setOpen(id, !was);
        announce(id, !was);
        if (mode === 'graph') {
            refreshGraph();
            if (focusId) {
                var again = document.getElementById(focusId);
                if (again && again.focus) again.focus({ preventScroll: true });
            }
        }
        syncFoundation();
        scheduleSettle();
        return !was;
    }

    function announce(id, opened) {
        if (!liveEl) return;
        var d = reg[id].data;
        if (!opened) { liveEl.textContent = d.label + ' collapsed.'; return; }
        var n = fanItems(id).length;
        liveEl.textContent = d.label + ' expanded, showing ' + n + (n === 1 ? ' item.' : ' items.');
    }

    /* ────────────────────────────────────────────────────────
       LAYOUT SOLVER
       Pure: (width, height, sizeFn, state) -> { id: rect }.
       The same function drives the live page and the audit.
       ──────────────────────────────────────────────────────── */

    function nominalSize(id) {
        var kind = reg[id] ? reg[id].kind : 'leaf';
        return SIZES[kind] || SIZES.leaf;
    }

    function measuredSize(id) {
        var node = reg[id] && reg[id].gEl;
        if (!node) return nominalSize(id);
        var w = node.offsetWidth, h = node.offsetHeight;
        if (!w || !h) return nominalSize(id);
        return { w: w, h: h };
    }

    function solve(W, H, sizeFn, state) {
        state = state || open;
        var out = {};
        var placed = [];

        /* 1. hubs, pinned */
        tree.routes.forEach(function (route) {
            var s = sizeFn(route.id);
            var rect = {
                id: route.id, x: HUB_X[route.id] * W, y: HUB_Y * H,
                w: s.w, h: s.h, pinned: true, spring: 1
            };
            out[route.id] = rect;
            placed.push(rect);
        });

        /* 2. topics on the ring */
        tree.routes.forEach(function (route) {
            if (!state[route.id]) return;
            var hub = out[route.id];
            route.children.forEach(function (topic) {
                var a = (TOPIC_ANGLE[topic.id] == null ? 90 : TOPIC_ANGLE[topic.id]) * DEG;
                var s = sizeFn(topic.id);
                /* The open topic sits closer in, which buys its own
                   children room to expand outward without leaving
                   the stage. */
                var radius = state[topic.id] ? RING_OPEN : RING;
                var rect = {
                    id: topic.id,
                    x: hub.x + Math.cos(a) * radius,
                    y: hub.y + Math.sin(a) * radius,
                    w: s.w, h: s.h, spring: 0.34
                };
                rect.homeX = rect.x; rect.homeY = rect.y;
                out[topic.id] = rect;
                placed.push(rect);
            });
        });

        /* 3. fans, outward from the hub, deepest last */
        tree.routes.forEach(function (route) {
            if (!state[route.id]) return;
            var hub = out[route.id];
            route.children.forEach(function (topic) {
                if (!state[topic.id]) return;
                placeFan(topic.id, hub, out, placed, W, H, sizeFn);
                (topic.children || []).forEach(function (child) {
                    if (!state[child.id]) return;
                    placeFan(child.id, hub, out, placed, W, H, sizeFn);
                });
            });
        });

        relax(placed, W, H);
        return out;
    }

    /* Search candidate directions, keep the cheapest. */
    function placeFan(parentId, hub, out, placed, W, H, sizeFn) {
        var items = fanItems(parentId);
        if (!items.length) return;
        var parent = out[parentId];
        if (!parent) return;

        var base = Math.atan2(parent.y - hub.y, parent.x - hub.x);
        var best = null;

        CANDIDATES.forEach(function (offset) {
            var rects = fanRects(parent, base + offset * DEG, items, sizeFn);
            var score = scoreRects(rects, placed, W, H) + Math.abs(offset) * 0.3;
            if (!best || score < best.score) best = { score: score, rects: rects };
        });

        best.rects.forEach(function (rect) {
            rect.spring = 0.16;
            rect.homeX = rect.x; rect.homeY = rect.y;
            out[rect.id] = rect;
            placed.push(rect);
        });
    }

    /* Lay items in ranks perpendicular to the given direction. */
    function fanRects(parent, angle, items, sizeFn) {
        var dx = Math.cos(angle), dy = Math.sin(angle);
        var px = -dy, py = dx;

        var itemW = 0, itemH = 0;
        var sizes = items.map(function (id) {
            var s = sizeFn(id);
            if (s.w > itemW) itemW = s.w;
            if (s.h > itemH) itemH = s.h;
            return s;
        });

        var majorHorizontal = Math.abs(px) >= Math.abs(py);
        var gapMajor = majorHorizontal ? itemW + 18 : itemH + 18;
        var gapMinor = majorHorizontal ? itemH + 26 : itemW + 26;
        var maxPerRank = majorHorizontal ? 4 : 6;

        var n = items.length;
        var ranks = Math.ceil(n / maxPerRank);
        var perRank = Math.ceil(n / ranks);

        var reach = (Math.abs(dx) * (parent.w + itemW) + Math.abs(dy) * (parent.h + itemH)) / 2 + FAN_GAP;

        return items.map(function (id, i) {
            var rank = Math.floor(i / perRank);
            var idx = i % perRank;
            var inRank = Math.min(perRank, n - rank * perRank);
            var offset = (idx - (inRank - 1) / 2) * gapMajor;
            var out = reach + rank * gapMinor;
            return {
                id: id,
                x: parent.x + dx * out + px * offset,
                y: parent.y + dy * out + py * offset,
                w: sizes[i].w, h: sizes[i].h
            };
        });
    }

    function scoreRects(rects, placed, W, H) {
        var score = 0;
        rects.forEach(function (r) {
            var left = r.x - r.w / 2, right = r.x + r.w / 2;
            var top = r.y - r.h / 2, bottom = r.y + r.h / 2;
            if (left < BOUND_PAD)      score += (BOUND_PAD - left) * 26;
            if (right > W - BOUND_PAD) score += (right - (W - BOUND_PAD)) * 26;
            if (top < BOUND_PAD)       score += (BOUND_PAD - top) * 26;
            if (bottom > H - BOUND_PAD) score += (bottom - (H - BOUND_PAD)) * 26;

            placed.forEach(function (p) { score += overlapArea(r, p) * 0.9; });
            rects.forEach(function (o) { if (o !== r) score += overlapArea(r, o) * 0.5; });
        });
        return score;
    }

    function overlapArea(a, b) {
        var ox = Math.min(a.x + a.w / 2, b.x + b.w / 2) - Math.max(a.x - a.w / 2, b.x - b.w / 2) + SEP_PAD;
        var oy = Math.min(a.y + a.h / 2, b.y + b.h / 2) - Math.max(a.y - a.h / 2, b.y - b.h / 2) + SEP_PAD;
        return (ox > 0 && oy > 0) ? ox * oy : 0;
    }

    /* Springs toward the ideal spot, separation along the axis of
       least penetration, hard bounds. Hubs never move. */
    function relax(rects, W, H) {
        for (var it = 0; it < RELAX; it++) {
            for (var i = 0; i < rects.length; i++) {
                var r = rects[i];
                if (r.pinned || r.homeX == null) continue;
                r.x += (r.homeX - r.x) * (r.spring || 0.2) * 0.35;
                r.y += (r.homeY - r.y) * (r.spring || 0.2) * 0.35;
            }
            for (var a = 0; a < rects.length; a++) {
                for (var b = a + 1; b < rects.length; b++) {
                    separate(rects[a], rects[b]);
                }
            }
            for (var k = 0; k < rects.length; k++) {
                var q = rects[k];
                if (q.pinned) continue;
                q.x = clamp(q.x, BOUND_PAD + q.w / 2, W - BOUND_PAD - q.w / 2);
                q.y = clamp(q.y, BOUND_PAD + q.h / 2, H - BOUND_PAD - q.h / 2);
            }
        }

        /* Final pass with the springs switched off, so the last
           few pixels of penetration actually clear instead of
           being pulled back toward an ideal position. */
        for (var f = 0; f < 24; f++) {
            for (var m = 0; m < rects.length; m++) {
                for (var n = m + 1; n < rects.length; n++) {
                    separate(rects[m], rects[n]);
                }
            }
            for (var g = 0; g < rects.length; g++) {
                var z = rects[g];
                if (z.pinned) continue;
                z.x = clamp(z.x, BOUND_PAD + z.w / 2, W - BOUND_PAD - z.w / 2);
                z.y = clamp(z.y, BOUND_PAD + z.h / 2, H - BOUND_PAD - z.h / 2);
            }
        }
    }

    function separate(a, b) {
        var dx = b.x - a.x, dy = b.y - a.y;
        var ox = (a.w + b.w) / 2 + SEP_PAD - Math.abs(dx);
        var oy = (a.h + b.h) / 2 + SEP_PAD - Math.abs(dy);
        if (ox <= 0 || oy <= 0) return;

        var wa = a.pinned ? 0 : 1, wb = b.pinned ? 0 : 1;
        var total = wa + wb;
        if (!total) return;

        if (ox < oy) {
            var sx = (dx < 0 ? -1 : 1) * ox;
            a.x -= sx * (wa / total);
            b.x += sx * (wb / total);
        } else {
            var sy = (dy < 0 ? -1 : 1) * oy;
            a.y -= sy * (wa / total);
            b.y += sy * (wb / total);
        }
    }

    /* ────────────────────────────────────────────────────────
       GRAPH RENDER
       Every node and chip is built once; state drives visibility
       and the solver drives position.
       ──────────────────────────────────────────────────────── */

    function buildGraph() {
        tree.routes.forEach(function (route) {
            var hub = el('button', 'ghub ghub--' + route.accent);
            hub.type = 'button';
            hub.id = 'g-' + route.id;
            hub.dataset.tip = route.id;
            hub.setAttribute('aria-expanded', 'false');
            hub.innerHTML =
                '<span class="ghub__ring" aria-hidden="true"></span>' +
                '<span class="ghub__tagline">' + esc(route.tagline) + '</span>' +
                '<span class="ghub__label">' + esc(route.label) + '</span>' +
                '<span class="ghub__count">' + route.children.length + ' topics</span>' +
                '<span class="visually-hidden">, ' + esc(route.blurb) + '</span>';
            hub.addEventListener('click', function () { toggle(route.id); });
            gnodes.appendChild(hub);
            reg[route.id].gEl = hub;

            buildBranch(route.children, route.accent);
        });
    }

    function buildBranch(list, accent) {
        (list || []).forEach(function (node) {
            var entry = reg[node.id];
            var card = nodeCard(node, accent, entry.kind);
            gnodes.appendChild(card);
            entry.gEl = card;

            chipsOf(node).forEach(function (chip, i) {
                var id = leafId(node.id, i);
                var leaf = leafCard(chip, accent);
                leaf.id = 'g-' + id;
                leaf.classList.add('is-off');
                gnodes.appendChild(leaf);
                reg[id].gEl = leaf;
            });

            buildBranch(node.children, accent);
        });
    }

    function nodeCard(node, accent, kind) {
        var card = el('button', 'gnode gnode--' + (kind === 'topic' ? 'topic' : 'sub') + ' gnode--' + accent);
        card.type = 'button';
        card.id = 'g-' + node.id;
        card.dataset.tip = node.id;
        card.dataset.status = node.status || 'ready';
        card.classList.add('is-off');
        card.setAttribute('aria-expanded', 'false');
        card.innerHTML =
            (START_TAG[node.id] ? '<span class="gnode__start">Start here</span>' : '') +
            '<span class="gnode__title">' + esc(node.label) + '</span>' +
            '<span class="gnode__meta">' +
                '<span class="gnode__count">' + countLabel(node) + '</span>' +
                ((node.status === 'soon') ? '<span class="gnode__flag">' + icon('soon') + 'Soon</span>' : '') +
            '</span>' +
            '<span class="gnode__plus" aria-hidden="true">' + icon('chev') + '</span>' +
            '<span class="visually-hidden">, ' + esc(node.blurb || '') + '</span>';
        card.addEventListener('click', function () { toggle(node.id); });
        return card;
    }

    function leafCard(chip, accent) {
        var kind = chip.kind || 'doc';
        var host;
        if (chip.href) {
            host = el('a', 'gleaf gleaf--' + kind + ' gleaf--' + accent);
            host.href = chip.href;
            host.target = '_blank';
            host.rel = 'noopener noreferrer';
            host.innerHTML = icon(kind) +
                '<span class="gleaf__label">' + esc(chip.label) + '</span>' +
                '<span class="gleaf__ext" aria-hidden="true">' + icon('arrow') + '</span>' +
                '<span class="visually-hidden"> (opens in a new tab)</span>';
        } else {
            host = el('span', 'gleaf gleaf--soon gleaf--' + accent);
            host.innerHTML = icon('soon') + '<span class="gleaf__label">' + esc(chip.label) + '</span>';
        }
        return host;
    }

    /* Visibility, open flags, and dimming of inactive branches. */
    function refreshGraph() {
        tree.routes.forEach(function (route) {
            var routeOpen = !!open[route.id];
            var hub = reg[route.id].gEl;
            hub.setAttribute('aria-expanded', String(routeOpen));
            hub.classList.toggle('is-open', routeOpen);

            var anyTopicOpen = route.children.some(function (t) { return open[t.id]; });

            order.forEach(function (id) {
                var entry = reg[id];
                if (entry.routeId !== route.id || entry.kind === 'hub') return;
                var node = entry.gEl;
                if (!node) return;

                var show = visible(id);
                var parentRect = lastSolve[entry.parentId] || lastSolve[route.id];
                setVis(node, show, parentRect);

                if (entry.kind !== 'leaf') {
                    node.setAttribute('aria-expanded', String(!!open[id]));
                    node.classList.toggle('is-open', !!open[id]);
                }
                if (entry.kind === 'topic') {
                    node.classList.toggle('is-dim', anyTopicOpen && !open[id]);
                } else if (entry.kind === 'sub') {
                    var parentOpenChild = (reg[entry.parentId].data.children || []).some(function (c) {
                        return open[c.id];
                    });
                    node.classList.toggle('is-dim', parentOpenChild && !open[id]);
                }
            });
        });
    }

    function setVis(node, show, fromRect) {
        var id = node.id;
        if (spawnTimers[id]) { clearTimeout(spawnTimers[id]); delete spawnTimers[id]; }

        if (show) {
            if (!node.classList.contains('is-off')) return;
            if (!reduceMotion && fromRect) {
                node.style.transition = 'none';
                node.style.left = fromRect.x + 'px';
                node.style.top = fromRect.y + 'px';
                node.classList.add('is-spawning');
                void node.offsetWidth;
                node.style.transition = '';
            }
            node.classList.remove('is-off');
            spawnTimers[id] = window.setTimeout(function () {
                node.classList.remove('is-spawning');
                delete spawnTimers[id];
            }, reduceMotion ? 0 : 30);
        } else {
            if (node.classList.contains('is-off')) return;
            node.classList.add('is-spawning');
            spawnTimers[id] = window.setTimeout(function () {
                node.classList.add('is-off');
                node.classList.remove('is-spawning');
                delete spawnTimers[id];
            }, reduceMotion ? 0 : 200);
        }
    }

    /* ────────────────────────────────────────────────────────
       APPLY LAYOUT
       ──────────────────────────────────────────────────────── */

    function stageHeight() {
        var vh = window.innerHeight || 900;
        return Math.round(clamp(vh * 0.82, 620, 900));
    }

    /* The map is always solved on a canvas at least SOLVE_W by
       SOLVE_H, then scaled to fit the real container. That keeps
       the geometry that the audit verifies identical at every
       window size: narrow windows shrink the map instead of
       cramping it. */
    function applyLayout() {
        if (mode !== 'graph') return;

        var realW = stage.clientWidth || GRAPH_MIN;
        var realH = stageHeight();
        stage.style.height = realH + 'px';

        viewScale = Math.min(1, realW / SOLVE_W, realH / SOLVE_H);
        var W = realW / viewScale;
        var H = realH / viewScale;

        gcanvas.style.width = W + 'px';
        gcanvas.style.height = H + 'px';
        gcanvas.style.transform = viewScale === 1 ? 'none' : 'scale(' + viewScale + ')';
        wires.setAttribute('viewBox', '0 0 ' + rr(W) + ' ' + rr(H));

        lastSolve = solve(W, H, measuredSize, open);

        Object.keys(lastSolve).forEach(function (id) {
            var entry = reg[id];
            if (!entry || !entry.gEl) return;
            var r = lastSolve[id];
            entry.gEl.style.left = rr(r.x) + 'px';
            entry.gEl.style.top = rr(r.y) + 'px';
        });
    }

    /* ────────────────────────────────────────────────────────
       EDGES
       Short local curves only: hub to topic, and parent to each
       fan item. No trunks, and nothing runs to shared modules.
       ──────────────────────────────────────────────────────── */

    /* Edges read the solved rects, so they are exact by
       construction and need no per frame measurement. */
    function drawEdges() {
        var used = {};
        if (mode !== 'graph') { fadeUnused(used); return; }

        tree.routes.forEach(function (route) {
            if (!open[route.id]) return;
            var accent = route.accent;
            var hubR = lastSolve[route.id];
            if (!hubR) return;

            route.children.forEach(function (topic) {
                var r = lastSolve[topic.id];
                if (!r || !visible(topic.id)) return;
                curve('e-' + topic.id, hubR, r, accent, used, false);
                var a = anchor(r, hubR);
                dot('d-' + topic.id, a.x, a.y, 3.2, accent, used);
                if (open[topic.id]) fanEdges(topic.id, accent, used);
            });
        });

        fadeUnused(used);
    }

    function fanEdges(parentId, accent, used) {
        var pr = lastSolve[parentId];
        if (!pr) return;
        fanItems(parentId).forEach(function (id) {
            var entry = reg[id];
            var r = lastSolve[id];
            if (!entry || !r || !visible(id)) return;
            curve('e-' + id, pr, r, accent, used, true);
            var a = anchor(r, pr);
            dot('d-' + id, a.x, a.y, 2.6, accent, used);
            if (entry.kind !== 'leaf' && open[id]) fanEdges(id, accent, used);
        });
    }

    function anchor(from, to) {
        var dx = to.x - from.x, dy = to.y - from.y;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var scale = Math.min(from.w, from.h) * 0.5;
        return { x: from.x + dx / len * scale, y: from.y + dy / len * scale };
    }

    function curve(key, a, b, accent, used, thin) {
        var pa = anchor(a, b);
        var pb = anchor(b, a);
        var horizontal = Math.abs(pb.x - pa.x) > Math.abs(pb.y - pa.y);
        var d;
        if (horizontal) {
            var mx = (pa.x + pb.x) / 2;
            d = 'M ' + rr(pa.x) + ' ' + rr(pa.y) +
                ' C ' + rr(mx) + ' ' + rr(pa.y) + ' ' + rr(mx) + ' ' + rr(pb.y) + ' ' + rr(pb.x) + ' ' + rr(pb.y);
        } else {
            var my = (pa.y + pb.y) / 2;
            d = 'M ' + rr(pa.x) + ' ' + rr(pa.y) +
                ' C ' + rr(pa.x) + ' ' + rr(my) + ' ' + rr(pb.x) + ' ' + rr(my) + ' ' + rr(pb.x) + ' ' + rr(pb.y);
        }
        usePath(key, d, accent, thin, used);
    }

    function usePath(key, d, accent, thin, used) {
        var p = pool[key];
        if (!p) {
            p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            p.setAttribute('class', 'edge edge--' + accent + (thin ? ' edge--thin' : ''));
            p.setAttribute('pathLength', '1');
            wires.appendChild(p);
            pool[key] = p;
            if (!reduceMotion) {
                p.classList.add('is-draw');
                window.setTimeout(function () { p.classList.remove('is-draw'); }, 480);
            }
            window.requestAnimationFrame(function () { p.classList.add('is-on'); });
        } else if (!p.classList.contains('is-on')) {
            p.classList.add('is-on');
        }
        p.setAttribute('d', d);
        used[key] = true;
    }

    function dot(key, x, y, r, accent, used) {
        var c = pool[key];
        if (!c) {
            c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('class', 'edot edot--' + accent);
            c.setAttribute('r', r);
            wires.appendChild(c);
            pool[key] = c;
            window.requestAnimationFrame(function () { c.classList.add('is-on'); });
        } else if (!c.classList.contains('is-on')) {
            c.classList.add('is-on');
        }
        c.setAttribute('cx', rr(x));
        c.setAttribute('cy', rr(y));
        used[key] = true;
    }

    function fadeUnused(used) {
        Object.keys(pool).forEach(function (key) {
            if (!used[key]) pool[key].classList.remove('is-on');
        });
    }

    function rr(n) { return Math.round(n * 10) / 10; }

    /* ────────────────────────────────────────────────────────
       SETTLE LOOP
       ──────────────────────────────────────────────────────── */

    /* Layout and edges are both pure functions of the open set,
       so one pass is enough. A second pass is scheduled after
       webfonts land, since those change measured card sizes. */
    function scheduleSettle(ms) {
        applyLayout();
        drawEdges();
        if (ms && !ticking) {
            ticking = true;
            window.setTimeout(function () {
                ticking = false;
                applyLayout();
                drawEdges();
            }, ms);
        }
    }

    /* ────────────────────────────────────────────────────────
       TOOLTIP
       ──────────────────────────────────────────────────────── */

    function tipContent(id) {
        var entry = reg[id];
        var d = entry.data;
        if (entry.kind === 'leaf') {
            return '<p class="tip__title">' + esc(d.label) + '</p>' +
                   '<p class="tip__meta"><span class="tip__pill tip__pill--' +
                   (d.href ? 'ready' : 'soon') + '">' +
                   (d.href ? (d.kind === 'colab' ? 'Colab notebook' : 'Lesson page') : 'In progress') +
                   '</span></p>';
        }
        var meta = '';
        if (entry.kind === 'hub') {
            meta = '<span class="tip__pill">' + d.children.length + ' topics</span>' +
                   '<span class="tip__pill tip__pill--ready">' + esc(d.tagline) + '</span>';
        } else {
            var count = countLabel(d);
            if (count) meta += '<span class="tip__pill">' + count + '</span>';
            meta += '<span class="tip__pill tip__pill--' + (d.status === 'soon' ? 'soon' : 'ready') + '">' +
                    (d.status === 'soon' ? 'In progress' : 'Open now') + '</span>';
        }
        return '<p class="tip__title">' + esc(d.label) + '</p>' +
               (d.blurb ? '<p class="tip__blurb">' + esc(d.blurb) + '</p>' : '') +
               '<p class="tip__meta">' + meta + '</p>';
    }

    function showTip(target) {
        var id = target.dataset.tip;
        if (!id || !reg[id]) return;
        tipEl.innerHTML = tipContent(id);
        tipEl.hidden = false;

        var r = target.getBoundingClientRect();
        var tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
        var x = clamp(r.left + r.width / 2 - tw / 2, 10, (window.innerWidth || 1200) - tw - 10);
        var y = r.top - th - 12;
        if (y < 8) y = r.bottom + 12;
        tipEl.style.left = x + 'px';
        tipEl.style.top = (y + (window.scrollY || 0)) + 'px';
        tipEl.classList.add('is-on');
    }

    function hideTip() {
        tipEl.classList.remove('is-on');
        tipEl.hidden = true;
    }

    function initTips() {
        document.addEventListener('pointerover', function (e) {
            var t = e.target.closest ? e.target.closest('[data-tip]') : null;
            if (t) showTip(t);
        });
        document.addEventListener('pointerout', function (e) {
            var t = e.target.closest ? e.target.closest('[data-tip]') : null;
            if (t) hideTip();
        });
        document.addEventListener('focusin', function (e) {
            var t = e.target.closest ? e.target.closest('[data-tip]') : null;
            if (t) showTip(t); else hideTip();
        });
        window.addEventListener('scroll', hideTip, { passive: true });
    }

    /* ────────────────────────────────────────────────────────
       SHARED MODULES PANEL
       ──────────────────────────────────────────────────────── */

    function buildFoundation() {
        var deck = document.getElementById('foundation-deck');
        var list = document.getElementById('foundation-list');
        if (deck) deck.textContent = tree.shared.blurb;
        if (!list) return;

        tree.shared.children.forEach(function (node) {
            var li = el('li', 'fcard');
            li.dataset.status = node.status || 'ready';

            var head = el('button', 'fcard__head');
            head.type = 'button';
            head.id = 'g-' + node.id;
            head.dataset.tip = node.id;
            head.setAttribute('aria-expanded', 'false');
            head.setAttribute('aria-controls', 'fk-' + node.id);
            head.innerHTML =
                '<span class="gnode__title">' + esc(node.label) + '</span>' +
                '<span class="gnode__blurb">' + esc(node.blurb || '') + '</span>' +
                '<span class="gnode__meta">' +
                    '<span class="gnode__count">' + countLabel(node) + '</span>' +
                    ((node.status === 'soon') ? '<span class="gnode__flag">' + icon('soon') + 'In progress</span>' : '') +
                '</span>' +
                '<span class="gnode__plus" aria-hidden="true">' + icon('chev') + '</span>';

            var kids = el('div', 'fcard__kids');
            kids.id = 'fk-' + node.id;
            kids.hidden = true;
            var row = el('div', 'frow');
            chipsOf(node).forEach(function (chip) {
                row.appendChild(leafCard(chip, 'shared'));
            });
            kids.appendChild(row);

            head.addEventListener('click', function () { toggle(node.id); });

            li.appendChild(head);
            li.appendChild(kids);
            list.appendChild(li);
            reg[node.id].fEl = { li: li, head: head, kids: kids };
        });
    }

    function syncFoundation() {
        tree.shared.children.forEach(function (node) {
            var f = reg[node.id].fEl;
            if (!f) return;
            var isOpen = !!open[node.id];
            f.head.setAttribute('aria-expanded', String(isOpen));
            f.kids.hidden = !isOpen;
            f.li.classList.toggle('is-open', isOpen);
        });
    }

    /* ────────────────────────────────────────────────────────
       LIST MODE
       ──────────────────────────────────────────────────────── */

    function buildList() {
        tree.routes.forEach(function (route) {
            var d = el('details', 'mroute mroute--' + route.accent);
            d.id = 'm-' + route.id;
            d.appendChild(el('summary', 'mroute__head',
                '<span class="mroute__tag">' + esc(route.tagline) + '</span>' +
                '<span class="mroute__name">' + esc(route.label) + '</span>' +
                '<span class="mroute__count">' + route.children.length + ' topics</span>' +
                '<span class="gnode__plus" aria-hidden="true">' + icon('chev') + '</span>'));
            var inner = el('div', 'mroute__body');
            route.children.forEach(function (topic) {
                inner.appendChild(listNode(topic, route.accent));
            });
            d.appendChild(inner);
            mtree.appendChild(d);
        });
        enforceListAccordion(mtree);
    }

    function listNode(node, accent) {
        var chips = chipsOf(node);
        var hasKids = (node.children && node.children.length) || chips.length;

        if (!hasKids) {
            return el('div', 'mnode mnode--flat',
                '<span class="gnode__title">' + esc(node.label) + '</span>' +
                '<span class="gnode__flag">' + icon('soon') + 'In progress</span>');
        }

        var d = el('details', 'mnode mnode--' + accent);
        d.id = 'm-' + node.id;
        d.dataset.status = node.status || 'ready';
        d.appendChild(el('summary', 'mnode__head',
            (START_TAG[node.id] ? '<span class="gnode__start">Start here</span>' : '') +
            '<span class="gnode__title">' + esc(node.label) + '</span>' +
            (node.blurb ? '<span class="gnode__blurb">' + esc(node.blurb) + '</span>' : '') +
            '<span class="gnode__meta"><span class="gnode__count">' + countLabel(node) + '</span>' +
            ((node.status === 'soon') ? '<span class="gnode__flag">' + icon('soon') + 'In progress</span>' : '') +
            '</span>' +
            '<span class="gnode__plus" aria-hidden="true">' + icon('chev') + '</span>'));

        var body = el('div', 'mnode__body');
        (node.children || []).forEach(function (child) {
            body.appendChild(listNode(child, accent));
        });
        if (chips.length) {
            var row = el('div', 'frow');
            chips.forEach(function (chip) { row.appendChild(leafCard(chip, accent)); });
            body.appendChild(row);
        }
        d.appendChild(body);
        return d;
    }

    function enforceListAccordion(root) {
        root.addEventListener('toggle', function (e) {
            var target = e.target;
            if (!target.open || target.tagName !== 'DETAILS') return;
            var parent = target.parentElement;
            Array.prototype.forEach.call(parent.children, function (sib) {
                if (sib !== target && sib.tagName === 'DETAILS' && sib.open) sib.open = false;
            });
        }, true);
    }

    /* ────────────────────────────────────────────────────────
       MODE SWITCHING
       The display flags are set inline as well as in CSS, so a
       stylesheet rule can never leave one mode showing through
       the other.
       ──────────────────────────────────────────────────────── */

    function pickMode() {
        var wantGraph = document.documentElement.clientWidth >= GRAPH_MIN;
        var next = wantGraph ? 'graph' : 'list';
        if (next === mode) return;
        mode = next;

        document.body.classList.toggle('mode-graph', mode === 'graph');
        document.body.classList.toggle('mode-list', mode === 'list');

        mtree.hidden = mode !== 'list';
        mtree.style.display = mode === 'list' ? '' : 'none';
        stage.style.display = mode === 'graph' ? '' : 'none';

        if (mode === 'graph') {
            refreshGraph();
            scheduleSettle(900);
        }
    }

    /* ────────────────────────────────────────────────────────
       DEEP LINKS + KEYS
       ──────────────────────────────────────────────────────── */

    function openFromHash() {
        var hash = window.location.hash.replace('#', '').replace(/^node-/, '');
        if (!hash || !reg[hash]) return;

        var chain = [];
        var cursor = hash;
        while (cursor && reg[cursor]) {
            chain.unshift(cursor);
            cursor = reg[cursor].parentId;
            if (cursor === 'foundation') cursor = null;
        }
        chain.forEach(function (id) {
            if (isExpandable(id)) setOpen(id, true);
        });
        syncFoundation();

        if (mode === 'graph') {
            refreshGraph();
        } else {
            chain.forEach(function (id) {
                var d = document.getElementById('m-' + id);
                if (d && d.tagName === 'DETAILS') d.open = true;
            });
        }
        scheduleSettle(900);

        window.setTimeout(function () {
            var target = document.getElementById((mode === 'graph' ? 'g-' : 'm-') + hash) ||
                         document.getElementById('g-' + hash);
            if (target) {
                target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
                if (target.focus) target.focus({ preventScroll: true });
            }
        }, 140);
    }

    function initKeys() {
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            hideTip();
            var deepest = null, depth = -1;
            Object.keys(open).forEach(function (id) {
                if (reg[id] && reg[id].depth > depth) { depth = reg[id].depth; deepest = id; }
            });
            if (deepest) {
                setOpen(deepest, false);
                syncFoundation();
                if (mode === 'graph') refreshGraph();
                scheduleSettle();
            }
        });
    }

    /* ────────────────────────────────────────────────────────
       PAGE TRANSITIONS
       ──────────────────────────────────────────────────────── */

    function initPageTransitions() {
        var page = document.querySelector('.page');
        if (!page || reduceMotion) return;

        document.addEventListener('click', function (event) {
            var link = event.target.closest ? event.target.closest('.nav__link') : null;
            if (!link) return;
            if (link.getAttribute('aria-current') === 'page') return;
            if (link.target === '_blank') return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
            if (link.origin !== window.location.origin) return;

            event.preventDefault();
            var destination = link.href;
            var settled = false;

            page.style.transition = 'opacity 220ms ease, transform 220ms ease';
            page.style.opacity = '0';
            page.style.transform = 'translateY(-10px)';

            function go() {
                if (settled) return;
                settled = true;
                window.location.href = destination;
            }
            page.addEventListener('transitionend', go, { once: true });
            window.setTimeout(go, 320);
        });
    }

    /* ────────────────────────────────────────────────────────
       AUDIT
       Runs the solver across every reachable open state and
       reports overlaps or out of bounds placement. Pure, so the
       test suite can call it without a real browser.
       ──────────────────────────────────────────────────────── */

    function auditLayout(W, H) {
        var problems = [];

        function trial(label, state) {
            var res = solve(W, H, nominalSize, state);
            var ids = Object.keys(res).filter(function (id) { return visible(id, state); });
            ids.forEach(function (id) {
                var r = res[id];
                if (r.x - r.w / 2 < BOUND_PAD - 2 || r.x + r.w / 2 > W - BOUND_PAD + 2 ||
                    r.y - r.h / 2 < BOUND_PAD - 2 || r.y + r.h / 2 > H - BOUND_PAD + 2) {
                    problems.push(label + ': ' + id + ' out of bounds');
                }
            });
            for (var i = 0; i < ids.length; i++) {
                for (var k = i + 1; k < ids.length; k++) {
                    var a = res[ids[i]], b = res[ids[k]];
                    var ox = Math.min(a.x + a.w / 2, b.x + b.w / 2) - Math.max(a.x - a.w / 2, b.x - b.w / 2);
                    var oy = Math.min(a.y + a.h / 2, b.y + b.h / 2) - Math.max(a.y - a.h / 2, b.y - b.h / 2);
                    if (ox > 2 && oy > 2) {
                        problems.push(label + ': ' + ids[i] + ' overlaps ' + ids[k] +
                                      ' by ' + Math.round(ox) + 'x' + Math.round(oy));
                    }
                }
            }
        }

        tree.routes.forEach(function (route) {
            route.children.forEach(function (topic) {
                var base = {};
                base[route.id] = true; base[topic.id] = true;
                trial(topic.id, base);
                (topic.children || []).forEach(function (child) {
                    var deep = {};
                    deep[route.id] = true; deep[topic.id] = true; deep[child.id] = true;
                    trial(child.id, deep);
                });
            });
        });

        tree.routes[0].children.forEach(function (a) {
            tree.routes[1].children.forEach(function (b) {
                var both = { qgis: true, python: true };
                both[a.id] = true; both[b.id] = true;
                trial('both ' + a.id + ' + ' + b.id, both);
            });
        });

        return problems;
    }

    /* ────────────────────────────────────────────────────────
       BOOT (always last, so nothing above can be undefined)
       ──────────────────────────────────────────────────────── */

    function boot() {
        tree = window.GEO_TREE;
        if (!tree) return;

        try {
            reduceMotion = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (err) { reduceMotion = false; }

        stage   = document.getElementById('stage');
        gcanvas = document.getElementById('gcanvas');
        gnodes  = document.getElementById('gnodes');
        wires  = document.getElementById('wires');
        mtree  = document.getElementById('mobile-tree');
        tipEl  = document.getElementById('tip');
        liveEl = document.getElementById('a11y-status');
        if (!stage || !gcanvas || !gnodes || !wires || !mtree) return;

        buildRegistry();
        buildFoundation();
        buildGraph();
        buildList();
        initTips();
        initKeys();
        initPageTransitions();

        pickMode();
        window.addEventListener('resize', function () {
            pickMode();
            scheduleSettle(360);
        });
        window.addEventListener('load', function () { scheduleSettle(400); });
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () { scheduleSettle(400); });
        }

        openFromHash();
        window.addEventListener('hashchange', openFromHash);
        scheduleSettle(900);

        if (document.body.textContent.indexOf('undefined') !== -1) {
            if (window.console && console.error) {
                console.error('Geospatial Training: template text leak detected.');
            }
        }

        window.__geoAudit = auditLayout;
        window.__geoSolve = function (W, H, state) { return solve(W, H, nominalSize, state); };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();

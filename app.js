/* ============================================================
   Geospatial Training Tutorials, app.js

   ARCHITECTURE (read this before editing)
   ------------------------------------------------------------
   Content lives in content-data.js (window.GEO_TREE) and is the
   only file you edit to change lessons. This file renders it in
   one of two modes:

   GRAPH MODE (containers wider than 1180px)
     A node map on a virtual canvas 1520 units wide. X positions
     scale with the container; Y positions are absolute pixels,
     so cards keep a constant readable size and the page simply
     grows taller as branches open.

     . Two hubs (QGIS left, Python right) plus five topic cards
       each, hand placed to match the wireframe: QGIS has one
       lateral node west, one vertical node north, three south;
       Python fans clockwise from northeast to southwest.
     . Two topics keep satellite fans (QGIS Getting Started
       floats micro chips above itself; Cartography radiates
       leaves beside itself). Every other topic opens into its
       route's BAND: a flex row cluster below the cluster, so
       any number of future children wrap safely with zero
       overlap by construction.
     . Edges are SVG paths pooled by key. Anchors are measured
       from live DOM rects every animation frame inside a short
       window after any change, so lines track motion. New paths
       draw themselves in using the pathLength="1" trick, which
       normalizes dash math regardless of real length. Trunk
       outlines hug each route's live bounding box, sweep down
       the outside, and converge on the Common Ground junction.

   LIST MODE (narrower containers)
     The same tree as native <details> disclosure groups. One
     open sibling per group is enforced on toggle.

   State is a single Set of open node ids with an accordion
   invariant kept by toggle(). Layout, edges, and stage height
   all derive from that Set plus measured rects. Bootstrapping
   happens in boot() at the very bottom of the file, after every
   definition, so load order can never produce undefined text.
   ============================================================ */

(function () {
    'use strict';

    /* ────────────────────────────────────────────────────────
       CONFIG
       ──────────────────────────────────────────────────────── */

    var VIRTUAL_W  = 1520;   /* virtual canvas width               */
    var GRAPH_MIN  = 1180;   /* container px needed for graph mode */
    var HUB_R      = 84;
    var EDGE_PAD   = 12;     /* stage inner margin                 */
    var SETTLE_MS  = 760;    /* rAF window after any change        */

    var HUB_POS = {
        qgis:   { x: 400,  y: 330 },
        python: { x: 1120, y: 330 }
    };

    /* Topic cards: x is virtual, y is absolute px.
       QGIS: west, north, and three south nodes.
       Python: clockwise starburst NE, E, SE, S, SW. */
    var TOPIC_POS = {
        'qgis-carto':      { x: 150,  y: 345 },
        'qgis-start':      { x: 400,  y: 190 },
        'qgis-collection': { x: 270,  y: 645 },
        'qgis-raster':     { x: 490,  y: 722 },
        'qgis-cases':      { x: 640,  y: 600 },

        'py-collection':   { x: 1330, y: 170 },
        'py-analysis':     { x: 1369, y: 372 },
        'py-intro':        { x: 1272, y: 560 },
        'py-viz':          { x: 1040, y: 660 },
        'py-cases':        { x: 890,  y: 520 }
    };

    /* Satellite fans: px offsets from the topic center.
       Everything else expands into the route band. */
    var FANS = {
        'qgis-start': [ [-150, -88], [150, -88], [-230, -146], [230, -146] ],
        'qgis-carto': [ [-58, 110], [6, 166], [70, 222] ]
    };

    var START_TAG = { 'qgis-start': true, 'py-intro': true };

    var CARD_W = 200, CARD_H = 74;      /* topic card estimate  */
    var SUB_W  = 176;                    /* band card width      */
    var CHIP_H = 46;

    /* ────────────────────────────────────────────────────────
       SHARED STATE
       ──────────────────────────────────────────────────────── */

    var tree, reg = {}, order = [];      /* registry by id       */
    var open = {};                       /* id -> true when open */
    var mode = null;                     /* 'graph' | 'list'     */
    var reduceMotion = false;

    var stage, gnodes, wires, foundationEl, junctionEl, mtree, tipEl, liveEl;
    var routeBands = {};                 /* routeId -> band el   */
    var pool = {};                       /* edge pools           */
    var settleUntil = 0, ticking = false;
    var spawnTimers = {};

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

    function nowMs() {
        return (window.performance && performance.now) ? performance.now() : Date.now();
    }

    function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

    /* Icons are pure functions of local literals: safe at any
       point in the load order, and always produce a full svg. */
    function icon(kind) {
        var open_ = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
        var close = '</svg>';
        var body = {
            chev:   '<path d="M6 9l6 6 6-6"/>',
            arrow:  '<path d="M7 17L17 7M9 7h8v8"/>',
            lesson: '<path d="M12 5.5C10.5 4.3 8.6 3.8 6.5 3.8c-1.2 0-2.4.2-3.5.6v14.2c1.1-.4 2.3-.6 3.5-.6 2.1 0 4 .5 5.5 1.7 1.5-1.2 3.4-1.7 5.5-1.7 1.2 0 2.4.2 3.5.6V4.4c-1.1-.4-2.3-.6-3.5-.6-2.1 0-4 .5-5.5 1.7z"/><path d="M12 5.5v14.2"/>',
            colab:  '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M10 8.6l5 3.4-5 3.4z"/>',
            doc:    '<path d="M14 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3.5V8h4.5M9 12.5h6M9 16h6"/>',
            soon:   '<circle cx="12" cy="12" r="8.5" stroke-dasharray="3.4 3.4"/><path d="M12 8v4.4l2.8 1.7"/>'
        }[kind] || '';
        return open_ + body + close;
    }

    /* Chip list = optional lesson shortcut + explicit links */
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
       ──────────────────────────────────────────────────────── */

    function buildRegistry() {
        tree.routes.forEach(function (route) {
            reg[route.id] = { data: route, parentId: null, routeId: route.id, depth: 0 };
            order.push(route.id);
            walk(route.children, route.id, route.id, 1);
        });
        tree.shared.children.forEach(function (node) {
            reg[node.id] = { data: node, parentId: 'foundation', routeId: 'shared', depth: 1 };
            order.push(node.id);
        });

        function walk(list, parentId, routeId, depth) {
            (list || []).forEach(function (node) {
                reg[node.id] = { data: node, parentId: parentId, routeId: routeId, depth: depth };
                order.push(node.id);
                walk(node.children, node.id, routeId, depth + 1);
            });
        }
    }

    function siblingsOf(id) {
        var parentId = reg[id].parentId;
        return order.filter(function (other) {
            return other !== id && reg[other].parentId === parentId;
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

    function isExpandable(id) {
        var d = reg[id].data;
        return !!((d.children && d.children.length) || chipsOf(d).length) || reg[id].depth === 0;
    }

    /* ────────────────────────────────────────────────────────
       STATE + ACCORDION
       ──────────────────────────────────────────────────────── */

    function setOpen(id, value) {
        if (value) {
            /* Hubs are independent; accordion applies below them */
            if (reg[id].depth > 0) {
                siblingsOf(id).forEach(function (sib) { if (open[sib]) closeBranch(sib); });
            }
            open[id] = true;
        } else {
            closeBranch(id);
        }
    }

    function closeBranch(id) {
        delete open[id];
        descendantsOf(id).forEach(function (d) { delete open[d]; });
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
        scheduleSettle();
        return !was;
    }

    function announce(id, opened) {
        if (!liveEl) return;
        var d = reg[id].data;
        if (!opened) { liveEl.textContent = d.label + ' collapsed.'; return; }
        var n = (d.children && d.children.length) || chipsOf(d).length;
        liveEl.textContent = d.label + ' expanded, showing ' + n + (n === 1 ? ' item.' : ' items.');
    }

    /* ────────────────────────────────────────────────────────
       GRAPH RENDER (built once, visibility driven by state)
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

            route.children.forEach(function (topic) {
                var card = topicCard(topic, route);
                gnodes.appendChild(card);
                reg[topic.id].gEl = card;

                if (FANS[topic.id]) {
                    reg[topic.id].fanEls = chipsOf(topic).map(function (chip, i) {
                        var leaf = leafEl(chip, route.accent, 'gleaf--sat');
                        leaf.classList.add('is-off');
                        gnodes.appendChild(leaf);
                        return leaf;
                    });
                }
            });

            var band = el('div', 'gband gband--' + route.accent);
            band.id = 'band-' + route.id;
            band.hidden = true;
            gnodes.appendChild(band);
            routeBands[route.id] = band;
        });
    }

    function topicCard(topic, route) {
        var card = el('button', 'gnode gnode--topic gnode--' + route.accent);
        card.type = 'button';
        card.id = 'g-' + topic.id;
        card.dataset.tip = topic.id;
        card.dataset.status = topic.status || 'ready';
        card.classList.add('is-off');
        if (topic.id === 'qgis-carto') card.classList.add('gnode--emit');
        card.setAttribute('aria-expanded', 'false');
        card.innerHTML =
            (START_TAG[topic.id] ? '<span class="gnode__start">Start here</span>' : '') +
            '<span class="gnode__title">' + esc(topic.label) + '</span>' +
            '<span class="gnode__meta">' +
                '<span class="gnode__count">' + countLabel(topic) + '</span>' +
                ((topic.status === 'soon') ? '<span class="gnode__flag">' + icon('soon') + 'In progress</span>' : '') +
            '</span>' +
            '<span class="gnode__plus" aria-hidden="true">' + icon('chev') + '</span>' +
            '<span class="visually-hidden">, ' + esc(topic.blurb || '') + '</span>';
        card.addEventListener('click', function () { toggle(topic.id); });
        return card;
    }

    function subCard(node, accent) {
        var card = el('button', 'gnode gnode--sub gnode--' + accent);
        card.type = 'button';
        card.id = 'g-' + node.id;
        card.dataset.tip = node.id;
        card.dataset.status = node.status || 'ready';
        card.setAttribute('aria-expanded', open[node.id] ? 'true' : 'false');
        if (open[node.id]) card.classList.add('is-open');
        card.innerHTML =
            '<span class="gnode__title">' + esc(node.label) + '</span>' +
            '<span class="gnode__meta">' +
                '<span class="gnode__count">' + countLabel(node) + '</span>' +
                ((node.status === 'soon') ? '<span class="gnode__flag">' + icon('soon') + 'In progress</span>' : '') +
            '</span>' +
            '<span class="gnode__plus" aria-hidden="true">' + icon('chev') + '</span>' +
            '<span class="visually-hidden">, ' + esc(node.blurb || '') + '</span>';
        card.addEventListener('click', function () { toggle(node.id); });
        return card;
    }

    function leafEl(chip, accent, extra) {
        var kind = chip.kind || 'doc';
        var host;
        if (chip.href) {
            host = el('a', 'gleaf gleaf--' + kind + ' gleaf--' + accent + (extra ? ' ' + extra : ''));
            host.href = chip.href;
            host.target = '_blank';
            host.rel = 'noopener noreferrer';
            host.innerHTML = icon(kind) +
                '<span class="gleaf__label">' + esc(chip.label) + '</span>' +
                '<span class="gleaf__ext" aria-hidden="true">' + icon('arrow') + '</span>' +
                '<span class="visually-hidden"> (opens in a new tab)</span>';
        } else {
            host = el('span', 'gleaf gleaf--soon gleaf--' + accent + (extra ? ' ' + extra : ''));
            host.innerHTML = icon('soon') + '<span class="gleaf__label">' + esc(chip.label) + '</span>';
        }
        return host;
    }

    /* Rebuild the band content for one route from open state */
    function fillBand(routeId) {
        var band = routeBands[routeId];
        var route = reg[routeId].data;
        var openTopic = null;
        route.children.forEach(function (t) {
            if (open[t.id] && !FANS[t.id]) openTopic = t;
        });

        band.innerHTML = '';
        if (!openTopic) { band.hidden = true; return; }
        band.hidden = false;

        var label = el('p', 'gband__label',
            esc(openTopic.label) + ' <span>' + esc(countLabel(openTopic)) + '</span>');
        band.appendChild(label);

        var row1 = el('div', 'gband__row');
        band.appendChild(row1);

        if (openTopic.children && openTopic.children.length) {
            openTopic.children.forEach(function (child) {
                row1.appendChild(subCard(child, route.accent));
            });
            if (openTopic.lesson) {
                row1.appendChild(leafEl(
                    { label: 'Open the full lesson', kind: 'lesson', href: openTopic.lesson },
                    route.accent));
            }
            var openChild = null;
            openTopic.children.forEach(function (c) { if (open[c.id]) openChild = c; });
            if (openChild) {
                var row2 = el('div', 'gband__row gband__row--leaves');
                chipsOf(openChild).forEach(function (chip) {
                    row2.appendChild(leafEl(chip, route.accent));
                });
                band.appendChild(row2);
                reg[openChild.id].leafRow = row2;
            }
        } else {
            chipsOf(openTopic).forEach(function (chip) {
                row1.appendChild(leafEl(chip, route.accent));
            });
        }
        reg[openTopic.id].bandRow = row1;

        /* Stagger index for the rise animation */
        var i = 0;
        Array.prototype.forEach.call(band.querySelectorAll('.gband__row > *'), function (item) {
            item.style.setProperty('--i', i++);
        });
    }

    /* Push open/closed classes to the built DOM */
    function refreshGraph() {
        tree.routes.forEach(function (route) {
            var routeOpen = !!open[route.id];
            var hub = reg[route.id].gEl;
            hub.setAttribute('aria-expanded', String(routeOpen));
            hub.classList.toggle('is-open', routeOpen);

            route.children.forEach(function (topic) {
                var entry = reg[topic.id];
                var card = entry.gEl;
                var show = routeOpen;
                setVis(card, show, HUB_POS[route.id]);
                card.setAttribute('aria-expanded', String(!!open[topic.id]));
                card.classList.toggle('is-open', !!open[topic.id]);

                if (entry.fanEls) {
                    var fanShow = show && !!open[topic.id];
                    entry.fanEls.forEach(function (leaf, i) {
                        setVis(leaf, fanShow, TOPIC_POS[topic.id], 60 + i * 55);
                    });
                }
            });

            fillBand(route.id);
        });
        layoutFoundationSoon();
    }

    /* Show or hide an absolutely positioned node with a spawn
       from its parent position. */
    function setVis(node, show, fromVirtual, delay) {
        var id = node.id;
        if (spawnTimers[id]) { clearTimeout(spawnTimers[id]); delete spawnTimers[id]; }

        if (show) {
            if (!node.classList.contains('is-off')) return;
            if (!reduceMotion && fromVirtual) {
                var p = toPx(fromVirtual.x, fromVirtual.y);
                node.style.transition = 'none';
                node.style.left = p.x + 'px';
                node.style.top = p.y + 'px';
                node.classList.add('is-spawning');
                void node.offsetWidth;
                node.style.transition = '';
            }
            node.classList.remove('is-off');
            spawnTimers[id] = window.setTimeout(function () {
                node.classList.remove('is-spawning');
                node.style.transitionDelay = '';
                delete spawnTimers[id];
            }, reduceMotion ? 0 : 40 + (delay || 0));
            if (delay && !reduceMotion) node.style.transitionDelay = delay + 'ms';
            else node.style.transitionDelay = '';
        } else {
            node.style.transitionDelay = '';
            if (node.classList.contains('is-off')) return;
            node.classList.add('is-spawning');
            spawnTimers[id] = window.setTimeout(function () {
                node.classList.add('is-off');
                node.classList.remove('is-spawning');
                delete spawnTimers[id];
            }, reduceMotion ? 0 : 220);
        }
    }

    /* ────────────────────────────────────────────────────────
       LAYOUT
       ──────────────────────────────────────────────────────── */

    function stageW() { return stage.clientWidth; }
    function scaleX() { return stageW() / VIRTUAL_W; }

    function toPx(vx, y) { return { x: vx * scaleX(), y: y }; }

    function positionAll() {
        var s = scaleX();
        var w = stageW();

        tree.routes.forEach(function (route) {
            var hp = HUB_POS[route.id];
            place(reg[route.id].gEl, hp.x * s, hp.y);

            route.children.forEach(function (topic) {
                var tp = TOPIC_POS[topic.id] || { x: hp.x, y: hp.y + 260 };
                var px = clamp(tp.x * s, EDGE_PAD + CARD_W / 2, w - EDGE_PAD - CARD_W / 2);
                place(reg[topic.id].gEl, px, tp.y);

                var fans = FANS[topic.id];
                if (fans && reg[topic.id].fanEls) {
                    reg[topic.id].fanEls.forEach(function (leaf, i) {
                        var off = fans[i] || [0, 120 + i * 56];
                        var half = Math.min(leaf.offsetWidth / 2 || 110, 130);
                        var lx = clamp(px + off[0], EDGE_PAD + half, w - EDGE_PAD - half);
                        var ly = Math.max(tp.y + off[1], 26);
                        place(leaf, lx, ly);
                    });
                }
            });
        });

        /* Bands sit under their route's half, below all cards and fans */
        var bottoms = { qgis: 0, python: 0 };
        tree.routes.forEach(function (route) {
            var b = HUB_POS[route.id].y + HUB_R;
            route.children.forEach(function (topic) {
                if (!open[route.id]) return;
                var tp = TOPIC_POS[topic.id];
                if (tp) b = Math.max(b, tp.y + CARD_H / 2);
                if (FANS[topic.id] && open[topic.id]) {
                    FANS[topic.id].forEach(function (off) {
                        b = Math.max(b, tp.y + off[1] + CHIP_H / 2);
                    });
                }
            });
            bottoms[route.id] = b;
        });
        var bandTop = Math.max(bottoms.qgis, bottoms.python) + 62;

        var half = w / 2;
        Object.keys(routeBands).forEach(function (routeId) {
            var band = routeBands[routeId];
            band.style.top = bandTop + 'px';
            if (routeId === 'qgis') {
                band.style.left = EDGE_PAD + 'px';
                band.style.width = (half - EDGE_PAD - 14) + 'px';
            } else {
                band.style.left = (half + 14) + 'px';
                band.style.width = (half - EDGE_PAD - 14) + 'px';
            }
        });

        /* Foundation below everything that is visible */
        var contentBottom = bandTop;
        Object.keys(routeBands).forEach(function (routeId) {
            var band = routeBands[routeId];
            if (!band.hidden) contentBottom = Math.max(contentBottom, bandTop + band.offsetHeight);
        });
        if (!open.qgis && !open.python) {
            contentBottom = HUB_POS.qgis.y + HUB_R + 96;
        }
        foundationEl.style.top = (contentBottom + 84) + 'px';
        stage.style.height = (contentBottom + 84 + foundationEl.offsetHeight + 20) + 'px';
    }

    function place(node, x, y) {
        node.style.left = Math.round(x * 10) / 10 + 'px';
        node.style.top = Math.round(y * 10) / 10 + 'px';
    }

    function layoutFoundationSoon() { scheduleSettle(); }

    /* ────────────────────────────────────────────────────────
       EDGES
       ──────────────────────────────────────────────────────── */

    function rectOf(node) {
        var stageR = stage.getBoundingClientRect();
        var r = node.getBoundingClientRect();
        return {
            x: r.left - stageR.left, y: r.top - stageR.top,
            w: r.width, h: r.height,
            cx: r.left - stageR.left + r.width / 2,
            cy: r.top - stageR.top + r.height / 2
        };
    }

    function drawEdges() {
        var used = {};
        if (mode !== 'graph') { fadeUnused(used); return; }

        var s = scaleX();
        var w = stageW();
        var jr = rectOf(junctionEl);

        tree.routes.forEach(function (route) {
            var accent = route.accent;
            var hubR = rectOf(reg[route.id].gEl);

            /* Cluster bounding box for the outline trunk */
            var minX = hubR.x, maxX = hubR.x + hubR.w, maxY = hubR.y + hubR.h;
            if (open[route.id]) {
                route.children.forEach(function (topic) {
                    var card = reg[topic.id].gEl;
                    if (card.classList.contains('is-off')) return;
                    var r = rectOf(card);
                    minX = Math.min(minX, r.x); maxX = Math.max(maxX, r.x + r.w);
                    maxY = Math.max(maxY, r.y + r.h);
                    (reg[topic.id].fanEls || []).forEach(function (leaf) {
                        if (leaf.classList.contains('is-off')) return;
                        var lr = rectOf(leaf);
                        minX = Math.min(minX, lr.x); maxX = Math.max(maxX, lr.x + lr.w);
                        maxY = Math.max(maxY, lr.y + lr.h);
                    });
                });
                var band = routeBands[route.id];
                if (!band.hidden) {
                    var br = rectOf(band);
                    minX = Math.min(minX, br.x); maxX = Math.max(maxX, br.x + br.w);
                    maxY = Math.max(maxY, br.y + br.h);
                }
            }

            /* Trunk: hug the outside of the cluster to the junction */
            var isLeft = route.id === 'qgis';
            var fx = isLeft ? Math.max(10, minX - 42) : Math.min(w - 10, maxX + 42);
            var sx = hubR.cx + (isLeft ? -0.62 : 0.62) * hubR.w / 2;
            var sy = hubR.cy + 0.62 * hubR.h / 2;
            var jx = jr.cx + (isLeft ? -14 : 14);
            var jy = jr.cy;
            var midY = Math.max(maxY + 40, sy + 120);
            var d = 'M ' + rr(sx) + ' ' + rr(sy) +
                    ' C ' + rr(fx) + ' ' + rr(sy + 90) + ' ' + rr(fx) + ' ' + rr(midY - 120) + ' ' + rr(fx) + ' ' + rr(midY) +
                    ' C ' + rr(fx) + ' ' + rr(jy - 30) + ' ' + rr(isLeft ? jx - 150 : jx + 150) + ' ' + rr(jy) + ' ' + rr(jx) + ' ' + rr(jy);
            usePath('trunk-' + route.id, d, accent, 'flow', used);

            if (!open[route.id]) return;

            /* Hub to each topic */
            route.children.forEach(function (topic) {
                var card = reg[topic.id].gEl;
                if (card.classList.contains('is-off')) return;
                var r = rectOf(card);
                edgeBetween('spoke-' + topic.id, hubR, r, accent, used);
                useDot('sd-' + topic.id, anchorToward(r, hubR).x, anchorToward(r, hubR).y, 3.4, accent, used);

                /* Satellite fans */
                if (FANS[topic.id] && open[topic.id]) {
                    (reg[topic.id].fanEls || []).forEach(function (leaf, i) {
                        if (leaf.classList.contains('is-off')) return;
                        edgeBetween('fan-' + topic.id + '-' + i, r, rectOf(leaf), accent, used, true);
                    });
                }
            });

            /* Band port and ties */
            var band2 = routeBands[route.id];
            if (!band2.hidden) {
                var br2 = rectOf(band2);
                var port = { x: br2.cx, y: br2.y - 2 };
                useDot('port-' + route.id, port.x, port.y, 4.5, accent, used);

                var openTopicId = null;
                route.children.forEach(function (t) {
                    if (open[t.id] && !FANS[t.id]) openTopicId = t.id;
                });
                if (openTopicId) {
                    var tr = rectOf(reg[openTopicId].gEl);
                    var far = Math.abs(tr.cy - port.y) > 250;
                    var pd;
                    if (far) {
                        var side = isLeft ? Math.max(10, minX - 42) : Math.min(w - 10, maxX + 42);
                        pd = 'M ' + rr(tr.cx + (isLeft ? -tr.w / 2 : tr.w / 2)) + ' ' + rr(tr.cy) +
                             ' C ' + rr(side) + ' ' + rr(tr.cy) + ' ' + rr(side) + ' ' + rr(port.y - 60) + ' ' + rr(port.x) + ' ' + rr(port.y - 4);
                    } else {
                        pd = 'M ' + rr(tr.cx) + ' ' + rr(tr.y + tr.h) +
                             ' C ' + rr(tr.cx) + ' ' + rr(tr.y + tr.h + 50) + ' ' + rr(port.x) + ' ' + rr(port.y - 54) + ' ' + rr(port.x) + ' ' + rr(port.y - 4);
                    }
                    usePath('bandlink-' + route.id, pd, accent, null, used);

                    /* Port to each first row item */
                    var row = reg[openTopicId].bandRow;
                    if (row) {
                        Array.prototype.forEach.call(row.children, function (item, i) {
                            var ir = rectOf(item);
                            var td = 'M ' + rr(port.x) + ' ' + rr(port.y) +
                                     ' C ' + rr(port.x) + ' ' + rr(port.y + 26) + ' ' + rr(ir.cx) + ' ' + rr(ir.y - 22) + ' ' + rr(ir.cx) + ' ' + rr(ir.y - 2);
                            usePath('tie-' + route.id + '-' + i, td, accent, 'thin', used);
                        });
                    }

                    /* Open child to its leaves */
                    var openChildId = null;
                    (reg[openTopicId].data.children || []).forEach(function (c) {
                        if (open[c.id]) openChildId = c.id;
                    });
                    if (openChildId && reg[openChildId].leafRow) {
                        var childEl = document.getElementById('g-' + openChildId);
                        if (childEl) {
                            var cr = rectOf(childEl);
                            Array.prototype.forEach.call(reg[openChildId].leafRow.children, function (item, i) {
                                var ir2 = rectOf(item);
                                var ld = 'M ' + rr(cr.cx) + ' ' + rr(cr.y + cr.h) +
                                         ' C ' + rr(cr.cx) + ' ' + rr(cr.y + cr.h + 24) + ' ' + rr(ir2.cx) + ' ' + rr(ir2.y - 20) + ' ' + rr(ir2.cx) + ' ' + rr(ir2.y - 2);
                                usePath('leaf-' + openChildId + '-' + i, ld, accent, 'thin', used);
                            });
                        }
                    }
                }
            }
        });

        /* Junction to the two shared cards */
        var flist = document.getElementById('foundation-list');
        if (flist) {
            Array.prototype.forEach.call(flist.children, function (li, i) {
                var head = li.firstElementChild;
                if (!head) return;
                var hrct = rectOf(head);
                var dd = 'M ' + rr(jr.cx) + ' ' + rr(jr.cy + jr.h / 2 + 2) +
                         ' C ' + rr(jr.cx) + ' ' + rr(jr.cy + 50) + ' ' + rr(hrct.cx) + ' ' + rr(hrct.y - 34) + ' ' + rr(hrct.cx) + ' ' + rr(hrct.y - 4);
                usePath('found-' + i, dd, 'shared', null, used);
                useDot('fdot-' + i, hrct.cx, hrct.y - 3, 3.4, 'shared', used);
            });
        }

        fadeUnused(used);
    }

    function anchorToward(from, to) {
        var dx = to.cx - from.cx, dy = to.cy - from.cy;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        return {
            x: from.cx + dx / len * Math.min(from.w, from.h) * 0.5,
            y: from.cy + dy / len * Math.min(from.w, from.h) * 0.5
        };
    }

    function edgeBetween(key, a, b, accent, used, thin) {
        var pa = anchorToward(a, b);
        var pb = anchorToward(b, a);
        var mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
        var horizontal = Math.abs(pb.x - pa.x) > Math.abs(pb.y - pa.y);
        var d;
        if (horizontal) {
            d = 'M ' + rr(pa.x) + ' ' + rr(pa.y) +
                ' C ' + rr(mx) + ' ' + rr(pa.y) + ' ' + rr(mx) + ' ' + rr(pb.y) + ' ' + rr(pb.x) + ' ' + rr(pb.y);
        } else {
            d = 'M ' + rr(pa.x) + ' ' + rr(pa.y) +
                ' C ' + rr(pa.x) + ' ' + rr(my) + ' ' + rr(pb.x) + ' ' + rr(my) + ' ' + rr(pb.x) + ' ' + rr(pb.y);
        }
        usePath(key, d, accent, thin ? 'thin' : null, used);
    }

    function usePath(key, d, accent, variant, used) {
        var elp = pool[key];
        if (!elp) {
            elp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            elp.setAttribute('class',
                'edge edge--' + accent +
                (variant === 'flow' ? ' edge--flow' : '') +
                (variant === 'thin' ? ' edge--thin' : ''));
            elp.setAttribute('pathLength', '1');
            wires.appendChild(elp);
            pool[key] = elp;
            if (!reduceMotion) {
                elp.classList.add('is-draw');
                window.setTimeout(function () { elp.classList.remove('is-draw'); }, 520);
            }
            window.requestAnimationFrame(function () { elp.classList.add('is-on'); });
        } else if (!elp.classList.contains('is-on')) {
            elp.classList.add('is-on');
        }
        elp.setAttribute('d', d);
        used[key] = true;
    }

    function useDot(key, x, y, r, accent, used) {
        var elc = pool[key];
        if (!elc) {
            elc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            elc.setAttribute('class', 'edot edot--' + accent);
            elc.setAttribute('r', r);
            wires.appendChild(elc);
            pool[key] = elc;
            window.requestAnimationFrame(function () { elc.classList.add('is-on'); });
        } else if (!elc.classList.contains('is-on')) {
            elc.classList.add('is-on');
        }
        elc.setAttribute('cx', rr(x));
        elc.setAttribute('cy', rr(y));
        used[key] = true;
    }

    function fadeUnused(used) {
        Object.keys(pool).forEach(function (key) {
            if (!used[key]) pool[key].classList.remove('is-on');
        });
    }

    function rr(n) { return Math.round(n * 10) / 10; }

    /* ────────────────────────────────────────────────────────
       SETTLE LOOP: keep layout + edges live during motion
       ──────────────────────────────────────────────────────── */

    function scheduleSettle(ms) {
        settleUntil = nowMs() + (ms || SETTLE_MS);
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(tick);
    }

    function tick() {
        if (mode === 'graph') {
            positionAll();
            drawEdges();
        }
        if (nowMs() < settleUntil) {
            window.requestAnimationFrame(tick);
        } else {
            ticking = false;
        }
    }

    /* ────────────────────────────────────────────────────────
       TOOLTIP (hover and focus metadata)
       ──────────────────────────────────────────────────────── */

    function tipContent(id) {
        var d = reg[id].data;
        var rows = '';
        var count = countLabel(d);
        if (count) rows += '<span class="tip__pill">' + count + '</span>';
        rows += '<span class="tip__pill tip__pill--' + (d.status === 'soon' ? 'soon' : 'ready') + '">' +
                (d.status === 'soon' ? 'In progress' : 'Open now') + '</span>';
        if (reg[id].depth === 0) {
            rows = '<span class="tip__pill">' + d.children.length + ' topics</span>' +
                   '<span class="tip__pill tip__pill--ready">' + esc(d.tagline) + '</span>';
        }
        return '<p class="tip__title">' + esc(d.label) + '</p>' +
               (d.blurb ? '<p class="tip__blurb">' + esc(d.blurb) + '</p>' : '') +
               '<p class="tip__meta">' + rows + '</p>';
    }

    function showTip(target) {
        var id = target.dataset.tip;
        if (!id || !reg[id]) return;
        tipEl.innerHTML = tipContent(id);
        tipEl.hidden = false;

        var r = target.getBoundingClientRect();
        var tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
        var x = clamp(r.left + r.width / 2 - tw / 2, 10, window.innerWidth - tw - 10);
        var y = r.top - th - 12;
        if (y < 8) y = r.bottom + 12;
        tipEl.style.left = x + 'px';
        tipEl.style.top = (y + window.scrollY) + 'px';
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
       FOUNDATION (shared cards, both modes)
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
            var chipsWrap = el('div', 'gband__row');
            chipsOf(node).forEach(function (chip) {
                chipsWrap.appendChild(leafEl(chip, 'shared'));
            });
            kids.appendChild(chipsWrap);

            head.addEventListener('click', function () {
                toggle(node.id);
                syncFoundation();
                scheduleSettle();
            });

            li.appendChild(head);
            li.appendChild(kids);
            list.appendChild(li);
            reg[node.id].fEl = { li: li, head: head, kids: kids };
        });
    }

    /* Keep foundation card DOM in sync when accordion closes one */
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
       LIST MODE (narrow screens): native details tree
       ──────────────────────────────────────────────────────── */

    function buildList() {
        tree.routes.forEach(function (route) {
            var d = el('details', 'mroute mroute--' + route.accent);
            d.id = 'm-' + route.id;
            var s = el('summary', 'mroute__head',
                '<span class="mroute__tag">' + esc(route.tagline) + '</span>' +
                '<span class="mroute__name">' + esc(route.label) + '</span>' +
                '<span class="mroute__count">' + route.children.length + ' topics</span>' +
                '<span class="gnode__plus" aria-hidden="true">' + icon('chev') + '</span>');
            d.appendChild(s);
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
        var s = el('summary', 'mnode__head',
            (START_TAG[node.id] ? '<span class="gnode__start">Start here</span>' : '') +
            '<span class="gnode__title">' + esc(node.label) + '</span>' +
            (node.blurb ? '<span class="gnode__blurb">' + esc(node.blurb) + '</span>' : '') +
            '<span class="gnode__meta"><span class="gnode__count">' + countLabel(node) + '</span>' +
            ((node.status === 'soon') ? '<span class="gnode__flag">' + icon('soon') + 'In progress</span>' : '') +
            '</span>' +
            '<span class="gnode__plus" aria-hidden="true">' + icon('chev') + '</span>');
        d.appendChild(s);

        var body = el('div', 'mnode__body');
        (node.children || []).forEach(function (child) {
            body.appendChild(listNode(child, accent));
        });
        if (chips.length && !(node.children && node.children.length)) {
            var row = el('div', 'gband__row');
            chips.forEach(function (chip) { row.appendChild(leafEl(chip, accent)); });
            body.appendChild(row);
        } else if (node.lesson && node.children && node.children.length) {
            var row2 = el('div', 'gband__row');
            row2.appendChild(leafEl({ label: 'Open the full lesson', kind: 'lesson', href: node.lesson }, accent));
            body.appendChild(row2);
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
       ──────────────────────────────────────────────────────── */

    function pickMode() {
        var wantGraph = document.documentElement.clientWidth >= GRAPH_MIN;
        var next = wantGraph ? 'graph' : 'list';
        if (next === mode) return;
        mode = next;
        document.body.classList.toggle('mode-graph', mode === 'graph');
        document.body.classList.toggle('mode-list', mode === 'list');
        stage.classList.toggle('is-list', mode === 'list');
        mtree.hidden = mode !== 'list';
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
        if (mode === 'graph') refreshGraph();
        else {
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
            /* close the deepest open branch */
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
       DEBUG HOOK: pure layout audit used by the test suite
       ──────────────────────────────────────────────────────── */

    function auditLayout(widthPx) {
        var s = widthPx / VIRTUAL_W;
        var rects = [];
        Object.keys(HUB_POS).forEach(function (id) {
            var p = HUB_POS[id];
            rects.push({ id: 'hub-' + id, x: p.x * s - HUB_R, y: p.y - HUB_R, w: HUB_R * 2, h: HUB_R * 2 });
        });
        Object.keys(TOPIC_POS).forEach(function (id) {
            var p = TOPIC_POS[id];
            var cx = clamp(p.x * s, EDGE_PAD + CARD_W / 2, widthPx - EDGE_PAD - CARD_W / 2);
            rects.push({ id: id, x: cx - CARD_W / 2, y: p.y - CARD_H / 2, w: CARD_W, h: CARD_H });
        });
        Object.keys(FANS).forEach(function (topicId) {
            var p = TOPIC_POS[topicId];
            var cx = clamp(p.x * s, EDGE_PAD + CARD_W / 2, widthPx - EDGE_PAD - CARD_W / 2);
            FANS[topicId].forEach(function (off, i) {
                var half = 110;
                var lx = clamp(cx + off[0], EDGE_PAD + half, widthPx - EDGE_PAD - half);
                var ly = Math.max(p.y + off[1], 26);
                rects.push({ id: topicId + '-fan-' + i, fan: topicId,
                             x: lx - half, y: ly - CHIP_H / 2, w: half * 2, h: CHIP_H });
            });
        });

        var problems = [];
        for (var i = 0; i < rects.length; i++) {
            var a = rects[i];
            if (a.x < 0 || a.x + a.w > widthPx) problems.push(a.id + ' out of bounds at ' + widthPx);
            for (var k = i + 1; k < rects.length; k++) {
                var b = rects[k];
                if (a.fan && a.fan === b.fan) continue;             /* same fan siblings stack by design */
                if (a.fan === b.id || b.fan === a.id) continue;      /* fan near its own topic */
                var overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
                var overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
                if (overlapX > 2 && overlapY > 2) {
                    problems.push(a.id + ' overlaps ' + b.id + ' at width ' + widthPx +
                                  ' by ' + Math.round(overlapX) + 'x' + Math.round(overlapY));
                }
            }
        }
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

        stage        = document.getElementById('stage');
        gnodes       = document.getElementById('gnodes');
        wires        = document.getElementById('wires');
        foundationEl = document.getElementById('foundation');
        junctionEl   = document.getElementById('junction');
        mtree        = document.getElementById('mobile-tree');
        tipEl        = document.getElementById('tip');
        liveEl       = document.getElementById('a11y-status');
        if (!stage || !gnodes || !wires || !foundationEl || !mtree) return;

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

        /* Guard against the exact bug class that bit v1: any
           literal "undefined" leaking into rendered text. */
        if (document.body.textContent.indexOf('undefined') !== -1) {
            if (window.console && console.error) {
                console.error('Geospatial Training: template text leak detected.');
            }
        }

        window.__geoAudit = auditLayout;   /* used by the test suite */
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();

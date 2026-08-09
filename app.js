/* ============================================================
   Geospatial Training Tutorials, app.js

   Everything on the page is generated from window.GEO_TREE in
   content-data.js. Edit that file to change content; this file
   only needs touching to change behavior.

   1. Render: routes, tiles, chips, foundation
   2. Disclosure: expand and collapse with sibling accordion
   3. Wires: SVG trunks, branches, and the junction (desktop)
   4. Deep links: index.html#py-geocoding opens straight there
   5. Announcements for assistive tech
   6. Soft page transition on internal navigation
   ============================================================ */

(function () {
    'use strict';

    var reduceMotion = false;
    try {
        reduceMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { reduceMotion = false; }

    var WIRE_MIN_WIDTH = 900;   /* matches the CSS breakpoint      */
    var OPEN_MS        = 340;   /* matches --t-open in style.css   */
    var STAGGER_MS     = 45;

    /* id -> { data, container, btn, kids, listEl, parentId, isHub } */
    var registry = {};
    var routeEls = [];

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

    function init() {
        if (!window.GEO_TREE) return;
        render();
        initWires();
        openFromHash();
        window.addEventListener('hashchange', openFromHash);
        initPageTransitions();
    }

    /* ────────────────────────────────────────────────────────
       ICONS
       ──────────────────────────────────────────────────────── */

    var SVG_OPEN  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    var SVG_CLOSE = '</svg>';

    function icon(kind) {
        switch (kind) {
            case 'chev':
                return SVG_OPEN + '<path d="M6 9l6 6 6-6"/>' + SVG_CLOSE;
            case 'arrow':
                return SVG_OPEN + '<path d="M7 17L17 7M9 7h8v8"/>' + SVG_CLOSE;
            case 'ext':
                return SVG_OPEN + '<path d="M7 17L17 7M9 7h8v8"/>' + SVG_CLOSE;
            case 'lesson':
                return SVG_OPEN + '<path d="M12 5.5C10.5 4.3 8.6 3.8 6.5 3.8c-1.2 0-2.4 .2-3.5 .6v14.2c1.1-.4 2.3-.6 3.5-.6 2.1 0 4 .5 5.5 1.7 1.5-1.2 3.4-1.7 5.5-1.7 1.2 0 2.4 .2 3.5 .6V4.4c-1.1-.4-2.3-.6-3.5-.6-2.1 0-4 .5-5.5 1.7z"/><path d="M12 5.5v14.2"/>' + SVG_CLOSE;
            case 'colab':
                return SVG_OPEN + '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M10 8.6l5 3.4-5 3.4z"/>' + SVG_CLOSE;
            case 'doc':
                return SVG_OPEN + '<path d="M14 3.5H7a1.5 1.5 0 0 0-1.5 1.5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3.5V8h4.5M9 12.5h6M9 16h6"/>' + SVG_CLOSE;
            case 'soon':
                return SVG_OPEN + '<circle cx="12" cy="12" r="8.5" stroke-dasharray="3.4 3.4"/><path d="M12 8v4.4l2.8 1.7"/>' + SVG_CLOSE;
            default:
                return '';
        }
    }

    /* ────────────────────────────────────────────────────────
       1. RENDER
       ──────────────────────────────────────────────────────── */

    function render() {
        var routesWrap = document.getElementById('routes');
        var tree = window.GEO_TREE;
        if (!routesWrap) return;

        tree.routes.forEach(function (route) {
            var section = document.createElement('section');
            section.className = 'route route--' + route.accent;
            section.id = 'route-' + route.id;

            var hub = document.createElement('button');
            hub.type = 'button';
            hub.className = 'hub';
            hub.id = 'hub-' + route.id;
            hub.setAttribute('aria-expanded', 'false');
            hub.setAttribute('aria-controls', 'kids-' + route.id);
            hub.innerHTML =
                '<span class="hub__tagline">' + esc(route.tagline) + '</span>' +
                '<span class="hub__label">' + esc(route.label) + '</span>' +
                '<span class="hub__count">' + route.children.length + ' topics</span>' +
                '<span class="hub__chev" aria-hidden="true">' + icon('chev') + '</span>' +
                '<span class="visually-hidden">, ' + esc(route.blurb) + '</span>';

            var kids = document.createElement('div');
            kids.className = 'route__kids';
            kids.id = 'kids-' + route.id;
            kids.hidden = true;

            var tier = document.createElement('ul');
            tier.className = 'tier';
            tier.setAttribute('role', 'list');
            route.children.forEach(function (child) {
                tier.appendChild(buildNode(child, route.id));
            });
            kids.appendChild(tier);

            section.appendChild(hub);
            section.appendChild(kids);
            routesWrap.appendChild(section);
            routeEls.push(section);

            registry[route.id] = {
                data: route, container: section, btn: hub,
                kids: kids, parentId: null, isHub: true
            };
            hub.addEventListener('click', function () { toggle(route.id); });
        });

        /* Foundation */
        var deckEl = document.getElementById('foundation-deck');
        var listEl = document.getElementById('foundation-list');
        if (deckEl) deckEl.textContent = tree.shared.blurb;
        if (listEl) {
            tree.shared.children.forEach(function (child) {
                var li = buildNode(child, null);
                li.classList.add('is-in');   /* foundation tiles are always visible */
                listEl.appendChild(li);
            });
        }
    }

    function buildNode(node, parentId) {
        var li = document.createElement('li');
        li.className = 'node';
        li.id = 'node-' + node.id;
        li.dataset.status = node.status || 'ready';

        var hasKids  = (node.children && node.children.length) ||
                       (node.links && node.links.length) || node.lesson;
        var expandable = !!((node.children && node.children.length) ||
                            (node.links && node.links.length));

        if (expandable) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'node__head';
            btn.setAttribute('aria-expanded', 'false');
            btn.setAttribute('aria-controls', 'kids-' + node.id);
            btn.innerHTML = headInner(node) +
                '<span class="node__chev" aria-hidden="true">' + icon('chev') + '</span>';

            var kids = document.createElement('div');
            kids.className = 'node__kids';
            kids.id = 'kids-' + node.id;
            kids.hidden = true;

            if (node.children && node.children.length) {
                var tier = document.createElement('ul');
                tier.className = 'tier';
                tier.setAttribute('role', 'list');
                node.children.forEach(function (child) {
                    tier.appendChild(buildNode(child, node.id));
                });
                kids.appendChild(tier);
            }

            var chipData = chipList(node);
            if (chipData.length) {
                kids.appendChild(buildChips(chipData));
            }

            li.appendChild(btn);
            li.appendChild(kids);

            registry[node.id] = {
                data: node, container: li, btn: btn,
                kids: kids, parentId: parentId, isHub: false
            };
            btn.addEventListener('click', function () { toggle(node.id); });

        } else if (node.lesson) {
            /* No children and no chips: the tile itself is the link */
            var a = document.createElement('a');
            a.className = 'node__head';
            a.href = node.lesson;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.innerHTML = headInner(node) +
                '<span class="node__arrow" aria-hidden="true">' + icon('arrow') + '</span>' +
                '<span class="visually-hidden"> (opens in a new tab)</span>';
            li.appendChild(a);
            registry[node.id] = {
                data: node, container: li, btn: null,
                kids: null, parentId: parentId, isHub: false
            };

        } else {
            /* Pure placeholder tile */
            var div = document.createElement('div');
            div.className = 'node__head';
            div.innerHTML = headInner(node);
            li.appendChild(div);
            registry[node.id] = {
                data: node, container: li, btn: null,
                kids: null, parentId: parentId, isHub: false
            };
        }

        if (!hasKids) li.dataset.status = 'soon';
        return li;
    }

    function headInner(node) {
        var html = '<span class="node__title">' + esc(node.label) + '</span>';
        if (node.blurb) html += '<span class="node__blurb">' + esc(node.blurb) + '</span>';

        var meta = '';
        var count = countLabel(node);
        if (count) meta += '<span class="node__count">' + count + '</span>';
        if ((node.status || 'ready') === 'soon') {
            meta += '<span class="node__flag">' + icon('soon') + 'In progress</span>';
        }
        if (meta) html += '<span class="node__meta">' + meta + '</span>';
        return html;
    }

    /* Merge the node.lesson shortcut into the chip list */
    function chipList(node) {
        var chips = [];
        if (node.lesson) {
            chips.push({ label: 'Open the full lesson', kind: 'lesson', href: node.lesson });
        }
        (node.links || []).forEach(function (l) { chips.push(l); });
        return chips;
    }

    function buildChips(links) {
        var ul = document.createElement('ul');
        ul.className = 'chips';
        ul.setAttribute('role', 'list');

        links.forEach(function (link) {
            var li = document.createElement('li');
            var kind = link.kind || 'doc';

            if (link.href) {
                var a = document.createElement('a');
                a.className = 'chip chip--' + kind;
                a.href = link.href;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.innerHTML = icon(kind) + esc(link.label) +
                    '<span class="chip__ext" aria-hidden="true">' + icon('ext') + '</span>' +
                    '<span class="visually-hidden"> (opens in a new tab)</span>';
                li.appendChild(a);
            } else {
                var span = document.createElement('span');
                span.className = 'chip chip--soon';
                span.innerHTML = icon('soon') + esc(link.label);
                li.appendChild(span);
            }
            ul.appendChild(li);
        });
        return ul;
    }

    function countLabel(node) {
        if (node.children && node.children.length) {
            return node.children.length + (node.children.length === 1 ? ' topic' : ' topics');
        }
        var chips = chipList(node);
        if (!chips.length) return '';
        var kinds = {};
        chips.forEach(function (c) { kinds[c.kind || 'doc'] = true; });
        var n = chips.length;
        if (kinds.colab && !kinds.lesson && !kinds.doc) {
            return n + (n === 1 ? ' notebook' : ' notebooks');
        }
        if (kinds.lesson && !kinds.colab && !kinds.doc) {
            return n + (n === 1 ? ' lesson' : ' lessons');
        }
        return n + (n === 1 ? ' resource' : ' resources');
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* ────────────────────────────────────────────────────────
       2. DISCLOSURE
       ──────────────────────────────────────────────────────── */

    function toggle(id) {
        var entry = registry[id];
        if (!entry || !entry.btn) return;
        if (entry.btn.getAttribute('aria-expanded') === 'true') {
            collapse(id, true);
        } else {
            expand(id, true);
        }
        scheduleWires(OPEN_MS + 380);
    }

    function expand(id, animate) {
        var entry = registry[id];
        if (!entry || !entry.kids) return;
        if (entry.btn.getAttribute('aria-expanded') === 'true') return;

        /* Accordion: close any open sibling first */
        if (!entry.isHub) {
            var parentList = entry.container.parentElement;
            if (parentList) {
                Array.prototype.forEach.call(
                    parentList.children,
                    function (siblingLi) {
                        if (siblingLi === entry.container) return;
                        if (siblingLi.classList.contains('is-open')) {
                            var sibId = siblingLi.id.replace(/^node-/, '');
                            collapse(sibId, false);
                        }
                    }
                );
            }
        }

        entry.btn.setAttribute('aria-expanded', 'true');
        entry.container.classList.add('is-open');
        entry.kids.hidden = false;

        var items = directItems(entry.kids);

        if (reduceMotion || !animate) {
            items.forEach(function (el) { el.classList.add('is-in'); });
            announce(entry, true);
            return;
        }

        /* Height animation from 0 to natural */
        var target = entry.kids.scrollHeight;
        entry.kids.style.height = '0px';
        entry.kids.style.transition = 'height ' + OPEN_MS + 'ms cubic-bezier(0.22, 1, 0.36, 1)';
        /* force reflow */
        void entry.kids.offsetHeight;
        entry.kids.style.height = target + 'px';

        items.forEach(function (el, i) {
            el.style.transitionDelay = (60 + i * STAGGER_MS) + 'ms';
            el.classList.add('is-in');
        });

        var done = function () {
            entry.kids.style.height = '';
            entry.kids.style.transition = '';
            items.forEach(function (el) { el.style.transitionDelay = ''; });
        };
        var settled = false;
        entry.kids.addEventListener('transitionend', function onEnd(ev) {
            if (ev.target !== entry.kids) return;
            entry.kids.removeEventListener('transitionend', onEnd);
            if (!settled) { settled = true; done(); }
        });
        window.setTimeout(function () {
            if (!settled) { settled = true; done(); }
        }, OPEN_MS + 120);

        announce(entry, true);
    }

    function collapse(id, animate) {
        var entry = registry[id];
        if (!entry || !entry.kids) return;
        if (entry.btn.getAttribute('aria-expanded') !== 'true') return;

        /* Close open descendants instantly so height math stays sane */
        Array.prototype.forEach.call(
            entry.kids.querySelectorAll('.node.is-open'),
            function (li) {
                var childId = li.id.replace(/^node-/, '');
                var childEntry = registry[childId];
                if (!childEntry) return;
                childEntry.btn.setAttribute('aria-expanded', 'false');
                li.classList.remove('is-open');
                childEntry.kids.hidden = true;
                childEntry.kids.style.height = '';
                childEntry.kids.style.transition = '';
                directItems(childEntry.kids).forEach(function (el) {
                    el.classList.remove('is-in');
                    el.style.transitionDelay = '';
                });
            }
        );

        entry.btn.setAttribute('aria-expanded', 'false');
        entry.container.classList.remove('is-open');

        var items = directItems(entry.kids);
        var finish = function () {
            entry.kids.hidden = true;
            entry.kids.style.height = '';
            entry.kids.style.transition = '';
            items.forEach(function (el) {
                el.classList.remove('is-in');
                el.style.transitionDelay = '';
            });
        };

        if (reduceMotion || !animate) { finish(); announce(entry, false); return; }

        entry.kids.style.height = entry.kids.scrollHeight + 'px';
        entry.kids.style.transition = 'height ' + (OPEN_MS - 80) + 'ms ease';
        void entry.kids.offsetHeight;
        entry.kids.style.height = '0px';

        var settled = false;
        entry.kids.addEventListener('transitionend', function onEnd(ev) {
            if (ev.target !== entry.kids) return;
            entry.kids.removeEventListener('transitionend', onEnd);
            if (!settled) { settled = true; finish(); }
        });
        window.setTimeout(function () {
            if (!settled) { settled = true; finish(); }
        }, OPEN_MS + 60);

        announce(entry, false);
    }

    function directItems(kids) {
        var out = [];
        Array.prototype.forEach.call(kids.children, function (group) {
            Array.prototype.forEach.call(group.children, function (li) {
                out.push(li);
            });
        });
        return out;
    }

    function announce(entry, opened) {
        var region = document.getElementById('a11y-status');
        if (!region) return;
        var label = entry.data.label;
        if (!opened) { region.textContent = label + ' collapsed.'; return; }
        var n = directItems(entry.kids).length;
        region.textContent = label + ' expanded, showing ' + n +
            (n === 1 ? ' item.' : ' items.');
    }

    /* ────────────────────────────────────────────────────────
       3. WIRES
       Trunks from each hub converge on the junction above the
       foundation; branch elbows reach the open level 1 tiles.
       Coordinates are relative to .network, so scrolling costs
       nothing; only layout changes trigger a redraw.
       ──────────────────────────────────────────────────────── */

    var wiresSvg, networkEl, junctionEl;
    var pool = {};
    var wiresDeadline = 0;
    var wiresRunning = false;

    function initWires() {
        wiresSvg   = document.getElementById('wires');
        networkEl  = document.getElementById('network');
        junctionEl = document.getElementById('junction');
        if (!wiresSvg || !networkEl || !junctionEl) return;

        window.addEventListener('resize', function () { scheduleWires(280); });
        window.addEventListener('load',   function () { scheduleWires(160); });
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () { scheduleWires(160); });
        }
        scheduleWires(420);
    }

    function scheduleWires(ms) {
        if (!wiresSvg) return;
        wiresDeadline = now() + ms;
        if (wiresRunning) return;
        wiresRunning = true;
        window.requestAnimationFrame(wireTick);
    }

    function wireTick() {
        layoutWires();
        if (now() < wiresDeadline) {
            window.requestAnimationFrame(wireTick);
        } else {
            wiresRunning = false;
        }
    }

    function now() {
        return (window.performance && performance.now) ? performance.now() : Date.now();
    }

    function layoutWires() {
        var used = {};

        if (window.innerWidth >= WIRE_MIN_WIDTH) {
            var net = networkEl.getBoundingClientRect();
            var jRect = junctionEl.getBoundingClientRect();
            var jx = jRect.left + jRect.width / 2 - net.left;
            var jy = jRect.top + jRect.height / 2 - net.top;
            var jr = jRect.width / 2;

            routeEls.forEach(function (routeEl) {
                var routeId = routeEl.id.replace(/^route-/, '');
                var entry = registry[routeId];
                if (!entry) return;

                var col = routeEl.getBoundingClientRect();
                var hub = entry.btn.getBoundingClientRect();
                var accent = entry.data.accent;

                var hx = hub.left + hub.width / 2 - net.left;
                var hy = hub.bottom - net.top + 3;
                var tX = col.left - net.left + 24;   /* trunk gutter center */
                var kneeY = Math.max(hy + 64, Math.min(hy + 96, jy - 120));

                var d = 'M ' + r1(hx) + ' ' + r1(hy) +
                        ' C ' + r1(hx) + ' ' + r1(hy + 34) + ' ' + r1(tX) + ' ' + r1(hy + 26) + ' ' + r1(tX) + ' ' + r1(kneeY) +
                        ' L ' + r1(tX) + ' ' + r1(jy - 110) +
                        ' C ' + r1(tX) + ' ' + r1(jy - 44) + ' ' + r1(jx) + ' ' + r1(jy - 84) + ' ' + r1(jx) + ' ' + r1(jy - jr - 4);

                usePath('trunk-' + routeId, d, accent, true, used);

                /* Branch elbows to open level 1 tiles */
                if (entry.btn.getAttribute('aria-expanded') === 'true' && !entry.kids.hidden) {
                    var lis = entry.kids.querySelectorAll(':scope > .tier > li');
                    Array.prototype.forEach.call(lis, function (li, i) {
                        var head = li.firstElementChild;
                        if (!head) return;
                        var hr = head.getBoundingClientRect();
                        if (hr.height < 2) return;
                        var cy = hr.top + Math.min(hr.height / 2, 34) - net.top;
                        var cx = hr.left - net.left;
                        var bd = 'M ' + r1(tX) + ' ' + r1(cy) +
                                 ' C ' + r1(tX + 15) + ' ' + r1(cy) + ' ' + r1(cx - 15) + ' ' + r1(cy) + ' ' + r1(cx) + ' ' + r1(cy);
                        usePath('branch-' + routeId + '-' + i, bd, accent, false, used);
                        useDot('bdot-' + routeId + '-' + i, cx, cy, 3.5, accent, used);
                        useDot('tdot-' + routeId + '-' + i, tX, cy, 2.5, accent, used);
                    });
                }
            });

            /* Junction splits to the foundation tiles */
            var tiles = document.querySelectorAll('#foundation-list > li');
            Array.prototype.forEach.call(tiles, function (li, i) {
                var head = li.firstElementChild;
                if (!head) return;
                var netB = networkEl.getBoundingClientRect();
                var hr = head.getBoundingClientRect();
                var tx = hr.left + hr.width / 2 - netB.left;
                var ty = hr.top - netB.top;
                var jRect2 = junctionEl.getBoundingClientRect();
                var jx2 = jRect2.left + jRect2.width / 2 - netB.left;
                var jy2 = jRect2.top + jRect2.height / 2 - netB.top;
                var jr2 = jRect2.width / 2;
                var sd = 'M ' + r1(jx2) + ' ' + r1(jy2 + jr2 + 3) +
                         ' C ' + r1(jx2) + ' ' + r1(jy2 + jr2 + 42) + ' ' + r1(tx) + ' ' + r1(ty - 38) + ' ' + r1(tx) + ' ' + r1(ty - 5);
                usePath('split-' + i, sd, 'shared', false, used);
                useDot('sdot-' + i, tx, ty - 4, 3.5, 'shared', used);
            });
        }

        /* Fade out anything not used this frame */
        Object.keys(pool).forEach(function (key) {
            if (!used[key]) pool[key].classList.remove('is-on');
        });
    }

    function usePath(key, d, accent, isTrunk, used) {
        var el = pool[key];
        if (!el) {
            el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            el.setAttribute('class', 'wire wire--' + accent + (isTrunk ? ' wire--trunk' : ''));
            wiresSvg.appendChild(el);
            pool[key] = el;
            window.requestAnimationFrame(function () { el.classList.add('is-on'); });
        } else if (!el.classList.contains('is-on')) {
            el.classList.add('is-on');
        }
        el.setAttribute('d', d);
        used[key] = true;
    }

    function useDot(key, cx, cy, radius, accent, used) {
        var el = pool[key];
        if (!el) {
            el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            el.setAttribute('class', 'wire-dot wire-dot--' + accent);
            el.setAttribute('r', radius);
            wiresSvg.appendChild(el);
            pool[key] = el;
            window.requestAnimationFrame(function () { el.classList.add('is-on'); });
        } else if (!el.classList.contains('is-on')) {
            el.classList.add('is-on');
        }
        el.setAttribute('cx', r1(cx));
        el.setAttribute('cy', r1(cy));
        used[key] = true;
    }

    function r1(n) { return Math.round(n * 10) / 10; }

    /* ────────────────────────────────────────────────────────
       4. DEEP LINKS
       #qgis or #python opens a route; any node id, for example
       #py-geocoding, opens the full path down to that node.
       ──────────────────────────────────────────────────────── */

    function openFromHash() {
        var hash = window.location.hash.replace('#', '');
        if (!hash) return;
        var id = hash.replace(/^node-/, '');
        var entry = registry[id];
        if (!entry) return;

        /* Walk up to build the ancestor chain, then open top down */
        var chain = [];
        var cursor = entry;
        while (cursor) {
            chain.unshift(cursor);
            cursor = cursor.parentId ? registry[cursor.parentId] : hubOf(cursor);
        }
        chain.forEach(function (e) {
            if (e.btn && e.kids) expand(e.id || idOf(e), false);
        });
        scheduleWires(500);

        window.setTimeout(function () {
            entry.container.scrollIntoView({
                behavior: reduceMotion ? 'auto' : 'smooth',
                block: 'center'
            });
            var focusable = entry.btn || entry.container.querySelector('a');
            if (focusable) focusable.focus({ preventScroll: true });
        }, 80);
    }

    /* A top level node's parentId is the route id already, so the
       chain walk above ends naturally; this helper resolves the
       owning hub for nodes rendered inside a route column. */
    function hubOf(entry) {
        if (entry.isHub || !entry.container) return null;
        var routeEl = entry.container.closest('.route');
        if (!routeEl) return null;
        var routeId = routeEl.id.replace(/^route-/, '');
        return entry.parentId === null ? registry[routeId] : null;
    }

    function idOf(entry) {
        return entry.isHub ? entry.data.id : entry.container.id.replace(/^node-/, '');
    }

    /* ────────────────────────────────────────────────────────
       6. PAGE TRANSITIONS
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
})();

/* ============================================================
   Geospatial Training Tutorials, app.js
   Vanilla ES5 compatible JavaScript. No dependencies.

   1. Pathway filter: dims excluded stages, lights the selected path
   2. Roving keyboard navigation across the filter chips
   3. Scroll reveal: stages assemble in sequence as you scroll
   4. Soft page transition on internal navigation
   ============================================================ */

(function () {
    'use strict';

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

    function init() {
        initPathwayFilter();
        initScrollReveal();
        initPageTransitions();
    }

    /* ────────────────────────────────────────────────────────
       1. PATHWAY FILTER

       Nothing is removed from the DOM. Excluded stages drop to
       opacity 0.15 and shrink slightly, so the track keeps its
       full length and the selected path reads as a continuous
       route through it.
       ──────────────────────────────────────────────────────── */
    function initPathwayFilter() {
        var filterGroup = document.getElementById('pathway-filter');
        var track       = document.getElementById('pathway-track');
        var countEl     = document.getElementById('filter-count');

        if (!filterGroup || !track) return;

        var chips  = Array.prototype.slice.call(filterGroup.querySelectorAll('[data-filter]'));
        var stages = Array.prototype.slice.call(track.querySelectorAll('.stage'));

        var COPY = {
            all: function (n) {
                return 'Showing all ' + n + ' stages of the pathway';
            },
            active: function (n) {
                return 'Showing ' + n + ' open ' + noun(n) + ', ready to start';
            },
            upcoming: function (n) {
                return 'Showing ' + n + ' upcoming ' + noun(n) + ', under construction';
            }
        };

        function noun(n) { return n === 1 ? 'stage' : 'stages'; }

        /* One delegated listener serves every chip. */
        filterGroup.addEventListener('click', function (event) {
            var chip = event.target.closest('[data-filter]');
            if (!chip || !filterGroup.contains(chip)) return;
            applyFilter(chip.dataset.filter);
        });

        function applyFilter(state) {
            var matched = 0;

            stages.forEach(function (stage) {
                var isMatch = state === 'all' || stage.dataset.status === state;
                var panel   = stage.querySelector('.stage__panel');

                stage.classList.toggle('is-dimmed', !isMatch);

                /* Only light the path when a narrowing filter is on.
                   Under "All modules" every stage sits at rest. */
                stage.classList.toggle('is-lit', isMatch && state !== 'all');

                /* Keep dimmed panels out of the tab order and out of
                   the accessibility tree while they are receded. */
                if (panel) {
                    panel.tabIndex = isMatch ? 0 : -1;
                    panel.setAttribute('aria-hidden', isMatch ? 'false' : 'true');
                }

                if (isMatch) matched += 1;
            });

            chips.forEach(function (chip) {
                var isActive = chip.dataset.filter === state;
                chip.classList.toggle('is-active', isActive);
                chip.setAttribute('aria-pressed', String(isActive));
            });

            if (countEl && COPY[state]) countEl.textContent = COPY[state](matched);
        }

        /* 2. Roving keyboard navigation ──────────────────── */
        filterGroup.addEventListener('keydown', function (event) {
            var index = chips.indexOf(document.activeElement);
            if (index === -1) return;

            var next;

            switch (event.key) {
                case 'ArrowRight':
                case 'ArrowDown': next = (index + 1) % chips.length; break;
                case 'ArrowLeft':
                case 'ArrowUp':   next = (index - 1 + chips.length) % chips.length; break;
                case 'Home':      next = 0; break;
                case 'End':       next = chips.length - 1; break;
                default: return;
            }

            event.preventDefault();
            chips[next].focus();
            applyFilter(chips[next].dataset.filter);
        });

        /* Deep links such as index.html#upcoming open pre filtered. */
        var hash = window.location.hash.replace('#', '');
        if (hash === 'active' || hash === 'upcoming') applyFilter(hash);
    }

    /* ────────────────────────────────────────────────────────
       3. SCROLL REVEAL

       Each stage enters from its own side of the rail as it
       comes into view, so the pathway assembles in order as the
       reader moves down it. The entering class is stripped once
       the animation finishes, leaving the filter states free to
       control opacity afterwards.
       ──────────────────────────────────────────────────────── */
    function initScrollReveal() {
        var stages = Array.prototype.slice.call(document.querySelectorAll('.stage'));
        if (!stages.length) return;

        function revealAll() {
            stages.forEach(function (stage) { stage.classList.add('is-visible'); });
        }

        if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
            revealAll();
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;

                var stage = entry.target;
                stage.classList.add('is-visible', 'is-entering');

                stage.addEventListener('animationend', function () {
                    stage.classList.remove('is-entering');
                }, { once: true });

                observer.unobserve(stage);
            });
        }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });

        stages.forEach(function (stage) { observer.observe(stage); });

        /* Safety net: if anything blocks the observer, show everything. */
        window.setTimeout(revealAll, 2500);
    }

    /* ────────────────────────────────────────────────────────
       4. PAGE TRANSITIONS
       ──────────────────────────────────────────────────────── */
    function initPageTransitions() {
        var page = document.querySelector('.page');
        if (!page || prefersReducedMotion.matches) return;

        document.addEventListener('click', function (event) {
            var link = event.target.closest('.nav__link');

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

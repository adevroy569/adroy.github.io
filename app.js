/* ============================================================
   Geospatial Training Tutorials — app.js
   Vanilla ES2015+. No dependencies.

   1. Module filter controller (all / active / upcoming)
   2. Roving keyboard navigation across the filter chips
   3. Soft page transition on internal navigation
   ============================================================ */

(function () {
    'use strict';

    /* Run once the DOM is parsed. `defer` on the script tag already
       guarantees this, so we only wait if we somehow arrived early. */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

    function init() {
        initModuleFilter();
        initPageTransitions();
    }

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* ────────────────────────────────────────────────────────
       1. MODULE FILTER
       ──────────────────────────────────────────────────────── */
    function initModuleFilter() {
        var filterGroup = document.getElementById('module-filter');
        var grid        = document.getElementById('module-grid');
        var countEl     = document.getElementById('filter-count');
        var emptyEl     = document.getElementById('module-empty');

        if (!filterGroup || !grid) return;

        var chips   = Array.prototype.slice.call(filterGroup.querySelectorAll('[data-filter]'));
        var modules = Array.prototype.slice.call(grid.querySelectorAll('.module'));

        var LABELS = {
            all:      function (n) { return 'Showing all ' + n + ' modules'; },
            active:   function (n) { return 'Showing ' + n + ' active ' + plural(n) + ', ready to open'; },
            upcoming: function (n) { return 'Showing ' + n + ' upcoming ' + plural(n) + ', under construction'; }
        };

        function plural(n) { return n === 1 ? 'module' : 'modules'; }

        /* Event delegation: one listener serves every chip. */
        filterGroup.addEventListener('click', function (event) {
            var chip = event.target.closest('[data-filter]');
            if (!chip || !filterGroup.contains(chip)) return;
            applyFilter(chip.dataset.filter);
        });

        function applyFilter(state) {
            var visible = 0;

            modules.forEach(function (module) {
                var matches = state === 'all' || module.dataset.status === state;

                /* Reset the entry animation so re-shown cards replay it. */
                module.classList.remove('is-entering');

                if (matches) {
                    module.classList.remove('is-hidden');
                    module.style.setProperty('--index', String(visible));
                    visible += 1;
                } else {
                    module.classList.add('is-hidden');
                }
            });

            /* Force a reflow, then re-apply the stagger class in one batch. */
            if (!prefersReducedMotion.matches) {
                void grid.offsetWidth;
                modules.forEach(function (module) {
                    if (!module.classList.contains('is-hidden')) {
                        module.classList.add('is-entering');
                    }
                });
            }

            /* Chip pressed states. */
            chips.forEach(function (chip) {
                var isActive = chip.dataset.filter === state;
                chip.classList.toggle('is-active', isActive);
                chip.setAttribute('aria-pressed', String(isActive));
            });

            /* Live region + empty state. */
            if (countEl) countEl.textContent = LABELS[state](visible);
            if (emptyEl) emptyEl.hidden = visible !== 0;
        }

        /* 2. Roving keyboard navigation ──────────────────── */
        filterGroup.addEventListener('keydown', function (event) {
            var index = chips.indexOf(document.activeElement);
            if (index === -1) return;

            var next = null;

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

        /* Honour a deep link such as index.html#upcoming. */
        var hash = window.location.hash.replace('#', '');
        if (hash === 'active' || hash === 'upcoming') applyFilter(hash);
    }

    /* ────────────────────────────────────────────────────────
       3. PAGE TRANSITIONS
       Fades the page out before following an internal link.
       ──────────────────────────────────────────────────────── */
    function initPageTransitions() {
        var page = document.querySelector('.page');
        if (!page || prefersReducedMotion.matches) return;

        document.addEventListener('click', function (event) {
            var link = event.target.closest('.nav__link');

            if (!link) return;
            if (link.getAttribute('aria-current') === 'page') return;
            if (link.target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey) return;
            if (link.origin !== window.location.origin) return;

            event.preventDefault();
            var destination = link.href;

            page.style.transition = 'opacity 0.22s ' + 'cubic-bezier(0.55, 0, 1, 0.45)' +
                                    ', transform 0.22s cubic-bezier(0.55, 0, 1, 0.45)';
            page.style.opacity = '0';
            page.style.transform = 'translateY(-10px)';

            /* Navigate when the fade finishes — with a timeout guard
               in case transitionend never fires. */
            var done = false;
            function go() {
                if (done) return;
                done = true;
                window.location.href = destination;
            }

            page.addEventListener('transitionend', go, { once: true });
            window.setTimeout(go, 320);
        });
    }
})();

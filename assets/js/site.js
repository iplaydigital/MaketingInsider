/* ==========================================================================
   Marketing Insider — site behaviour
   Vanilla ES5+ (no build step, no dependencies).
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var BASE = body.getAttribute('data-root') || '';
  var THEME_KEY = 'mi-theme';

  /* ---------------------------------------------------------------- helpers */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function on(el, evt, fn, opts) { if (el) el.addEventListener(evt, fn, opts); }
  function url(path) { return BASE + path; }

  var toastEl, toastTimer;
  function toast(message) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.setAttribute('data-show', 'true');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.setAttribute('data-show', 'false'); }, 2200);
  }

  /* ------------------------------------------------------------------ theme */
  function applyTheme(theme, persist) {
    root.setAttribute('data-theme', theme);
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#080b12' : '#fbfbfd');
    $$('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      btn.setAttribute('title', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    });
    if (persist) { try { localStorage.setItem(THEME_KEY, theme); } catch (e) {} }
  }
  $$('[data-theme-toggle]').forEach(function (btn) {
    on(btn, 'click', function () {
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    });
  });
  applyTheme(root.getAttribute('data-theme') || 'light', false);

  /* ------------------------------------------------------------- mobile nav */
  var menuToggle = $('[data-menu-toggle]');
  var mobileNav = $('[data-mobile-nav]');
  function closeMenu() {
    if (!mobileNav) return;
    mobileNav.setAttribute('data-open', 'false');
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open menu');
    }
  }
  on(menuToggle, 'click', function () {
    var open = mobileNav.getAttribute('data-open') === 'true';
    mobileNav.setAttribute('data-open', open ? 'false' : 'true');
    menuToggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    menuToggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
  });
  $$('a', mobileNav).forEach(function (a) { on(a, 'click', closeMenu); });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1080) closeMenu();
  });

  /* --------------------------------------------------------- header state */
  var header = $('[data-header]');
  if (header) {
    var ticking = false;
    function syncHeader() {
      header.classList.toggle('is-stuck', window.scrollY > 8);
      ticking = false;
    }
    on(window, 'scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(syncHeader); }
    }, { passive: true });
    syncHeader();
  }

  /* ------------------------------------------------------------ reading bar */
  var bar = $('[data-progress]');
  if (bar) {
    var raf = false;
    function syncProgress() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      bar.style.width = pct + '%';
      raf = false;
    }
    on(window, 'scroll', function () {
      if (!raf) { raf = true; window.requestAnimationFrame(syncProgress); }
    }, { passive: true });
    on(window, 'resize', syncProgress);
    syncProgress();
  }

  /* ---------------------------------------------------------------- reveal */
  var reveals = $$('.reveal');
  if (reveals.length) {
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      reveals.forEach(function (el, i) {
        el.style.transitionDelay = Math.min(i % 3, 2) * 70 + 'ms';
        io.observe(el);
      });
    }
  }

  /* ----------------------------------------------------------- table of contents */
  var tocList = $('#tocList');
  var prose = $('.prose');
  if (tocList && prose) {
    var headings = $$('h2', prose).filter(function (h) { return h.id; });
    headings.forEach(function (h, i) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent.replace(/\s+/g, ' ').trim();
      li.appendChild(a);
      tocList.appendChild(li);
      if (i === 0) a.classList.add('is-active');
    });

    if ('IntersectionObserver' in window && headings.length) {
      var links = $$('a', tocList);
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          links.forEach(function (a) {
            a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
          });
        });
      }, { rootMargin: '-90px 0px -70% 0px', threshold: 0 });
      headings.forEach(function (h) { spy.observe(h); });
    }
  }

  /* ------------------------------------------------------------- share / copy */
  $$('[data-copy-link]').forEach(function (btn) {
    on(btn, 'click', function () {
      var link = btn.getAttribute('data-copy-link') || window.location.href;
      var done = function () { toast('Link copied to clipboard'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(done, function () { toast('Copy failed — ' + link); });
      } else {
        var ta = document.createElement('textarea');
        ta.value = link; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) { toast(link); }
        document.body.removeChild(ta);
      }
    });
  });

  /* ------------------------------------------------------------- newsletter */
  $$('[data-newsletter]').forEach(function (form) {
    var input = $('input[type="email"]', form);
    var msg = $('[data-form-msg]', form);
    var button = $('button[type="submit"]', form);
    function say(text, state) {
      if (!msg) return;
      msg.textContent = text;
      msg.setAttribute('data-state', state || '');
    }
    on(input, 'input', function () {
      if (input.getAttribute('aria-invalid') === 'true') {
        input.removeAttribute('aria-invalid');
        say('');
      }
    });
    on(form, 'submit', function (event) {
      event.preventDefault();
      var value = (input.value || '').trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      if (!valid) {
        input.setAttribute('aria-invalid', 'true');
        say('That email address looks incomplete — try again?', 'error');
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      var original = button.textContent;
      button.disabled = true;
      button.textContent = 'Subscribing…';
      setTimeout(function () {
        button.disabled = false;
        button.textContent = original;
        form.reset();
        say('You’re in. Look for Thursday’s brief in your inbox.', 'success');
      }, 750);
    });
  });

  /* --------------------------------------------------------- search overlay */
  var INDEX = [
    {
      title: 'The zero-click internet: how AI answers rewrote the top of the funnel',
      dek: 'Search is becoming an answer engine. The brands that win the next decade are optimising to be cited, not clicked.',
      category: 'Strategy', cat: 'strategy', url: 'articles/ai-search-zero-click.html',
      image: 'assets/img/cover-ai.jpg', author: 'Maya Lindqvist', date: 'Nov 6, 2026', read: '9 min read'
    },
    {
      title: 'First-party data is a product, not a project',
      dek: 'The companies getting value from their data aren’t running bigger campaigns. They’re shipping better data.',
      category: 'Data', cat: 'data', url: 'articles/first-party-data.html',
      image: 'assets/img/cover-growth.jpg', author: 'Daniel Osei', date: 'Nov 3, 2026', read: '8 min read'
    },
    {
      title: 'Distinctiveness beats differentiation (and your brand tracking knows it)',
      dek: 'Everyone has a positioning statement. Almost nobody has a memory structure. Here’s how to build the second one.',
      category: 'Brand', cat: 'brand', url: 'articles/brand-distinctiveness.html',
      image: 'assets/img/cover-brand.jpg', author: 'Priya Raman', date: 'Oct 30, 2026', read: '10 min read'
    },
    {
      title: 'Retention is a marketing channel now',
      dek: 'Acquisition costs are up 34% in two years. The cheapest growth left is the customer you already paid for.',
      category: 'Growth', cat: 'growth', url: 'articles/retention-channel.html',
      image: 'assets/img/cover-lifecycle.jpg', author: 'Tomás Ferreira', date: 'Oct 27, 2026', read: '7 min read'
    },
    {
      title: 'The pricing page is your most underrated ad',
      dek: 'It gets more qualified traffic than your homepage. Most teams last redesigned it three years ago.',
      category: 'Conversion', cat: 'conversion', url: 'articles/pricing-page.html',
      image: 'assets/img/cover-pricing.jpg', author: 'Maya Lindqvist', date: 'Oct 22, 2026', read: '6 min read'
    },
    {
      title: 'Attribution is a story we tell ourselves',
      dek: 'Every model is a hypothesis about causality. The useful question is not which one is right — it’s which one is honest.',
      category: 'Data', cat: 'data', url: 'articles/attribution-story.html',
      image: 'assets/img/cover-attribution.jpg', author: 'Daniel Osei', date: 'Oct 19, 2026', read: '8 min read'
    }
  ];

  var overlay, panel, searchInput, resultsBox, activeIndex = -1;
  var lastFocused = null;

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    overlay.id = 'searchOverlay';
    overlay.setAttribute('data-open', 'false');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Search Marketing Insider');
    overlay.innerHTML =
      '<div class="search-panel" role="document">' +
        '<div class="search-field">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>' +
          '<input type="search" id="searchInput" placeholder="Search articles, topics, authors…" autocomplete="off" spellcheck="false" aria-label="Search articles" aria-controls="searchResults">' +
          '<span class="search-hint">esc</span>' +
        '</div>' +
        '<div class="search-results" id="searchResults" role="listbox" aria-label="Results"></div>' +
        '<div class="search-foot">' +
          '<span><span class="search-hint">↑</span><span class="search-hint">↓</span> to navigate</span>' +
          '<span><span class="search-hint">↵</span> to open</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    panel = $('.search-panel', overlay);
    searchInput = $('#searchInput', overlay);
    resultsBox = $('#searchResults', overlay);

    on(overlay, 'mousedown', function (e) {
      if (e.target === overlay) closeSearch();
    });
    on(searchInput, 'input', function () { renderResults(searchInput.value); });
    on(searchInput, 'keydown', function (e) {
      var items = $$('.search-result', resultsBox);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!items.length) return;
        activeIndex = e.key === 'ArrowDown'
          ? (activeIndex + 1) % items.length
          : (activeIndex - 1 + items.length) % items.length;
        items.forEach(function (item, i) { item.classList.toggle('is-active', i === activeIndex); });
        items[activeIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        var target = items[activeIndex] || items[0];
        if (target) { e.preventDefault(); window.location.href = target.getAttribute('href'); }
      }
    });
    renderResults('');
  }

  function score(item, q) {
    var haystack = (item.title + ' ' + item.dek + ' ' + item.category + ' ' + item.author).toLowerCase();
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    var total = 0;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (item.title.toLowerCase().indexOf(w) > -1) total += 4;
      else if (haystack.indexOf(w) > -1) total += 1;
      else return -1;
    }
    return total;
  }

  function renderResults(query) {
    var q = (query || '').trim();
    var list = q
      ? INDEX.map(function (item) { return { item: item, s: score(item, q) }; })
             .filter(function (r) { return r.s > 0; })
             .sort(function (a, b) { return b.s - a.s; })
             .map(function (r) { return r.item; })
      : INDEX.slice(0, 5);
    activeIndex = list.length ? 0 : -1;

    if (!list.length) {
      resultsBox.innerHTML = '<div class="search-empty">No articles match “' + escapeHtml(q) + '”.<br>Try “data”, “brand” or “retention”.</div>';
      return;
    }
    resultsBox.innerHTML = list.map(function (item, i) {
      return '<a class="search-result' + (i === 0 ? ' is-active' : '') + '" href="' + url(item.url) + '" role="option">' +
        '<img class="search-result__thumb" src="' + url(item.image) + '" alt="" loading="lazy">' +
        '<div class="search-result__body">' +
          '<div class="search-result__cat">' + item.category + ' · ' + item.read + '</div>' +
          '<div class="search-result__title">' + item.title + '</div>' +
        '</div>' +
      '</a>';
    }).join('');
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function openSearch(seed) {
    if (!overlay) buildOverlay();
    lastFocused = document.activeElement;
    overlay.setAttribute('data-open', 'true');
    document.body.style.overflow = 'hidden';
    renderResults(seed || '');
    searchInput.value = seed || '';
    setTimeout(function () { searchInput.focus(); }, 30);
  }
  function closeSearch() {
    if (!overlay) return;
    overlay.setAttribute('data-open', 'false');
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  on(document, 'click', function (e) {
    var trigger = e.target.closest && e.target.closest('[data-search-open]');
    if (trigger) { e.preventDefault(); openSearch(); }
  });
  on(document, 'keydown', function (e) {
    var isOpen = overlay && overlay.getAttribute('data-open') === 'true';
    if (e.key === 'Escape') {
      if (isOpen) { e.stopPropagation(); closeSearch(); }
      if (mobileNav && mobileNav.getAttribute('data-open') === 'true') closeMenu();
      return;
    }
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault(); openSearch(); return;
    }
    if (e.key === '/' && !typing && !isOpen) { e.preventDefault(); openSearch(); }
  });

  /* --------------------------------------------------------- archive filters */
  var grid = $('[data-archive-grid]');
  if (grid) {
    var cards = $$('[data-article]', grid);
    var pills = $$('[data-filter]');
    var archiveInput = $('[data-archive-search]');
    var countEl = $('[data-result-count]');
    var emptyEl = $('[data-empty]');
    var current = 'all';

    function apply() {
      var q = (archiveInput && archiveInput.value || '').trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (card) {
        var cat = card.getAttribute('data-category');
        var hay = (card.getAttribute('data-search') || '').toLowerCase();
        var matchCat = current === 'all' || cat === current;
        var matchQ = !q || hay.indexOf(q) > -1;
        var visible = matchCat && matchQ;
        card.classList.toggle('is-hidden', !visible);
        if (visible) shown++;
      });
      if (countEl) countEl.textContent = shown;
      if (emptyEl) emptyEl.classList.toggle('is-hidden', shown > 0);
      pills.forEach(function (p) {
        p.setAttribute('aria-pressed', p.getAttribute('data-filter') === current ? 'true' : 'false');
      });
    }

    function setCategory(cat, push) {
      current = cat;
      if (push && window.history.replaceState) {
        var u = new URL(window.location.href);
        if (cat === 'all') u.searchParams.delete('category');
        else u.searchParams.set('category', cat);
        window.history.replaceState({}, '', u);
      }
      apply();
    }

    pills.forEach(function (p) {
      on(p, 'click', function () { setCategory(p.getAttribute('data-filter'), true); });
    });
    on(archiveInput, 'input', apply);

    var params = new URLSearchParams(window.location.search);
    var initial = (params.get('category') || 'all').toLowerCase();
    setCategory(initial, false);
  }
})();

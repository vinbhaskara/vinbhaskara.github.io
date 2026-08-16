/* ==========================================================================
   Custom JS — vinbhaskara.github.io
   Runs after main.min.js (jQuery already available)
   ========================================================================== */

(function ($) {
  'use strict';

  /* -------------------------------------------------------------------------
     Sticky header height -> --header-h

     Anything that has to clear the sticky header (currently `scroll-padding-top`
     on <html>, which offsets every anchor-link landing) reads this variable, so
     no stylesheet has to hard-code a height that changes with the viewport, the
     root font size, whether the sub-masthead is on the page, or a web font
     landing after first paint.

     Measured with offsetHeight, which is the one box metric that means the same
     thing in every engine when CSS zoom is in play: it reports layout pixels,
     with zoom not applied, in both Chromium and WebKit. getBoundingClientRect()
     does NOT — Chromium scales it by zoom and WebKit does not — so it is never
     used for layout math here.
  -------------------------------------------------------------------------  */
  var header = document.querySelector('.site-header');

  function publishHeaderHeight() {
    if (!header) return;
    document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  }

  publishHeaderHeight();
  $(window).on('resize.header orientationchange.header', publishHeaderHeight);

  /* Web fonts land after first paint and change the nav's metrics, so re-measure
     once they do. The resize event is for greedy nav (jquery.greedy-navigation.js),
     which sizes the visible link list once at parse time and afterwards only on
     resize: Inter is wider than the fallback it measured against, so without a
     nudge the last link it kept ends up underneath the overflow button. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      publishHeaderHeight();
      $(window).trigger('resize');
    }).catch(function () {});
  }

  /* -------------------------------------------------------------------------
     Reading Progress Bar

     documentElement's scrollHeight/clientHeight and window.pageYOffset are all
     reported in the same (visual) pixel space in both Chromium and WebKit, with
     or without CSS zoom, so this needs no zoom correction. jQuery's
     $(document).height() does not share that space — it maxes in body metrics,
     which are layout pixels — which is what the previous zoom fudge here was
     compensating for.
  -------------------------------------------------------------------------  */
  var $bar = $('<div id="reading-progress"></div>');
  $('body').prepend($bar);

  function updateProgress() {
    var de = document.documentElement;
    var scrollable = de.scrollHeight - de.clientHeight;
    var pct = scrollable > 0 ? (window.pageYOffset / scrollable) * 100 : 0;
    $bar.css('width', Math.max(0, Math.min(pct, 100)) + '%');
  }

  $(window).on('scroll.progress resize.progress', updateProgress);
  updateProgress();

  /* -------------------------------------------------------------------------
     Scroll-aware masthead (.scrolled class)
  -------------------------------------------------------------------------  */
  $(window).on('scroll.masthead', function () {
    $('.masthead').toggleClass('scrolled', $(this).scrollTop() > 20);
  });

  /* -------------------------------------------------------------------------
     Dark mode toggle
  -------------------------------------------------------------------------  */
  /* Dark mode toggle — handled by inline onclick in masthead.html */

  /* -------------------------------------------------------------------------
     Scroll-reveal via IntersectionObserver
  -------------------------------------------------------------------------  */
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

    /* Section headings */
    document.querySelectorAll('.page__content h2, .page__content h3').forEach(function (el) {
      el.classList.add('reveal');
      observer.observe(el);
    });

    /* Publication rows (skip blank spacer rows) */
    document.querySelectorAll('#publication-table > tbody > tr').forEach(function (el, i) {
      if (el.textContent.trim().length > 10) {
        el.classList.add('reveal');
        el.style.transitionDelay = Math.min(i * 55, 400) + 'ms';
        observer.observe(el);
      }
    });

    /* First few paragraphs in content area */
    document.querySelectorAll('.page__content > p').forEach(function (el, i) {
      if (i < 4) {
        el.classList.add('reveal');
        el.style.transitionDelay = (i * 65) + 'ms';
        observer.observe(el);
      }
    });
  }

  /* -------------------------------------------------------------------------
     Code block line numbers + word wrap
     Replaces <pre> content with a two-column table: line number | code line.
     The code column uses pre-wrap so long lines wrap instead of scroll.
  -------------------------------------------------------------------------  */
  document.querySelectorAll('div.highlighter-rouge pre, figure.highlight pre').forEach(function (pre) {
    var code = pre.querySelector('code');
    if (!code) return;

    var lines = code.innerHTML.split('\n');
    if (lines[lines.length - 1] === '') lines.pop();

    var table = document.createElement('table');
    table.className = 'code-linenos';
    var tbody = document.createElement('tbody');

    lines.forEach(function (line, i) {
      var tr = document.createElement('tr');
      var tdNum = document.createElement('td');
      tdNum.className = 'lineno';
      tdNum.textContent = String(i + 1);
      var tdCode = document.createElement('td');
      tdCode.className = 'code-line';
      tdCode.innerHTML = line;
      tr.appendChild(tdNum);
      tr.appendChild(tdCode);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    pre.parentNode.insertBefore(table, pre);
    pre.style.display = 'none';
  });

  /* -------------------------------------------------------------------------
     Copy button on code blocks
     Injects a pill button into each code block; copies raw text from the
     hidden <pre><code> element (still in DOM after line-number injection).
  -------------------------------------------------------------------------  */
  document.querySelectorAll('div.highlighter-rouge, figure.highlight').forEach(function (block) {
    var code = block.querySelector('pre code');
    if (!code) return;

    var btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy code to clipboard');

    btn.addEventListener('click', function () {
      var text = code.innerText || code.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
      function done() {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });

    block.appendChild(btn);
  });

  /* -------------------------------------------------------------------------
     In-page anchor scrolling that clears the sticky header.
     Delegated handler in capture phase pre-empts jQuery smoothScroll's
     per-element binding (which was initialized with offset: -20 in _main.js).

     The clearance itself is `scroll-padding-top` on <html> (see
     _sass/_custom.scss), applied by the browser's own scrolling machinery —
     this handler does no coordinate arithmetic at all. That is deliberate: the
     obvious formula, `target.getBoundingClientRect().top + window.pageYOffset`,
     is wrong under CSS zoom in WebKit, because getBoundingClientRect() returns
     layout pixels there while pageYOffset and scrollTo() are in visual pixels.
     Measured on the home page at zoom 0.825, that mismatch sent an #education
     click ~21% too far down the page, and it got worse the further the target
     sat from the top — matching the Safari-only overshoot this replaces.
     Chromium scales rects by zoom, which is why the same code behaved there.
  -------------------------------------------------------------------------  */
  document.addEventListener('click', function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    if (a.closest('.sidebar__top')) return;
    var hash = a.getAttribute('href');
    if (!hash || hash === '#' || hash.length < 2) return;

    // Bio link in the sub-masthead points to the top of the page (title lives
    // in the layout above #bio), so treat it like a back-to-top action.
    if (hash === '#bio' && a.closest('.sub-masthead')) {
      e.preventDefault();
      e.stopPropagation();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      history.pushState(null, '', '#bio');
      return;
    }

    var target = document.getElementById(hash.slice(1));
    if (!target) return;

    e.preventDefault();
    e.stopPropagation();

    publishHeaderHeight(); // in case a resize/font load beat the listeners
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.pushState(null, '', hash);
  }, true);

  /* -------------------------------------------------------------------------
     Back-to-top button — always scrolls to absolute top.
     Overrides jQuery smoothScroll which reports wrong document position for
     sticky #site-nav (offset().top = currentScrollTop, not 0).
  -------------------------------------------------------------------------  */
  $(document).on('click', '.sidebar__top a', function (e) {
    e.preventDefault();
    e.stopPropagation();
    $('html, body').stop(true).animate({ scrollTop: 0 }, 250, 'swing');
  });

  /* -------------------------------------------------------------------------
     Publication card expand / collapse
     Clicking the card toggles the .expanded class (shows .pub-summary).
     Clicks on links, buttons, and images stop propagation so they still work.
  -------------------------------------------------------------------------  */
  document.querySelectorAll('.pub-card').forEach(function (card) {
    card.querySelectorAll('a, button, img').forEach(function (el) {
      el.addEventListener('click', function (e) { e.stopPropagation(); });
    });
    card.addEventListener('click', function () {
      if (window.getSelection && window.getSelection().toString().length > 0) return;
      card.classList.toggle('expanded');
    });
  });

  /* -------------------------------------------------------------------------
     Keyboard shortcut: press 'd' to toggle dark mode
  -------------------------------------------------------------------------  */
  $(document).on('keydown', function (e) {
    /* ignore if inside input/textarea */
    if ($(e.target).is('input, textarea, [contenteditable]')) return;
    if (e.key === 'd' || e.key === 'D') {
      $('#myInverter').trigger('click');
    }
  });

}(jQuery));

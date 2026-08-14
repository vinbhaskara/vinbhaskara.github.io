/* ==========================================================================
   Custom JS — vinbhaskara.github.io
   Runs after main.min.js (jQuery already available)
   ========================================================================== */

(function ($) {
  'use strict';

  /* -------------------------------------------------------------------------
     Screen-resolution-based zoom
     CSS media queries use viewport width, which shrinks when the user manually
     browser-zooms, causing the wrong breakpoint to fire. window.screen.width
     always reflects the actual physical screen resolution regardless of browser
     zoom, giving a stable, user-zoom-independent baseline.
     CSS zoom rules above serve as an instant visual approximation; this
     overrides them with the correct value once the script runs.
  -------------------------------------------------------------------------  */
  (function () {
    // >>> KEEP IN SYNC WITH _sass/_custom.scss <<<
    // Every constant below is the twin of a variable in the "RESPONSIVE
    // GLOBAL SCALE" block at the top of _sass/_custom.scss:
    //   GLOBAL_ZOOM  <->  $global-zoom
    //   ZOOM_MOBILE  <->  $zoom-mobile   (and so on for the rest)
    // If you change a value here, change its twin there — a mismatch makes
    // the page visibly jump from the CSS value to the JS value on load.
    //
    // 1.0 = browser default; 0.825 renders like browser zoom at 82.5%.
    var GLOBAL_ZOOM = 0.825;

    // Every bracket is a relative multiplier applied on top of GLOBAL_ZOOM —
    // no exceptions, mobile included. 1.0 means "exactly GLOBAL_ZOOM".
    var ZOOM_MOBILE  = 1.0;  // < 768
    var ZOOM_LAPTOP  = 1.0;  // 768–1599
    var ZOOM_DESKTOP = 1.0;  // 1600–1919
    var ZOOM_LARGE   = 1.0;  // 1920–2559
    var ZOOM_XLARGE  = 1.0;  // 2560+

    var sw = window.screen.width;
    var factor = sw < 768  ? ZOOM_MOBILE   // mobile
               : sw < 1600 ? ZOOM_LAPTOP   // laptop / MacBook Air
               : sw < 1920 ? ZOOM_DESKTOP  // large laptop / external monitor
               : sw < 2560 ? ZOOM_LARGE    // 27"+ desktop
               :             ZOOM_XLARGE;  // 32"+ / 4K

    document.documentElement.style.zoom = String(GLOBAL_ZOOM * factor);
  }());

  /* -------------------------------------------------------------------------
     Reading Progress Bar
  -------------------------------------------------------------------------  */
  var $bar = $('<div id="reading-progress"></div>');
  $('body').prepend($bar);

  // function updateProgress() {
  //   var scrollTop = $(window).scrollTop();
  //   var docH = $(document).height() - $(window).height();
  //   var pct = docH > 0 ? (scrollTop / docH) * 100 : 0;
  //   $bar.css('width', Math.min(pct, 100) + '%');
  // }
  function updateProgress() {
    var zoomValue = window.getComputedStyle(document.documentElement).getPropertyValue('zoom');
    var zoomFactor = (zoomValue && !isNaN(parseFloat(zoomValue))) ? parseFloat(zoomValue) : 1;

    // zoom < 1: scrollTop is in the compressed zoomed coordinate space while
    //           scrollHeight is unscaled → multiply docHeight by zoom to match.
    // zoom >= 1: both scrollTop and scrollHeight are in the same coordinate space
    //            → standard formula, no correction needed.
    var scrollTop = Math.ceil($(window).scrollTop());
    var docH = zoomFactor < 1
      ? ($(document).height() * zoomFactor) - $(window).height()
      : $(document).height() - $(window).height();

    var pct = docH > 0 ? (scrollTop / docH) * 100 : 0;
    $bar.css('width', Math.min(pct, 100) + '%');
  }


  $(window).on('scroll.progress', updateProgress);
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
     In-page anchor scrolling that clears the sticky masthead(s).
     Delegated handler in capture phase pre-empts jQuery smoothScroll's
     per-element binding (which was initialized with offset: -20 in _main.js).
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

    var masthead = document.querySelector('.masthead');
    var subMasthead = document.querySelector('.sub-masthead');
    var offset = (masthead ? masthead.offsetHeight : 0)
               + (subMasthead ? subMasthead.offsetHeight : 0)
               + 16; // breathing room

    var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: top, behavior: 'smooth' });
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

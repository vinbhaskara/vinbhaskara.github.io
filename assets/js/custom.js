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
    var sw = window.screen.width;
    var zoom = sw < 768  ? null    // mobile — no zoom
             : sw < 1600 ? '0.9'  // laptop / MacBook Air
             :             '1.0'; // large monitors and above
    if (zoom !== null) {
      document.documentElement.style.zoom = zoom;
    }
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
  $(document).on('click', '#theme-toggle', function () {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    sessionStorage.setItem('theme', next);
  });

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
      $('#theme-toggle').trigger('click');
    }
  });

}(jQuery));

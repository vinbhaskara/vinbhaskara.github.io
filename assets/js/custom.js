/* ==========================================================================
   Custom JS — vinbhaskara.github.io
   Runs after main.min.js (jQuery already available)
   ========================================================================== */

(function ($) {
  'use strict';

  /* -------------------------------------------------------------------------
     Reading Progress Bar
  -------------------------------------------------------------------------  */
  var $bar = $('<div id="reading-progress"></div>');
  $('body').prepend($bar);

  function updateProgress() {
    var scrollTop = $(window).scrollTop();
    var docH = $(document).height() - $(window).height();
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
     Back-to-top button — always scrolls to absolute top.
     Overrides jQuery smoothScroll which reports wrong document position for
     sticky #site-nav (offset().top = currentScrollTop, not 0).
  -------------------------------------------------------------------------  */
  $(document).on('click', '.sidebar__top a', function (e) {
    e.preventDefault();
    e.stopPropagation();
    $('html, body').animate({ scrollTop: 0 }, 550, 'swing');
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

// ==UserScript==
// @author         Anonymous
// @name           ClearView
// @version        0.1.5
// @description    Improve page readability by removing obstructive overlays and blur effects.
// @id             clearview
// @namespace      https://cdno.canghai.org
// @updateURL      https://cdno.canghai.org/js/clearview.js
// @downloadURL    https://cdno.canghai.org/js/clearview.js
// @icon           https://cdno.canghai.org/images/clearview.svg
// @match          https://clearview.invalid/*
// @grant          none
// @run-at         document-start
// ==/UserScript==

(function() {
  'use strict';

  function restoreView() {
    document.querySelectorAll('.vip-gate-overlay').forEach(function(element) {
      element.remove();
    });

    document.querySelectorAll("div[style*='blur']").forEach(function(element) {
      if (element.style.filter !== 'none') element.style.filter = 'none';
      if (element.style.pointerEvents !== 'auto') element.style.pointerEvents = 'auto';
      if (element.style.userSelect !== 'auto') element.style.userSelect = 'auto';
    });
  }

  function start() {
    restoreView();

    new MutationObserver(restoreView).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      childList: true,
      subtree: true
    });
  }

  if (document.documentElement) {
    start();
  } else {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  }
})();

// Keeps the rules sidebar in sync with the section shown in #rules-content.
(function () {
  function syncToc() {
    var article = document.querySelector('#rules-content [data-active-section]');
    var toc = document.getElementById('rules-toc');
    if (!article || !toc) return;
    var activeId = article.getAttribute('data-active-section');

    toc.querySelectorAll('.rules-toc-link.active').forEach(function (link) {
      link.classList.remove('active');
    });

    var active = activeId && toc.querySelector('.rules-toc-link[data-section="' + CSS.escape(activeId) + '"]');
    if (!active) return;
    active.classList.add('active');

    // open the branches containing the active link, then bring it into view
    for (var el = active.parentElement; el && el !== toc; el = el.parentElement) {
      if (el.tagName === 'DETAILS') el.open = true;
    }
    scrollSidebarTo(active);
  }

  // scrollIntoView would scroll the window too, so scroll only the sidebar
  function scrollSidebarTo(link) {
    var sidebar = document.getElementById('rules-toc');
    if (!sidebar || sidebar.scrollHeight <= sidebar.clientHeight) return;
    var linkRect = link.getBoundingClientRect();
    var sidebarRect = sidebar.getBoundingClientRect();
    if (linkRect.top < sidebarRect.top || linkRect.bottom > sidebarRect.bottom) {
      sidebar.scrollTop += linkRect.top - sidebarRect.top - sidebarRect.height / 2;
    }
  }

  document.body.addEventListener('htmx:afterSettle', function (evt) {
    if (evt.detail.target.id !== 'rules-content') return;
    syncToc();
    // on small screens the TOC sits above the content; close it after picking a section
    document.getElementById('rules-toc').classList.remove('show');
  });

  // on small screens the TOC is collapsed until opened, so it can only scroll to the
  // active section once it's visible
  document.getElementById('rules-toc').addEventListener('shown.bs.collapse', function () {
    var active = document.querySelector('#rules-toc .rules-toc-link.active');
    if (active) scrollSidebarTo(active);
  });

  syncToc();
})();

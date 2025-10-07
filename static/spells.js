document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('openSpell')) {
    const modal = new bootstrap.Modal(document.getElementById('spellModal'));
    modal.show();
  }

  document.getElementById('spellModal').addEventListener('hidden.bs.modal', () => {
    const url = new URL(window.location);
    url.searchParams.delete('openSpell');
    history.pushState(null, '', url);
  });
});

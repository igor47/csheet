const OPEN_PARAMS = ['openSpell', 'openBeast'];

// Close detail modal when backend triggers closeDetailModal event
document.body.addEventListener('closeDetailModal', function() {
  const modalElement = document.getElementById('detailModal');
  if (modalElement) {
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
      modal.hide();
    }
  }
});

// Open detail modal when backend triggers openDetailModal event
document.body.addEventListener('openDetailModal', function() {
  const modalElement = document.getElementById('detailModal');
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
});

// Auto-open modal if URL contains an open param, and clean up on close
document.addEventListener('DOMContentLoaded', () => {
  const modalElement = document.getElementById('detailModal');
  if (!modalElement) return;

  const urlParams = new URLSearchParams(window.location.search);

  if (OPEN_PARAMS.some(p => urlParams.has(p))) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }

  modalElement.addEventListener('hidden.bs.modal', () => {
    const url = new URL(window.location);
    OPEN_PARAMS.forEach(p => url.searchParams.delete(p));
    history.pushState(null, '', url);
  });
});

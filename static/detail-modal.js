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

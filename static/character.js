// Close edit modal when backend triggers closeEditModal event
document.body.addEventListener('closeEditModal', function() {
  const modalElement = document.getElementById('editModal');
  if (modalElement) {
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
      modal.hide();
    }
  }
});

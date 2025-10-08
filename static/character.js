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

// scroll position restore
document.body.addEventListener('htmx:afterSwap', (e) => {
  const container = e.target;

  // bring selected spell into view if any
  const selectedSpell = container.querySelector('input[name="spell_id"]:checked');
  if (selectedSpell) {
    selectedSpell.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
    selectedSpell.focus({ preventScroll: true });
  }
});

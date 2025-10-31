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

// Open edit modal when backend triggers openEditModal event
document.body.addEventListener('openEditModal', function() {
  const modalElement = document.getElementById('editModal');
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
});

// scroll position restore and modal opening
document.body.addEventListener('htmx:afterSwap', (e) => {
  const container = e.target;

  // chat box was updated
  if (container.id === 'chat-box-card') {
    // Scroll chat messages to bottom if present
    const messages = container.querySelectorAll('.chat-message');
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      lastMessage.scrollIntoView({ behavior: 'instant', block: 'end', container: 'nearest' });
    }

    // Focus chat input
    const chatInput = container.querySelector('#chat-input');
    if (chatInput && !chatInput.disabled) {
      chatInput.focus();
    }
  }

  // bring selected spell into view if any
  const selectedSpell = container.querySelector('input[name="spell_id"]:checked');
  if (selectedSpell) {
    selectedSpell.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
    selectedSpell.focus({ preventScroll: true });
  }
});

// Avatar Upload Flow
async function handleAvatarUpload() {
  const uploadBtn = document.getElementById('uploadAvatarBtn');
  const fileInput = document.getElementById('avatarFileInput');
  const progressDiv = document.getElementById('uploadProgress');
  const errorDiv = document.getElementById('uploadError');
  const successDiv = document.getElementById('uploadSuccess');

  if (!fileInput) return;

  const file = fileInput.files[0];
  if (!file) {
    errorDiv.textContent = 'Please select a file';
    errorDiv.classList.remove('d-none');
    return;
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    errorDiv.textContent = 'Invalid file type. Please select a JPEG, PNG, WebP, or GIF image.';
    errorDiv.classList.remove('d-none');
    return;
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    errorDiv.textContent = 'File too large. Maximum size is 5MB.';
    errorDiv.classList.remove('d-none');
    return;
  }

  // Hide error/success, show progress
  errorDiv.classList.add('d-none');
  successDiv.classList.add('d-none');
  progressDiv.classList.remove('d-none');
  uploadBtn.disabled = true;

  try {
    // Step 1: Initiate upload
    const initiateResponse = await fetch('/uploads/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content_type: file.type,
        size_bytes: file.size,
        original_filename: file.name
      })
    });

    if (!initiateResponse.ok) {
      const error = await initiateResponse.json();
      throw new Error(error.error || 'Failed to initiate upload');
    }

    const { upload_id, upload_url } = await initiateResponse.json();

    // Step 2: Upload file to S3
    const uploadResponse = await fetch(upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to storage');
    }

    // Step 3: Complete upload
    const completeResponse = await fetch(`/uploads/${upload_id}/complete`, {
      method: 'POST'
    });

    if (!completeResponse.ok) {
      const error = await completeResponse.json();
      throw new Error(error.error || 'Failed to complete upload');
    }

    // Step 4: Assign avatar to character using htmx
    const characterId = document.querySelector('[data-character-id]')?.dataset.characterId;
    if (!characterId) {
      throw new Error('Character ID not found');
    }

    // Hide progress, show success temporarily
    progressDiv.classList.add('d-none');
    successDiv.classList.remove('d-none');

    // Use htmx to assign avatar and update UI
    htmx.ajax('POST', `/characters/${characterId}/avatar`, {
      target: '#editModalContent',
      swap: 'innerHTML',
      values: { upload_id }
    })
  } catch (error) {
    progressDiv.classList.add('d-none');
    errorDiv.textContent = error.message;
    errorDiv.classList.remove('d-none');
    uploadBtn.disabled = false;
    console.dir(error);
  }
}

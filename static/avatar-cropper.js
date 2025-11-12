// Avatar Cropper - Initialize Cropper.js when cropper image is present
(function() {
  // Store cropper instance
  let cropper = null;

  // Initialize cropper after HTMX swaps content
  document.addEventListener('htmx:afterSwap', function(event) {
    const cropperImage = document.getElementById('cropperImage');
    if (!cropperImage) return;

    // Clean up existing cropper if any
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }

    // Parse existing crop data if available
    const existingCropData = cropperImage.dataset.existingCrop;
    let existingCrop = null;

    if (existingCropData && existingCropData !== '' && existingCropData !== 'null') {
      try {
        existingCrop = JSON.parse(existingCropData);
      } catch (e) {
        console.error('Failed to parse existing crop data:', e);
      }
    }

    // Initialize Cropper.js
    cropper = new Cropper(cropperImage, {
      aspectRatio: 1,
      viewMode: 1,
      autoCropArea: 1,
      ready() {
        // If we have existing crop data (as percentages), set it
        if (existingCrop) {
          const imageData = cropper.getImageData();

          // Convert percentages back to pixels
          const cropData = {
            x: existingCrop.x * imageData.naturalWidth,
            y: existingCrop.y * imageData.naturalHeight,
            width: existingCrop.width * imageData.naturalWidth,
            height: existingCrop.height * imageData.naturalHeight,
          };

          cropper.setData(cropData);
        }
      },
    });

    // Attach save handler to button
    const saveCropBtn = document.getElementById('saveCropBtn');
    if (saveCropBtn) {
      saveCropBtn.addEventListener('click', function() {
        if (!cropper) {
          console.error('No cropper instance found');
          return;
        }

        const cropData = cropper.getData();
        const imageData = cropper.getImageData();

        // Convert pixel coordinates to percentages (0-1)
        const xPercent = cropData.x / imageData.naturalWidth;
        const yPercent = cropData.y / imageData.naturalHeight;
        const widthPercent = cropData.width / imageData.naturalWidth;
        const heightPercent = cropData.height / imageData.naturalHeight;

        // Populate hidden form fields
        document.getElementById('crop_x_percent').value = xPercent;
        document.getElementById('crop_y_percent').value = yPercent;
        document.getElementById('crop_width_percent').value = widthPercent;
        document.getElementById('crop_height_percent').value = heightPercent;

        // Submit the form via htmx
        const form = document.getElementById('cropForm');
        htmx.trigger(form, 'submit');
      });
    }
  });

  // Clean up when modal is hidden
  document.addEventListener('hidden.bs.modal', function() {
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
  });
})();

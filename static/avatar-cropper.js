function prepareCropperImage() {
  const cropperImage = document.querySelector('cropper-image');
  if (!cropperImage) {
    console.warn(`No cropper-image element found`);
    return;
  }

  cropperImage.$ready((img) => {
    // resize canvas to be the height of the rendered image (max 500px)
    const cropperCanvas = document.querySelector('cropper-canvas');
    if (!cropperCanvas) {
      console.warn('No cropper canvas found');
      return;
    }

    const rect = img.getBoundingClientRect();
    const renderedH = rect.height;
    if (renderedH < 500) {
      cropperCanvas.style.height = `${renderedH}px`;

      const barWidth = (500 - renderedH) / 2;
      cropperImage.$move(0, -barWidth);
    }

    const cropForm = document.getElementById('cropForm');
    if (!cropForm) {
      console.warn('No crop form found');
      return;
    }


    function setCropFormFields({ x, y, width, height }) {
      const rect = img.getBoundingClientRect();
      const renderedH = rect.height;
      const renderedW = rect.width;

      // canvas dimensions
      const canvasBox = cropperCanvas.getBoundingClientRect();
      const canvasW = canvasBox.width;
      const canvasH = canvasBox.height;

      const cropX = cropForm.querySelector('input[name="crop_x_percent"]');
      const cropY = cropForm.querySelector('input[name="crop_y_percent"]');
      const cropW = cropForm.querySelector('input[name="crop_width_percent"]');
      const cropH = cropForm.querySelector('input[name="crop_height_percent"]');

      // Calculate padding (image might be smaller than canvas)
      const canvasExtraW = (canvasW - renderedW) / 2;
      const canvasExtraH = (canvasH - renderedH) / 2;

      // Convert canvas coordinates to image-relative percentages
      const yPercent = (y - canvasExtraH) / renderedH;
      cropY.value = yPercent;

      const hPercent = height / renderedH;
      cropH.value = hPercent;

      const xPercent = (x - canvasExtraW) / renderedW;
      cropX.value = xPercent;

      const wPercent = width / renderedW;
      cropW.value = wPercent;
    }

    function onCropperSelectionChange(event) {
      const detail = event.detail;

      // image dimensions
      const rect = img.getBoundingClientRect();
      const renderedW = rect.width;
      const renderedH = rect.height;

      // canvas dimensions
      const canvasBox = cropperCanvas.getBoundingClientRect();
      const canvasW = canvasBox.width;
      const canvasH = canvasBox.height;

      // Calculate padding (image might be smaller than canvas)
      const canvasExtraW = (canvasW - renderedW) / 2;
      const canvasExtraH = (canvasH - renderedH) / 2;

      // Constrain selection to stay within image bounds
      let { x, y, width, height } = detail;
      let needsCorrection = false;

      // Prevent selection from going into top/left padding
      if (x < canvasExtraW) {
        x = canvasExtraW;
        needsCorrection = true;
      }
      if (y < canvasExtraH) {
        y = canvasExtraH;
        needsCorrection = true;
      }

      // Prevent selection from exceeding image bounds on right/bottom
      if (x + width > canvasW - canvasExtraW) {
        x = canvasW - canvasExtraW - width;
        needsCorrection = true;
      }
      if (y + height > canvasH - canvasExtraH) {
        y = canvasH - canvasExtraH - height;
        needsCorrection = true;
      }

      // If we needed to correct the position, update the selection
      if (needsCorrection) {
        event.preventDefault();
        cropperSelection.$change(x, y, width, height);

      // update the hidden form fields with corrected coordinates
      } else {
        setCropFormFields({ x, y, width, height });
      }
    }

    // add the selection change listener
    const cropperSelection = document.querySelector('cropper-selection');
    if (cropperSelection) {
      // image dimensions
      const rect = img.getBoundingClientRect();
      const renderedW = rect.width;
      const renderedH = rect.height;

      const { existingx, existingy, existingw, existingh } = cropperSelection.dataset;

      // Calculate canvas padding (image might be smaller than canvas)
      const canvasBox = cropperCanvas.getBoundingClientRect();
      const canvasW = canvasBox.width;
      const canvasH = canvasBox.height;
      const canvasExtraW = (canvasW - renderedW) / 2;
      const canvasExtraH = (canvasH - renderedH) / 2;

      // if existing crop data is present, set initial selection
      // Use != null to allow 0 values (which are valid percentages)
      if (existingx != null && existingy != null && existingw != null && existingh != null) {
        // Convert percentages to canvas pixels (add padding to both x and y)
        const x = parseFloat(existingx) * renderedW + canvasExtraW;
        const y = parseFloat(existingy) * renderedH + canvasExtraH;
        const width = parseFloat(existingw) * renderedW;
        const height = parseFloat(existingh) * renderedH;
        cropperSelection.$change(x, y, width, height);
        setCropFormFields({ x, y, width, height });

      // otherwise, center a square selection
      } else {
        const sideLength = Math.min(renderedW, renderedH) * 0.8;
        const x = (renderedW - sideLength) / 2 + canvasExtraW;
        const y = (renderedH - sideLength) / 2 + canvasExtraH;
        cropperSelection.$change(x, y, sideLength, sideLength);
        setCropFormFields({ x, y, width: sideLength, height: sideLength });
      }

      cropperSelection.addEventListener('change', onCropperSelectionChange);
    }
  })
}

prepareCropperImage();

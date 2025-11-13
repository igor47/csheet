function prepareCropperImage() {
  const cropperImage = document.querySelector('cropper-image');
  if (!cropperImage) {
    console.warn(`No ${selector} element found`);
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
      const canvasW = cropperCanvas.getBoundingClientRect().width;

      const cropX = cropForm.querySelector('input[name="crop_x_percent"]');
      const cropY = cropForm.querySelector('input[name="crop_y_percent"]');
      const cropW = cropForm.querySelector('input[name="crop_width_percent"]');
      const cropH = cropForm.querySelector('input[name="crop_height_percent"]');

      const yPercent = y / renderedH;
      cropY.value = yPercent;

      const hPercent = height / renderedH;
      cropH.value = hPercent;

      const canvasExtraV = (canvasW - renderedW) / 2;
      const xPercent = (x - canvasExtraV) / renderedW;
      cropX.value = xPercent;

      const wPercent = width / renderedW;
      cropW.value = wPercent;
    }

    function onCropperSelectionChange(event) {
      const detail = event.detail;

      // prevent negative coordinates
      if (detail.x < 0 || detail.y < 0) {
        event.preventDefault();
      }

      // image dimensions
      const rect = img.getBoundingClientRect();
      const renderedW = rect.width;

      // canvas dimensions
      const canvasBox = cropperCanvas.getBoundingClientRect();
      const [canvasW, canvasH] = [canvasBox.width, canvasBox.height];

      // don't allow selection to exceed image bounds
      // we know the height of the canvas is the same as the image height
      if (detail.y + detail.height > canvasH) {
        event.preventDefault();
      }

      // we might have extra space on the sides if the image is narrow
      const canvasExtraV = (canvasW - renderedW) / 2
      if (detail.x < canvasExtraV || detail.x + detail.width > canvasW - canvasExtraV) {
        event.preventDefault();
      }

      // update the hidden form fields
      setCropFormFields(event.detail);
    }

    // add the selection change listener
    const cropperSelection = document.querySelector('cropper-selection');
    if (cropperSelection) {
      // image dimensions
      const rect = img.getBoundingClientRect();
      const renderedW = rect.width;
      const renderedH = rect.height;

      const { existingx, existingy, existingw, existingh } = cropperSelection.dataset;

      // if existing crop data is present, set initial selection
      if (existingx && existingy && existingw && existingh) {
        // set initial selection based on existing data
        const x = parseFloat(existingx) * renderedW;
        const y = parseFloat(existingy) * renderedH;
        const width = parseFloat(existingw) * renderedW;
        const height = parseFloat(existingh) * renderedH;
        cropperSelection.$change(x, y, width, height);
        setCropFormFields({ x, y, width, height });

      // otherwise, center a square selection
      } else {
        const sideLength = Math.min(renderedW, renderedH) * 0.8;
        const x = (renderedW - sideLength) / 2;
        const y = (renderedH - sideLength) / 2;
        cropperSelection.$change(x, y, sideLength, sideLength);
        setCropFormFields({ x, y, width: sideLength, height: sideLength });
      }

      cropperSelection.addEventListener('change', onCropperSelectionChange);
    }
  })
}

prepareCropperImage();

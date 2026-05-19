/** Crop a region from an image URL using pixel coordinates from react-easy-crop. */
export async function getCroppedImageBlob(imageSrc, pixelCrop, mimeType = 'image/png') {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Failed to crop image'))),
      mimeType,
      0.92,
    );
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

/** Rasterise SVG / remote image to PNG blob for storage + QR embedding. */
export async function rasteriseToPngBlob(fileOrUrl, maxSize = 512) {
  const url = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);
  try {
    const image = await loadImage(url);
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const w = Math.round(image.width * scale);
    const h = Math.round(image.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(image, 0, 0, w, h);
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        b => (b ? resolve(b) : reject(new Error('Rasterise failed'))),
        'image/png',
        0.92,
      );
    });
  } finally {
    if (typeof fileOrUrl !== 'string') URL.revokeObjectURL(url);
  }
}

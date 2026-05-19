import { jsPDF } from 'jspdf';

const FOOTER_TEXT = 'Powered by Reviewz';
const SUBTITLE = 'Scan to Review Us on Google';

/**
 * Compose branded QR card onto a canvas (QR image + business name + footer).
 * @param {object} opts
 * @param {string} opts.qrDataUrl — PNG data URL of the QR code
 * @param {string} opts.businessName
 * @param {number} [opts.width=360]
 */
export async function composeBrandedCardCanvas({
  qrDataUrl,
  businessName,
  width = 360,
  showSubtitle = true,
  showFooter = true,
}) {
  const pad = 28;
  const qrSize = width - pad * 2;
  const titleH = 44;
  const subtitleH = showSubtitle ? 28 : 0;
  const footerH = showFooter ? 32 : 0;
  const height = pad + qrSize + pad + titleH + subtitleH + footerH + pad;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  const qrImg = await loadImage(qrDataUrl);
  const qrX = pad;
  const qrY = pad;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  let y = qrY + qrSize + pad + 8;

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const name = (businessName || 'Your Business').trim();
  wrapText(ctx, name, width / 2, y, width - pad * 2, 22);
  y += titleH;

  if (showSubtitle) {
    ctx.fillStyle = '#111827';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText(SUBTITLE, width / 2, y);
    y += subtitleH + 8;
  }

  if (showFooter) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '500 11px system-ui, sans-serif';
    ctx.fillText(FOOTER_TEXT, width / 2, y);
  }

  return canvas;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  const lines = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((ln, i) => ctx.fillText(ln, x, startY + i * lineHeight));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

export function downloadCanvasAsPng(canvas, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function downloadBrandedCardPdf(canvas, filename) {
  const imgData = canvas.toDataURL('image/png');
  const pdfW = 210;
  const aspect = canvas.height / canvas.width;
  const pdfH = Math.min(297, pdfW * aspect + 20);
  const pdf = new jsPDF({
    orientation: pdfH > pdfW ? 'portrait' : 'landscape',
    unit: 'mm',
    format: [pdfW, pdfH],
  });
  const imgW = pdfW - 20;
  const imgH = imgW * aspect;
  pdf.addImage(imgData, 'PNG', 10, 10, imgW, imgH);
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

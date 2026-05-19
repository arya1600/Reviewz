import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { motion } from 'framer-motion';
import QRCodeStyling from 'qr-code-styling';
import {
  composeBrandedCardCanvas,
  downloadCanvasAsPng,
  downloadBrandedCardPdf,
} from '../../utils/brandedQrExport';

const FOOTER_TEXT = 'Powered by Reviewz';
const SUBTITLE = 'Scan to Review Us on Google';

/**
 * Branded QR card with optional center logo (qr-code-styling).
 * Exposes exportPng / exportPdf via ref.
 */
const BrandedQRCard = forwardRef(function BrandedQRCard(
  {
    value,
    businessName,
    logoUrl = null,
    qrSize = 200,
    compact = false,
    showLabels = true,
    showSubtitle = true,
    showFooter = true,
    monochrome = true,
    className = '',
  },
  ref,
) {
  const qrHostRef = useRef(null);
  const qrInstanceRef = useRef(null);

  const ink = monochrome ? '#000000' : '#4338ca';
  const corner = monochrome ? '#000000' : '#312e81';

  useEffect(() => {
    if (!qrHostRef.current || !value) return;

    const qr = new QRCodeStyling({
      width: qrSize,
      height: qrSize,
      type: 'canvas',
      data: value,
      margin: 4,
      qrOptions: { errorCorrectionLevel: 'H' },
      image: logoUrl || undefined,
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 12,
        imageSize: 0.32,
        hideBackgroundDots: true,
      },
      dotsOptions: { color: ink, type: 'rounded' },
      backgroundOptions: { color: '#ffffff' },
      cornersSquareOptions: { color: corner, type: 'extra-rounded' },
      cornersDotOptions: { color: ink, type: 'dot' },
    });

    qrHostRef.current.innerHTML = '';
    qr.append(qrHostRef.current);
    qrInstanceRef.current = qr;

    return () => {
      if (qrHostRef.current) qrHostRef.current.innerHTML = '';
      qrInstanceRef.current = null;
    };
  }, [value, logoUrl, qrSize, ink, corner]);

  async function getQrPngDataUrl() {
    const qr = qrInstanceRef.current;
    if (!qr) throw new Error('QR not ready');
    const blob = await qr.getRawData('png');
    if (!blob) throw new Error('Could not render QR');
    return blobToDataUrl(blob);
  }

  async function exportPng(filename) {
    const qrDataUrl = await getQrPngDataUrl();
    const canvas = await composeBrandedCardCanvas({
      qrDataUrl,
      businessName,
      width: compact ? 280 : 360,
      showSubtitle,
      showFooter,
    });
    downloadCanvasAsPng(canvas, filename || `${slugify(businessName)}-qr.png`);
  }

  async function exportPdf(filename) {
    const qrDataUrl = await getQrPngDataUrl();
    const canvas = await composeBrandedCardCanvas({
      qrDataUrl,
      businessName,
      width: compact ? 280 : 360,
      showSubtitle,
      showFooter,
    });
    await downloadBrandedCardPdf(canvas, filename || `${slugify(businessName)}-qr.pdf`);
  }

  useImperativeHandle(ref, () => ({ exportPng, exportPdf, getQrPngDataUrl }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`flex flex-col items-center text-center ${className}`}
    >
      <div
        className={`bg-white border border-gray-100 shadow-sm flex items-center justify-center ${
          compact ? 'p-3 rounded-xl' : 'p-4 rounded-2xl'
        }`}
      >
        <div ref={qrHostRef} className="leading-none" />
      </div>

      {showLabels && (
        <motion.div
          key={`${businessName}-${logoUrl}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 space-y-1 max-w-[280px]"
        >
          <p className={`font-bold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
            {businessName || 'Your Business'}
          </p>
          {showSubtitle && (
            <p className={`font-semibold ${compact ? 'text-xs' : 'text-sm'} ${monochrome ? 'text-gray-900' : 'text-indigo-600'}`}>
              {SUBTITLE}
            </p>
          )}
          {showFooter && (
            <p className="text-[11px] text-gray-400 font-medium pt-2">{FOOTER_TEXT}</p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
});

export default BrandedQRCard;

function slugify(s) {
  return (s || 'business').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'business';
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

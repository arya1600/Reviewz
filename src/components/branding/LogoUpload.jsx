import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper from 'react-easy-crop';
import { Upload, X, ImageIcon, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { getCroppedImageBlob, rasteriseToPngBlob } from '../../utils/cropImage';
import { uploadBusinessLogo, removeBusinessLogo } from '../../lib/logoStorage';
import BrandedQRCard from './BrandedQRCard';

const ACCEPT = 'image/png,image/jpeg,image/jpg,image/svg+xml';
const MAX_MB = 2;

export default function LogoUpload({
  businessId,
  businessName = 'Your Business',
  logoUrl,
  onLogoChange,
  onPendingLogoChange,
  previewQrValue,
}) {
  const inputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const [cropSrc, setCropSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [pendingSvg, setPendingSvg] = useState(null);

  const onCropComplete = useCallback((_area, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function processFile(file) {
    setError('');
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB} MB.`);
      return;
    }
    const type = file.type.toLowerCase();
    if (!ACCEPT.split(',').some(t => type === t || type === t.replace('image/jpg', 'image/jpeg'))) {
      setError('Use PNG, JPG, or SVG.');
      return;
    }

    if (type === 'image/svg+xml') {
      setPendingSvg(file);
      setCropSrc(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
    setPendingSvg(null);
  }

  async function confirmUpload() {
    setUploading(true);
    setError('');
    try {
      let blob;
      if (pendingSvg) {
        blob = await rasteriseToPngBlob(pendingSvg);
        setPendingSvg(null);
      } else if (cropSrc && croppedAreaPixels) {
        blob = await getCroppedImageBlob(cropSrc, croppedAreaPixels, 'image/png');
        setCropSrc(null);
      } else {
        throw new Error('No image to upload');
      }

      if (businessId) {
        const url = await uploadBusinessLogo(businessId, blob);
        onLogoChange?.(url);
        onPendingLogoChange?.(null);
      } else {
        onPendingLogoChange?.(blob);
        onLogoChange?.(URL.createObjectURL(blob));
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!logoUrl) return;
    if (!confirm('Remove your business logo?')) return;
    setUploading(true);
    setError('');
    try {
      if (businessId && !logoUrl.startsWith('blob:')) {
        await removeBusinessLogo(businessId);
      }
      if (logoUrl.startsWith('blob:')) URL.revokeObjectURL(logoUrl);
      onPendingLogoChange?.(null);
      onLogoChange?.(null);
    } catch (err) {
      setError(err.message || 'Could not remove logo');
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  }

  const qrPreviewUrl = previewQrValue || (logoUrl ? `${window.location.origin}/r/preview` : null);

  const showCropModal = cropSrc || pendingSvg;

  return (
    <div className="space-y-6">
      {/* Upload card */}
      <motion.div
        layout
        className={`relative rounded-2xl border-2 border-dashed transition-colors ${
          dragOver ? 'border-indigo-400 bg-indigo-50/50' : 'border-gray-200 bg-gray-50/80'
        }`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={e => processFile(e.target.files?.[0])}
        />

        <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <AnimatePresence mode="wait">
            {logoUrl ? (
              <motion.div
                key="preview"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative flex-shrink-0"
              >
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-md bg-white"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-24 h-24 rounded-2xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0"
              >
                <ImageIcon className="w-10 h-10 text-gray-300" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-medium text-gray-800 mb-1">
              {logoUrl ? 'Logo uploaded' : 'Upload business logo'}
            </p>
            <p className="text-xs text-gray-500 mb-3">
              PNG, JPG, or SVG · max {MAX_MB} MB · appears in QR codes & review pages
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {logoUrl ? 'Replace' : 'Choose file'}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              )}
            </div>
            {!businessId && (
              <p className="text-xs text-amber-600 mt-2">
                {logoUrl
                  ? 'Logo ready — click Save business below to store it.'
                  : 'You can pick a logo now; it saves when you submit the form.'}
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4 px-4">
          Drag & drop an image here, or click Choose file
        </p>
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2"
        >
          {error}
        </motion.p>
      )}

      {/* Live QR preview */}
      {qrPreviewUrl && logoUrl && (
        <motion.div
          layout
          className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
        >
          <p className="text-sm font-semibold text-gray-800 mb-4">Live QR preview</p>
          <div className="flex justify-center">
            <BrandedQRCard
              value={qrPreviewUrl}
              businessName={businessName}
              logoUrl={logoUrl}
              qrSize={180}
              monochrome
            />
          </div>
        </motion.div>
      )}

      {/* Crop modal */}
      <AnimatePresence>
        {showCropModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-800">
                  {pendingSvg ? 'Upload SVG logo' : 'Crop your logo'}
                </p>
                <button
                  type="button"
                  onClick={() => { setCropSrc(null); setPendingSvg(null); }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {pendingSvg ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-600 mb-4">SVG will be converted to PNG for QR embedding.</p>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={confirmUpload}
                    className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                    {uploading ? 'Saving…' : businessId ? 'Upload logo' : 'Use this logo'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative h-64 bg-gray-900">
                    <Cropper
                      image={cropSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    <label className="text-xs text-gray-500 block">Zoom</label>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={zoom}
                      onChange={e => setZoom(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={confirmUpload}
                      className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                      {uploading ? 'Saving…' : businessId ? 'Save logo' : 'Use this logo'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

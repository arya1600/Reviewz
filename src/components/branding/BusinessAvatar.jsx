/**
 * Business logo or initial letter — dashboard, landing pages, QR flows.
 */
export default function BusinessAvatar({
  name,
  logoUrl,
  size = 48,
  className = '',
  rounded = '2xl',
}) {
  const px = typeof size === 'number' ? `${size}px` : size;
  const initial = name?.trim()?.[0]?.toUpperCase() ?? '?';
  const roundClass =
    rounded === 'full' ? 'rounded-full' :
    rounded === 'xl' ? 'rounded-xl' :
    rounded === 'lg' ? 'rounded-lg' : 'rounded-2xl';

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name || 'Business'} logo`}
        className={`object-cover bg-white border border-gray-100 ${roundClass} ${className}`}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-indigo-600 text-white font-bold shadow-sm ${roundClass} ${className}`}
      style={{ width: px, height: px, fontSize: typeof size === 'number' ? size * 0.4 : '1.25rem' }}
    >
      {initial}
    </div>
  );
}

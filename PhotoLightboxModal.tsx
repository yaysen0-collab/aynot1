import React from 'react';
import { X, Download } from 'lucide-react';

interface PhotoLightboxModalProps {
  photoUrl: string | null;
  onClose: () => void;
  title?: string;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  photoUrl,
  onClose,
  title,
}) => {
  if (!photoUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `ogrenci_not_fotografi_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Controls */}
        <div className="w-full flex items-center justify-between text-white mb-3 px-1">
          <span className="text-sm font-medium truncate opacity-90">
            {title || 'Not Fotoğrafı'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition active:scale-95"
              title="Fotoğrafı İndir"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition active:scale-95"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="w-full rounded-2xl overflow-hidden bg-black/50 flex items-center justify-center max-h-[80vh]">
          <img
            src={photoUrl}
            alt="Not Görseli"
            className="max-h-[80vh] w-auto max-w-full object-contain rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
};

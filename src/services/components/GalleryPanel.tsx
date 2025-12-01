
import React, { useState } from 'react';
import { GalleryImage } from '../types';
import { ArrowDownTrayIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface GalleryPanelProps {
  images: GalleryImage[];
  onDelete: (id: string) => void;
}

const GalleryPanel: React.FC<GalleryPanelProps> = ({ images, onDelete }) => {
  if (images.length === 0) return null;

  return (
    <div className="w-full mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          Your Gallery
        </h2>
        <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-full border border-slate-700">
          {images.length}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img) => (
          <GalleryItem key={img.id} img={img} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
};

const GalleryItem: React.FC<{ img: GalleryImage; onDelete: (id: string) => void }> = ({ img, onDelete }) => {
    const [showReference, setShowReference] = useState(false);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = `data:image/jpeg;base64,${showReference && img.referenceImage ? img.referenceImage : img.imageData}`;
        link.download = `instapose_${img.timestamp}_${showReference ? 'ref' : 'capture'}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div 
            className="group relative aspect-[3/4] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-lg hover:shadow-purple-500/20 transition-all hover:-translate-y-1"
        >
            <img 
                src={`data:image/jpeg;base64,${showReference && img.referenceImage ? img.referenceImage : img.imageData}`} 
                alt={`Score ${img.score}`} 
                className={`w-full h-full object-cover transition-opacity duration-300 ${showReference ? 'opacity-90' : 'opacity-100'}`}
            />
            
            {/* Score Badge */}
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 z-10">
                <span className={`text-xs font-bold ${
                img.score >= 80 ? 'text-green-400' : 'text-yellow-400'
                }`}>
                {img.score}%
                </span>
            </div>

            {/* Reference Toggle Thumbnail (Only if reference exists) */}
            {img.referenceImage && (
                <div 
                    className="absolute bottom-2 left-2 z-20 cursor-pointer"
                    onMouseEnter={() => setShowReference(true)}
                    onMouseLeave={() => setShowReference(false)}
                >
                    <div className="w-12 h-16 rounded border-2 border-white/30 overflow-hidden bg-black shadow-lg hover:scale-110 transition-transform hover:border-purple-500">
                        <img 
                            src={`data:image/jpeg;base64,${img.referenceImage}`}
                            className="w-full h-full object-cover opacity-70 hover:opacity-100"
                            alt="Ref" 
                        />
                    </div>
                </div>
            )}

            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-[2px] z-30 pointer-events-none">
                <div className="pointer-events-auto flex flex-col gap-2">
                    <button 
                        onClick={handleDownload}
                        className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg flex items-center justify-center gap-2"
                        title={showReference ? "Download Reference" : "Download Photo"}
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => onDelete(img.id)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                        title="Delete"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
                {img.referenceImage && (
                    <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold">
                        {showReference ? 'Downloading Reference' : 'Hover bottom-left to see ref'}
                    </span>
                )}
            </div>
        </div>
    );
};

export default GalleryPanel;

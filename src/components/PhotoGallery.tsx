'use client';

import { X, Image as ImageIcon } from 'lucide-react';

interface PhotoGalleryProps {
  photos: string[];
  onRemove: (index: number) => void;
}

export default function PhotoGallery({ photos, onRemove }: PhotoGalleryProps) {
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <ImageIcon size={48} className="mb-2" />
        <p>Nenhuma foto capturada</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Fotos Capturadas
        </h2>
        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden shadow-md">
            <img
              src={photo}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => onRemove(index)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg"
            >
              <X size={18} />
            </button>
            <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
              {index + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { Camera, Images, Save, Trash2 } from 'lucide-react';
import CameraCapture from '@/components/CameraCapture';
import PhotoGallery from '@/components/PhotoGallery';
import UploadModal from '@/components/UploadModal';

type View = 'camera' | 'gallery';

export default function Home() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<View>('camera');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCapture = useCallback((photo: string) => {
    setPhotos((prev) => [...prev, photo]);
  }, []);

  const handleRemovePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearAll = useCallback(() => {
    if (confirm('Deseja remover todas as fotos?')) {
      setPhotos([]);
    }
  }, []);

  const handleUploadComplete = useCallback(() => {
    setPhotos([]);
    setIsModalOpen(false);
    setCurrentView('camera');
  }, []);

  return (
    <main className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <h1 className="text-xl font-bold text-center">Geotecnia App</h1>
        <p className="text-blue-200 text-sm text-center">
          Captura e upload de fotos
        </p>
      </header>

      {/* Área principal */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'camera' ? (
          <CameraCapture onCapture={handleCapture} isActive={true} />
        ) : (
          <div className="h-full overflow-auto">
            <PhotoGallery photos={photos} onRemove={handleRemovePhoto} />
          </div>
        )}
      </div>

      {/* Barra de navegação inferior */}
      <nav className="bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {/* Botão Câmera */}
          <button
            onClick={() => setCurrentView('camera')}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              currentView === 'camera'
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Camera size={24} />
            <span className="text-xs mt-1">Câmera</span>
          </button>

          {/* Botão Galeria */}
          <button
            onClick={() => setCurrentView('gallery')}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors relative ${
              currentView === 'gallery'
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Images size={24} />
            <span className="text-xs mt-1">Galeria</span>
            {photos.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {photos.length}
              </span>
            )}
          </button>

          {/* Botão Limpar */}
          <button
            onClick={handleClearAll}
            disabled={photos.length === 0}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              photos.length === 0
                ? 'text-gray-300'
                : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Trash2 size={24} />
            <span className="text-xs mt-1">Limpar</span>
          </button>

          {/* Botão Salvar */}
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={photos.length === 0}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              photos.length === 0
                ? 'text-gray-300'
                : 'text-green-600 hover:text-green-700'
            }`}
          >
            <Save size={24} />
            <span className="text-xs mt-1">Salvar</span>
          </button>
        </div>
      </nav>

      {/* Modal de Upload */}
      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        photos={photos}
        onUploadComplete={handleUploadComplete}
      />
    </main>
  );
}

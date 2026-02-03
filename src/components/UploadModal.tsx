'use client';

import { useState } from 'react';
import { X, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  onUploadComplete: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function UploadModal({
  isOpen,
  onClose,
  photos,
  onUploadComplete,
}: UploadModalProps) {
  const [serviceName, setServiceName] = useState('');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const handleUpload = async () => {
    if (!serviceName.trim()) {
      setErrorMessage('Digite o nome do serviço');
      return;
    }

    setStatus('uploading');
    setProgress(0);
    setErrorMessage('');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceName: serviceName.trim(),
          photos,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload');
      }

      setStatus('success');
      setProgress(100);

      // Aguardar um pouco antes de fechar
      setTimeout(() => {
        onUploadComplete();
        resetModal();
      }, 2000);
    } catch (error) {
      console.error('Erro no upload:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  };

  const resetModal = () => {
    setServiceName('');
    setStatus('idle');
    setProgress(0);
    setErrorMessage('');
  };

  const handleClose = () => {
    if (status !== 'uploading') {
      resetModal();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Salvar no Google Drive
          </h2>
          {status !== 'uploading' && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {status === 'idle' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ex: Obra Centro - Sondagem 01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                {errorMessage && (
                  <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{photos.length}</span>{' '}
                  {photos.length === 1 ? 'foto será enviada' : 'fotos serão enviadas'}
                </p>
              </div>

              <button
                onClick={handleUpload}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
              >
                <Upload size={20} />
                Enviar Fotos
              </button>
            </>
          )}

          {status === 'uploading' && (
            <div className="py-8 text-center">
              <Loader2 size={48} className="animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">
                Enviando {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}...
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Por favor, aguarde
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-8 text-center">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <p className="text-gray-800 font-semibold text-lg">
                Upload concluído!
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {photos.length} {photos.length === 1 ? 'foto enviada' : 'fotos enviadas'} com sucesso
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="py-8 text-center">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <p className="text-gray-800 font-semibold text-lg">
                Erro no upload
              </p>
              <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-4 bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

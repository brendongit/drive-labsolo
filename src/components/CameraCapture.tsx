'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { SwitchCamera, AlertTriangle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (photo: string) => void;
  isActive: boolean;
}

export default function CameraCapture({ onCapture, isActive }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSecureContext = typeof window !== 'undefined' && (
    window.isSecureContext ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Verificar se está em contexto seguro
    if (!isSecureContext) {
      setError('Acesso à câmera requer HTTPS ou localhost. Acesse via localhost:3000');
      setIsLoading(false);
      return;
    }

    // Verificar se a API existe
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Seu navegador não suporta acesso à câmera. Tente Chrome ou Firefox.');
      setIsLoading(false);
      return;
    }

    try {
      // Parar stream anterior se existir
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Erro ao acessar câmera:', err);
      if (err.name === 'NotAllowedError') {
        setError('Permissão de câmera negada. Clique no ícone de cadeado na barra de endereço e permita o acesso.');
      } else if (err.name === 'NotFoundError') {
        setError('Nenhuma câmera encontrada no dispositivo.');
      } else {
        setError(`Erro ao acessar câmera: ${err.message || 'Verifique as permissões.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, isSecureContext]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, startCamera, stopCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Definir tamanho do canvas baseado no vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar frame atual no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converter para base64
    const photoData = canvas.toDataURL('image/jpeg', 0.8);
    onCapture(photoData);
  }, [onCapture]);

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  // Reiniciar câmera quando mudar facingMode
  useEffect(() => {
    if (isActive) {
      startCamera();
    }
  }, [facingMode, isActive, startCamera]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="relative w-full h-full bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-white">Carregando câmera...</div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10 p-6">
          <AlertTriangle size={48} className="text-yellow-500 mb-4" />
          <div className="text-white text-center mb-4">{error}</div>
          <button
            onClick={startCamera}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      <canvas ref={canvasRef} className="hidden" />

      {/* Controles */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8">
        {/* Botão para trocar câmera */}
        <button
          onClick={toggleCamera}
          className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white"
        >
          <SwitchCamera size={24} />
        </button>

        {/* Botão de captura */}
        <button
          onClick={capturePhoto}
          disabled={isLoading || !!error}
          className="w-20 h-20 rounded-full bg-white flex items-center justify-center disabled:opacity-50"
        >
          <div className="w-16 h-16 rounded-full bg-white border-4 border-gray-300" />
        </button>

        {/* Espaço para balancear */}
        <div className="w-12 h-12" />
      </div>
    </div>
  );
}

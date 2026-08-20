import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Image, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface CameraViewProps {
  onCapture: (base64: string) => void;
  isLoading: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, isLoading }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Initialize Camera
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    setCameraError(null);
    setPermissionDenied(false);

    // Stop existing tracks
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("L'accès à l'appareil photo n'est pas supporté sur ce navigateur.");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setCameraError("Permission de l'appareil photo refusée. Activez l'accès dans les paramètres de votre navigateur.");
      } else {
        setCameraError("Impossible d'activer le flux vidéo direct. Vous pouvez importer une photo depuis le stockage.");
      }
    }
  }, [stream]);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Capture frame from video
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.88);
    onCapture(base64);
  };

  // Handle local storage / file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onCapture(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-zinc-950 text-white overflow-hidden select-none">
      {/* Hidden File Input for Storage Access */}
      <input
        id="file-storage-input"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Viewport */}
      <div className="relative w-full flex-1 flex items-center justify-center bg-black overflow-hidden">
        {isCameraActive && (
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Viewfinder Target Reticle */}
        {isCameraActive && !cameraError && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative w-64 h-72 sm:w-80 sm:h-96 border-2 border-white/40 rounded-2xl">
              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />

              <div className="absolute top-3 left-0 right-0 text-center">
                <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white/90">
                  Cadrez le vêtement
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error / Fallback State if camera not accessible */}
        {(!isCameraActive || cameraError) && (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-400">
              {permissionDenied ? (
                <AlertCircle className="w-8 h-8 text-amber-400" />
              ) : (
                <Camera className="w-8 h-8" />
              )}
            </div>
            <h2 className="text-base font-semibold text-zinc-200 mb-2">
              {permissionDenied ? 'Accès Appareil Photo Requis' : 'Prise de vue directe'}
            </h2>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              {cameraError || "Autorisez l'accès à la caméra pour scanner les vêtements en direct, ou importez depuis le stockage."}
            </p>
            <div className="flex flex-col gap-3 w-full">
              <button
                id="retry-camera-btn"
                onClick={() => startCamera(facingMode)}
                className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer la caméra
              </button>
              <button
                id="upload-storage-btn"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 bg-white text-black hover:bg-zinc-200 active:bg-zinc-300 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Image className="w-4 h-4" />
                Choisir depuis la galerie
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Bar (Android Lens Style) */}
      <div className="w-full bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800/80 px-6 py-5 flex items-center justify-around z-20">
        {/* Gallery / Storage Button */}
        <button
          id="btn-open-gallery"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex flex-col items-center gap-1.5 p-2 text-zinc-400 hover:text-white active:scale-95 transition-all disabled:opacity-50"
          title="Importer depuis la galerie"
        >
          <div className="w-11 h-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Image className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium tracking-tight">Galerie</span>
        </button>

        {/* Shutter Capture Button */}
        <button
          id="btn-shutter-capture"
          onClick={capturePhoto}
          disabled={isLoading || !isCameraActive}
          className="relative group p-1 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          title="Capturer et rechercher"
        >
          <div className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center bg-transparent group-hover:border-zinc-300">
            <div className="w-14 h-14 rounded-full bg-white group-hover:bg-zinc-200 group-active:scale-90 transition-all flex items-center justify-center">
              <Camera className="w-6 h-6 text-black" />
            </div>
          </div>
        </button>

        {/* Camera Switcher Button */}
        <button
          id="btn-switch-camera"
          onClick={switchCamera}
          disabled={isLoading || !isCameraActive}
          className="flex flex-col items-center gap-1.5 p-2 text-zinc-400 hover:text-white active:scale-95 transition-all disabled:opacity-50"
          title="Changer de caméra"
        >
          <div className="w-11 h-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium tracking-tight">Pivoter</span>
        </button>
      </div>
    </div>
  );
};


import React, { useEffect, useRef } from 'react';
import { Camera, User } from 'lucide-react';

export const CameraOverlay: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    };

    if (isActive) {
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="absolute bottom-6 left-6 pointer-events-none z-20 group">
      <div className="relative w-48 h-36 rounded-2xl overflow-hidden border-2 border-blue-500/30 shadow-2xl transition-all duration-500 hover:border-blue-400/60 bg-black/40 backdrop-blur-md">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-500"
        />
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500/80 rounded-full flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold text-white uppercase">Visual Input Active</span>
        </div>
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <User size={14} className="text-white/40" />
        </div>
      </div>
      <div className="mt-2 text-[9px] text-blue-300 font-mono tracking-widest text-center bg-blue-900/20 py-1 rounded-md border border-blue-500/10">
        AI PERCEPTION ENGAGED
      </div>
    </div>
  );
};

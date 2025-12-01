import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PoseLandmarks } from '../types';

interface CameraViewProps {
  onCaptureFrame: (base64: string) => void;
  overlayImage: string | null;
  landmarks?: PoseLandmarks | null;
  isAnalyzing: boolean;
}

// Add custom animation for scanning
const style = document.createElement('style');
style.textContent = `
  @keyframes scan {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }
  .animate-scan {
    animation: scan 2s linear infinite;
  }
`;
document.head.appendChild(style);

const CameraView = React.forwardRef((props: CameraViewProps, ref: React.ForwardedRef<{ capture: () => void }>) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Default opacity 0.4 ensures user sees themselves clearly through the overlay
  const [opacity, setOpacity] = useState(0.4); 

  useEffect(() => {
    const startCamera = async () => {
      try {
        const constraints = {
          video: {
            facingMode: "user",
            width: { ideal: 1280 }, // Optimize for performance
            height: { ideal: 720 },
          },
          audio: false
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions.");
      }
    };
    startCamera();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror the capture for consistency with preview
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        props.onCaptureFrame(dataUrl.split(',')[1]);
      }
    }
  }, [props.onCaptureFrame]);

  React.useImperativeHandle(ref, () => ({
    capture
  }));

  return (
    <div className="relative w-full h-[65vh] bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-700 group">
       {error && (
         <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-red-500 z-50 p-4 text-center">
           {error}
         </div>
       )}
       
       <canvas ref={canvasRef} className="hidden" />
       
       {/* Live Video Feed - Mirrored */}
       <video 
         ref={videoRef} 
         autoPlay 
         playsInline 
         muted 
         className="w-full h-full object-cover transform -scale-x-100" 
       />
       
       {/* Ghost Overlay (Reference Pose) */}
       {props.overlayImage && (
        <div 
          className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-300" 
          style={{ 
            opacity: opacity,
            // 'screen' makes black transparent. 
            // 'lighten' is also good, but screen is smoother for overlays.
            mixBlendMode: 'screen' 
          }}
        >
           <img 
             src={`data:image/jpeg;base64,${props.overlayImage}`} 
             className="w-full h-full object-cover" 
             alt="Pose Ghost" 
           />
        </div>
      )}

      {/* Opacity Slider */}
      {props.overlayImage && (
         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center bg-black/40 backdrop-blur-md rounded-full px-6 py-3 border border-white/10 shadow-lg w-3/4 max-w-[200px]">
             <div className="flex justify-between w-full mb-1">
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Ghost</span>
                <span className="text-[10px] text-white/60">{Math.round(opacity * 100)}%</span>
             </div>
             <input 
                type="range" min="0" max="1" step="0.05" value={opacity} 
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
             />
         </div>
      )}

      {/* Scanning Animation */}
      {props.isAnalyzing && (
        <div className="absolute inset-0 z-40 bg-gradient-to-b from-transparent via-purple-500/20 to-transparent w-full h-full animate-scan pointer-events-none border-b border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]" />
      )}
      
      {/* Grid Lines (Optional helper) */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-10 grid grid-cols-3 grid-rows-3">
          <div className="border-r border-white/50"></div>
          <div className="border-r border-white/50"></div>
          <div></div>
          <div className="border-t border-white/50 col-span-3"></div>
          <div className="border-t border-white/50 col-span-3"></div>
      </div>
    </div>
  );
});

export default CameraView;

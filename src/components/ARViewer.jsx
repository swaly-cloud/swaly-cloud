import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera, RotateCcw } from 'lucide-react';
import { useARCamera } from '../hooks/useARCamera';

const C = {
  ink: '#0A0A0A', gold: '#D4AF37', goldLight: '#F5D547',
  bg: '#0A0A0A', error: '#C0392B',
};

// Draw glasses image over detected face
function drawOverlay(canvas, video, faces, glassesImg) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Mirror the video (front camera is mirrored)
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(video, -W, 0, W, H);
  ctx.restore();

  if (!glassesImg || faces.length === 0) return;

  for (const face of faces) {
    const bb = face.boundingBox;
    if (!bb) continue;

    // Bounding box coords are normalized [0,1]
    const x = bb.originX * W;
    const y = bb.originY * H;
    const w = bb.width * W;
    const h = bb.height * H;

    // Place glasses in the upper third of the face (eye area)
    // Mirror X since video is mirrored
    const gW = w * 1.1;
    const gH = gW * (glassesImg.naturalHeight / glassesImg.naturalWidth);
    const gX = W - (x + w / 2 + gW / 2);
    const gY = y + h * 0.22;

    ctx.drawImage(glassesImg, gX, gY, gW, gH);
  }
}

export default function ARViewer({ product, onClose }) {
  const canvasRef = useRef(null);
  const glassesImgRef = useRef(null);
  const [started, setStarted] = useState(false);
  const { videoRef, faces, isLoading, error, initCamera, stopCamera } = useARCamera();

  // Preload glasses image
  useEffect(() => {
    if (!product?.img) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = product.img;
    img.onload = () => { glassesImgRef.current = img; };
  }, [product?.img]);

  // Camera starts only when user taps the button (iOS requires user gesture)
  const handleStart = useCallback(() => {
    setStarted(true);
    initCamera();
  }, [initCamera]);

  // Draw loop
  useEffect(() => {
    let raf;
    const loop = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas && video && video.readyState >= 2) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        drawOverlay(canvas, video, faces, glassesImgRef.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [faces, videoRef]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: C.bg }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0">
        <div>
          <div className="text-[9px] tracking-[0.3em] font-semibold" style={{ color: C.gold }}>
            ESSAYAGE AR
          </div>
          <div className="text-[15px] font-semibold text-white truncate max-w-[200px]" style={{ fontFamily: 'Fraunces, serif' }}>
            {product?.name}
          </div>
        </div>
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.12)' }}
        >
          <X size={18} color="white" />
        </button>
      </div>

      {/* Video / Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {/* Hidden video element */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
          playsInline
          muted
          autoPlay
        />

        {/* Canvas with overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Start screen — before camera begins */}
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(212,175,55,0.15)', border: `1.5px solid ${C.gold}` }}
            >
              <Camera size={36} color={C.gold} />
            </div>
            <div className="text-center">
              <div className="text-white text-[17px] font-semibold mb-2" style={{ fontFamily: 'Fraunces,serif' }}>
                Essayage virtuel
              </div>
              <div className="text-[13px] text-white opacity-50">
                Ta caméra frontale sera utilisée pour superposer les lunettes sur ton visage.
              </div>
            </div>
            <button
              onClick={handleStart}
              className="px-8 py-4 text-[12px] tracking-[0.2em] font-semibold"
              style={{ background: C.gold, color: C.ink }}
            >
              ACTIVER LA CAMÉRA
            </button>
          </div>
        )}

        {/* Loading state */}
        {started && isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8">
            <div
              className="w-12 h-12 rounded-full border-2 animate-spin"
              style={{ borderColor: `${C.gold}40`, borderTopColor: C.gold }}
            />
            <div className="text-center">
              <div className="text-[14px] text-white font-semibold mb-1">Chargement IA…</div>
              <div className="text-[12px] text-white opacity-50">Premier lancement : ~10 secondes</div>
            </div>
          </div>
        )}

        {/* Error states */}
        {error === 'camera_denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8">
            <Camera size={48} color={C.gold} />
            <div className="text-center">
              <div className="text-white font-semibold mb-2">Accès caméra refusé</div>
              <div className="text-[13px] text-white opacity-60 mb-5">
                Autorise l'accès à la caméra dans les réglages de ton iPhone pour utiliser l'essayage AR.
              </div>
              <button
                onClick={initCamera}
                className="flex items-center gap-2 px-5 py-3 text-[11px] tracking-[0.15em] font-semibold"
                style={{ background: C.gold, color: C.ink }}
              >
                <RotateCcw size={13} /> RÉESSAYER
              </button>
            </div>
          </div>
        )}

        {error === 'no_camera' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8">
            <Camera size={48} color="white" opacity="0.4" />
            <div className="text-center text-white opacity-60 text-[13px]">
              Aucune caméra disponible sur cet appareil.
            </div>
          </div>
        )}

        {error && error !== 'camera_denied' && error !== 'no_camera' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8">
            <div className="text-center">
              <div className="text-white font-semibold mb-2">Erreur de chargement</div>
              <div className="text-[12px] text-white opacity-50 mb-5">{error}</div>
              <button
                onClick={initCamera}
                className="flex items-center gap-2 px-5 py-3 text-[11px] tracking-[0.15em] font-semibold"
                style={{ background: C.gold, color: C.ink }}
              >
                <RotateCcw size={13} /> RÉESSAYER
              </button>
            </div>
          </div>
        )}

        {/* Face hint when no face detected */}
        {started && !isLoading && !error && faces.length === 0 && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-[12px] font-semibold whitespace-nowrap"
            style={{ background: 'rgba(0,0,0,0.65)', color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' }}
          >
            Positionnez votre visage dans le cadre
          </div>
        )}

        {/* Face guide oval */}
        {started && !isLoading && !error && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: faces.length > 0 ? 0 : 0.4 }}
          >
            <ellipse
              cx="50%" cy="46%" rx="30%" ry="40%"
              fill="none"
              stroke={C.gold}
              strokeWidth="1.5"
              strokeDasharray="8 4"
            />
          </svg>
        )}
      </div>

      {/* Bottom bar */}
      <div
        className="flex-shrink-0 px-5 pt-4 pb-10"
        style={{ background: 'rgba(10,10,10,0.95)' }}
      >
        <div className="flex items-center gap-3">
          <img
            src={product?.img}
            alt={product?.name}
            className="w-12 h-12 object-cover rounded flex-shrink-0"
            style={{ background: '#1A1A1A' }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] tracking-[0.2em] font-semibold" style={{ color: C.gold }}>
              {product?.brand}
            </div>
            <div className="text-[13px] text-white truncate">{product?.name}</div>
          </div>
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: faces.length > 0 ? '#2D7D46' : 'rgba(255,255,255,0.2)' }}
          />
        </div>
      </div>
    </div>
  );
}

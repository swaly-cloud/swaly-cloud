import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Camera, RotateCcw, Move } from 'lucide-react';
import { useARCamera } from '../hooks/useARCamera';

const C = { ink: '#0A0A0A', gold: '#D4AF37' };

// bb coords from MediaPipe are in pixels — normalize by video size
function glassesStyle(bb, vW, vH) {
  if (!bb || !vW || !vH) return null;
  const nx = bb.originX / vW;
  const ny = bb.originY / vH;
  const nw = bb.width / vW;
  const nh = bb.height / vH;
  // mirror X (video is scaleX(-1))
  const centerX = (1 - nx - nw / 2) * 100;
  const topY    = (ny + nh * 0.22) * 100;
  const widthPct = nw * 115;
  return {
    position: 'absolute',
    left: `${centerX}%`,
    top: `${topY}%`,
    width: `${widthPct}%`,
    transform: 'translateX(-50%)',
    mixBlendMode: 'multiply',
    pointerEvents: 'none',
    userSelect: 'none',
  };
}

export default function ARViewer({ product, onClose }) {
  const { videoRef, phase, error, faces, initCamera, stopCamera } = useARCamera();
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const pinchRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 38 });
  const [scale, setScale] = useState(1.0);
  const [videoDims, setVideoDims] = useState({ w: 0, h: 0 });

  const hasFaces = faces.length > 0;
  const isLive = phase === 'live';

  // Track video native dimensions for coordinate normalization
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onMeta = () => setVideoDims({ w: video.videoWidth, h: video.videoHeight });
    video.addEventListener('loadedmetadata', onMeta);
    if (video.videoWidth) onMeta();
    return () => video.removeEventListener('loadedmetadata', onMeta);
  }, [videoRef]);


  const handleStart = useCallback(() => {
    setStarted(true);
    initCamera();
  }, [initCamera]);

  const handleClose = useCallback(() => { stopCamera(); onClose(); }, [stopCamera, onClose]);

  // Touch drag/pinch (CSS overlay mode — when no face detected)
  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      dragRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, startPosX: pos.x, startPosY: pos.y };
    } else if (e.touches.length === 2) {
      dragRef.current = null;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { startDist: Math.hypot(dx, dy), startScale: scale };
    }
  }, [pos, scale]);

  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (e.touches.length === 1 && dragRef.current) {
      const dx = ((e.touches[0].clientX - dragRef.current.startX) / rect.width) * 100;
      const dy = ((e.touches[0].clientY - dragRef.current.startY) / rect.height) * 100;
      setPos({ x: Math.max(10, Math.min(90, dragRef.current.startPosX + dx)), y: Math.max(5, Math.min(85, dragRef.current.startPosY + dy)) });
    } else if (e.touches.length === 2 && pinchRef.current) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setScale(Math.max(0.4, Math.min(2.5, pinchRef.current.startScale * (dist / pinchRef.current.startDist))));
    }
  }, []);

  const onTouchEnd = useCallback(() => { dragRef.current = null; pinchRef.current = null; }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: C.ink }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-3 flex-shrink-0"
           style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(8px)' }}>
        <div>
          <div className="text-[9px] tracking-[0.3em] font-semibold" style={{ color: C.gold }}>ESSAYAGE VIRTUEL</div>
          <div className="text-[15px] font-semibold text-white truncate max-w-[220px]" style={{ fontFamily: 'Fraunces,serif' }}>
            {product?.brand} — {product?.name}
          </div>
        </div>
        <button onClick={handleClose} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <X size={18} color="white" />
        </button>
      </div>

      {/* Camera area */}
      <div className="flex-1 relative overflow-hidden bg-black" ref={containerRef}
           onTouchStart={isLive && !hasFaces ? onTouchStart : undefined}
           onTouchMove={isLive && !hasFaces ? onTouchMove : undefined}
           onTouchEnd={isLive && !hasFaces ? onTouchEnd : undefined}
           style={{ touchAction: 'none' }}>

        {/* Video */}
        <video ref={videoRef}
               className="absolute inset-0 w-full h-full object-cover"
               style={{ transform: 'scaleX(-1)', display: isLive ? 'block' : 'none' }}
               playsInline muted autoPlay />

        {/* Glasses — auto-positioned when face detected, manual drag/pinch otherwise */}
        {isLive && (
          <img
            src={product?.img} alt="" draggable={false}
            style={
              hasFaces && videoDims.w > 0
                ? glassesStyle(faces[0]?.boundingBox, videoDims.w, videoDims.h)
                : { position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
                    width: `${70 * scale}%`, transform: 'translateX(-50%)',
                    mixBlendMode: 'multiply', pointerEvents: 'none', userSelect: 'none' }
            }
          />
        )}

        {/* START */}
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
                 style={{ background: 'rgba(212,175,55,0.15)', border: `1.5px solid ${C.gold}` }}>
              <Camera size={36} color={C.gold} />
            </div>
            <div className="text-center">
              <div className="text-white text-[17px] font-semibold mb-2" style={{ fontFamily: 'Fraunces,serif' }}>Essayage virtuel</div>
              <div className="text-[13px] text-white opacity-50">Détection automatique du visage</div>
            </div>
            <button onClick={handleStart} className="px-8 py-4 text-[12px] tracking-[0.2em] font-semibold" style={{ background: C.gold, color: C.ink }}>
              ACTIVER LA CAMÉRA
            </button>
          </div>
        )}

        {/* LOADING — camera */}
        {phase === 'camera' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: `${C.gold}40`, borderTopColor: C.gold }} />
            <div className="text-[13px] text-white opacity-60">Ouverture caméra…</div>
          </div>
        )}

        {/* LOADING — AI */}
        {phase === 'ai' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: `${C.gold}40`, borderTopColor: C.gold }} />
            <div className="text-center">
              <div className="text-[14px] text-white font-semibold mb-1">Chargement IA…</div>
              <div className="text-[12px] text-white opacity-40">~10 sec au premier lancement</div>
            </div>
          </div>
        )}

        {/* ERROR */}
        {phase === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8">
            <Camera size={44} color={C.gold} />
            <div className="text-center">
              {error === 'camera_denied' ? (
                <>
                  <div className="text-white font-semibold mb-2">Accès caméra refusé</div>
                  <div className="text-[12px] text-white opacity-50 mb-5">Réglages iOS → Safari → Caméra → Autoriser</div>
                </>
              ) : (
                <>
                  <div className="text-white font-semibold mb-2">Erreur caméra</div>
                  <div className="text-[11px] text-white opacity-40 mb-5">{error}</div>
                </>
              )}
              <button onClick={handleStart} className="flex items-center gap-2 px-5 py-3 text-[11px] tracking-[0.15em] font-semibold" style={{ background: C.gold, color: C.ink }}>
                <RotateCcw size={12} /> RÉESSAYER
              </button>
            </div>
          </div>
        )}

        {/* HINTS */}
        {isLive && !hasFaces && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-[11px] whitespace-nowrap flex items-center gap-1.5"
               style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(6px)' }}>
            <Move size={11} /> Glisse · Pince pour redimensionner
          </div>
        )}
        {isLive && hasFaces && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-[11px] whitespace-nowrap"
               style={{ background: 'rgba(0,0,0,0.55)', color: C.gold, backdropFilter: 'blur(6px)' }}>
            ● Visage détecté
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 px-5 pt-3 pb-10 flex items-center gap-3" style={{ background: 'rgba(10,10,10,0.9)' }}>
        <img src={product?.img} alt="" className="w-12 h-12 object-cover rounded flex-shrink-0" style={{ background: '#1A1A1A' }} />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] tracking-[0.2em] font-semibold" style={{ color: C.gold }}>{product?.brand}</div>
          <div className="text-[13px] text-white truncate">{product?.name}</div>
        </div>
      </div>
    </div>
  );
}

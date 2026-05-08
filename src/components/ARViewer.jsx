import { useState, useCallback, useRef } from 'react';
import { X, Camera, RotateCcw, Move } from 'lucide-react';
import { useARCamera } from '../hooks/useARCamera';

const C = { ink: '#0A0A0A', gold: '#D4AF37', goldLight: '#F5D547' };

export default function ARViewer({ product, onClose }) {
  const { videoRef, isLoading, error, initCamera, stopCamera } = useARCamera();
  const [started, setStarted] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 38 }); // % of screen
  const [scale, setScale] = useState(1.0);
  const containerRef = useRef(null);
  const dragRef = useRef(null); // { startX, startY, startPosX, startPosY }
  const pinchRef = useRef(null); // { startDist, startScale }

  const handleStart = useCallback(() => {
    setStarted(true);
    initCamera();
  }, [initCamera]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  // ── Touch handlers ──────────────────────────────────────────────
  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      dragRef.current = { startX: t.clientX, startY: t.clientY, startPosX: pos.x, startPosY: pos.y };
      pinchRef.current = null;
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
      const t = e.touches[0];
      const dx = ((t.clientX - dragRef.current.startX) / rect.width) * 100;
      const dy = ((t.clientY - dragRef.current.startY) / rect.height) * 100;
      setPos({
        x: Math.max(10, Math.min(90, dragRef.current.startPosX + dx)),
        y: Math.max(5, Math.min(85, dragRef.current.startPosY + dy)),
      });
    } else if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchRef.current.startDist;
      setScale(Math.max(0.4, Math.min(2.5, pinchRef.current.startScale * ratio)));
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    dragRef.current = null;
    pinchRef.current = null;
  }, []);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: C.ink }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-3 flex-shrink-0"
           style={{ background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(8px)' }}>
        <div>
          <div className="text-[9px] tracking-[0.3em] font-semibold" style={{ color: C.gold }}>ESSAYAGE VIRTUEL</div>
          <div className="text-[15px] font-semibold text-white truncate max-w-[220px]"
               style={{ fontFamily: 'Fraunces,serif' }}>
            {product?.brand} — {product?.name}
          </div>
        </div>
        <button onClick={handleClose}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.1)' }}>
          <X size={18} color="white" />
        </button>
      </div>

      {/* Camera area */}
      <div className="flex-1 relative overflow-hidden"
           ref={containerRef}
           onTouchStart={started && !isLoading && !error ? onTouchStart : undefined}
           onTouchMove={started && !isLoading && !error ? onTouchMove : undefined}
           onTouchEnd={started && !isLoading && !error ? onTouchEnd : undefined}
           style={{ touchAction: 'none' }}>

        {/* Video */}
        <video ref={videoRef}
               className="absolute inset-0 w-full h-full object-cover"
               style={{ transform: 'scaleX(-1)' }}
               playsInline muted autoPlay />

        {/* Glasses overlay */}
        {started && !isLoading && !error && (
          <img
            src={product?.img}
            alt={product?.name}
            draggable={false}
            style={{
              position: 'absolute',
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: `${70 * scale}%`,
              transform: 'translateX(-50%)',
              mixBlendMode: 'multiply',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        )}

        {/* Start screen */}
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
                 style={{ background: 'rgba(212,175,55,0.15)', border: `1.5px solid ${C.gold}` }}>
              <Camera size={36} color={C.gold} />
            </div>
            <div className="text-center">
              <div className="text-white text-[17px] font-semibold mb-2" style={{ fontFamily: 'Fraunces,serif' }}>
                Essayage virtuel
              </div>
              <div className="text-[13px] text-white opacity-50">
                Caméra frontale · glisse pour repositionner · pince pour redimensionner
              </div>
            </div>
            <button onClick={handleStart}
                    className="px-8 py-4 text-[12px] tracking-[0.2em] font-semibold"
                    style={{ background: C.gold, color: C.ink }}>
              ACTIVER LA CAMÉRA
            </button>
          </div>
        )}

        {/* Loading */}
        {started && isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 animate-spin"
                 style={{ borderColor: `${C.gold}40`, borderTopColor: C.gold }} />
            <div className="text-[13px] text-white opacity-60">Ouverture caméra…</div>
          </div>
        )}

        {/* Error: permission denied */}
        {error === 'camera_denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8">
            <Camera size={44} color={C.gold} />
            <div className="text-center">
              <div className="text-white font-semibold mb-2">Accès caméra refusé</div>
              <div className="text-[12px] text-white opacity-50 mb-5">
                Autorise la caméra dans Réglages → Safari → Caméra
              </div>
              <button onClick={handleStart}
                      className="flex items-center gap-2 px-5 py-3 text-[11px] tracking-[0.15em] font-semibold"
                      style={{ background: C.gold, color: C.ink }}>
                <RotateCcw size={12} /> RÉESSAYER
              </button>
            </div>
          </div>
        )}

        {/* Error: no camera */}
        {error === 'no_camera' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
            <div className="text-[13px] text-white opacity-50 text-center">Aucune caméra disponible sur cet appareil.</div>
          </div>
        )}

        {/* Error: other */}
        {error && error !== 'camera_denied' && error !== 'no_camera' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8">
            <div className="text-center">
              <div className="text-white font-semibold mb-2">Erreur caméra</div>
              <div className="text-[11px] text-white opacity-40 mb-5">{error}</div>
              <button onClick={handleStart}
                      className="flex items-center gap-2 px-5 py-3 text-[11px] tracking-[0.15em] font-semibold"
                      style={{ background: C.gold, color: C.ink }}>
                <RotateCcw size={12} /> RÉESSAYER
              </button>
            </div>
          </div>
        )}

        {/* Drag hint — shown briefly */}
        {started && !isLoading && !error && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px]"
               style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(6px)' }}>
            <Move size={11} />
            Glisse · Pince pour redimensionner
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 px-5 pt-3 pb-10 flex items-center gap-3"
           style={{ background: 'rgba(10,10,10,0.9)' }}>
        <img src={product?.img} alt="" className="w-12 h-12 object-cover rounded flex-shrink-0"
             style={{ background: '#1A1A1A' }} />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] tracking-[0.2em] font-semibold" style={{ color: C.gold }}>{product?.brand}</div>
          <div className="text-[13px] text-white truncate">{product?.name}</div>
        </div>
      </div>
    </div>
  );
}

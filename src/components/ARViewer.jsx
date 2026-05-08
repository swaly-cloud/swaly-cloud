import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Camera, RotateCcw, Move } from 'lucide-react';

const C = { ink: '#0A0A0A', gold: '#D4AF37', goldLight: '#F5D547' };

export default function ARViewer({ product, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const pinchRef = useRef(null);

  const [phase, setPhase] = useState('start'); // start | loading | live | error
  const [errorMsg, setErrorMsg] = useState('');
  const [pos, setPos] = useState({ x: 50, y: 38 });
  const [scale, setScale] = useState(1.0);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // Called directly from button tap — iOS requires getUserMedia in user gesture
  const handleStart = useCallback(async () => {
    setPhase('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.play().catch(() => {});
      }
      setPhase('live');
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setErrorMsg('denied');
      } else {
        setErrorMsg(err.message || 'Erreur inconnue');
      }
      setPhase('error');
    }
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  // ── Touch drag / pinch ───────────────────────────────────────────
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
      setScale(Math.max(0.4, Math.min(2.5, pinchRef.current.startScale * (dist / pinchRef.current.startDist))));
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    dragRef.current = null;
    pinchRef.current = null;
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: C.ink }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-3 flex-shrink-0"
           style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(8px)' }}>
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
      <div className="flex-1 relative overflow-hidden bg-black"
           ref={containerRef}
           onTouchStart={phase === 'live' ? onTouchStart : undefined}
           onTouchMove={phase === 'live' ? onTouchMove : undefined}
           onTouchEnd={phase === 'live' ? onTouchEnd : undefined}
           style={{ touchAction: 'none' }}>

        {/* Video always mounted so ref is ready */}
        <video ref={videoRef}
               className="absolute inset-0 w-full h-full object-cover"
               style={{ transform: 'scaleX(-1)', display: phase === 'live' ? 'block' : 'none' }}
               playsInline muted autoPlay webkit-playsinline="true" />

        {/* Glasses overlay */}
        {phase === 'live' && (
          <img
            src={product?.img}
            alt=""
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

        {/* START SCREEN */}
        {phase === 'start' && (
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
                Glisse · Pince pour redimensionner
              </div>
            </div>
            <button
              onClick={handleStart}
              className="px-8 py-4 text-[12px] tracking-[0.2em] font-semibold"
              style={{ background: C.gold, color: C.ink }}>
              ACTIVER LA CAMÉRA
            </button>
          </div>
        )}

        {/* LOADING */}
        {phase === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 animate-spin"
                 style={{ borderColor: `${C.gold}40`, borderTopColor: C.gold }} />
            <div className="text-[13px] text-white opacity-60">Ouverture caméra…</div>
          </div>
        )}

        {/* ERROR */}
        {phase === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8">
            <Camera size={44} color={C.gold} />
            <div className="text-center">
              {errorMsg === 'denied' ? (
                <>
                  <div className="text-white font-semibold mb-2">Accès caméra refusé</div>
                  <div className="text-[12px] text-white opacity-50 mb-5">
                    Réglages iOS → Safari → Caméra → Autoriser
                  </div>
                </>
              ) : (
                <>
                  <div className="text-white font-semibold mb-2">Erreur caméra</div>
                  <div className="text-[11px] text-white opacity-40 mb-5">{errorMsg}</div>
                </>
              )}
              <button onClick={handleStart}
                      className="flex items-center gap-2 px-5 py-3 text-[11px] tracking-[0.15em] font-semibold"
                      style={{ background: C.gold, color: C.ink }}>
                <RotateCcw size={12} /> RÉESSAYER
              </button>
            </div>
          </div>
        )}

        {/* DRAG HINT */}
        {phase === 'live' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap"
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

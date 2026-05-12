import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Camera, RotateCcw, Move } from 'lucide-react';
import { useARCamera } from '../hooks/useARCamera';

const C = { ink: '#0A0A0A', gold: '#D4AF37' };

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (from, to, amount) => from + (to - from) * amount;
const lerpAngle = (from, to, amount) => {
  let delta = to - from;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return from + delta * amount;
};

function mapVideoPoint(point, vW, vH, scale, cropX, cropY, cW) {
  const rawX = point.x <= 1 ? point.x * vW : point.x;
  const rawY = point.y <= 1 ? point.y * vH : point.y;
  const x = rawX * scale - cropX;
  const y = rawY * scale - cropY;
  return { x: cW - x, y };
}

function mapFaceBox(box, vW, vH, scale, cropX, cropY, cW) {
  if (!box) return null;
  const originX = box.originX ?? box.xMin ?? box.x ?? 0;
  const originY = box.originY ?? box.yMin ?? box.y ?? 0;
  const width = box.width ?? ((box.xMax ?? 0) - originX);
  const height = box.height ?? ((box.yMax ?? 0) - originY);
  if (!width || !height) return null;

  const topLeft = mapVideoPoint({ x: originX, y: originY }, vW, vH, scale, cropX, cropY, cW);
  const bottomRight = mapVideoPoint({ x: originX + width, y: originY + height }, vW, vH, scale, cropX, cropY, cW);
  return {
    centerX: (topLeft.x + bottomRight.x) / 2,
    centerY: (topLeft.y + bottomRight.y) / 2,
    width: Math.abs(topLeft.x - bottomRight.x),
    height: Math.abs(bottomRight.y - topLeft.y),
  };
}

function getFacePose(detection, vW, vH, cW, cH) {
  if (!detection || !vW || !vH || !cW || !cH) return null;

  const kp = detection.keypoints;
  const scale = Math.max(cW / vW, cH / vH);
  const cropX = (vW * scale - cW) / 2;
  const cropY = (vH * scale - cH) / 2;
  const faceBox = mapFaceBox(detection.boundingBox, vW, vH, scale, cropX, cropY, cW);

  if (!kp || kp.length < 2) {
    if (!faceBox) return null;
    return {
      centerX: faceBox.centerX,
      centerY: faceBox.centerY - faceBox.height * 0.11,
      width: faceBox.width * 0.72,
      rotation: 0,
    };
  }

  const eyeA = mapVideoPoint(kp[0], vW, vH, scale, cropX, cropY, cW);
  const eyeB = mapVideoPoint(kp[1], vW, vH, scale, cropX, cropY, cW);
  const leftEye = eyeA.x < eyeB.x ? eyeA : eyeB;
  const rightEye = eyeA.x < eyeB.x ? eyeB : eyeA;

  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  const eyeSpan = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
  const rotation = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180 / Math.PI;
  const faceWidth = faceBox?.width || eyeSpan * 2.15;
  const width = clamp(Math.max(eyeSpan * 2.35, faceWidth * 0.76), cW * 0.24, cW * 0.92);

  return {
    centerX: faceBox ? lerp(eyeCenterX, faceBox.centerX, 0.18) : eyeCenterX,
    centerY: faceBox ? lerp(eyeCenterY, faceBox.centerY - faceBox.height * 0.1, 0.12) : eyeCenterY,
    width,
    rotation: clamp(rotation, -35, 35),
  };
}

// Position glasses from the displayed, mirrored face pose.
function glassesStyle(pose, cW, cH) {
  if (!pose || !cW || !cH) return null;

  return {
    position: 'absolute',
    left: `${(pose.centerX / cW) * 100}%`,
    top:  `${(pose.centerY / cH) * 100}%`,
    width:`${(pose.width / cW) * 100}%`,
    transform: `translate(-50%, -50%) rotate(${pose.rotation}deg)`,
    transformOrigin: '50% 50%',
    mixBlendMode: 'multiply',
    pointerEvents: 'none',
    userSelect: 'none',
  };
}

// Renders glasses with arms faded out via a side gradient mask.
function GlassesOverlay({ src, style }) {
  return (
    <img src={src} alt="" draggable={false} style={{
      ...style,
      WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%)',
      maskImage: 'linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%)',
    }} />
  );
}

export default function ARViewer({ product, onClose }) {
  const { videoRef, phase, error, faces, initCamera, stopCamera } = useARCamera();
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const pinchRef = useRef(null);
  const poseRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 38 });
  const [scale, setScale] = useState(1.0);
  const [videoDims, setVideoDims] = useState({ w: 0, h: 0 });

  const hasFaces = faces.length > 0;
  const isLive = phase === 'live';

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

  let smoothedPose = null;
  if (hasFaces && videoDims.w > 0) {
    const targetPose = getFacePose(
      faces[0],
      videoDims.w,
      videoDims.h,
      containerRef.current?.offsetWidth,
      containerRef.current?.offsetHeight
    );
    if (targetPose) {
      const previousPose = poseRef.current;
      smoothedPose = previousPose ? {
        centerX: lerp(previousPose.centerX, targetPose.centerX, 0.38),
        centerY: lerp(previousPose.centerY, targetPose.centerY, 0.38),
        width: lerp(previousPose.width, targetPose.width, 0.32),
        rotation: lerpAngle(previousPose.rotation, targetPose.rotation, 0.45),
      } : targetPose;
      poseRef.current = smoothedPose;
    }
  } else {
    poseRef.current = null;
  }

  const glassesOverlayStyle = smoothedPose
    ? glassesStyle(smoothedPose, containerRef.current?.offsetWidth, containerRef.current?.offsetHeight)
    : { position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
        width: `${70 * scale}%`, transform: 'translate(-50%, -50%)',
        mixBlendMode: 'multiply', pointerEvents: 'none', userSelect: 'none' };

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

        {/* Glasses — 3D temple effect */}
        {isLive && glassesOverlayStyle && (
          <GlassesOverlay src={product?.img} style={glassesOverlayStyle} />
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

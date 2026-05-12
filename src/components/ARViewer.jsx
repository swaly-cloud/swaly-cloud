import { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
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
  const width = clamp(Math.max(eyeSpan * 2.85, faceWidth * 0.9), cW * 0.32, cW * 0.98);

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

function Glasses2DOverlay({ src, style }) {
  return (
    <img src={src} alt="" draggable={false} style={{
      ...style,
      height: 'auto',
      WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 16%, black 84%, transparent 100%)',
      maskImage: 'linear-gradient(to right, transparent 0%, black 16%, black 84%, transparent 100%)',
    }} />
  );
}

function Glasses3DOverlay({ product, style }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-3.2, 3.2, 1.1, -1.1, 0.1, 20);
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-2.5, 2.5, 5);
    scene.add(key);

    const frameColor = new THREE.Color(product?.hue?.[0] || '#111111');
    const frameLight = new THREE.Color(product?.hue?.[1] || '#333333');
    const accentColor = new THREE.Color(product?.accent || C.gold);
    const isSun = product?.cat === 'soleil';

    const frameMat = new THREE.MeshStandardMaterial({
      color: frameColor,
      roughness: 0.38,
      metalness: 0.12,
      emissive: frameLight,
      emissiveIntensity: 0.08,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.22,
      metalness: 0.65,
    });
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: isSun ? 0x111318 : 0xddeeff,
      transparent: true,
      opacity: isSun ? 0.42 : 0.18,
      roughness: 0.08,
      metalness: 0,
      transmission: 0.25,
    });

    const group = new THREE.Group();
    scene.add(group);

    const ringGeo = new THREE.TorusGeometry(0.86, 0.075, 18, 96);
    const lensGeo = new THREE.CircleGeometry(0.78, 96);
    const bridgeGeo = new THREE.CapsuleGeometry(0.07, 0.72, 8, 18);
    const hingeGeo = new THREE.BoxGeometry(0.2, 0.14, 0.16);

    const leftRing = new THREE.Mesh(ringGeo, frameMat);
    leftRing.position.x = -1.05;
    leftRing.scale.set(1.05, 0.58, 0.18);
    group.add(leftRing);

    const rightRing = leftRing.clone();
    rightRing.position.x = 1.05;
    group.add(rightRing);

    const leftLens = new THREE.Mesh(lensGeo, lensMat);
    leftLens.position.set(-1.05, 0, -0.04);
    leftLens.scale.set(1.03, 0.56, 1);
    group.add(leftLens);

    const rightLens = leftLens.clone();
    rightLens.position.x = 1.05;
    group.add(rightLens);

    const bridge = new THREE.Mesh(bridgeGeo, frameMat);
    bridge.rotation.z = Math.PI / 2;
    bridge.scale.set(1, 1, 0.8);
    group.add(bridge);

    const leftHinge = new THREE.Mesh(hingeGeo, accentMat);
    leftHinge.position.set(-2.02, 0.02, 0.02);
    group.add(leftHinge);

    const rightHinge = leftHinge.clone();
    rightHinge.position.x = 2.02;
    group.add(rightHinge);

    const shineGeo = new THREE.PlaneGeometry(0.58, 0.05);
    const shineMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    });
    [-1.12, 0.98].forEach((x) => {
      const shine = new THREE.Mesh(shineGeo, shineMat);
      shine.position.set(x, 0.28, 0.04);
      shine.rotation.z = -0.35;
      group.add(shine);
    });

    group.rotation.x = -0.08;
    group.rotation.y = 0.14;

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    return () => {
      observer.disconnect();
      mount.removeChild(renderer.domElement);
      [ringGeo, lensGeo, bridgeGeo, hingeGeo, shineGeo].forEach((geo) => geo.dispose());
      [frameMat, accentMat, lensMat, shineMat].forEach((mat) => mat.dispose());
      renderer.dispose();
    };
  }, [product]);

  return (
    <div ref={mountRef} style={{
      ...style,
      aspectRatio: '3 / 1',
      height: 'auto',
      mixBlendMode: 'normal',
      filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.24))',
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
  const [arMode, setArMode] = useState('2d');
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
        <div className="flex items-center gap-2">
          <div className="flex rounded-full p-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
            {['2d', '3d'].map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setArMode(mode)}
                className="px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-[0.16em]"
                style={{
                  background: arMode === mode ? C.gold : 'transparent',
                  color: arMode === mode ? C.ink : 'rgba(255,255,255,0.7)',
                }}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={handleClose} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <X size={18} color="white" />
          </button>
        </div>
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

        {/* Glasses */}
        {isLive && glassesOverlayStyle && arMode === '2d' && (
          <Glasses2DOverlay src={product?.img} style={glassesOverlayStyle} />
        )}
        {isLive && glassesOverlayStyle && arMode === '3d' && (
          <Glasses3DOverlay product={product} style={glassesOverlayStyle} />
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

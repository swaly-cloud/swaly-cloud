import { useRef, useState, useCallback, useEffect } from 'react';

async function loadFaceDetector() {
  const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
  );
  return await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
      delegate: 'CPU',
    },
    runningMode: 'VIDEO',
    minDetectionConfidence: 0.4,
  });
}

export function useARCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);

  const [phase, setPhase] = useState('idle'); // idle | camera | ai | live | error
  const [error, setError] = useState(null);
  const [faces, setFaces] = useState([]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const initCamera = useCallback(async () => {
    stopCamera();
    setPhase('camera');
    setError(null);
    setFaces([]);
    try {
      // 1. Camera first (fast)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // 2. Load MediaPipe in parallel
      setPhase('ai');
      try {
        detectorRef.current = await Promise.race([
          loadFaceDetector(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 20000)),
        ]);
      } catch {
        // MediaPipe failed/timed out → fall back to CSS overlay mode
        setPhase('live');
        return;
      }

      setPhase('live');

      // 3. Detection loop at ~20fps
      const detect = () => {
        const video = videoRef.current;
        const detector = detectorRef.current;
        if (video && detector && video.readyState >= 2) {
          const now = performance.now();
          if (now - lastTimeRef.current >= 50) {
            lastTimeRef.current = now;
            try {
              const result = detector.detectForVideo(video, now);
              setFaces(result.detections || []);
            } catch { /* ignore */ }
          }
        }
        rafRef.current = requestAnimationFrame(detect);
      };
      rafRef.current = requestAnimationFrame(detect);

    } catch (err) {
      stopCamera();
      if (err.name === 'NotAllowedError') setError('camera_denied');
      else if (err.name === 'NotFoundError') setError('no_camera');
      else setError(err.message || 'Erreur caméra');
      setPhase('error');
    }
  }, [stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return { videoRef, phase, error, faces, initCamera, stopCamera };
}

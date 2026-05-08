import { useRef, useState, useCallback, useEffect } from 'react';

// Lazy-load MediaPipe only when needed
async function loadFaceDetector() {
  const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
  const vision = await FilesetResolver.forVisionTasks(
    `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm`
  );
  const detector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
      delegate: 'CPU',
    },
    runningMode: 'VIDEO',
    minDetectionConfidence: 0.4,
  });
  return detector;
}

export function useARCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);

  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState(null);
  const [faces, setFaces] = useState([]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const initCamera = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setFaces([]);

    try {
      // Request camera first (fast feedback)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Load MediaPipe in parallel (can take a few seconds on first load)
      detectorRef.current = await loadFaceDetector();

      setStatus('ready');

      // Detection loop — throttled to ~20fps for battery
      const detect = () => {
        const video = videoRef.current;
        const detector = detectorRef.current;
        if (!video || !detector || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(detect);
          return;
        }
        const now = performance.now();
        if (now - lastTimeRef.current >= 50) {
          lastTimeRef.current = now;
          try {
            const result = detector.detectForVideo(video, now);
            setFaces(result.detections || []);
          } catch {
            // ignore per-frame errors
          }
        }
        rafRef.current = requestAnimationFrame(detect);
      };
      rafRef.current = requestAnimationFrame(detect);

    } catch (err) {
      stopCamera();
      if (err.name === 'NotAllowedError') setError('camera_denied');
      else if (err.name === 'NotFoundError') setError('no_camera');
      else setError(err.message);
      setStatus('error');
    }
  }, [stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const isLoading = status === 'loading' || status === 'idle';

  return { videoRef, faces, isLoading, error, initCamera, stopCamera };
}

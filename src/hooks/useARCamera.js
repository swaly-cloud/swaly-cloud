import { useRef, useState, useCallback, useEffect } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

export function useARCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
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
    setIsLoading(true);
    setError(null);
    try {
      // Init MediaPipe FaceDetector
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      detectorRef.current = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.5,
      });

      // Request camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsLoading(false);

      // Detection loop
      const detect = () => {
        if (!videoRef.current || !detectorRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(detect);
          return;
        }
        try {
          const result = detectorRef.current.detectForVideo(videoRef.current, performance.now());
          setFaces(result.detections || []);
        } catch {
          // ignore individual frame errors
        }
        rafRef.current = requestAnimationFrame(detect);
      };
      rafRef.current = requestAnimationFrame(detect);

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('camera_denied');
      } else if (err.name === 'NotFoundError') {
        setError('no_camera');
      } else {
        setError(err.message);
      }
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return { videoRef, faces, isLoading, error, initCamera, stopCamera };
}

import { useRef, useState, useCallback, useEffect } from 'react';

export function useARCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const initCamera = useCallback(async () => {
    // Clean up any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {}); // fire-and-forget on iOS
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') setError('camera_denied');
      else if (err.name === 'NotFoundError') setError('no_camera');
      else setError(err.message || 'Erreur caméra');
    } finally {
      setIsLoading(false); // don't wait for play() to resolve
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return { videoRef, isLoading, error, initCamera, stopCamera };
}

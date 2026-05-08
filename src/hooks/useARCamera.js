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
        await videoRef.current.play();
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') setError('camera_denied');
      else if (err.name === 'NotFoundError') setError('no_camera');
      else setError(err.message || 'Erreur caméra');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return { videoRef, isLoading, error, initCamera, stopCamera };
}

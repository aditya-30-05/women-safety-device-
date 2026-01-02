import { useEffect, useRef, useCallback, useState } from 'react';

interface ShakeDetectionOptions {
  threshold?: number; // Acceleration threshold to detect shake
  timeout?: number; // Time window for counting shakes (ms)
  shakeCount?: number; // Number of shakes needed to trigger
  onShake?: () => void;
  enabled?: boolean;
}

export const useShakeDetection = ({
  threshold = 15,
  timeout = 1000,
  shakeCount = 3,
  onShake,
  enabled = true,
}: ShakeDetectionOptions = {}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  
  const shakeTimestamps = useRef<number[]>([]);
  const lastX = useRef<number | null>(null);
  const lastY = useRef<number | null>(null);
  const lastZ = useRef<number | null>(null);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    if (!isEnabled || !onShake) return;

    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;

    const { x, y, z } = acceleration;
    if (x === null || y === null || z === null) return;

    if (lastX.current !== null && lastY.current !== null && lastZ.current !== null) {
      const deltaX = Math.abs(x - lastX.current);
      const deltaY = Math.abs(y - lastY.current);
      const deltaZ = Math.abs(z - lastZ.current);

      const acceleration = Math.sqrt(deltaX ** 2 + deltaY ** 2 + deltaZ ** 2);

      if (acceleration > threshold) {
        const now = Date.now();
        shakeTimestamps.current = shakeTimestamps.current.filter(
          (timestamp) => now - timestamp < timeout
        );
        shakeTimestamps.current.push(now);

        if (shakeTimestamps.current.length >= shakeCount) {
          shakeTimestamps.current = [];
          onShake();
        }
      }
    }

    lastX.current = x;
    lastY.current = y;
    lastZ.current = z;
  }, [isEnabled, onShake, threshold, timeout, shakeCount]);

  const requestPermission = useCallback(async () => {
    // Check if DeviceMotionEvent exists and has requestPermission (iOS 13+)
    if (typeof DeviceMotionEvent !== 'undefined' && 
        typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        setPermissionStatus(permission as 'granted' | 'denied');
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting device motion permission:', error);
        setPermissionStatus('denied');
        return false;
      }
    }
    
    // For other browsers, assume permission is granted if API exists
    if (typeof DeviceMotionEvent !== 'undefined') {
      setPermissionStatus('granted');
      return true;
    }
    
    setPermissionStatus('unsupported');
    return false;
  }, []);

  useEffect(() => {
    // Check if the API is supported
    const supported = typeof DeviceMotionEvent !== 'undefined';
    setIsSupported(supported);

    if (!supported) {
      setPermissionStatus('unsupported');
      return;
    }

    // Auto-request permission for non-iOS devices
    if (typeof (DeviceMotionEvent as any).requestPermission !== 'function') {
      setPermissionStatus('granted');
    }
  }, []);

  useEffect(() => {
    if (!isSupported || !isEnabled || permissionStatus !== 'granted') return;

    window.addEventListener('devicemotion', handleMotion);
    
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [isSupported, isEnabled, permissionStatus, handleMotion]);

  return {
    isSupported,
    isEnabled,
    setIsEnabled,
    permissionStatus,
    requestPermission,
  };
};

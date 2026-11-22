import { useCallback, useEffect, useRef, useState } from 'react';

// Countdown timer driven by an absolute expiry timestamp (backend-authoritative),
// so it survives page refreshes and tab switches.
const useTimer = (expiryTime, onExpire) => {
  const [remaining, setRemaining] = useState(() =>
    expiryTime ? Math.max(0, new Date(expiryTime).getTime() - Date.now()) : 0
  );
  const expiredRef = useRef(false);
  const callbackRef = useRef(onExpire);
  callbackRef.current = onExpire;

  const expiry = expiryTime ? new Date(expiryTime).getTime() : null;

  useEffect(() => {
    if (!expiry) return;
    expiredRef.current = false;

    const tick = () => {
      const left = expiry - Date.now();
      setRemaining(left > 0 ? left : 0);
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        callbackRef.current?.();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiry]);

  const minutes = Math.floor(remaining / 60000);
  const isLow = remaining <= 60000;
  const isCritical = remaining <= 30000;

  return { remaining, minutes, isLow, isCritical };
};

export default useTimer;

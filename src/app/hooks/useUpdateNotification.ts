import { useRegisterSW } from 'virtual:pwa-register/react';
import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for PWA update notifications
 * Detects when a new service worker is available and provides
 * a safe reload mechanism for applying updates
 */
export function useUpdateNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const lastCheckRef = useRef<number>(0);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] Service Worker registered');
      // Save registration for manual checks
      registrationRef.current = r || null;
      if (r) {
        // Also check every 10 minutes as a fallback
        setInterval(() => {
          console.log('[PWA] Checking for updates (interval)...');
          r.update();
        }, 10 * 60 * 1000); 
      }
    },
    onRegisterError(error: Error) {
      console.error('[PWA] Service Worker registration error:', error);
    },
  });

  // Check for updates on window focus/visibility change (Throttled)
  useEffect(() => {
    const checkUpdate = () => {
      const now = Date.now();
      const throttleTime = 15 * 60 * 1000; // 15 minutes

      if (
        document.visibilityState === 'visible' && 
        registrationRef.current &&
        now - lastCheckRef.current > throttleTime
      ) {
        console.log('[PWA] App became visible, checking for updates...');
        registrationRef.current.update();
        lastCheckRef.current = now;
      }
    };

    document.addEventListener('visibilitychange', checkUpdate);
    window.addEventListener('focus', checkUpdate);

    return () => {
      document.removeEventListener('visibilitychange', checkUpdate);
      window.removeEventListener('focus', checkUpdate);
    };
  }, []);

  // Show notification when update is available
  useEffect(() => {
    if (needRefresh) {
      setShowNotification(true);
    }
  }, [needRefresh]);

  /**
   * Safely reload the application with the new service worker
   * Includes error handling to prevent infinite reload loops
   */
  const handleReload = async () => {
    try {
      // Update the service worker (activates waiting SW)
      await updateServiceWorker(true);
      
      // The updateServiceWorker function will reload the page automatically
      // No need to call window.location.reload() manually
    } catch (error) {
      console.error('[PWA] Error updating service worker:', error);
      
      // Fallback: manual reload if automatic update fails
      // Only reload once to prevent infinite loops
      if (!sessionStorage.getItem('pwa-update-attempted')) {
        sessionStorage.setItem('pwa-update-attempted', 'true');
        window.location.reload();
      }
    }
  };

  /**
   * Dismiss the notification without reloading
   * User can manually refresh later to get the update
   */
  const handleDismiss = () => {
    setShowNotification(false);
    setNeedRefresh(false);
  };

  // Clear the update attempt flag on successful load
  useEffect(() => {
    sessionStorage.removeItem('pwa-update-attempted');
  }, []);

  return {
    showNotification,
    handleReload,
    handleDismiss,
  };
}

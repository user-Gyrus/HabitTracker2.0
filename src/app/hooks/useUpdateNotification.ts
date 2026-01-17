import { useRegisterSW } from 'virtual:pwa-register/react';
import { useState, useEffect } from 'react';

/**
 * Custom hook for PWA update notifications
 * Detects when a new service worker is available and provides
 * a safe reload mechanism for applying updates
 */
export function useUpdateNotification() {
  const [showNotification, setShowNotification] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration: ServiceWorkerRegistration | undefined) {
      console.log('[PWA] Service Worker registered:', registration);
    },
    onRegisterError(error: Error) {
      console.error('[PWA] Service Worker registration error:', error);
    },
  });

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

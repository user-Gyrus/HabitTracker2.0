import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X } from 'lucide-react';
import { useUpdateNotification } from '../hooks/useUpdateNotification';

/**
 * PWA Update Notification Component
 * Displays a modern toast notification when a new app version is available
 * Matches the app's design system with glassmorphism and theme support
 */
export default function UpdateNotification() {
  const { showNotification, handleReload, handleDismiss } = useUpdateNotification();

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-md"
          role="alert"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="bg-card/95 backdrop-blur-xl border border-card-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  New features are available
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Reload to update and get the latest improvements.
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleReload}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 active:scale-95 transition-all shadow-md"
                    aria-label="Reload to update"
                  >
                    Reload
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-2 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-lg active:scale-95 transition-all"
                    aria-label="Dismiss notification"
                  >
                    Later
                  </button>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 hover:bg-secondary rounded-lg transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useEffect, useState } from 'react';
import { Share, PlusSquare, Smartphone, Tablet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<'iphone' | 'android'>('iphone');

  useEffect(() => {
    // Check if app is already installed/in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) {
      return;
    }

    // Check if user dismissed recently (within 30 days for this more prominent UI)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < thirtyDays) {
        return;
      }
    }

    // Detection for platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android|blackberry|mini|windows\sphone/i.test(userAgent) 
      || (window.innerWidth < 1024 && (navigator.maxTouchPoints > 0));

    if (!isMobile) {
      return;
    }

    if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) {
      setPlatform('iphone');
    } else {
      setPlatform('android');
    }

    // Show after a delay
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none p-4 overflow-hidden">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
          onClick={handleDismiss}
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto flex flex-col items-center p-8 text-center"
        >
          {/* Logo/Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-[#4db4a8] to-[#2a8e84] rounded-2xl flex items-center justify-center shadow-lg mb-6 ring-4 ring-white shadow-[#4db4a8]/30 overflow-hidden">
            <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-white drop-shadow-md">
               <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
            </svg>
          </div>

          <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2">
            One-Click Download to Home Screen
          </h2>
          
          <p className="text-gray-500 text-sm font-medium px-4 mb-8 leading-relaxed">
            Install the Atomiq app now to redeem your rewards instantly and access exclusive, app-only features.
          </p>

          {/* Platform Toggle */}
          <div className="w-full bg-gray-100 rounded-2xl p-1.5 flex mb-8">
            <button 
              onClick={() => setPlatform('iphone')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm ${
                platform === 'iphone' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500'
              }`}
            >
              <Smartphone size={18} />
              iPhone
            </button>
            <button 
              onClick={() => setPlatform('android')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm ${
                platform === 'android' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500'
              }`}
            >
              <Tablet size={18} />
              Android
            </button>
          </div>

          {/* Steps */}
          <div className="w-full space-y-4 mb-8">
            {platform === 'iphone' ? (
              <>
                <div className="flex items-center gap-4 text-left p-1">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <Share size={20} className="text-gray-700" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">1. Tap the Share icon</h4>
                    <p className="text-xs text-gray-400 font-medium">Located in the browser bar</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-left p-1">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <PlusSquare size={20} className="text-gray-700" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">2. Select 'Add to Home Screen'</h4>
                    <p className="text-xs text-gray-400 font-medium">Scroll down to find it</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-left p-1">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-tighter">Add</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">3. Tap 'Add' to confirm</h4>
                    <p className="text-xs text-gray-400 font-medium">Top right corner of screen</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4 text-left p-1">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <div className="flex flex-col gap-0.5 items-center justify-center">
                      <div className="w-1 h-1 bg-gray-700 rounded-full" />
                      <div className="w-1 h-1 bg-gray-700 rounded-full" />
                      <div className="w-1 h-1 bg-gray-700 rounded-full" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">1. Tap the Menu icon</h4>
                    <p className="text-xs text-gray-400 font-medium">Top right corner of Chrome</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-left p-1">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <Smartphone size={20} className="text-gray-700" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">2. Tap 'Install App'</h4>
                    <p className="text-xs text-gray-400 font-medium">Or 'Add to Home Screen'</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-left p-1">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                   <div className="w-4 h-4 rounded-full border-2 border-gray-700 pointer-events-none" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">3. Tap 'Install' / 'Add'</h4>
                    <p className="text-xs text-gray-400 font-medium">In the popup that appears</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <button 
            onClick={handleDismiss}
            className="w-full bg-[#2a8e84] text-white py-4 rounded-[1.5rem] font-bold text-lg shadow-lg shadow-[#2a8e84]/30 active:scale-[0.98] transition-all"
          >
            Got it!
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

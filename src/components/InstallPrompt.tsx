import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, Globe } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show install prompt banner after a short delay
      const dismissed = localStorage.getItem('pwa_install_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS or testing, show banner if not dismissed after 3 seconds
    if (isIosDevice) {
      const dismissed = localStorage.getItem('pwa_install_dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setShowBanner(true), 2500);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowBanner(false);
      }
    } else if (isIOS) {
      alert('لتثبيت التطبيق على آيفون:\n1. اضغط على زر المشاركة (Share) في متصفح سفاري.\n2. اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).');
    } else {
      alert('يمكنك تثبيت هذا التطبيق مباشرة من القائمة الثلاثية للمتصفح (ثبيت التطبيق / Install App).');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_install_dismissed', 'true');
  };

  if (isStandalone || !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md bg-gradient-to-r from-gray-900 to-indigo-950 border border-indigo-500/40 rounded-2xl shadow-2xl p-4 text-white flex items-center justify-between gap-4 animate-bounce-subtle">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 flex-shrink-0">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <div>
          <h4 className="font-bold text-sm">تثبيت تطبيق MobCash</h4>
          <p className="text-xs text-gray-300">ثبت التطبيق على هاتفك للوصول السريع بدون متصفح</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
        >
          <Download className="w-4 h-4" />
          تثبيت
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

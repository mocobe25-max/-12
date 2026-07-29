import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { SkeletonLoader } from './SkeletonLoader';

interface NetworkInformation extends EventTarget {
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  onchange?: EventListener;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

export function PageLoaderWrapper({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { i18n } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(15);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Determine estimated loading duration based on Network Speed
  const calculateDuration = useCallback(() => {
    if (!navigator.onLine) {
      return 8000; // Timeout for offline state
    }

    const nav = navigator as NavigatorWithConnection;
    if (nav.connection) {
      const type = nav.connection.effectiveType;
      if (type === '4g') return 350; // Ultra fast
      if (type === '3g') return 900; // Medium speed
      if (type === '2g' || type === 'slow-2g') return 2500; // Slow connection
    }

    return 450; // Default fast speed
  }, []);

  const startLoadingSequence = useCallback(() => {
    setIsLoading(true);
    setProgress(20);
    setShowError(false);

    const online = navigator.onLine;
    setIsOffline(!online);

    if (!online) {
      setProgress(40);
      const offlineTimer = setTimeout(() => {
        setShowError(true);
        setErrorMessage('تعذر الاتصال بالشبكة. يرجى التحقق من الاتصال بالإنترنت.');
      }, 1500);
      return () => clearTimeout(offlineTimer);
    }

    const duration = calculateDuration();

    // Progress bar animation keyframes
    const intervalTime = duration / 4;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, intervalTime);

    // Complete loading and transition to content
    const completeTimeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
      }, 150);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(completeTimeout);
    };
  }, [calculateDuration]);

  // Trigger on Route Location Change
  useEffect(() => {
    const cleanup = startLoadingSequence();
    return cleanup;
  }, [location.pathname, startLoadingSequence]);

  // Listen to Online / Offline browser events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowError(false);
      startLoadingSequence();
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowError(true);
      setErrorMessage('انقطع الاتصال بالإنترنت.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [startLoadingSequence]);

  const handleRetry = () => {
    setShowError(false);
    startLoadingSequence();
  };

  return (
    <div className="relative min-h-screen bg-[#0A0E17]">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-0 z-40 bg-[#0A0E17]"
          >
            <SkeletonLoader
              progress={progress}
              showError={showError}
              errorMessage={errorMessage}
              isOffline={isOffline}
              onRetry={handleRetry}
              onDismissError={() => setShowError(false)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full min-h-screen"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, RefreshCw, X, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SkeletonLoaderProps {
  progress?: number;
  showError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onDismissError?: () => void;
  isOffline?: boolean;
}

export function TopProgressBar({ progress = 45 }: { progress?: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#161D2B] overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 top-loader-glow"
        initial={{ width: '5%' }}
        animate={{ width: `${Math.min(progress, 100)}%` }}
        transition={{ ease: 'easeOut', duration: 0.3 }}
      />
    </div>
  );
}

export function ErrorToast({
  message,
  onRetry,
  onClose,
  isOffline,
}: {
  message?: string;
  onRetry?: () => void;
  onClose?: () => void;
  isOffline?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 bg-[#1B2232] border border-[#2D384E] rounded-2xl p-4 shadow-2xl text-white flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
            {isOffline ? <WifiOff className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          </div>
          <span className="font-semibold text-base text-red-400">
            {isOffline ? t('no_internet', 'لا يوجد اتصال بالإنترنت') : t('error', 'خطأ')}
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="text-sm text-gray-300 font-medium leading-relaxed px-1">
        {message ||
          (isOffline
            ? t('offline_message', 'تعذر الاتصال بالخادم. يرجى التحقق من شبكة الإنترنت وإعادة المحاولة.')
            : t('generic_error_message', 'حدث خطأ أثناء تحميل البيانات.'))}
      </p>

      {onRetry && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('retry', 'إعادة المحاولة')}</span>
          </button>
        </div>
      )}
    </motion.div>
  );
}

export function SkeletonLoader({
  progress = 65,
  showError,
  errorMessage,
  onRetry,
  onDismissError,
  isOffline,
}: SkeletonLoaderProps) {
  return (
    <div className="min-h-screen bg-[#0A0E17] text-white flex flex-col relative overflow-hidden select-none">
      {/* Top Animated Progress Bar */}
      <TopProgressBar progress={progress} />

      {/* Floating Error / Offline Toast Notice (Matching Screenshot 2) */}
      <AnimatePresence>
        {(showError || isOffline) && (
          <ErrorToast
            message={errorMessage}
            onRetry={onRetry}
            onClose={onDismissError}
            isOffline={isOffline}
          />
        )}
      </AnimatePresence>

      {/* Top Navigation & Arrow Row matching Screenshot 1 */}
      <div className="pt-6 pb-2 px-6 flex items-center justify-between">
        <div className="w-20 h-4 shimmer-block rounded-lg opacity-40" />
        <div className="w-6 h-6 shimmer-block rounded-full" />
      </div>

      {/* Main Skeleton Layout Content (Matching Screenshots 1, 2, 3) */}
      <div className="flex-1 max-w-lg w-full mx-auto px-5 py-3 space-y-4 flex flex-col justify-start">
        {/* Top Search / Header Pill */}
        <div className="h-12 w-full shimmer-block rounded-2xl" />

        {/* Second Line Bar */}
        <div className="h-12 w-full shimmer-block rounded-2xl" />

        {/* Third Line Bar */}
        <div className="h-12 w-full shimmer-block rounded-2xl" />

        {/* Large Main Card Block 1 */}
        <div className="h-28 w-full shimmer-block rounded-3xl" />

        {/* Title Bar for Next Section */}
        <div className="h-10 w-full shimmer-block rounded-2xl" />

        {/* Large Card Block 2 */}
        <div className="h-28 w-full shimmer-block rounded-3xl" />

        {/* Title Bar for Third Section */}
        <div className="h-10 w-full shimmer-block rounded-2xl" />

        {/* Large Card Block 3 */}
        <div className="h-28 w-full shimmer-block rounded-3xl" />

        {/* Split Rows matching Screenshot 3 bottom */}
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-3 h-14 shimmer-block rounded-2xl" />
          <div className="col-span-1 h-14 shimmer-block rounded-2xl" />
        </div>

        {/* Bottom Hero / Action Banner Card */}
        <div className="h-44 w-full shimmer-block rounded-3xl" />
      </div>
    </div>
  );
}

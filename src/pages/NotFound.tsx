import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/agent/login', { replace: true });
    }, 1000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-[100dvh] w-full bg-[#0b0e17] text-white flex flex-col items-center justify-center p-6 text-center select-none" dir="rtl">
      <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4 text-indigo-400 shadow-xl">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
      <h2 className="text-xl font-bold mb-2">جاري التوجيه للرئيسية...</h2>
      <p className="text-sm text-gray-400 mb-6">ننقلك فوراً إلى منصة MobCash للاستمرار.</p>
      <button
        onClick={() => navigate('/agent/login', { replace: true })}
        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
      >
        <span>الانتقال فوراً</span>
        <ArrowRight className="w-4 h-4 rotate-180" />
      </button>
    </div>
  );
}

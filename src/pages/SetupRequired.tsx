import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SetupRequired() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t('setup_required')}
        </h1>
        <p className="text-gray-600 mb-6">
          Please configure your Supabase credentials in the <code className="bg-gray-100 px-2 py-1 rounded text-sm">.env</code> file to continue.
        </p>
        <div className="text-left bg-gray-50 p-4 rounded-xl text-sm font-mono text-gray-700 overflow-x-auto border border-gray-200">
          VITE_SUPABASE_URL="your-project-url"<br/>
          VITE_SUPABASE_ANON_KEY="your-anon-key"
        </div>
      </div>
    </div>
  );
}

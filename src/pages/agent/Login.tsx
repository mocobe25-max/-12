import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldAlert,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
  MapPin,
  Copy,
  ChevronDown,
  Search,
  Globe,
  Phone,
  MessageSquare,
  Send,
  Info,
  ShieldCheck,
  Shield,
  Award,
  Lock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { MobCashLogo } from '../../components/MobCashLogo';
import { sendTelegramMessage, getDeviceInfo, getIpAddress } from '../../lib/telegram';
import { ALL_COUNTRIES, detectUserCountry, getSortedCountriesList, Country, getCountryDialInfo } from '../../lib/countries';

const formatDobInput = (newVal: string, oldVal: string): string => {
  // If user is deleting (backspace), allow raw value without forced dot re-insertion
  if (newVal.length < oldVal.length) {
    return newVal;
  }

  // Strip non-digits
  const digits = newVal.replace(/\D/g, '').slice(0, 8); // e.g. 20011998 max 8 digits

  if (digits.length <= 2) {
    if (digits.length === 2 && !newVal.endsWith('.')) {
      return `${digits}.`;
    }
    return digits;
  }

  if (digits.length <= 4) {
    const day = digits.slice(0, 2);
    const month = digits.slice(2);
    if (digits.length === 4 && !newVal.endsWith('.')) {
      return `${day}.${month}.`;
    }
    return `${day}.${month}`;
  }

  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  return `${day}.${month}.${year}`;
};

export default function AgentLogin() {
  const [searchParams] = useSearchParams();

  // Helper to load saved registration flow state
  const getInitialFlowState = () => {
    try {
      const saved = localStorage.getItem('agent_registration_flow_state');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore JSON parse error
    }
    return null;
  };

  const initialFlow = getInitialFlowState();

  const [showLoginForm, setShowLoginForm] = useState<boolean>(() => initialFlow?.showLoginForm ?? false);
  const [showRegScreen, setShowRegScreen] = useState<boolean>(() => initialFlow?.showRegScreen ?? false);
  const [activeTab, setActiveTab] = useState<'agent' | 'admin'>(() => initialFlow?.activeTab ?? 'agent');

  // Login form state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration form state
  const [regStep, setRegStep] = useState<1 | 2 | 3>(() => initialFlow?.regStep ?? 1);
  const [firstName, setFirstName] = useState(() => initialFlow?.firstName ?? '');
  const [lastName, setLastName] = useState(() => initialFlow?.lastName ?? '');
  const [dob, setDob] = useState(() => initialFlow?.dob ?? '');
  const [country, setCountry] = useState(() => initialFlow?.country ?? 'مصر');
  const [detectedCountryCode, setDetectedCountryCode] = useState('EG');
  const [isDetectingCountry, setIsDetectingCountry] = useState(false);
  const [showCountryPickerModal, setShowCountryPickerModal] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');

  const [promoCode, setPromoCode] = useState(() => initialFlow?.promoCode ?? '');
  const [phone, setPhone] = useState(() => initialFlow?.phone ?? '');
  const [email, setEmail] = useState(() => initialFlow?.email ?? '');
  const [contactMethod, setContactMethod] = useState<'phone' | 'telegram' | 'whatsapp' | ''>(() => initialFlow?.contactMethod ?? '');
  const [showContactModal, setShowContactModal] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState(() => initialFlow?.telegramUsername ?? '');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createdAgentId, setCreatedAgentId] = useState(() => initialFlow?.createdAgentId ?? '');
  const [managerCode, setManagerCode] = useState(() => initialFlow?.managerCode ?? '');
  const [copiedManagerCode, setCopiedManagerCode] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, role, setUser } = useAuthStore();

  const isArLang = i18n.language?.startsWith('ar');

  const dialInfo = getCountryDialInfo(country);

  // Persist current flow & registration state to localStorage
  useEffect(() => {
    try {
      const stateToSave = {
        showLoginForm,
        showRegScreen,
        activeTab,
        regStep,
        firstName,
        lastName,
        dob,
        country,
        promoCode,
        phone,
        email,
        contactMethod,
        telegramUsername,
        createdAgentId,
        managerCode,
      };
      localStorage.setItem('agent_registration_flow_state', JSON.stringify(stateToSave));
    } catch {
      // ignore storage error
    }
  }, [
    showLoginForm,
    showRegScreen,
    activeTab,
    regStep,
    firstName,
    lastName,
    dob,
    country,
    promoCode,
    phone,
    email,
    contactMethod,
    telegramUsername,
    createdAgentId,
    managerCode,
  ]);

  // Detect country on mount
  useEffect(() => {
    let mounted = true;
    setIsDetectingCountry(true);
    detectUserCountry()
      .then(({ country: detected }) => {
        if (!mounted) return;
        const countryName = isArLang ? detected.nameAr : detected.nameEn;
        setDetectedCountryCode(detected.code);
        if (!initialFlow?.country) {
          setCountry(countryName);
        }
        setIsDetectingCountry(false);
      })
      .catch(() => {
        if (mounted) setIsDetectingCountry(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const { sortedList: allSortedCountries, detectedCountry: currentDetectedCountry } =
    getSortedCountriesList(detectedCountryCode, isArLang);

  const selectedCountryObj =
    ALL_COUNTRIES.find((c) => c.nameAr === country || c.nameEn === country) || currentDetectedCountry;

  const filteredCountriesList = allSortedCountries.filter((c) => {
    if (!countrySearchQuery.trim()) return true;
    const q = countrySearchQuery.trim().toLowerCase();
    return (
      c.nameAr.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (user) {
      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'agent') {
        const status = user.status;
        if (status === 'pending') navigate('/agent/verify', { replace: true });
        else if (status === 'verified') navigate('/agent/activation-info', { replace: true });
        else if (status === 'under_review') navigate('/agent/review', { replace: true });
        else if (status === 'active') navigate('/agent/dashboard', { replace: true });
        else if (status === 'suspended') navigate('/agent/suspended', { replace: true });
        else navigate('/agent/dashboard', { replace: true });
      }
    }
  }, [user, role, navigate]);

  useEffect(() => {
    if (searchParams.get('mode') === 'login' || searchParams.get('form') === 'true') {
      setShowLoginForm(true);
    }
    const savedUser = localStorage.getItem('mobcash_saved_user');
    if (savedUser) {
      setUsernameInput(savedUser);
    }
  }, [searchParams]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) return;
    setError('');
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem('mobcash_saved_user', usernameInput);
    } else {
      localStorage.removeItem('mobcash_saved_user');
    }

    try {
      // 1. First attempt agent login by agent_id from Supabase, then local storage fallback
      let agentData: any = null;
      try {
        const { data } = await supabase
          .from('agents')
          .select('*')
          .eq('agent_id', usernameInput)
          .single();
        agentData = data;
      } catch {
        // ignore supabase error
      }

      if (!agentData) {
        try {
          const localAgents = JSON.parse(localStorage.getItem('local_registered_agents') || '[]');
          agentData = localAgents.find((a: any) => a.agent_id === usernameInput);
        } catch {
          // ignore
        }
      }

      if (agentData && agentData.password_hash === passwordInput) {
        setUser(agentData, 'agent');

        // Log activity
        await supabase.from('activities').insert([
          {
            agent_id: agentData.agent_id,
            action: 'Agent logged in',
          },
        ]);

        // Send Telegram notification
        try {
          const ip = await getIpAddress();
          const device = getDeviceInfo();
          const time = new Date().toLocaleString('ar-EG');
          const lang = i18n.language === 'ar' ? 'العربية' : 'English';

          const msg =
            `🚨 *تسجيل دخول وكيل* 🚨\n\n` +
            `*ID الوكيل:* \`${agentData.agent_id}\`\n` +
            `*الاسم:* ${agentData.full_name}\n` +
            `*اللغة:* ${lang}\n` +
            `*الجهاز:* ${device}\n` +
            `*IP:* ${ip}\n` +
            `*الوقت:* ${time}\n` +
            `*الحالة:* ${agentData.status}`;

          await sendTelegramMessage(msg);
        } catch (e) {
          console.error('Telegram notification failed', e);
        }

        // Route according to agent status
        const status = agentData.status;
        if (status === 'pending') navigate('/agent/verify');
        else if (status === 'verified') navigate('/agent/activation-info');
        else if (status === 'under_review') navigate('/agent/review');
        else if (status === 'active') navigate('/agent/dashboard');
        else if (status === 'suspended') navigate('/agent/suspended');
        return;
      }

      // 2. Check admin table by username
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('username', usernameInput)
        .single();

      if (adminData && adminData.password_hash === passwordInput) {
        setUser(adminData, 'admin');
        navigate('/admin/dashboard');
        return;
      }

      // If neither matches
      throw new Error(t('invalid_credentials', 'Invalid credentials'));
    } catch (err: any) {
      setError(err.message || t('login_failed', 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  // Helper to clear specific field error when typing
  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldName];
        return copy;
      });
    }
    if (regError) setRegError('');
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLButtonElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  // Calculate age helper
  const calculateAge = (birthDateString: string): number => {
    if (!birthDateString || !birthDateString.trim()) return -1;
    let year = 0, month = 0, day = 0;
    const cleaned = birthDateString.trim().replace(/[-/]/g, '.');
    const parts = cleaned.split('.');

    if (parts.length === 3) {
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else if (parts[2].length === 4) {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      }
    }

    if (!year || isNaN(year) || isNaN(month) || isNaN(day)) {
      const d = new Date(birthDateString);
      if (!isNaN(d.getTime())) {
        year = d.getFullYear();
        month = d.getMonth();
        day = d.getDate();
      } else {
        return -1;
      }
    }

    const today = new Date();
    let age = today.getFullYear() - year;
    const m = today.getMonth() - month;
    if (m < 0 || (m === 0 && today.getDate() < day)) {
      age--;
    }
    return age;
  };

  // Registration step handlers
  const handleRegStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!firstName.trim()) {
      errors.firstName = t('field_required', 'املأ الحقل');
    }
    if (!lastName.trim()) {
      errors.lastName = t('field_required', 'املأ الحقل');
    }
    if (!dob.trim()) {
      errors.dob = t('field_required', 'املأ الحقل');
    } else {
      const userAge = calculateAge(dob);
      if (userAge < 0) {
        errors.dob = t('invalid_dob_format', 'أدخل تاريخ ميلاد صحيح (مثال: 15.08.1998)');
      } else if (userAge < 18) {
        errors.dob = t('must_be_18_or_older', 'عذراً، يجب أن يكون عمرك 18 عاماً أو أكثر للتسجيل كوكيل');
      }
    }
    if (!country.trim()) {
      errors.country = t('field_required', 'املأ الحقل');
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setRegError(t('fill_all_fields', 'يرجى التأكد من البيانات وإكمال الحقول المطلوبة'));
      return;
    }

    setFieldErrors({});
    setRegError('');
    setRegStep(2);
  };

  const handleRegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = t('field_required', 'الحقل فارغ');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = t('invalid_email', 'صيغة البريد الإلكتروني غير صحيحة');
    }

    if (contactMethod === 'telegram') {
      if (!telegramUsername.trim()) {
        errors.telegramUsername = t('telegram_username_required', 'يرجى إدخال اسم المستخدم في تيليجرام');
      }
    } else if (contactMethod === 'whatsapp' || contactMethod === 'phone') {
      if (!phone.trim()) {
        errors.phone = t('phone_required', 'يرجى إدخال رقم الهاتف بشكل صحيح');
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setRegError(t('fill_all_fields', 'يرجى إكمال جميع الحقول المطلوبة بشكل صحيح'));
      return;
    }

    setFieldErrors({});
    setRegLoading(true);

    try {
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const newAgentId = `1069${randomSuffix}`;
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const autoPassword = `Pass#${Math.floor(100000 + Math.random() * 900000)}`;

      // Generate a random 9-digit Manager Verification Security Code
      const generatedManagerCode = String(Math.floor(100000000 + Math.random() * 900000000));
      setManagerCode(generatedManagerCode);

      let contactDetail = '';
      if (contactMethod === 'whatsapp' || contactMethod === 'phone') {
        contactDetail = `${contactMethod.toUpperCase()}: ${dialInfo.dialCode} ${phone}`;
      } else if (contactMethod === 'telegram') {
        const formattedTg = telegramUsername.startsWith('@') ? telegramUsername : `@${telegramUsername}`;
        contactDetail = `TELEGRAM: ${formattedTg}`;
      } else {
        contactDetail = 'غير محدد';
      }

      const userAge = calculateAge(dob);

      const newAgentRecord = {
        id: 'local_' + Date.now(),
        agent_id: newAgentId,
        full_name: fullName,
        phone: phone ? `${dialInfo.dialCode}${phone}` : email.trim(),
        email: email.trim(),
        password_hash: autoPassword,
        country: country,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      try {
        const existingLocal = JSON.parse(localStorage.getItem('local_registered_agents') || '[]');
        localStorage.setItem('local_registered_agents', JSON.stringify([newAgentRecord, ...existingLocal]));
      } catch (e) {
        console.error('Local storage save error:', e);
      }

      try {
        await supabase.from('agents').insert([newAgentRecord]);
      } catch (insertError) {
        console.error('Registration supabase insert warning:', insertError);
      }

      setCreatedAgentId(newAgentId);
      setRegStep(3);

      try {
        const ip = await getIpAddress();
        const device = getDeviceInfo();
        const time = new Date().toLocaleString('ar-EG');
        const msg =
          `📝 *طلب تسجيل وكيل جديد* 📝\n\n` +
          `*معرف الوكيل:* \`${newAgentId}\`\n` +
          `*🔐 كود أمان التحقق للمدير (9 أرقام):* \`${generatedManagerCode}\`\n\n` +
          `*الاسم الكامل:* ${fullName}\n` +
          `*تاريخ الميلاد:* ${dob} (العمر: ${userAge >= 0 ? userAge : 'غير معروف'} سنة)\n` +
          `*البريد الإلكتروني:* ${email.trim()}\n` +
          `*طريقة التواصل المحددة:* ${contactMethod ? contactMethod.toUpperCase() : 'غير محدد'}\n` +
          `*بيانات التواصل:* ${contactDetail}\n` +
          `*البلد:* ${country} (${dialInfo.dialCode})\n` +
          `*كود ترويجي/حالة:* ${promoCode || 'لا يوجد'}\n` +
          `*الجهاز:* ${device}\n` +
          `*IP:* ${ip}\n` +
          `*الوقت:* ${time}`;
        await sendTelegramMessage(msg);
      } catch (e) {
        console.error('Telegram notification failed:', e);
      }
    } catch (err: any) {
      setRegError(err.message || 'حدث خطأ أثناء تقديم الطلب');
    } finally {
      setRegLoading(false);
    }
  };

  const isRtl = ['ar', 'ur', 'fa'].includes(i18n.language?.split('-')[0] || 'en');

  // VIEW 3: FULL SCREEN STEP-BY-STEP REGISTRATION FORM MATCHING USER'S SCREENSHOTS
  if (showRegScreen) {
    return (
      <div
        className="min-h-[100dvh] w-full bg-[#0b0e17] text-white flex flex-col justify-between font-sans select-none relative overflow-y-auto"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Top Indicator Progress Bar */}
        <div className="w-full bg-[#182030] h-1.5 shrink-0">
          <div
            className="bg-[#4E71FF] h-full transition-all duration-300 ease-out"
            style={{ width: regStep === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* Top Header Row with Back Arrow & Titles */}
        <div className="w-full px-6 pt-3 pb-1 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <button
              type="button"
              onClick={() => {
                if (regStep === 2) {
                  setRegStep(1);
                  setRegError('');
                } else {
                  setShowRegScreen(false);
                  setRegStep(1);
                  setRegError('');
                }
              }}
              className="p-2 -ms-2 text-gray-300 hover:text-white transition-colors cursor-pointer rounded-full active:bg-gray-800/50"
            >
              {isRtl ? <ArrowRight className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
            </button>
            <div className="w-6" />
          </div>

          <div className="text-center space-y-0.5">
            <span className="text-gray-400 text-xs sm:text-sm font-medium tracking-wide">
              {t('registration_title', 'التسجيل')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
              {regStep === 1
                ? t('personal_info', 'معلومات شخصية')
                : regStep === 2
                ? t('contact_details', 'تفاصيل الاتصال')
                : t('registration_successful', 'تم تقديم طلب التسجيل بنجاح')}
            </h2>
          </div>
        </div>

        {/* Form Body Area */}
        <div className="flex-1 px-6 overflow-y-auto max-w-md w-full mx-auto py-2 space-y-4 my-auto">
          {regError && (
            <div className="w-full bg-red-950/50 border border-red-800/60 p-3 rounded-2xl flex items-center gap-3 text-red-300 text-sm animate-in fade-in shrink-0">
              <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
              <p className="font-medium text-xs sm:text-sm">{regError}</p>
            </div>
          )}

          {regStep === 1 && (
            <form id="reg-step-1" onSubmit={handleRegStep1Next} className="space-y-3.5">
              {/* First Name */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-white tracking-wide">
                  {t('first_name', 'الاسم')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      clearFieldError('firstName');
                    }}
                    onFocus={handleInputFocus}
                    placeholder={t('enter_first_name', 'أدخل الاسم الأول...')}
                    className={`w-full bg-[#1C2538] border ${
                      fieldErrors.firstName
                        ? 'border-red-500/90 bg-red-950/20 focus:border-red-500'
                        : 'border-[#2B3852] focus:border-[#4E71FF] focus:ring-1 focus:ring-[#4E71FF]'
                    } text-white text-base rounded-2xl py-3 ps-12 pe-5 outline-none transition-all placeholder:text-gray-500 font-normal`}
                  />
                  {firstName && (
                    <button
                      type="button"
                      onClick={() => setFirstName('')}
                      className="absolute inset-y-0 start-0 ps-4 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {fieldErrors.firstName && (
                  <p className="text-red-500 text-xs font-semibold pt-0.5 pe-1 animate-in fade-in">
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-white tracking-wide">
                  {t('last_name', 'اسم العائلة')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      clearFieldError('lastName');
                    }}
                    onFocus={handleInputFocus}
                    placeholder={t('enter_last_name', 'أدخل اسم العائلة...')}
                    className={`w-full bg-[#1C2538] border ${
                      fieldErrors.lastName
                        ? 'border-red-500/90 bg-red-950/20 focus:border-red-500'
                        : 'border-[#2B3852] focus:border-[#4E71FF] focus:ring-1 focus:ring-[#4E71FF]'
                    } text-white text-base rounded-2xl py-3 ps-12 pe-5 outline-none transition-all placeholder:text-gray-500 font-normal`}
                  />
                  {lastName && (
                    <button
                      type="button"
                      onClick={() => setLastName('')}
                      className="absolute inset-y-0 start-0 ps-4 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {fieldErrors.lastName && (
                  <p className="text-red-500 text-xs font-semibold pt-0.5 pe-1 animate-in fade-in">
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-white tracking-wide">
                  {t('dob', 'تاريخ الميلاد')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={dob}
                    onChange={(e) => {
                      const formatted = formatDobInput(e.target.value, dob);
                      setDob(formatted);
                      clearFieldError('dob');
                    }}
                    onFocus={handleInputFocus}
                    placeholder={t('dob_placeholder', 'DD.MM.YYYY')}
                    className={`w-full bg-[#1C2538] border ${
                      fieldErrors.dob
                        ? 'border-red-500/90 bg-red-950/20 focus:border-red-500'
                        : 'border-[#2B3852] focus:border-[#4E71FF] focus:ring-1 focus:ring-[#4E71FF]'
                    } text-white text-base rounded-2xl py-3 ps-12 pe-5 outline-none transition-all placeholder:text-gray-500 font-normal`}
                  />
                  {dob && (
                    <button
                      type="button"
                      onClick={() => setDob('')}
                      className="absolute inset-y-0 start-0 ps-4 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {fieldErrors.dob && (
                  <p className="text-red-500 text-xs font-semibold pt-0.5 pe-1 animate-in fade-in">
                    {fieldErrors.dob}
                  </p>
                )}
              </div>

              {/* Select Country */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-white tracking-wide">
                  {t('select_country', 'حدد البلد')}
                </label>

                <div
                  className="relative cursor-pointer"
                  onClick={() => {
                    setCountrySearchQuery('');
                    setShowCountryPickerModal(true);
                    clearFieldError('country');
                  }}
                >
                  <input
                    type="text"
                    readOnly
                    value={country}
                    placeholder={t('select_country_placeholder', 'حدد البلد...')}
                    className={`w-full bg-[#1C2538] border ${
                      fieldErrors.country
                        ? 'border-red-500/90 bg-red-950/20'
                        : 'border-[#2B3852] hover:border-[#4E71FF]'
                    } text-white text-base rounded-2xl py-3 ps-12 pe-12 outline-none transition-all cursor-pointer font-normal`}
                  />

                  {/* Location Pin Icon on the RIGHT */}
                  <div className="absolute inset-y-0 end-0 pe-4 flex items-center pointer-events-none text-gray-400">
                    <MapPin className="w-5 h-5 text-gray-300" />
                  </div>

                  {/* Clear Button X on the LEFT when country is selected */}
                  {country && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCountry('');
                      }}
                      className="absolute inset-y-0 start-0 ps-4 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {fieldErrors.country && (
                  <p className="text-red-500 text-xs font-semibold pt-0.5 pe-1 animate-in fade-in">
                    {fieldErrors.country}
                  </p>
                )}
              </div>

              {/* Promo Code (Optional) */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-white tracking-wide">
                  {t('promo_code', 'رمز ترويجي (اختياري)')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder={t('promo_code_placeholder', 'أدخل 6 - 10 حرفاً...')}
                    className="w-full bg-[#1C2538] border border-[#2B3852] focus:border-[#4E71FF] focus:ring-1 focus:ring-[#4E71FF] text-white text-base rounded-2xl py-3 ps-12 pe-5 outline-none transition-all placeholder:text-gray-500 font-normal"
                  />
                  {promoCode && (
                    <button
                      type="button"
                      onClick={() => setPromoCode('')}
                      className="absolute inset-y-0 start-0 ps-4 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}

          {regStep === 2 && (
            <form id="reg-step-2" onSubmit={handleRegSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-white tracking-wide">
                  {t('email_address', 'عنوان البريد الإلكتروني')}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFieldError('email');
                    }}
                    onFocus={handleInputFocus}
                    placeholder={t('enter_email_placeholder', 'ادخل بريدك الإلكتروني...')}
                    className={`w-full bg-[#1C2538] border ${
                      fieldErrors.email
                        ? 'border-red-500/90 bg-red-950/20 focus:border-red-500'
                        : 'border-[#2B3852] focus:border-[#4E71FF] focus:ring-1 focus:ring-[#4E71FF]'
                    } text-white text-base rounded-2xl py-3.5 ps-12 pe-5 outline-none transition-all placeholder:text-gray-500 font-normal`}
                  />
                  {email && (
                    <button
                      type="button"
                      onClick={() => setEmail('')}
                      className="absolute inset-y-0 start-0 ps-4 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {fieldErrors.email && (
                  <p className="text-red-500 text-xs font-semibold pt-0.5 pe-1 animate-in fade-in">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Contact Manager Optional Dropdown / Picker */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-white tracking-wide">
                  {t('contact_manager_optional', 'التواصل مع المدير (اختياري)')}
                </label>
                <div className="relative">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setShowContactModal(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setShowContactModal(true);
                      }
                    }}
                    className="w-full bg-[#1C2538] border border-[#2B3852] focus:border-[#4E71FF] text-white text-base rounded-2xl py-3.5 px-5 flex items-center justify-between outline-none transition-all cursor-pointer hover:border-[#3D4F72]"
                  >
                    {contactMethod === '' ? (
                      <span className="text-gray-500 font-normal">
                        {t('select_contact_method', 'اختر طريقة التواصل...')}
                      </span>
                    ) : (
                      <span className="text-white font-medium flex items-center gap-2">
                        {contactMethod === 'whatsapp' && (
                          <>
                            <MessageSquare className="w-5 h-5 text-emerald-400" />
                            <span>WhatsApp</span>
                          </>
                        )}
                        {contactMethod === 'telegram' && (
                          <>
                            <Send className="w-5 h-5 text-sky-400" />
                            <span>{t('telegram', 'تيليجرام')}</span>
                          </>
                        )}
                        {contactMethod === 'phone' && (
                          <>
                            <Phone className="w-5 h-5 text-gray-300" />
                            <span>{t('phone_number', 'رقم الهاتف')}</span>
                          </>
                        )}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {contactMethod !== '' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setContactMethod('');
                            setPhone('');
                            setTelegramUsername('');
                          }}
                          className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                      {contactMethod === '' && (
                        <MessageSquare className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Conditional Contact Input Field */}
              {(contactMethod === 'whatsapp' || contactMethod === 'phone') && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="block text-sm font-semibold text-white tracking-wide">
                    {t('phone_number', 'رقم الهاتف')}
                  </label>
                  <div className="flex gap-2.5 items-center">
                    {/* Dial Code Badge */}
                    <div className="bg-[#1C2538] border border-[#2B3852] rounded-2xl py-3.5 px-4 font-bold text-white text-base min-w-[75px] flex items-center justify-center shrink-0">
                      {dialInfo.dialCode}
                    </div>

                    {/* Phone Input Box */}
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '');
                          if (digits.length <= dialInfo.phoneLength) {
                            setPhone(digits);
                            clearFieldError('phone');
                          }
                        }}
                        onFocus={handleInputFocus}
                        placeholder={dialInfo.placeholder}
                        className="w-full bg-[#1C2538] border border-[#2B3852] focus:border-[#4E71FF] focus:ring-1 focus:ring-[#4E71FF] text-white text-base rounded-2xl py-3.5 ps-12 pe-5 outline-none transition-all placeholder:text-gray-500 font-medium tracking-wider"
                      />
                      {phone && (
                        <button
                          type="button"
                          onClick={() => setPhone('')}
                          className="absolute inset-y-0 start-0 ps-4 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {contactMethod === 'telegram' && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="block text-sm font-semibold text-white tracking-wide">
                    {t('telegram_username', 'اسم مستخدم تيليجرام')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={telegramUsername}
                      onChange={(e) => setTelegramUsername(e.target.value)}
                      onFocus={handleInputFocus}
                      placeholder={t('enter_telegram_username', '(ادخل اسم المستخدم@...)')}
                      className="w-full bg-[#1C2538] border border-[#2B3852] focus:border-[#4E71FF] focus:ring-1 focus:ring-[#4E71FF] text-white text-base rounded-2xl py-3.5 ps-12 pe-5 outline-none transition-all placeholder:text-gray-500 font-normal"
                    />
                    {telegramUsername && (
                      <button
                        type="button"
                        onClick={() => setTelegramUsername('')}
                        className="absolute inset-y-0 start-0 ps-4 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Information Card Note */}
              <div className="bg-[#141C2B] border border-[#1E2A3E] rounded-2xl p-4 flex items-start gap-3 mt-4">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-gray-300 font-normal leading-relaxed">
                  {t('contact_manager_info_note', 'سنرسل معلوماتك إلى المدير، وسيتواصلون معك عبر الطريقة المحددة قريبًا')}
                </p>
              </div>
            </form>
          )}

          {regStep === 3 && (
            <div className="py-2 space-y-5 animate-in zoom-in-95">
              {/* Top Text Header matching screenshot */}
              <div className="space-y-2 text-start px-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {t('request_sent_successfully', 'تم إرسال طلبك بنجاح')}
                </h2>
                <p className="text-sm sm:text-base text-gray-300 font-normal leading-relaxed">
                  {t('congrats_registered_msg', 'تهانينا! لقد سجلت بنجاح. شكراً لصبرك واهتمامك بالتفاصيل.')}
                </p>
              </div>

              {/* Trophy Podium Graphic SVG positioned ABOVE verification code */}
              <div className="flex justify-center py-3">
                <svg width="220" height="180" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
                  {/* Podium base */}
                  {/* Middle step (1st) */}
                  <rect x="62" y="80" width="76" height="75" rx="12" fill="#3B4861" />
                  {/* Left step (2nd) */}
                  <rect x="18" y="98" width="52" height="57" rx="10" fill="#2B364A" />
                  {/* Right step (3rd) */}
                  <rect x="130" y="108" width="52" height="47" rx="10" fill="#2B364A" />
                  
                  {/* Trophy Stand */}
                  <rect x="91" y="68" width="18" height="18" rx="4" fill="#64748B" />
                  <path d="M82 72 H118 L112 80 H88 Z" fill="#475569" />

                  {/* Trophy Cup */}
                  <path d="M66 12 C66 12 66 52 100 52 C134 52 134 12 134 12 H66 Z" fill="#8B9BB4" />
                  
                  {/* Trophy Handles */}
                  <path d="M66 20 C52 20 52 38 66 42" stroke="#8B9BB4" strokeWidth="6" strokeLinecap="round" fill="none" />
                  <path d="M134 20 C148 20 148 38 134 42" stroke="#8B9BB4" strokeWidth="6" strokeLinecap="round" fill="none" />
                  
                  {/* Star on Trophy */}
                  <path d="M100 22 L103.5 29 L111 30.2 L105.5 35.5 L106.8 43 L100 39.4 L93.2 43 L94.5 35.5 L89 30.2 L96.5 29 Z" fill="#253043" />
                </svg>
              </div>

              {/* Manager Security Verification Code Card (9 Random Digits) */}
              <div className="bg-[#141E30] border border-[#283858] rounded-2xl p-4 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#22304A] pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <span className="text-xs sm:text-sm font-bold text-gray-100">
                      {t('manager_verification_code_title', 'كود أمان التحقق من المدير')}
                    </span>
                  </div>
                  <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    9 أرقام موثوقة
                  </span>
                </div>

                <div className="bg-[#0B1220] border border-[#1F2C46] p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] text-gray-400 font-medium">
                      {t('manager_security_code', 'كود الأمان المخصص')}
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold text-amber-300 font-mono tracking-widest">
                      {managerCode ? managerCode.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3') : '106-982-415'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (managerCode) {
                        navigator.clipboard.writeText(managerCode);
                        setCopiedManagerCode(true);
                        setTimeout(() => setCopiedManagerCode(false), 2000);
                      }
                    }}
                    className="p-2.5 bg-[#1C2A44] hover:bg-[#283B5E] text-white rounded-xl transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 text-xs font-bold"
                  >
                    {copiedManagerCode ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">{t('copied', 'تم النسخ')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-gray-300" />
                        <span>{t('copy', 'نسخ')}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Explanatory Note */}
                <div className="bg-[#19243B] border border-[#253554] rounded-xl p-3 flex items-start gap-2.5 text-start">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] sm:text-xs text-gray-300 leading-relaxed font-normal">
                    {t('manager_code_explanation', 'احتفظ بهذا الكود! عند تواصل المدير معك عبر وسائل التواصل، اطلب منه تزويدك بـ "كود الأمان" هذا للتأكد من هويته المعتمدة لدى النظام.')}
                  </p>
                </div>
              </div>

              {/* Information Note matching screenshot */}
              <div className="flex items-start gap-3 pt-1 text-start">
                <div className="w-7 h-7 rounded-full border border-blue-400/40 bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-xs sm:text-sm text-gray-300 font-normal leading-relaxed">
                  {t('contact_manager_info_note', 'سنرسل معلوماتك إلى المدير، وسيتواصلون معك عبر الطريقة المحددة قريبًا')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Section */}
        <div className="w-full max-w-md mx-auto px-6 pb-4 pt-1 shrink-0 space-y-2.5">
          {regStep === 1 && (
            <button
              type="submit"
              form="reg-step-1"
              className={`w-full font-bold py-3.5 sm:py-4 px-6 rounded-2xl text-base sm:text-xl transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center justify-center ${
                firstName && lastName && dob && country
                  ? 'bg-[#4E71FF] hover:bg-[#3D62EF] active:bg-[#3153DC] text-white shadow-lg shadow-blue-600/25'
                  : 'bg-[#1c2538] text-gray-400 hover:bg-[#25314a] hover:text-white'
              }`}
            >
              {t('next', 'التالي')}
            </button>
          )}

          {regStep === 2 && (
            <button
              type="submit"
              form="reg-step-2"
              disabled={regLoading}
              className={`w-full font-bold py-3.5 sm:py-4 px-6 rounded-2xl text-base sm:text-xl transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center justify-center ${
                email.trim()
                  ? 'bg-[#4E71FF] hover:bg-[#3D62EF] active:bg-[#3153DC] text-white shadow-lg shadow-blue-600/25'
                  : 'bg-[#1c2538] text-gray-400 hover:bg-[#25314a] hover:text-white'
              }`}
            >
              {regLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('loading', 'جارٍ التحميل...')}
                </span>
              ) : (
                t('send_request', 'إرسال الطلب')
              )}
            </button>
          )}

          {regStep === 3 && (
            <button
              type="button"
              onClick={() => {
                setShowRegScreen(false);
                setShowLoginForm(true);
                setUsernameInput(createdAgentId);
              }}
              className="w-full bg-[#4E71FF] hover:bg-[#3D62EF] active:bg-[#3153DC] text-white font-bold py-3.5 sm:py-4 px-6 rounded-2xl text-base sm:text-xl transition-all cursor-pointer shadow-lg shadow-blue-600/25"
            >
              {t('login', 'تسجيل الدخول')}
            </button>
          )}

          {/* Language Switcher */}
          <div className="flex justify-center pt-1">
            <LanguageSwitcher variant="dark" />
          </div>
        </div>

        {/* Country Picker Modal */}
        {showCountryPickerModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-[#131926] border border-[#252E42] w-full max-w-md h-[85vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
              {/* Modal Header */}
              <div className="p-4 border-b border-[#252E42] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#4E71FF]" />
                  <h3 className="font-bold text-lg text-white">
                    {t('select_country', 'اختر البلد')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCountryPickerModal(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-full bg-[#1C2538] hover:bg-[#25314a] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3 border-b border-[#252E42] shrink-0 bg-[#0b0e17]/50">
                <div className="relative">
                  <input
                    type="text"
                    value={countrySearchQuery}
                    onChange={(e) => setCountrySearchQuery(e.target.value)}
                    placeholder={t('search_country_placeholder', 'ابحث عن اسم الدولة...')}
                    className="w-full bg-[#1C2538] border border-[#2B3852] focus:border-[#4E71FF] text-white text-sm rounded-xl py-2.5 ps-9 pe-4 outline-none transition-all placeholder:text-gray-500"
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Country List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-[#1C2538]">
                {filteredCountriesList.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    {t('no_country_found', 'لم يتم العثور على نتائج')}
                  </div>
                ) : (
                  filteredCountriesList.map((c, idx) => {
                    const cName = isArLang ? c.nameAr : c.nameEn;
                    const isDetected = c.code === currentDetectedCountry.code;
                    const isSelected = country === cName;

                    return (
                      <button
                        key={`${c.code}-${idx}`}
                        type="button"
                        onClick={() => {
                          setCountry(cName);
                          setShowCountryPickerModal(false);
                        }}
                        className={`w-full px-4 py-3 rounded-xl flex items-center justify-between text-start transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#4E71FF]/20 border border-[#4E71FF]/40 text-white font-bold'
                            : 'hover:bg-[#1C2538] text-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-base">{cName}</span>
                        </div>

                        {isSelected && <Check className="w-5 h-5 text-[#4E71FF]" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contact Method Bottom Sheet Modal */}
        {showContactModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className="fixed inset-0"
              onClick={() => setShowContactModal(false)}
            />
            <div className="relative w-full max-w-md bg-[#131B2E] border-t border-[#232F48] rounded-t-3xl p-6 space-y-4 z-10 animate-in slide-in-from-bottom duration-300">
              {/* Drawer Handle Pill */}
              <div className="w-12 h-1 bg-gray-500/40 rounded-full mx-auto -mt-2 mb-3" />

              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {t('contact_method_modal_title', 'طريقة الاتصال')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-full bg-[#1C2538] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Options List */}
              <div className="space-y-3 pt-2">
                {/* Phone Option */}
                <button
                  type="button"
                  onClick={() => {
                    setContactMethod('phone');
                    setShowContactModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                    contactMethod === 'phone'
                      ? 'bg-[#1C2844] border-[#4E71FF] text-white'
                      : 'bg-[#182135] border-[#25324C] hover:bg-[#1F2B45] text-gray-200'
                  }`}
                >
                  <span className="font-semibold text-base">
                    {t('phone_number', 'رقم الهاتف')}
                  </span>
                  <Phone className="w-5 h-5 text-gray-300" />
                </button>

                {/* Telegram Option */}
                <button
                  type="button"
                  onClick={() => {
                    setContactMethod('telegram');
                    setShowContactModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                    contactMethod === 'telegram'
                      ? 'bg-[#1C2844] border-[#4E71FF] text-white'
                      : 'bg-[#182135] border-[#25324C] hover:bg-[#1F2B45] text-gray-200'
                  }`}
                >
                  <span className="font-semibold text-base">
                    {t('telegram', 'تيليجرام')}
                  </span>
                  <Send className="w-5 h-5 text-sky-400" />
                </button>

                {/* WhatsApp Option */}
                <button
                  type="button"
                  onClick={() => {
                    setContactMethod('whatsapp');
                    setShowContactModal(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                    contactMethod === 'whatsapp'
                      ? 'bg-[#1C2844] border-[#4E71FF] text-white'
                      : 'bg-[#182135] border-[#25324C] hover:bg-[#1F2B45] text-gray-200'
                  }`}
                >
                  <span className="font-semibold text-base">WhatsApp</span>
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VIEW 2: FULL SCREEN LOG IN FORM MATCHING USER'S SCREENSHOT EXACTLY
  if (showLoginForm) {
    return (
      <div
        className="min-h-[100dvh] w-full bg-[#0b0e17] text-white flex flex-col justify-between px-6 py-4 font-sans select-none relative overflow-y-auto"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Top Header Row with Back Button & Centered Title */}
        <div className="flex items-center justify-between w-full pt-1 pb-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setError('');
              setShowLoginForm(false);
            }}
            className="p-2 -ms-2 text-gray-300 hover:text-white transition-colors cursor-pointer rounded-full active:bg-gray-800/50"
          >
            {isRtl ? <ArrowRight className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
          </button>

          <h2 className="text-2xl font-bold text-white tracking-wide text-center flex-1 me-4">
            {t('login', 'Log in')}
          </h2>

          <div className="w-6" />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full mx-auto space-y-5 my-auto">
          {/* Centered MobCash Ticket Logo */}
          <div className="shrink-0">
            <MobCashLogo className="w-20 h-20 sm:w-24 sm:h-24" />
          </div>

          {/* Error Message Notice */}
          {error && (
            <div className="w-full bg-red-950/50 border border-red-800/60 p-3 rounded-2xl flex items-center gap-3 text-red-300 text-sm animate-in fade-in shrink-0">
              <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
              <p className="font-medium text-xs sm:text-sm">{error}</p>
            </div>
          )}

          {/* Form Inputs */}
          <form id="login-form" onSubmit={handleLoginSubmit} className="w-full space-y-4 shrink-0">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-sm sm:text-base font-semibold text-white tracking-wide">
                {t('username', 'Username')}
              </label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder={t('enter_username', 'Enter username...')}
                className="w-full bg-[#1C2538] border border-[#2B3852] focus:border-[#4E71FF] focus:ring-1 focus:ring-[#4E71FF] text-white text-base rounded-2xl py-3.5 px-5 outline-none transition-all placeholder:text-gray-500 font-normal"
                autoFocus
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-sm sm:text-base font-semibold text-white tracking-wide">
                {t('password', 'Password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={t('enter_password', 'Enter password...')}
                  className="w-full bg-[#1C2538] border border-[#2B3852] focus:border-[#4E71FF] focus:ring-1 focus:ring-[#4E71FF] text-white text-base rounded-2xl py-3.5 ps-5 pe-12 outline-none transition-all placeholder:text-gray-500 font-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 pe-4 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                  rememberMe
                    ? 'bg-[#4E71FF] border-[#4E71FF] text-white'
                    : 'bg-[#1C2538] border-[#2B3852] text-transparent'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
              <span
                onClick={() => setRememberMe(!rememberMe)}
                className="text-sm sm:text-base font-semibold text-white cursor-pointer select-none"
              >
                {t('remember_me', 'Remember me')}
              </span>
            </div>
          </form>
        </div>

        {/* Bottom Area with Version & Primary Button matching Screenshot */}
        <div className="w-full max-w-md mx-auto pb-3 pt-2 space-y-2.5 shrink-0">
          <div className="text-start ps-1 text-gray-400 text-xs sm:text-sm font-medium tracking-wide">
            {t('version_label', 'Version: 63.0')}
          </div>

          <button
            type="submit"
            form="login-form"
            disabled={loading}
            className={`w-full font-bold py-3.5 sm:py-4 px-6 rounded-2xl text-base sm:text-xl transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center justify-center ${
              usernameInput && passwordInput
                ? 'bg-[#4E71FF] hover:bg-[#3D62EF] active:bg-[#3153DC] text-white shadow-lg shadow-blue-600/25'
                : 'bg-[#1c2538] text-gray-400 hover:bg-[#25314a] hover:text-white'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('loading', 'Loading...')}
              </span>
            ) : (
              t('login', 'Log in')
            )}
          </button>
        </div>
      </div>
    );
  }

  // VIEW 1: WELCOME / LANDING SPLASH SCREEN
  return (
    <div
      className="min-h-[100dvh] w-full bg-[#0B0E14] text-white flex flex-col justify-between items-center px-6 py-6 relative overflow-y-auto font-sans select-none"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Background radial glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Branding Section */}
      <div className="flex-1 flex flex-col justify-center items-center text-center z-10 my-auto">
        {/* MobCash Logo Icon */}
        <MobCashLogo className="w-28 h-28 mb-4 transition-transform hover:scale-105 duration-300" />

        {/* Brand Name */}
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">
          MobCash
        </h1>

        {/* Subtitle */}
        <p className="text-gray-300/90 text-lg sm:text-xl font-medium tracking-wide">
          {t('make_money_with_us', 'Make money with us')}
        </p>
      </div>

      {/* Bottom Actions Section */}
      <div className="w-full max-w-sm flex flex-col items-center z-10 mt-auto pb-4">
        {/* Version Tag */}
        <span className="text-gray-400 text-sm font-medium mb-4 tracking-wider">
          {t('version_label', 'Version: 63.0')}
        </span>

        {/* Primary Log in Button */}
        <button
          type="button"
          onClick={() => {
            setError('');
            setShowLoginForm(true);
          }}
          className="w-full bg-[#4E71FF] hover:bg-[#3D62EF] active:bg-[#3153DC] text-white font-bold py-4 px-6 rounded-2xl text-lg sm:text-xl shadow-lg shadow-blue-600/25 transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center justify-center mb-3"
        >
          {t('login', 'Log in')}
        </button>

        {/* Sub-label */}
        <p className="text-gray-300/80 text-sm sm:text-base font-normal my-1 text-center">
          {t('dont_have_account', "Don't have an account?")}
        </p>

        {/* Secondary Registration Button */}
        <button
          type="button"
          onClick={() => {
            setRegStep(1);
            setRegError('');
            setShowRegScreen(true);
          }}
          className="w-full bg-[#131926] hover:bg-[#1A2234] border border-[#252E42] text-[#4E71FF] hover:text-white font-bold py-4 px-6 rounded-2xl text-lg sm:text-xl hover:border-[#4E71FF] transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center justify-center mb-6"
        >
          {t('registration', 'Registration')}
        </button>

        {/* Language Switcher Button */}
        <LanguageSwitcher variant="dark" />
      </div>
    </div>
  );
}

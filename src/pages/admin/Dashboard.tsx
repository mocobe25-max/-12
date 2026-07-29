import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Clock, CheckCircle, XCircle, Activity, UserPlus, ShieldCheck, DollarSign, TrendingUp, BarChart2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    under_review: 0,
    active: 0,
    suspended: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('status, created_at');

      if (!agentsError && agents) {
        const newStats = {
          total: agents.length,
          pending: agents.filter(a => a.status === 'pending').length,
          under_review: agents.filter(a => a.status === 'under_review').length,
          active: agents.filter(a => a.status === 'active').length,
          suspended: agents.filter(a => a.status === 'suspended').length,
        };
        setStats(newStats);
      }

      const { data: recentActivities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!activitiesError && recentActivities) {
        setActivities(recentActivities);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: t('total_agents'), value: stats.total, icon: Users, color: 'bg-indigo-600', textColor: 'text-indigo-600', bgLight: 'bg-indigo-50' },
    { label: t('pending'), value: stats.pending, icon: Clock, color: 'bg-amber-500', textColor: 'text-amber-600', bgLight: 'bg-amber-50' },
    { label: t('under_review'), value: stats.under_review, icon: Activity, color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50' },
    { label: t('active'), value: stats.active, icon: CheckCircle, color: 'bg-emerald-600', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50' },
    { label: t('suspended'), value: stats.suspended, icon: XCircle, color: 'bg-rose-600', textColor: 'text-rose-600', bgLight: 'bg-rose-50' },
  ];

  const chartData = [
    { name: t('active'), count: stats.active, color: '#059669' },
    { name: t('pending'), count: stats.pending, color: '#d97706' },
    { name: t('under_review'), count: stats.under_review, color: '#2563eb' },
    { name: t('suspended'), count: stats.suspended, color: '#e11d48' },
  ];

  if (loading) return <div className="p-12 text-center text-gray-500 font-medium">{t('loading')}</div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 rounded-3xl shadow-xl gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-300 font-medium text-sm mb-1">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            لوحة تحكم المشرف (Admin Control Center)
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">نظرة عامة على النظام والوكلاء</h1>
          <p className="text-gray-300 mt-2 max-w-xl text-sm leading-relaxed">
            إدارة الوكلاء، تتبع حالات التفعيل، مراقبة النشاطات المالية والتشغيلية بكفاءة عالية وأمان تام.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/admin/create-agent"
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-2xl shadow-lg transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
          >
            <UserPlus className="w-5 h-5" />
            {t('create_agent')}
          </Link>
          <Link
            to="/admin/agents"
            className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl backdrop-blur-md transition-all flex items-center gap-2"
          >
            <Users className="w-5 h-5" />
            {t('manage_agents')}
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{stat.label}</span>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${stat.color} shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.bgLight} ${stat.textColor}`}>
                  الوكلاء
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Chart & Quick Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              توزيع حالات الوكلاء (Agent Status Analytics)
            </h2>
            <span className="text-xs font-medium px-3 py-1 bg-gray-100 text-gray-600 rounded-full">الكل: {stats.total}</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '12px', border: 'none' }}
                  cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Shortcuts & Financial Overview */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              روابط سريعة وأقسام النظام
            </h2>
            <div className="space-y-3">
              <Link to="/admin/create-agent" className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600">إنشاء وكيل جديد</p>
                    <p className="text-xs text-gray-500">إضافة وكيل بصلاحيات كاملة</p>
                  </div>
                </div>
                <span className="text-indigo-600 font-bold">&larr;</span>
              </Link>

              <Link to="/admin/agents" className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600">إدارة الوكلاء</p>
                    <p className="text-xs text-gray-500">تعديل، تفعيل أو إيقاف الوكلاء</p>
                  </div>
                </div>
                <span className="text-indigo-600 font-bold">&larr;</span>
              </Link>

              <Link to="/admin/payment-setup" className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600">إعداد الدفع والعمولات</p>
                    <p className="text-xs text-gray-500">تكوين عناوين الاستلام</p>
                  </div>
                </div>
                <span className="text-indigo-600 font-bold">&larr;</span>
              </Link>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 text-center">
            <p className="text-xs font-semibold text-indigo-900">النظام يعمل بكفاءة تامة والتخزين متزامن</p>
            <p className="text-[11px] text-indigo-600 mt-1">تحديث تلقائي لحظي للبيانات</p>
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            {t('recent_activities')}
          </h2>
          <span className="text-xs font-medium text-gray-400">آخر 10 عمليات مسجلة</span>
        </div>
        <div className="divide-y divide-gray-100">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="p-5 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {t('agent')} <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{activity.agent_id}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{activity.action}</p>
                  </div>
                </div>
                <div className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                  {new Date(activity.created_at).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-400">{t('no_recent_activities')}</div>
          )}
        </div>
      </div>
    </div>
  );
}


import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Clock, CheckCircle, XCircle, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
      // Fetch stats
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('status');

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

      // Fetch recent activities
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
    { label: t('total_agents'), value: stats.total, icon: Users, color: 'bg-primary' },
    { label: t('pending'), value: stats.pending, icon: Clock, color: 'bg-pending' },
    { label: t('under_review'), value: stats.under_review, icon: Activity, color: 'bg-review' },
    { label: t('active'), value: stats.active, icon: CheckCircle, color: 'bg-active' },
    { label: t('suspended'), value: stats.suspended, icon: XCircle, color: 'bg-error' },
  ];

  if (loading) return <div className="p-8">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('dashboard')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-secondary" />
            {t('recent_activities')}
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-secondary">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t('agent')} <span className="font-mono text-secondary">{activity.agent_id}</span>
                    </p>
                    <p className="text-sm text-gray-500">{activity.action}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(activity.created_at).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">{t('no_recent_activities')}</div>
          )}
        </div>
      </div>
    </div>
  );
}

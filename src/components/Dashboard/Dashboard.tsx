import React, { useMemo } from 'react';
import { Users, Calendar, TrendingUp, Clock } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import StatsCard from './StatsCard';
import { useCRM } from '../../contexts/CRMContext';
import { useAuth } from '../../contexts/AuthContext';
import { canViewAllClients } from '../../utils/permissions';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

const Dashboard = () => {
  const { clients, activities } = useCRM();
  const { user } = useAuth();

  const filteredClients = useMemo(() => {
    if (!user) return [];
    return canViewAllClients(user.role) 
      ? clients 
      : clients.filter(client => client.createdBy === user.id);
  }, [clients, user]);

  const filteredActivities = useMemo(() => {
    if (!user) return [];
    return canViewAllClients(user.role)
      ? activities
      : activities.filter(activity => activity.createdBy === user.id);
  }, [activities, user]);

  const upcomingActivities = filteredActivities
    .filter(activity => new Date(activity.date) > new Date() && !activity.completed)
    .slice(0, 5);

  const completedActivities = filteredActivities.filter(activity => activity.completed).length;

  // Chart data
  const clientsByTag = useMemo(() => {
    const tagCounts: { [key: string]: number } = {};
    filteredClients.forEach(client => {
      client.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return tagCounts;
  }, [filteredClients]);

  const activitiesByType = useMemo(() => {
    const typeCounts: { [key: string]: number } = {};
    filteredActivities.forEach(activity => {
      typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1;
    });
    return typeCounts;
  }, [filteredActivities]);

  const monthlyClients = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCounts = new Array(12).fill(0);
    
    filteredClients.forEach(client => {
      const month = new Date(client.createdAt).getMonth();
      monthlyCounts[month]++;
    });

    return {
      labels: months,
      datasets: [{
        label: 'New Clients',
        data: monthlyCounts,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }]
    };
  }, [filteredClients]);

  const tagChartData = {
    labels: Object.keys(clientsByTag),
    datasets: [{
      data: Object.values(clientsByTag),
      backgroundColor: [
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#EF4444',
        '#8B5CF6',
        '#F97316'
      ]
    }]
  };

  const activityChartData = {
    labels: Object.keys(activitiesByType),
    datasets: [{
      label: 'Activities',
      data: Object.values(activitiesByType),
      backgroundColor: 'rgba(99, 102, 241, 0.8)',
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 1
    }]
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back, {user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Clients"
          value={filteredClients.length}
          icon={Users}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Activities"
          value={filteredActivities.length}
          icon={Calendar}
          color="green"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Completed Tasks"
          value={completedActivities}
          icon={TrendingUp}
          color="purple"
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Upcoming"
          value={upcomingActivities.length}
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Client Acquisition</h3>
          <div className="h-64">
            <Line 
              data={monthlyClients} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: {
                      color: document.documentElement.classList.contains('dark') ? '#fff' : '#000'
                    }
                  }
                },
                scales: {
                  x: {
                    ticks: {
                      color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
                    }
                  },
                  y: {
                    ticks: {
                      color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
                    }
                  }
                }
              }} 
            />
          </div>
        </div>

        {Object.keys(clientsByTag).length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Clients by Tags</h3>
            <div className="h-64">
              <Doughnut 
                data={tagChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: {
                        color: document.documentElement.classList.contains('dark') ? '#fff' : '#000'
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        )}

        {Object.keys(activitiesByType).length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activities by Type</h3>
            <div className="h-64">
              <Bar 
                data={activityChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: {
                        color: document.documentElement.classList.contains('dark') ? '#fff' : '#000'
                      }
                    }
                  },
                  scales: {
                    x: {
                      ticks: {
                        color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
                      }
                    },
                    y: {
                      ticks: {
                        color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Recent Activities */}
      {upcomingActivities.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Activities</h3>
          <div className="space-y-3">
            {upcomingActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{activity.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(activity.date).toLocaleDateString()} - {activity.type}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activity.type === 'meeting' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  activity.type === 'call' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  activity.type === 'email' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                }`}>
                  {activity.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useCRM } from '../../contexts/CRMContext';
import { useAuth } from '../../contexts/AuthContext';
import { canManageActivities, canViewAllClients } from '../../utils/permissions';
import ActivityForm from './ActivityForm';
import { Activity } from '../../contexts/CRMContext';

const ActivityCalendar = () => {
  const { activities, clients, deleteActivity } = useCRM();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>();

  const filteredActivities = useMemo(() => {
    if (!user) return [];
    return canViewAllClients(user.role)
      ? activities
      : activities.filter(activity => activity.createdBy === user.id);
  }, [activities, user]);

  const calendarEvents = useMemo(() => {
    return filteredActivities.map(activity => {
      const client = activity.clientId ? clients.find(c => c.id === activity.clientId) : null;
      
      return {
        id: activity.id,
        title: activity.title,
        date: new Date(activity.date).toISOString().split('T')[0],
        backgroundColor: getActivityColor(activity.type),
        borderColor: getActivityColor(activity.type),
        extendedProps: {
          activity,
          clientName: client?.name || 'No client'
        }
      };
    });
  }, [filteredActivities, clients]);

  function getActivityColor(type: string): string {
    switch (type) {
      case 'meeting': return '#3B82F6';
      case 'call': return '#10B981';
      case 'email': return '#F59E0B';
      case 'followup': return '#8B5CF6';
      default: return '#6B7280';
    }
  }

  const handleDateClick = (arg: any) => {
    if (canManageActivities(user?.role || 'support')) {
      setSelectedDate(new Date(arg.date));
      setShowForm(true);
    }
  };

  const handleEventClick = (arg: any) => {
    const activity = arg.event.extendedProps.activity;
    
    if (canManageActivities(user?.role || 'support')) {
      const action = window.confirm('Would you like to edit this activity? Click Cancel to delete it instead.');
      
      if (action) {
        setEditingActivity(activity);
        setShowForm(true);
      } else if (window.confirm('Are you sure you want to delete this activity?')) {
        deleteActivity(activity.id);
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingActivity(undefined);
    setSelectedDate(null);
  };

  if (!user) return null;

  const canManage = canManageActivities(user.role);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activities</h1>
          <p className="text-gray-600 dark:text-gray-400">Track meetings, calls, and follow-ups</p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={20} />
            Add Activity
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Meeting</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Call</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Follow-up</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
          eventDisplay="block"
        />
      </div>

      {/* Upcoming Activities List */}
      {filteredActivities.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {filteredActivities
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 10)
              .map((activity) => {
                const client = activity.clientId ? clients.find(c => c.id === activity.clientId) : null;
                
                return (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getActivityColor(activity.type) }}
                        ></div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{activity.title}</h4>
                        {activity.completed && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                            Completed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{new Date(activity.date).toLocaleDateString()}</span>
                        <span className="capitalize">{activity.type}</span>
                        {client && <span>Client: {client.name}</span>}
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex gap-1 ml-4">
                        <button
                          onClick={() => {
                            setEditingActivity(activity);
                            setShowForm(true);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this activity?')) {
                              deleteActivity(activity.id);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <ActivityForm
          activity={editingActivity}
          defaultDate={selectedDate}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default ActivityCalendar;
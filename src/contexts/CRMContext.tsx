import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import localforage from 'localforage';
import { useAuth } from './AuthContext';

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  date: Date;
  type: 'meeting' | 'call' | 'email' | 'followup';
  clientId?: string;
  createdBy: string;
  completed: boolean;
}

interface CRMContextType {
  clients: Client[];
  activities: Activity[];
  addClient: (client: Omit<Client, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id' | 'createdBy'>) => Promise<void>;
  updateActivity: (id: string, activity: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  loading: boolean;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [savedClients, savedActivities] = await Promise.all([
        localforage.getItem<Client[]>('clients') || [],
        localforage.getItem<Activity[]>('activities') || []
      ]);

      setClients(savedClients || []);
      setActivities(savedActivities || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      createdBy: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedClients = [...clients, newClient];
    setClients(updatedClients);
    await localforage.setItem('clients', updatedClients);
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    const updatedClients = clients.map(client =>
      client.id === id
        ? { ...client, ...clientData, updatedAt: new Date() }
        : client
    );
    setClients(updatedClients);
    await localforage.setItem('clients', updatedClients);
  };

  const deleteClient = async (id: string) => {
    const updatedClients = clients.filter(client => client.id !== id);
    setClients(updatedClients);
    await localforage.setItem('clients', updatedClients);
  };

  const addActivity = async (activityData: Omit<Activity, 'id' | 'createdBy'>) => {
    if (!user) return;

    const newActivity: Activity = {
      ...activityData,
      id: Date.now().toString(),
      createdBy: user.id,
    };

    const updatedActivities = [...activities, newActivity];
    setActivities(updatedActivities);
    await localforage.setItem('activities', updatedActivities);
  };

  const updateActivity = async (id: string, activityData: Partial<Activity>) => {
    const updatedActivities = activities.map(activity =>
      activity.id === id
        ? { ...activity, ...activityData }
        : activity
    );
    setActivities(updatedActivities);
    await localforage.setItem('activities', updatedActivities);
  };

  const deleteActivity = async (id: string) => {
    const updatedActivities = activities.filter(activity => activity.id !== id);
    setActivities(updatedActivities);
    await localforage.setItem('activities', updatedActivities);
  };

  return (
    <CRMContext.Provider value={{
      clients,
      activities,
      addClient,
      updateClient,
      deleteClient,
      addActivity,
      updateActivity,
      deleteActivity,
      loading
    }}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
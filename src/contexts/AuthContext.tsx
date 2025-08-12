import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import localforage from 'localforage';

export type UserRole = 'admin' | 'sales' | 'support';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy users for demonstration
const DUMMY_USERS: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@crm.com', role: 'admin' },
  { id: '2', name: 'John Sales', email: 'john@crm.com', role: 'sales' },
  { id: '3', name: 'Sarah Support', email: 'sarah@crm.com', role: 'support' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const savedUser = await localforage.getItem<User>('currentUser');
      if (savedUser) {
        setUser(savedUser);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = DUMMY_USERS.find(u => u.email === email);
    if (foundUser && password === 'password123') {
      setUser(foundUser);
      await localforage.setItem('currentUser', foundUser);
      return true;
    }
    return false;
  };

  const logout = async () => {
    setUser(null);
    await localforage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
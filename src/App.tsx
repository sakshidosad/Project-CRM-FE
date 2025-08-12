import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CRMProvider } from './contexts/CRMContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import ClientList from './components/Clients/ClientList';
import ActivityCalendar from './components/Activities/ActivityCalendar';
import Settings from './components/Settings/Settings';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CRMProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
              <ProtectedRoute>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="clients" element={<ClientList />} />
                    <Route path="activities" element={<ActivityCalendar />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                </Routes>
              </ProtectedRoute>
            </div>
          </Router>
        </CRMProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
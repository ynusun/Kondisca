
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ConditionerDashboard from './pages/ConditionerDashboard';
import PlayerDashboard from './pages/PlayerDashboard';
import PlayerProfile from './pages/PlayerProfile';
import ManageMetrics from './pages/ManageMetrics';
import DailySurveyPage from './pages/DailySurvey';
import CalendarPage from './pages/CalendarPage';
import DashboardLayout from './components/DashboardLayout';
import { UserRole } from './types';
import PlayersListPage from './pages/PlayersListPage';
import SurveyManagementPage from './pages/SurveyManagementPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

const AppRoutes: React.FC = () => {
    const { user } = useAuth();
  
    return (
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route 
          path="/*"
          element={
            user ? (
              <DashboardLayout>
                <Routes>
                  {user.role === UserRole.Conditioner && (
                    <>
                      <Route path="/" element={<ConditionerDashboard />} />
                      <Route path="/players" element={<PlayersListPage />} />
                      <Route path="/player/:id" element={<PlayerProfile />} />
                      <Route path="/survey-management" element={<SurveyManagementPage />} />
                      <Route path="/metrics" element={<ManageMetrics />} />
                      <Route path="/calendar" element={<CalendarPage />} />
                    </>
                  )}
                  {user.role === UserRole.Player && (
                    <>
                      <Route path="/" element={<PlayerDashboard />} />
                      <Route path="/survey" element={<DailySurveyPage />} />
                    </>
                  )}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
      </Routes>
    );
};


export default App;
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { wsClient } from './websocket/wsClient';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OAuthCallback from './pages/OAuthCallback';

export default function App() {
  useEffect(() => {
    wsClient.connect().catch(console.error);

    return () => {
      wsClient.disconnect();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
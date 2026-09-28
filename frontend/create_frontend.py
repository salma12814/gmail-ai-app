import os
import json

# Créer les dossiers
os.makedirs('src/api', exist_ok=True)
os.makedirs('src/components', exist_ok=True)
os.makedirs('src/pages', exist_ok=True)
os.makedirs('src/store', exist_ok=True)
os.makedirs('src/websocket', exist_ok=True)

files = {
    'src/api/client.js': '''import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  getGoogleAuthUrl: () => apiClient.get('/auth/google/auth-url'),
  getAccount: (id) => apiClient.get(`/auth/accounts/${id}`),
};

export const gmailAPI = {
  syncEmails: (userId) => apiClient.post(`/gmail/sync?userId=${userId}`),
  getEmails: (userId) => apiClient.get(`/gmail/emails?userId=${userId}`),
  getUnreplied: (userId) => apiClient.get(`/gmail/unreplied?userId=${userId}`),
  markReplied: (emailId) => apiClient.post(`/gmail/mark-replied?emailId=${emailId}`),
};

export const aiAPI = {
  analyzeEmail: (emailId, tone) => 
    apiClient.post(`/ai/analyze?emailId=${emailId}&tone=${tone}`),
  generateReply: (emailId, tone, language) => 
    apiClient.post(`/ai/generate-reply?emailId=${emailId}&tone=${tone}&language=${language}`),
  analyzeAndReply: (emailId, tone, language) =>
    apiClient.post(`/ai/analyze-and-reply?emailId=${emailId}&tone=${tone}&language=${language}`),
};''',

    'src/store/authStore.js': '''import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  userId: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setUserId: (userId) => set({ userId }),
  logout: () => set({ user: null, userId: null, isAuthenticated: false }),
}));''',

    'src/store/emailStore.js': '''import { create } from 'zustand';

export const useEmailStore = create((set) => ({
  emails: [],
  selectedEmail: null,
  loading: false,
  filter: 'all',

  setEmails: (emails) => set({ emails }),
  setSelectedEmail: (email) => set({ selectedEmail: email }),
  setLoading: (loading) => set({ loading }),
  setFilter: (filter) => set({ filter }),
  addEmail: (email) => set((state) => ({ 
    emails: [email, ...state.emails] 
  })),
}));''',

    'src/websocket/wsClient.js': '''export class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.listeners = {};
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('✅ WebSocket connecté');
          resolve();
        };

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const { type } = data;
          
          if (this.listeners[type]) {
            this.listeners[type].forEach(cb => cb(data));
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket erreur:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket fermé');
          this.reconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  on(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  send(type, data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    }
  }

  reconnect() {
    setTimeout(() => {
      console.log('🔄 Reconnexion WebSocket...');
      this.connect().catch(console.error);
    }, 3000);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

export const wsClient = new WebSocketClient('ws://localhost:8081/ws/emails');''',

    'src/pages/LoginPage.jsx': '''import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setUserId } = useAuthStore();

  const handleGoogleLogin = async () => {
    try {
      const response = await authAPI.getGoogleAuthUrl();
      const authUrl = response.data;
      window.location.href = authUrl;
    } catch (error) {
      console.error('Erreur connexion:', error);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
      localStorage.setItem('userId', '1');
      setUserId(1);
      navigate('/dashboard');
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="bg-white rounded-lg shadow-xl p-8 w-96">
        <h1 className="text-3xl font-bold text-center mb-6">📧 Gmail AI</h1>
        <p className="text-gray-600 text-center mb-8">
          Automatisez vos emails avec l'IA Gemini gratuit
        </p>
        
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
        >
          <span>🔐</span> Se connecter avec Google
        </button>
      </div>
    </div>
  );
}''',

    'src/pages/DashboardPage.jsx': '''import { useEffect, useState } from 'react';
import { gmailAPI } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useEmailStore } from '../store/emailStore';
import EmailList from '../components/EmailList';
import AnalysisPanel from '../components/AnalysisPanel';

export default function DashboardPage() {
  const userId = useAuthStore((s) => s.userId);
  const { emails, selectedEmail, loading, setEmails, setLoading } = useEmailStore();
  const [stats, setStats] = useState({
    total: 0,
    unreplied: 0,
    highPriority: 0,
  });

  useEffect(() => {
    if (!userId) return;
    
    const loadEmails = async () => {
      setLoading(true);
      try {
        const response = await gmailAPI.getEmails(userId);
        setEmails(response.data || []);
        
        setStats({
          total: response.data?.length || 0,
          unreplied: response.data?.filter(e => !e.isReplied).length || 0,
          highPriority: response.data?.filter(e => e.aiAnalysis?.priority === 'high').length || 0,
        });
      } catch (error) {
        console.error('Erreur chargement emails:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEmails();
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">📊 Dashboard</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Emails" value={stats.total} icon="📧" />
          <StatCard title="Sans Réponse" value={stats.unreplied} icon="🔔" />
          <StatCard title="Haute Priorité" value={stats.highPriority} icon="🔴" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EmailList emails={emails} loading={loading} />
        {selectedEmail && <AnalysisPanel email={selectedEmail} />}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <span className="text-4xl mr-4">{icon}</span>
        <div>
          <p className="text-gray-600">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}''',

    'src/components/EmailList.jsx': '''import { useEmailStore } from '../store/emailStore';
import EmailCard from './EmailCard';

export default function EmailList({ emails, loading }) {
  const { setSelectedEmail } = useEmailStore();

  if (loading) {
    return <div className="text-center py-8">⏳ Chargement...</div>;
  }

  return (
    <div className="lg:col-span-2">
      <h2 className="text-2xl font-bold mb-4">📨 Emails</h2>
      <div className="space-y-4">
        {emails.length === 0 ? (
          <p className="text-gray-500">Aucun email</p>
        ) : (
          emails.map((email) => (
            <EmailCard
              key={email.id}
              email={email}
              onClick={() => setSelectedEmail(email)}
            />
          ))
        )}
      </div>
    </div>
  );
}''',

    'src/components/EmailCard.jsx': '''import SentimentBadge from './SentimentBadge';
import PriorityBadge from './PriorityBadge';

export default function EmailCard({ email, onClick }) {
  const analysis = email.aiAnalysis ? JSON.parse(email.aiAnalysis) : null;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{email.senderName || email.senderEmail}</p>
          <p className="text-sm text-gray-500">{email.subject}</p>
          <p className="text-sm text-gray-400 line-clamp-2 mt-1">{email.body}</p>
        </div>
        <div className="flex gap-2">
          {analysis && (
            <>
              <SentimentBadge sentiment={analysis.sentiment} />
              <PriorityBadge priority={analysis.priority} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}''',

    'src/components/SentimentBadge.jsx': '''export default function SentimentBadge({ sentiment }) {
  const colors = {
    positive: 'bg-green-100 text-green-800',
    negative: 'bg-red-100 text-red-800',
    neutral: 'bg-gray-100 text-gray-800',
  };

  const icons = {
    positive: '😊',
    negative: '😞',
    neutral: '😐',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[sentiment]}`}>
      {icons[sentiment]} {sentiment}
    </span>
  );
}''',

    'src/components/PriorityBadge.jsx': '''export default function PriorityBadge({ priority }) {
  const colors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800',
  };

  const icons = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[priority]}`}>
      {icons[priority]} {priority}
    </span>
  );
}''',

    'src/components/AnalysisPanel.jsx': '''import { useState } from 'react';
import { aiAPI, gmailAPI } from '../api/client';

export default function AnalysisPanel({ email }) {
  const [analysis, setAnalysis] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('fr');

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await aiAPI.analyzeEmail(email.id, 'professional');
      setAnalysis(response.analysis);
    } catch (error) {
      console.error('Erreur analyse:', error);
      alert('Erreur lors de l\\'analyse');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReply = async () => {
    setLoading(true);
    try {
      const response = await aiAPI.generateReply(email.id, 'professional', language);
      setReply(response.reply.text);
    } catch (error) {
      console.error('Erreur génération:', error);
      alert('Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReplied = async () => {
    try {
      await gmailAPI.markReplied(email.id);
      alert('Email marqué comme répondu ✅');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">🔍 Analyse & Réponse</h3>

      <div className="mb-6 pb-6 border-b">
        <p className="text-sm text-gray-600"><strong>De:</strong> {email.senderEmail}</p>
        <p className="text-sm text-gray-600"><strong>Sujet:</strong> {email.subject}</p>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded mb-4 hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '⏳ Analyse...' : '🤖 Analyser'}
      </button>

      {analysis && (
        <div className="bg-blue-50 rounded p-4 mb-4">
          <p><strong>Sentiment:</strong> {analysis.sentiment}</p>
          <p><strong>Priorité:</strong> {analysis.priority}</p>
          <p><strong>Catégorie:</strong> {analysis.category}</p>
          <p><strong>Confiance:</strong> {(analysis.confidence * 100).toFixed(0)}%</p>
          <p className="mt-2"><strong>Résumé:</strong> {analysis.summary}</p>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Langue de réponse:</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-2"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>

        <button
          onClick={handleGenerateReply}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded mb-4 hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? '⏳ Génération...' : '✍️ Générer Réponse'}
        </button>
      </div>

      {reply && (
        <div className="bg-green-50 rounded p-4 mb-4">
          <p className="font-semibold mb-2">Réponse Générée:</p>
          <p className="text-gray-700 mb-4">{reply}</p>
          <button
            onClick={handleMarkReplied}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
          >
            ✅ Marquer comme Répondu
          </button>
        </div>
      )}
    </div>
  );
}''',

    'src/App.jsx': '''import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { wsClient } from './websocket/wsClient';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

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
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}''',

    'src/index.css': '''@tailwind base;
@tailwind components;
@tailwind utilities;''',
}

for filepath, content in files.items():
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'✅ {filepath}')

print('\n🎉 Tous les fichiers créés!')
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
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
  
  // ✅ NOUVEAUX
  sendReply: (emailId, userId, replyText) => 
    apiClient.post(`/gmail/send-reply?emailId=${emailId}&userId=${userId}`, {
      replyText: replyText,
      markAsRead: true,
      autoSend: true,
    }),
    
  generateAndSend: (emailId, userId, tone = 'professional') =>
    apiClient.post(`/gmail/generate-and-send?emailId=${emailId}&userId=${userId}&tone=${tone}`),
};

export const aiAPI = {
  analyzeEmail: (emailId, tone) => 
    apiClient.post(`/ai/analyze?emailId=${emailId}&tone=${tone}`),
  generateReply: (emailId, tone, language) => 
    apiClient.post(`/ai/generate-reply?emailId=${emailId}&tone=${tone}&language=${language}`),
  analyzeAndReply: (emailId, tone, language) =>
    apiClient.post(`/ai/analyze-and-reply?emailId=${emailId}&tone=${tone}&language=${language}`),
};
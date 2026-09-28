import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { setUserId } = useAuthStore();

  useEffect(() => {
    // Récupère userId de l'URL
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');

    console.log('🔐 OAuthCallback - userId reçu:', userId);

    if (userId) {
      try {
        // Sauvegarde dans localStorage
        localStorage.setItem('userId', userId);
        console.log('✅ userId sauvegardé dans localStorage:', userId);

        // Sauvegarde dans Zustand
        setUserId(userId);
        console.log('✅ userId sauvegardé dans Zustand');

        // Attend un peu puis redirige
        setTimeout(() => {
          console.log('🚀 Redirection vers dashboard...');
          navigate('/dashboard');
        }, 500);
      } catch (error) {
        console.error('❌ Erreur:', error);
        navigate('/login?error=' + encodeURIComponent(error.message));
      }
    } else {
      console.warn('⚠️ userId non trouvé dans l\'URL');
      navigate('/login?error=userId_not_found');
    }
  }, [navigate, setUserId]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <p className="text-xl font-bold">⏳ Authentification en cours...</p>
        <p className="text-gray-600">Veuillez patienter</p>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUserId } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await authAPI.getGoogleAuthUrl();
      const authUrl = response.data;
      window.location.href = authUrl;
    } catch (error) {
      console.error('Erreur connexion:', error);
      alert('Une erreur est survenue lors de la connexion.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const userIdFromUrl = params.get('userId');

      if (userIdFromUrl) {
        try {
          localStorage.setItem('userId', userIdFromUrl);
          setUserId(userIdFromUrl);
          setTimeout(() => {
            navigate('/dashboard');
          }, 400);
        } catch (error) {
          console.error('Erreur callback:', error);
          navigate(
            '/login?error=' +
              encodeURIComponent(error.message || 'Erreur inconnue')
          );
        }
      }
    };

    handleCallback();
  }, [navigate, setUserId]);

  const errorMessage = new URLSearchParams(window.location.search).get('error');

  return (
    <div className="login-page">
      <div className="background">
        <div className="background-grid" />
        <div className="orb orb-one" />
        <div className="orb orb-two" />
        <div className="orb orb-three" />
      </div>

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#brandGradient)" />
              <path d="M12.5 17.5L24 27L35.5 17.5" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12.5 17.5V31.5C12.5 32.6046 13.3954 33.5 14.5 33.5H33.5C34.6046 33.5 35.5 32.6046 35.5 31.5V17.5" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M33.5 10.5V15.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M31 13H36" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="brandGradient" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#635BFF" />
                  <stop offset="1" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="brand-name">Gmail AI</span>
        </div>

        <div className="topbar-status">
          <span className="status-dot" />
          <span>AI Email Assistant</span>
        </div>
      </header>

      <main className="login-main">
        <section className="hero-section">
          <div className="eyebrow">
            <span className="eyebrow-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 3L13.6 8.4L19 10L13.6 11.6L12 17L10.4 11.6L5 10L10.4 8.4L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </span>
            Intelligent email automation
          </div>

          <h1>
            Your inbox.
            <br />
            <span>Smarter with AI.</span>
          </h1>

          <p className="hero-description">
            Gmail AI helps you understand, organize and respond to your emails faster with intelligent assistance powered by Gemini.
          </p>

          <div className="features">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 5.5C4 4.67 4.67 4 5.5 4H18.5C19.33 4 20 4.67 20 5.5V15.5C20 16.33 19.33 17 18.5 17H13L9 20V17H5.5C4.67 17 4 16.33 4 15.5V5.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="M8 8H16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M8 12H13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <strong>Understand instantly</strong>
                <span>Summarize long conversations in seconds.</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 12.5L9 17.5L20 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <strong>Respond intelligently</strong>
                <span>Generate contextual and professional replies.</span>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </div>
              <div>
                <strong>Save valuable time</strong>
                <span>Let AI handle repetitive email tasks.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="login-section">
          <div className="login-card">
            <div className="card-header">
              <div className="mini-logo">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#miniGradient)" />
                  <path d="M12.5 17.5L24 27L35.5 17.5" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12.5 17.5V31.5C12.5 32.6046 13.3954 33.5 14.5 33.5H33.5C34.6046 33.5 35.5 32.6046 35.5 31.5V17.5" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="miniGradient" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#635BFF" />
                      <stop offset="1" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h2>Welcome back</h2>
              <p>Connect your Gmail account to get started.</p>
            </div>

            {errorMessage && (
              <div className="error-message">
                <div className="error-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M12 8V12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    <circle cx="12" cy="16" r="1" fill="currentColor" />
                  </svg>
                </div>
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className={`google-button ${isLoading ? 'loading' : ''}`}
            >
              {!isLoading && (
                <svg className="google-logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.27-2.09 3.57-5.16 3.57-8.64Z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.87-3c-1.07.72-2.44 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.97H1.25v3.09A12 12 0 0 0 12 24Z" />
                  <path fill="#FBBC05" d="M5.25 14.28A7.2 7.2 0 0 1 4.87 12c0-.79.14-1.56.38-2.28V6.63H1.25A12 12 0 0 0 0 12c0 1.94.46 3.78 1.25 5.37l4-3.09Z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.12 15.24 0 12 0A12 12 0 0 0 1.25 6.63l4 3.09C6.2 6.87 8.86 4.75 12 4.75Z" />
                </svg>
              )}

              {isLoading ? (
                <>
                  <span className="spinner" />
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Continue with Google</span>
              )}

              {!isLoading && (
                <svg className="arrow-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M13 6L19 12L13 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            <div className="security-note">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 3L19 6V11.5C19 16.2 16.1 19.8 12 21C7.9 19.8 5 16.2 5 11.5V6L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Secure authentication with Google OAuth 2.0</span>
            </div>

            <div className="divider">
              <span />
              <p>Privacy first</p>
              <span />
            </div>

            <p className="privacy-text">
              Your account remains protected by Google's authentication system. Gmail AI only accesses the permissions required for the application to work.
            </p>
          </div>

          <p className="copyright">Gmail AI · Intelligent email assistance</p>
        </section>
      </main>

      <style>{`
        * { box-sizing: border-box; }
        .login-page {
          min-height: 100vh;
          min-height: 100svh;
          position: relative;
          overflow: hidden;
          background: radial-gradient(circle at 10% 10%, rgba(99, 91, 255, 0.10), transparent 32%), radial-gradient(circle at 90% 90%, rgba(139, 92, 246, 0.08), transparent 35%), #f8f9fc;
          color: #111827;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .background { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .background-grid {
          position: absolute; inset: 0; opacity: 0.35;
          background-image: linear-gradient(rgba(99, 102, 241, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.035) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: linear-gradient(to bottom, black, transparent 80%);
        }

        .orb { position: absolute; border-radius: 999px; filter: blur(90px); opacity: 0.45; }
        .orb-one { width: 420px; height: 420px; background: rgba(99, 91, 255, 0.10); top: -220px; left: -160px; }
        .orb-two { width: 360px; height: 360px; background: rgba(139, 92, 246, 0.09); right: -150px; bottom: -130px; }
        .orb-three { width: 250px; height: 250px; background: rgba(59, 130, 246, 0.07); left: 48%; top: 20%; }

        .topbar {
          position: relative; z-index: 10; height: 76px; padding: 0 6vw; display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid rgba(17, 24, 39, 0.06);
          background: rgba(255, 255, 255, 0.68);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .brand { display: flex; align-items: center; gap: 11px; }
        .brand-mark { width: 38px; height: 38px; }
        .brand-mark svg { width: 100%; height: 100%; display: block; }
        .brand-name { font-size: 17px; font-weight: 700; letter-spacing: -0.025em; color: #171522; }

        .topbar-status { display: flex; align-items: center; gap: 8px; color: #6b7280; font-size: 12px; font-weight: 500; }
        .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.10); }

        .login-main {
          position: relative; z-index: 2; width: min(1180px, calc(100% - 48px)); min-height: calc(100vh - 76px);
          margin: auto; display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 90px;
          align-items: center; padding: 72px 0;
        }

        .hero-section { max-width: 600px; animation: heroIn 0.7s ease-out both; }
        .eyebrow {
          display: inline-flex; align-items: center; gap: 9px; padding: 7px 11px;
          border: 1px solid rgba(99, 91, 255, 0.14); border-radius: 999px;
          background: rgba(255, 255, 255, 0.72);
          color: #625bb5; font-size: 11px; font-weight: 700; letter-spacing: 0.04em;
          text-transform: uppercase; box-shadow: 0 2px 8px rgba(17, 24, 39, 0.03);
        }

        .eyebrow-icon { width: 16px; height: 16px; display: flex; }
        .eyebrow-icon svg { width: 100%; height: 100%; }

        .hero-section h1 {
          margin: 22px 0 20px; color: #11121a;
          font-size: clamp(46px, 5vw, 68px); line-height: 0.99; font-weight: 750; letter-spacing: -0.055em;
        }

        .hero-section h1 span {
          background: linear-gradient(110deg, #635bff, #8b5cf6);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .hero-description { max-width: 540px; color: #6b7280; font-size: 16px; line-height: 1.7; letter-spacing: -0.01em; }

        .features { display: flex; flex-direction: column; gap: 10px; margin-top: 34px; max-width: 500px; }
        .feature-card {
          display: flex; align-items: center; gap: 14px; padding: 13px 15px;
          border: 1px solid rgba(17, 24, 39, 0.06); border-radius: 14px;
          background: rgba(255, 255, 255, 0.62);
          transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
        }

        .feature-card:hover {
          transform: translateX(5px); border-color: rgba(99, 91, 255, 0.18);
          background: rgba(255, 255, 255, 0.9); box-shadow: 0 10px 30px rgba(17, 24, 39, 0.05);
        }

        .feature-icon {
          width: 38px; height: 38px; flex: 0 0 38px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 11px; color: #635bff;
          background: linear-gradient(135deg, rgba(99, 91, 255, 0.10), rgba(139, 92, 246, 0.08));
        }

        .feature-icon svg { width: 19px; height: 19px; }
        .feature-card strong { display: block; color: #1f2937; font-size: 13px; font-weight: 650; line-height: 1.4; }
        .feature-card span { display: block; margin-top: 2px; color: #8a919f; font-size: 11px; line-height: 1.4; }

        .login-section { display: flex; flex-direction: column; align-items: center; }
        .login-card {
          width: min(100%, 430px); padding: 38px;
          border: 1px solid rgba(17, 24, 39, 0.08); border-radius: 24px;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.86));
          box-shadow: 0 30px 80px rgba(17, 24, 39, 0.09), 0 8px 25px rgba(17, 24, 39, 0.04);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          animation: cardIn 0.7s 0.1s ease-out both;
        }

        .card-header { text-align: center; }
        .mini-logo { width: 58px; height: 58px; margin: 0 auto 20px; filter: drop-shadow(0 8px 18px rgba(99, 91, 255, 0.20)); }
        .mini-logo svg { width: 100%; height: 100%; }
        .card-header h2 { margin: 0; color: #11121a; font-size: 27px; line-height: 1.2; font-weight: 700; letter-spacing: -0.035em; }
        .card-header p { margin: 9px 0 0; color: #8a919f; font-size: 13px; line-height: 1.5; }

        .google-button {
          position: relative; width: 100%; height: 52px; margin-top: 30px;
          display: flex; align-items: center; justify-content: center; gap: 11px;
          border: 1px solid #dadde3; border-radius: 12px;
          background: #ffffff; color: #1f2937; font-family: inherit; font-size: 13px; font-weight: 650;
          cursor: pointer; box-shadow: 0 2px 4px rgba(17, 24, 39, 0.03);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }

        .google-button:hover:not(:disabled) {
          transform: translateY(-2px); border-color: #cfd3da;
          background: #ffffff; box-shadow: 0 10px 25px rgba(17, 24, 39, 0.08);
        }

        .google-button:active:not(:disabled) { transform: translateY(0); }
        .google-button:disabled { cursor: wait; opacity: 0.7; }

        .google-logo { width: 18px; height: 18px; flex: 0 0 18px; }
        .arrow-icon {
          position: absolute; right: 17px; width: 17px; height: 17px;
          color: #9ca3af; transition: transform 0.2s ease, color 0.2s ease;
        }

        .google-button:hover .arrow-icon { transform: translateX(3px); color: #635bff; }

        .spinner { width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top-color: #635bff;
          border-radius: 50%; animation: spin 0.7s linear infinite;
        }

        .security-note {
          display: flex; justify-content: center; align-items: center; gap: 7px;
          margin-top: 17px; color: #9299a5; font-size: 10px; font-weight: 500;
        }

        .security-note svg { width: 15px; height: 15px; color: #6f6aa9; }

        .divider { display: flex; align-items: center; gap: 12px; margin: 27px 0 14px; }
        .divider span { flex: 1; height: 1px; background: #eceef2; }
        .divider p { margin: 0; color: #a0a5af; font-size: 9px; font-weight: 650; letter-spacing: 0.08em; text-transform: uppercase; }

        .privacy-text { margin: 0 auto; max-width: 310px; color: #a0a5af; font-size: 10px; line-height: 1.6; text-align: center; }

        .error-message {
          display: flex; align-items: flex-start; gap: 9px; margin-top: 20px; padding: 11px 13px;
          border: 1px solid rgba(239, 68, 68, 0.18); border-radius: 10px;
          background: rgba(254, 242, 242, 0.8); color: #b91c1c; font-size: 11px; line-height: 1.5;
        }

        .error-icon { width: 16px; height: 16px; flex: 0 0 16px; }
        .error-icon svg { width: 100%; height: 100%; }

        .copyright { margin-top: 20px; color: #a5a9b2; font-size: 9px; font-weight: 500; letter-spacing: 0.01em; }

        @keyframes heroIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 950px) {
          .login-main { grid-template-columns: 1fr; gap: 45px; padding: 55px 0 70px; }
          .hero-section { max-width: 650px; margin: auto; text-align: center; }
          .hero-description { margin-left: auto; margin-right: auto; }
          .features { margin-left: auto; margin-right: auto; text-align: left; }
          .login-section { width: 100%; }
        }

        @media (max-width: 600px) {
          .topbar { height: 66px; padding: 0 20px; }
          .topbar-status { display: none; }
          .login-main { width: min(100% - 30px, 500px); padding: 40px 0 55px; }
          .hero-section h1 { font-size: 43px; }
          .hero-description { font-size: 14px; }
          .features { margin-top: 25px; }
          .login-card { padding: 28px 22px; border-radius: 20px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-section, .login-card { animation: none; }
          .feature-card, .google-button, .arrow-icon { transition: none; }
        }
      `}</style>
    </div>
  );
}
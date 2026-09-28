import { useEffect, useState } from 'react';
import { gmailAPI } from '../api/client';

export default function EmailReplyForm({ email, userId, onReplySuccess }) {
  const [replyText, setReplyText] = useState(email.aiGeneratedReply || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Synchronise le textarea lorsque la réponse IA est générée/modifiée
  useEffect(() => {
    setReplyText(email.aiGeneratedReply || '');
  }, [email.aiGeneratedReply]);

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      setError('La réponse ne peut pas être vide');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await gmailAPI.sendReply(
        email.id,
        userId,
        replyText
      );

      if (response.success) {
        setSuccess(true);

        setTimeout(() => {
          setReplyText('');
          onReplySuccess?.();
        }, 2000);
      } else {
        setError(response.message || "Impossible d'envoyer la réponse");
      }
    } catch (err) {
      setError(
        "Erreur lors de l'envoi : " +
        (err.message || "Une erreur est survenue")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();

      if (!loading && replyText.trim()) {
        handleSendReply();
      }
    }
  };

  return (
    <div className="reply-form">
      <div className="reply-header">
        <div className="reply-title-wrapper">
          <div className="reply-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>

          <div>
            <h3>Votre réponse</h3>
            <p>Modifiez le message avant de l'envoyer</p>
          </div>
        </div>

        {email.aiGeneratedReply && (
          <span className="ai-badge">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
              <path d="M19 16l.7 1.8L21.5 18l-1.8.7L19 20.5l-.7-1.8-1.8-.7 1.8-.7L19 16z" />
            </svg>
            Générée par IA
          </span>
        )}
      </div>

      <div className="editor-container">
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Rédigez votre réponse..."
          disabled={loading || success}
          className="reply-textarea"
        />

        <div className="editor-footer">
          <span className="character-count">
            {replyText.length.toLocaleString('fr-FR')} caractères
          </span>

          <span className="shortcut">
            <kbd>Ctrl</kbd>
            <span>+</span>
            <kbd>Enter</kbd>
            <span>pour envoyer</span>
          </span>
        </div>
      </div>

      {error && (
        <div className="message-box error-box">
          <div className="message-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="message-box success-box">
          <div className="message-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <span>Votre réponse a été envoyée avec succès.</span>
        </div>
      )}

      <div className="reply-actions">
        <div className="security-note">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>

          <span>Envoi sécurisé via Gmail</span>
        </div>

        <button
          type="button"
          onClick={handleSendReply}
          disabled={loading || success || !replyText.trim()}
          className="send-button"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Envoi en cours...
            </>
          ) : success ? (
            <>
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Envoyée
            </>
          ) : (
            <>
              Envoyer la réponse

              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </>
          )}
        </button>
      </div>

      <style>{`
        .reply-form {
          width: 100%;
          margin-top: 24px;
          padding: 24px;
          background: #ffffff;
          border: 1px solid #e7e9ee;
          border-radius: 18px;
          box-shadow:
            0 1px 2px rgba(16, 24, 40, 0.02),
            0 8px 30px rgba(16, 24, 40, 0.04);
          box-sizing: border-box;
        }

        .reply-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 18px;
        }

        .reply-title-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .reply-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #635bff;
          background: linear-gradient(
            135deg,
            rgba(99, 91, 255, 0.12),
            rgba(139, 92, 246, 0.12)
          );
          border: 1px solid rgba(99, 91, 255, 0.12);
          border-radius: 11px;
        }

        .reply-title-wrapper h3 {
          margin: 0;
          color: #171923;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .reply-title-wrapper p {
          margin: 3px 0 0;
          color: #969daa;
          font-size: 12px;
          line-height: 1.4;
        }

        .ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border-radius: 8px;
          color: #635bff;
          background: rgba(99, 91, 255, 0.07);
          border: 1px solid rgba(99, 91, 255, 0.12);
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .editor-container {
          overflow: hidden;
          border: 1px solid #e3e5ea;
          border-radius: 13px;
          background: #ffffff;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .editor-container:focus-within {
          border-color: rgba(99, 91, 255, 0.55);
          box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.08);
        }

        .reply-textarea {
          display: block;
          width: 100%;
          min-height: 170px;
          padding: 17px 18px;
          box-sizing: border-box;
          resize: vertical;
          border: none;
          outline: none;
          background: #ffffff;
          color: #272a35;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.7;
        }

        .reply-textarea::placeholder {
          color: #a5a9b2;
        }

        .reply-textarea:disabled {
          background: #fafbfc;
          cursor: not-allowed;
        }

        .editor-footer {
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px 0 18px;
          border-top: 1px solid #eef0f3;
          background: #fafbfc;
        }

        .character-count {
          color: #9aa0aa;
          font-size: 11px;
        }

        .shortcut {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #a0a5ae;
          font-size: 10px;
        }

        .shortcut kbd {
          min-width: 24px;
          padding: 3px 5px;
          text-align: center;
          color: #707580;
          background: #ffffff;
          border: 1px solid #dfe2e7;
          border-bottom-width: 2px;
          border-radius: 5px;
          font-family: inherit;
          font-size: 9px;
          font-weight: 600;
        }

        .message-box {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 12px;
          padding: 11px 13px;
          border-radius: 10px;
          font-size: 12px;
          line-height: 1.4;
        }

        .message-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .error-box {
          color: #b42318;
          background: #fff5f4;
          border: 1px solid #fecdca;
        }

        .success-box {
          color: #087443;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
        }

        .reply-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 17px;
        }

        .security-note {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #969daa;
          font-size: 11px;
        }

        .security-note svg {
          color: #8b93a1;
        }

        .send-button {
          min-width: 160px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 17px;
          border: none;
          border-radius: 10px;
          color: #ffffff;
          background: linear-gradient(
            135deg,
            #635bff 0%,
            #765cf6 55%,
            #8b5cf6 100%
          );
          box-shadow:
            0 4px 12px rgba(99, 91, 255, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.18);
          font-family: inherit;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            opacity 0.18s ease;
        }

        .send-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow:
            0 7px 18px rgba(99, 91, 255, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.18);
        }

        .send-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .send-button:disabled {
          opacity: 0.48;
          cursor: not-allowed;
          box-shadow: none;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: reply-spin 0.7s linear infinite;
        }

        @keyframes reply-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 640px) {
          .reply-form {
            padding: 18px;
            border-radius: 15px;
          }

          .reply-header {
            align-items: flex-start;
            flex-direction: column;
            gap: 12px;
          }

          .ai-badge {
            margin-left: 50px;
          }

          .editor-footer {
            height: auto;
            min-height: 40px;
            padding: 8px 12px;
          }

          .shortcut {
            display: none;
          }

          .reply-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .security-note {
            justify-content: center;
          }

          .send-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
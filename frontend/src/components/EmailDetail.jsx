import { useState } from 'react';
import { aiAPI } from '../api/client';
import EmailReplyForm from './EmailReplyForm';
import SentimentBadge from './SentimentBadge';
import PriorityBadge from './PriorityBadge';

export default function EmailDetail({
  email,
  userId,
  onBack,
  onReplySuccess,
  onStarChange,
}) {
  const [analysis, setAnalysis] = useState(() => {
    if (!email?.aiAnalysis) return null;

    try {
      return typeof email.aiAnalysis === 'string'
        ? JSON.parse(email.aiAnalysis)
        : email.aiAnalysis;
    } catch {
      return null;
    }
  });

  const [generatedReply, setGeneratedReply] = useState(
    email?.aiGeneratedReply || ''
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [isStarred, setIsStarred] = useState(
    email?.starred || false
  );

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await aiAPI.analyzeEmail(
        email.id,
        'professional'
      );

      console.log('Analysis response:', response);

      const analysisData =
        response?.data?.analysis ||
        response?.analysis ||
        response;

      setAnalysis(analysisData);
    } catch (error) {
      console.error(
        'Erreur analyse:',
        error
      );

      setError(
        "Erreur lors de l'analyse : " +
        (
          error.response?.data?.message ||
          error.message
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReply = async () => {
    try {
      setLoading(true);
      setError('');

      const response =
        await aiAPI.generateReply(
          email.id,
          'professional',
          'french'
        );

      let replyText = '';

      if (response?.data) {

        if (response.data.ai_generated_reply) {
          replyText = String(
            response.data.ai_generated_reply
          );
        } else if (
          response.data.aiGeneratedReply
        ) {
          replyText = String(
            response.data.aiGeneratedReply
          );
        } else if (response.data.reply) {
          replyText = String(
            response.data.reply
          );
        } else {
          const keys = Object.keys(
            response.data
          );

          const replyKey = keys.find((key) =>
            key.toLowerCase().includes('reply')
          );

          if (replyKey) {
            replyText = String(
              response.data[replyKey]
            );
          }
        }

      } else if (
        typeof response === 'string'
      ) {
        replyText = response;
      }

      replyText = String(
        replyText || ''
      );

      if (!replyText.trim()) {
        setError(
          'Réponse vide reçue du serveur'
        );
        return;
      }

      setGeneratedReply(replyText);

    } catch (error) {
      console.error(
        'Erreur génération:',
        error
      );

      setError(
        'Erreur lors de la génération : ' +
        (
          error.response?.data?.message ||
          error.message
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleStarred = async () => {
    const newStarredState = !isStarred;

    setIsStarred(newStarredState);

    // Mise à jour immédiate du Dashboard
    onStarChange?.(
      email.id,
      newStarredState
    );

    try {
      await fetch(
        '/api/gmail/mark-starred',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            emailId: email.id,
            starred: newStarredState,
          }),
        }
      );
    } catch (err) {
      console.error(
        'Star toggle error:',
        err
      );
    }
  };

  const senderInitial =
    (
      email?.senderName ||
      email?.senderEmail ||
      'U'
    )
      .charAt(0)
      .toUpperCase();

  const emailDate = email?.createdAt
    ? new Date(
        email.createdAt
      ).toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

  return (
    <div className="email-detail">

      {/* Header */}

      <div className="email-header">

        <div className="header-top">

          <div className="header-actions">

            <button
              type="button"
              className="back-button"
              onClick={onBack}
              title="Retour"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M19 12H5M12 19L5 12L12 5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span>Retour</span>
            </button>

            <button
              type="button"
              className={`star-button ${
                isStarred ? 'starred' : ''
              }`}
              onClick={toggleStarred}
              title={
                isStarred
                  ? 'Remove from starred'
                  : 'Add to starred'
              }
            >
              <svg
                viewBox="0 0 24 24"
                fill={
                  isStarred
                    ? 'currentColor'
                    : 'none'
                }
              >
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

          </div>

          <div className="header-status">
            <span className="status-dot" />
            AI Ready
          </div>

        </div>

        <div className="subject-row">

          <div className="subject-container">

            <span className="mail-label">
              {email?.direction === 'sent'
                ? 'SENT'
                : 'INBOX'}
            </span>

            <h1>
              {email?.subject ||
                '(No subject)'}
            </h1>

          </div>

        </div>

        <div className="sender-row">

          <div className="sender-avatar">
            {senderInitial}
          </div>

          <div className="sender-information">

            <div className="sender-name">
              {email?.senderName ||
                email?.senderEmail ||
                'Unknown sender'}
            </div>

            <div className="sender-email">
              {email?.senderEmail || ''}
            </div>

          </div>

          <div className="email-date">
            {emailDate}
          </div>

        </div>

      </div>

      {/* Email */}

      <div className="email-content">

        <div className="email-card">

          <div className="email-card-header">

            <span>
              Message
            </span>

            {isStarred && (
              <span className="starred-label">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                Starred
              </span>
            )}

          </div>

          <div
            className="email-body"
            dangerouslySetInnerHTML={{
              __html:
                email?.body ||
                '<p>No content</p>',
            }}
          />

        </div>

        {/* AI Panel */}

        <div className="ai-panel">

          <div className="ai-panel-header">

            <div className="ai-title-wrapper">

              <div className="ai-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 3L13.7 8.3L19 10L13.7 11.7L12 17L10.3 11.7L5 10L10.3 8.3L12 3Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />

                  <path
                    d="M19 16L19.7 18.3L22 19L19.7 19.7L19 22L18.3 19.7L16 19L18.3 18.3L19 16Z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <h2>
                  AI Assistant
                </h2>

                <p>
                  Analyse intelligente du message
                </p>
              </div>

            </div>

          </div>

          {error && (
            <div className="error-message">

              <svg
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />

                <path
                  d="M12 8V12"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />

                <circle
                  cx="12"
                  cy="16"
                  r="0.8"
                  fill="currentColor"
                />
              </svg>

              {error}

            </div>
          )}

          {analysis && (
            <div className="analysis-card">

              <div className="analysis-grid">

                <div className="analysis-item">
                  <span className="analysis-label">
                    Sentiment
                  </span>

                  <div>
                    <SentimentBadge
                      sentiment={
                        analysis.sentiment
                      }
                    />
                  </div>
                </div>

                <div className="analysis-item">
                  <span className="analysis-label">
                    Priorité
                  </span>

                  <div>
                    <PriorityBadge
                      priority={
                        analysis.priority
                      }
                    />
                  </div>
                </div>

                <div className="analysis-item">
                  <span className="analysis-label">
                    Confiance
                  </span>

                  <div className="confidence-wrapper">

                    <div className="confidence-value">
                      {Math.round(
                        Number(
                          analysis.confidence || 0
                        ) *
                          (
                            Number(
                              analysis.confidence
                            ) <= 1
                              ? 100
                              : 1
                          )
                      )}%
                    </div>

                    <div className="confidence-bar">
                      <div
                        className="confidence-progress"
                        style={{
                          width: `${
                            Math.min(
                              100,
                              Number(
                                analysis.confidence || 0
                              ) *
                                (
                                  Number(
                                    analysis.confidence
                                  ) <= 1
                                    ? 100
                                    : 1
                                )
                            )
                          }%`,
                        }}
                      />
                    </div>

                  </div>
                </div>

              </div>

              {analysis.summary && (
                <div className="summary">

                  <div className="summary-title">
                    Résumé
                  </div>

                  <p>
                    {analysis.summary}
                  </p>

                </div>
              )}

            </div>
          )}

          <div className="ai-actions">

            <button
              type="button"
              className="action-button analyze-button"
              onClick={handleAnalyze}
              disabled={loading}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M4 19L10 13L14 17L21 10"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M16 10H21V15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {loading
                ? 'Analyse...'
                : 'Analyser'}
            </button>

            <button
              type="button"
              className="action-button reply-button"
              onClick={handleGenerateReply}
              disabled={loading}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M21 11.5A8.5 8.5 0 0 1 12.5 20C10.9 20 9.4 19.6 8.1 18.9L3 21L4.9 15.9C4.2 14.6 3.8 13.1 3.8 11.5A8.5 8.5 0 0 1 12.3 3H13C17.4 3 21 6.6 21 11V11.5Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {loading
                ? 'Génération...'
                : 'Générer une réponse'}
            </button>

          </div>

        </div>

        {/* Reply */}

        {generatedReply && (
          <div className="reply-section">

            <div className="reply-preview">

              <div className="reply-preview-header">
                <span>
                  Réponse générée
                </span>

                <span>
                  IA
                </span>
              </div>

              <p>
                {generatedReply}
              </p>

            </div>

          </div>
        )}

        <div className="reply-form-wrapper">

          <EmailReplyForm
            email={{
              ...email,
              aiGeneratedReply:
                generatedReply,
            }}
            userId={userId}
            onReplySuccess={onReplySuccess}
          />

        </div>

      </div>

      <style>{`
        .email-detail {
          flex: 1;
          min-width: 0;
          min-height: 0;
          overflow-y: auto;
          background:
            radial-gradient(
              circle at 80% 0%,
              rgba(99,91,255,0.035),
              transparent 28%
            ),
            #f7f8fb;
        }

        .email-header {
          padding: 20px 28px 18px;
          background: rgba(255,255,255,0.86);
          border-bottom: 1px solid #e7e9ee;
          backdrop-filter: blur(16px);
        }

        .header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .back-button,
        .star-button {
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          color: #747a85;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .back-button {
          gap: 7px;
          padding: 0 9px;
          font-size: 11px;
          font-weight: 550;
        }

        .back-button svg {
          width: 16px;
          height: 16px;
        }

        .back-button:hover {
          color: #635bff;
          background: rgba(99,91,255,0.06);
          border-color: rgba(99,91,255,0.12);
        }

        .star-button {
          width: 34px;
        }

        .star-button svg {
          width: 18px;
          height: 18px;
        }

        .star-button:hover {
          color: #f59e0b;
          background: rgba(245,158,11,0.07);
          border-color: rgba(245,158,11,0.15);
        }

        .star-button.starred {
          color: #f59e0b;
        }

        .header-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 8px;
          border: 1px solid #e6e9ed;
          border-radius: 7px;
          color: #7f8691;
          background: #fafbfc;
          font-size: 9px;
          font-weight: 600;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.08);
        }

        .subject-row {
          margin-top: 21px;
        }

        .mail-label {
          display: inline-flex;
          padding: 4px 7px;
          border-radius: 5px;
          color: #635bff;
          background: rgba(99,91,255,0.07);
          font-size: 8px;
          font-weight: 750;
          letter-spacing: 0.08em;
        }

        .subject-container h1 {
          margin: 8px 0 0;
          color: #171923;
          font-size: 22px;
          line-height: 1.25;
          font-weight: 750;
          letter-spacing: -0.03em;
        }

        .sender-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 18px;
        }

        .sender-avatar {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 50%;
          color: #fff;
          background: linear-gradient(135deg,#635bff,#8b5cf6);
          font-size: 12px;
          font-weight: 700;
        }

        .sender-information {
          min-width: 0;
          flex: 1;
        }

        .sender-name {
          color: #363a45;
          font-size: 11px;
          font-weight: 650;
        }

        .sender-email {
          margin-top: 2px;
          overflow: hidden;
          color: #9ba0aa;
          font-size: 9px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .email-date {
          color: #a0a5ae;
          font-size: 9px;
          white-space: nowrap;
        }

        .email-content {
          max-width: 1000px;
          margin: 0 auto;
          padding: 25px 28px 50px;
        }

        .email-card {
          overflow: hidden;
          background: #fff;
          border: 1px solid #e7e9ee;
          border-radius: 15px;
          box-shadow:
            0 1px 2px rgba(16,24,40,0.02),
            0 8px 28px rgba(16,24,40,0.025);
        }

        .email-card-header {
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 17px;
          border-bottom: 1px solid #eef0f3;
          color: #858b95;
          font-size: 10px;
          font-weight: 600;
        }

        .starred-label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #f59e0b;
          font-size: 9px;
        }

        .starred-label svg {
          width: 11px;
          height: 11px;
        }

        .email-body {
          padding: 23px;
          color: #454a55;
          font-size: 13px;
          line-height: 1.75;
          overflow-wrap: anywhere;
        }

        .email-body p {
          margin: 0 0 12px;
        }

        .email-body p:last-child {
          margin-bottom: 0;
        }

        .ai-panel {
          margin-top: 18px;
          padding: 19px;
          background: #fff;
          border: 1px solid #e7e9ee;
          border-radius: 15px;
          box-shadow:
            0 1px 2px rgba(16,24,40,0.02),
            0 8px 28px rgba(16,24,40,0.025);
        }

        .ai-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ai-title-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ai-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #635bff;
          background: linear-gradient(
            135deg,
            rgba(99,91,255,0.09),
            rgba(139,92,246,0.1)
          );
          border: 1px solid rgba(99,91,255,0.1);
          border-radius: 9px;
        }

        .ai-icon svg {
          width: 17px;
          height: 17px;
        }

        .ai-title-wrapper h2 {
          margin: 0;
          color: #272a35;
          font-size: 13px;
          font-weight: 700;
        }

        .ai-title-wrapper p {
          margin: 2px 0 0;
          color: #9aa0aa;
          font-size: 9px;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 14px;
          padding: 9px 11px;
          border: 1px solid #fecdca;
          border-radius: 8px;
          color: #b42318;
          background: #fff5f4;
          font-size: 10px;
        }

        .error-message svg {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }

        .analysis-card {
          margin-top: 17px;
          padding: 14px;
          border: 1px solid #eef0f3;
          border-radius: 11px;
          background: #fafbfc;
        }

        .analysis-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .analysis-item {
          padding: 11px;
          background: #fff;
          border: 1px solid #eef0f3;
          border-radius: 9px;
        }

        .analysis-label {
          display: block;
          margin-bottom: 7px;
          color: #969daa;
          font-size: 9px;
          font-weight: 600;
        }

        .confidence-wrapper {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .confidence-value {
          color: #3c404b;
          font-size: 11px;
          font-weight: 700;
        }

        .confidence-bar {
          width: 100%;
          height: 4px;
          overflow: hidden;
          border-radius: 99px;
          background: #e8eaf0;
        }

        .confidence-progress {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            #635bff,
            #8b5cf6
          );
          transition: width 0.3s ease;
        }

        .summary {
          margin-top: 12px;
          padding-top: 13px;
          border-top: 1px solid #e9ebef;
        }

        .summary-title {
          color: #3c404b;
          font-size: 10px;
          font-weight: 700;
        }

        .summary p {
          margin: 6px 0 0;
          color: #777d88;
          font-size: 11px;
          line-height: 1.6;
        }

        .ai-actions {
          display: flex;
          gap: 9px;
          margin-top: 14px;
        }

        .action-button {
          height: 37px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 13px;
          border-radius: 8px;
          font-family: inherit;
          font-size: 10px;
          font-weight: 650;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .action-button svg {
          width: 14px;
          height: 14px;
        }

        .analyze-button {
          border: 1px solid #e0e3e8;
          background: #fff;
          color: #606671;
        }

        .analyze-button:hover:not(:disabled) {
          border-color: rgba(99,91,255,0.25);
          color: #635bff;
          background: rgba(99,91,255,0.04);
        }

        .reply-button {
          border: none;
          color: #fff;
          background: linear-gradient(
            135deg,
            #635bff,
            #8b5cf6
          );
          box-shadow: 0 4px 12px rgba(99,91,255,0.17);
        }

        .reply-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 7px 18px rgba(99,91,255,0.24);
        }

        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .reply-section {
          margin-top: 18px;
        }

        .reply-preview {
          padding: 15px;
          background: #fff;
          border: 1px solid #e7e9ee;
          border-radius: 13px;
        }

        .reply-preview-header {
          display: flex;
          justify-content: space-between;
          padding-bottom: 10px;
          border-bottom: 1px solid #eef0f3;
          color: #858b95;
          font-size: 10px;
          font-weight: 650;
        }

        .reply-preview-header span:last-child {
          padding: 3px 6px;
          border-radius: 5px;
          color: #635bff;
          background: rgba(99,91,255,0.07);
          font-size: 8px;
        }

        .reply-preview p {
          margin: 13px 0 0;
          color: #555a65;
          font-size: 11px;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        .reply-form-wrapper {
          margin-top: 18px;
        }

        @media (max-width: 700px) {
          .email-header {
            padding: 16px;
          }

          .email-content {
            padding: 16px;
          }

          .subject-container h1 {
            font-size: 18px;
          }

          .analysis-grid {
            grid-template-columns: 1fr;
          }

          .email-date {
            display: none;
          }

          .ai-actions {
            flex-direction: column;
          }

          .action-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
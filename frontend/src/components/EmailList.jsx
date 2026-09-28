import { convert } from 'html-to-text';

export default function EmailList({
  emails,
  selectedEmail,
  onSelectEmail,
  loading,
  activeTab,
}) {
  const formatDate = (date) => {
    if (!date) return '';

    const d = new Date(date);
    const today = new Date();

    const isToday =
      d.toDateString() === today.toDateString();

    if (isToday) {
      return d.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return d.toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const unreadCount = emails.filter(
    (email) => !email.isRead
  ).length;

  const getTitle = () => {
    if (activeTab === 'sent') return 'Sent';
    if (activeTab === 'starred') return 'Starred';
    return 'Inbox';
  };

  return (
    <div className="email-list">

      {/* Header */}

      <div className="email-list-header">

        <div>
          <h2>{getTitle()}</h2>

          <p>
            {emails.length}{' '}
            {emails.length === 1
              ? 'email'
              : 'emails'}

            {unreadCount > 0 && (
              <span className="unread-summary">
                {unreadCount} non lu
                {unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>

        <div className="email-count">
          {emails.length}
        </div>

      </div>

      {/* Loading */}

      {loading && emails.length === 0 && (
        <div className="email-list-state">

          <div className="loading-spinner" />

          <span>
            Chargement des emails...
          </span>

        </div>
      )}

      {/* Empty */}

      {!loading && emails.length === 0 && (
        <div className="email-list-state">

          <div className="empty-mail-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
              />
              <path d="M3 7L12 13L21 7" />
            </svg>
          </div>

          <strong>Aucun email</strong>

          <span>
            Synchronisez votre boîte Gmail
            pour charger vos messages.
          </span>

        </div>
      )}

      {/* Email list */}

      {emails.length > 0 && (
        <div className="emails-scroll">

          {emails.map((email) => {

            const isSelected =
              selectedEmail?.id === email.id;

            const isUnread = !email.isRead;

            let preview = '';

            try {
              preview = convert(
                email.body || ''
              );
            } catch {
              preview = email.body || '';
            }

            preview = preview
              .replace(/\s+/g, ' ')
              .trim()
              .substring(0, 120);

            return (
              <button
                key={email.id}
                type="button"
                className={`email-item ${
                  isSelected ? 'selected' : ''
                } ${isUnread ? 'unread' : 'read'}`}
                onClick={() =>
                  onSelectEmail(email)
                }
              >

                <div className="email-item-main">

                  {/* Sender */}

                  <div className="email-item-top">

                    <div
                      className={`sender-name ${
                        isUnread ? 'sender-unread' : ''
                      }`}
                    >
                      {email.senderName ||
                        email.senderEmail ||
                        'Unknown sender'}
                    </div>

                    <div className="email-date">
                      {formatDate(email.createdAt)}
                    </div>

                  </div>

                  {/* Subject */}

                  <div
                    className={`email-subject ${
                      isUnread
                        ? 'subject-unread'
                        : ''
                    }`}
                  >
                    {email.subject ||
                      '(No subject)'}
                  </div>

                  {/* Preview */}

                  <div className="email-preview">
                    {preview || 'No preview available'}
                  </div>

                </div>

                {/* Right indicators */}

                <div className="email-indicators">

                  {email.starred && (
                    <svg
                      className="star-indicator"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  )}

                  {isUnread && (
                    <span className="unread-dot" />
                  )}

                </div>

              </button>
            );
          })}

        </div>
      )}

      <style>{`
        .email-list {
          width: 350px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #fff;
          border-right: 1px solid #e7e9ee;
        }

        .email-list-header {
          min-height: 76px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 15px 17px;
          background: rgba(255,255,255,0.96);
          border-bottom: 1px solid #eef0f3;
        }

        .email-list-header h2 {
          margin: 0;
          color: #171923;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.015em;
        }

        .email-list-header p {
          margin: 4px 0 0;
          color: #9a9fa9;
          font-size: 10px;
        }

        .unread-summary {
          margin-left: 8px;
          color: #635bff;
          font-weight: 650;
        }

        .email-count {
          min-width: 27px;
          height: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 7px;
          border-radius: 7px;
          color: #635bff;
          background: rgba(99,91,255,0.07);
          border: 1px solid rgba(99,91,255,0.1);
          font-size: 10px;
          font-weight: 700;
        }

        .emails-scroll {
          flex: 1;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #dfe2e7 transparent;
        }

        .email-item {
          width: 100%;
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 14px 14px 13px 17px;
          border: none;
          border-bottom: 1px solid #f0f1f4;
          border-left: 3px solid transparent;
          outline: none;
          background: #fff;
          color: inherit;
          font-family: inherit;
          text-align: left;
          cursor: pointer;
          transition:
            background 0.15s ease,
            border-color 0.15s ease;
        }

        .email-item:hover {
          background: #fafbfc;
        }

        .email-item.selected {
          background: rgba(99,91,255,0.055);
          border-left-color: #635bff;
        }

        .email-item.read {
          opacity: 0.78;
        }

        .email-item.unread {
          opacity: 1;
        }

        .email-item-main {
          flex: 1;
          min-width: 0;
        }

        .email-item-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .sender-name {
          min-width: 0;
          overflow: hidden;
          color: #454a55;
          font-size: 12px;
          font-weight: 550;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sender-unread {
          color: #20232c;
          font-weight: 700;
        }

        .email-date {
          flex-shrink: 0;
          color: #a7acb5;
          font-size: 9px;
          font-weight: 500;
          white-space: nowrap;
        }

        .email-subject {
          margin-top: 5px;
          overflow: hidden;
          color: #777d88;
          font-size: 11px;
          font-weight: 500;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .subject-unread {
          color: #373b46;
          font-weight: 650;
        }

        .email-preview {
          display: -webkit-box;
          margin-top: 5px;
          overflow: hidden;
          color: #a2a7b0;
          font-size: 10px;
          line-height: 1.5;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .email-indicators {
          min-width: 9px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 7px;
          padding-top: 2px;
        }

        .unread-dot {
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #635bff;
          box-shadow: 0 0 0 3px rgba(99,91,255,0.08);
        }

        .star-indicator {
          width: 12px;
          height: 12px;
          color: #f59e0b;
        }

        .email-list-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 30px;
          color: #9aa0aa;
          text-align: center;
          font-size: 11px;
        }

        .email-list-state strong {
          color: #555b66;
          font-size: 12px;
        }

        .email-list-state span {
          max-width: 190px;
          line-height: 1.5;
        }

        .empty-mail-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
          color: #635bff;
          background: rgba(99,91,255,0.07);
          border-radius: 14px;
        }

        .empty-mail-icon svg {
          width: 22px;
          height: 22px;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #e7e9ee;
          border-top-color: #635bff;
          border-radius: 50%;
          animation: email-list-spin 0.7s linear infinite;
        }

        @keyframes email-list-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .email-list {
            width: 310px;
          }
        }

        @media (max-width: 640px) {
          .email-list {
            width: 100%;
            border-right: none;
          }
        }
      `}</style>
    </div>
  );
}
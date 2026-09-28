import { useState, useEffect } from 'react';
import { gmailAPI } from '../api/client';
import EmailList from '../components/EmailList';
import EmailDetail from '../components/EmailDetail';

export default function DashboardPage() {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('inbox');

  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName') || 'User';

  useEffect(() => {
    if (userId) {
      fetchEmails();
    }
  }, [userId]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await gmailAPI.getEmails(userId);

      const emailsData = Array.isArray(response)
        ? response
        : response?.data || [];

      setEmails(emailsData);
    } catch (error) {
      console.error('Erreur fetch emails:', error);
      setError('Erreur lors du chargement des emails');
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setLoading(true);
      setError('');

      await gmailAPI.syncEmails(userId);
      await fetchEmails();
    } catch (error) {
      console.error('Erreur sync:', error);
      setError('Erreur lors de la synchronisation');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmail = (email) => {
    setSelectedEmail(email);
  };

  const handleBack = () => {
    setSelectedEmail(null);
  };

  const handleReplySuccess = () => {
    fetchEmails();
    setSelectedEmail(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  // Mise à jour immédiate du Star dans la liste
  const handleStarChange = (emailId, starred) => {
    setEmails((currentEmails) =>
      currentEmails.map((email) =>
        email.id === emailId
          ? { ...email, starred }
          : email
      )
    );

    setSelectedEmail((currentEmail) =>
      currentEmail && currentEmail.id === emailId
        ? { ...currentEmail, starred }
        : currentEmail
    );
  };

  // Sauvegarde Settings
  const handleSettingsChange = (key, value) => {
    const currentSettings = JSON.parse(
      localStorage.getItem('settings') || '{}'
    );

    const newSettings = {
      ...currentSettings,
      [key]: value,
    };

    localStorage.setItem(
      'settings',
      JSON.stringify(newSettings)
    );
  };

  // Filtrage des emails selon l'onglet
  const filteredEmails = emails.filter((email) => {
    if (activeTab === 'sent') {
      return email.direction === 'sent';
    }

    if (activeTab === 'starred') {
      return email.starred === true;
    }

    return true;
  });

  const unreadCount = filteredEmails.filter(
    (email) => !email.isRead
  ).length;

  return (
    <div className="dashboard-container">

      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedEmail(null);
        }}
        onLogout={handleLogout}
        userName={userName}
        unreadCount={unreadCount}
      />

      <div className="dashboard-main">

        <Topbar
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onSync={handleSync}
          loading={loading}
          error={error}
          activeTab={activeTab}
        />

        <div className="dashboard-content">

          {activeTab === 'settings' ? (

            <SettingsPage
              onSettingsChange={handleSettingsChange}
            />

          ) : selectedEmail ? (

            <EmailDetail
              email={selectedEmail}
              userId={userId}
              onBack={handleBack}
              onReplySuccess={handleReplySuccess}
              onStarChange={handleStarChange}
            />

          ) : (

            <>
              <EmailList
                emails={filteredEmails}
                selectedEmail={selectedEmail}
                onSelectEmail={handleSelectEmail}
                loading={loading}
                activeTab={activeTab}
              />

              {filteredEmails.length === 0 && !loading && (
                <div className="empty-state">

                  <div className="empty-state-icon">
                    <svg
                      width="42"
                      height="42"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16v16H4z" />
                      <path d="M4 7l8 6 8-6" />
                    </svg>
                  </div>

                  <h3>
                    {activeTab === 'starred'
                      ? 'Aucun email favori'
                      : activeTab === 'sent'
                        ? 'Aucun email envoyé'
                        : 'Aucun email'}
                  </h3>

                  <p>
                    {activeTab === 'starred'
                      ? 'Les emails que vous ajoutez aux favoris apparaîtront ici.'
                      : 'Synchronisez votre boîte Gmail pour charger vos emails.'}
                  </p>

                  {activeTab !== 'starred' && (
                    <button
                      className="empty-sync-button"
                      onClick={handleSync}
                      disabled={loading}
                    >
                      <SyncIcon />
                      Synchroniser les emails
                    </button>
                  )}

                </div>
              )}
            </>
          )}

        </div>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .dashboard-container {
          display: flex;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          background: #f7f8fb;
          color: #171923;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            sans-serif;
        }

        .dashboard-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .dashboard-content {
          flex: 1;
          min-height: 0;
          display: flex;
          overflow: hidden;
          position: relative;
        }

        .empty-state {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
          background: #ffffff;
        }

        .empty-state-icon {
          width: 76px;
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          color: #635bff;
          background:
            linear-gradient(
              135deg,
              rgba(99, 91, 255, 0.09),
              rgba(139, 92, 246, 0.09)
            );
          border: 1px solid rgba(99, 91, 255, 0.12);
          border-radius: 22px;
        }

        .empty-state h3 {
          margin: 0;
          color: #171923;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .empty-state p {
          max-width: 420px;
          margin: 8px 0 22px;
          color: #8b919d;
          font-size: 13px;
          line-height: 1.6;
        }

        .empty-sync-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 40px;
          padding: 0 16px;
          border: none;
          border-radius: 9px;
          color: #fff;
          background: linear-gradient(135deg, #635bff, #8b5cf6);
          font-family: inherit;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          box-shadow: 0 5px 16px rgba(99, 91, 255, 0.2);
          transition: all 0.2s ease;
        }

        .empty-sync-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(99, 91, 255, 0.26);
        }

        .empty-sync-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .dashboard-container {
            position: relative;
          }

          .dashboard-content {
            overflow: auto;
          }
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function SettingsPage({ onSettingsChange }) {
  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('settings') ||
        '{"autoSync":true,"syncInterval":"15","aiTone":"professional","notificationsEnabled":true}'
      );
    } catch {
      return {
        autoSync: true,
        syncInterval: '15',
        aiTone: 'professional',
        notificationsEnabled: true,
      };
    }
  });

  const handleChange = (key, value) => {
    const newSettings = {
      ...settings,
      [key]: value,
    };

    setSettings(newSettings);
    onSettingsChange(key, value);
  };

  return (
    <div className="settings-page">

      <div className="settings-container">

        <div className="settings-heading">
          <div>
            <div className="settings-eyebrow">
              PREFERENCES
            </div>

            <h1>Settings</h1>

            <p>
              Manage your Gmail AI preferences and
              synchronization options.
            </p>
          </div>
        </div>

        {/* Email Sync */}

        <SettingsCard
          icon={<SyncIcon />}
          title="Email Sync"
          description="Control how Gmail AI synchronizes your mailbox."
        >

          <SettingToggle
            checked={settings.autoSync}
            onChange={(value) =>
              handleChange('autoSync', value)
            }
            title="Auto-sync emails"
            description="Automatically synchronize new emails."
          />

          <SettingSelect
            label="Sync interval"
            value={settings.syncInterval}
            onChange={(value) =>
              handleChange('syncInterval', value)
            }
            options={[
              ['5', 'Every 5 minutes'],
              ['15', 'Every 15 minutes'],
              ['30', 'Every 30 minutes'],
              ['60', 'Every hour'],
            ]}
          />

        </SettingsCard>

        {/* AI */}

        <SettingsCard
          icon={<SparklesIcon />}
          title="AI Preferences"
          description="Customize how Gmail AI analyzes and generates replies."
        >

          <SettingSelect
            label="Default reply tone"
            value={settings.aiTone}
            onChange={(value) =>
              handleChange('aiTone', value)
            }
            options={[
              ['professional', 'Professional'],
              ['friendly', 'Friendly'],
              ['formal', 'Formal'],
            ]}
          />

          <SettingToggle
            checked={settings.notificationsEnabled}
            onChange={(value) =>
              handleChange(
                'notificationsEnabled',
                value
              )
            }
            title="AI analysis notifications"
            description="Receive notifications when AI analysis is available."
          />

        </SettingsCard>

        {/* About */}

        <SettingsCard
          icon={<InfoIcon />}
          title="About"
          description="Information about your Gmail AI application."
        >

          <div className="about-content">
            <div className="about-logo">
              <svg
                viewBox="0 0 48 48"
                fill="none"
              >
                <rect
                  x="4"
                  y="4"
                  width="40"
                  height="40"
                  rx="12"
                  fill="url(#aboutGradient)"
                />

                <path
                  d="M12.5 17.5L24 27L35.5 17.5"
                  stroke="white"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M12.5 17.5V31.5C12.5 32.6046 13.3954 33.5 14.5 33.5H33.5C34.6046 33.5 35.5 32.6046 35.5 31.5V17.5"
                  stroke="white"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />

                <defs>
                  <linearGradient
                    id="aboutGradient"
                    x1="6"
                    y1="6"
                    x2="42"
                    y2="42"
                  >
                    <stop stopColor="#635BFF" />
                    <stop
                      offset="1"
                      stopColor="#8B5CF6"
                    />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div>
              <strong>Gmail AI</strong>
              <span>Version 1.0</span>
              <span>Powered by Gemini AI</span>
              <span>© 2026 Gmail AI Agent</span>
            </div>
          </div>

        </SettingsCard>

      </div>

      <style>{`
        .settings-page {
          flex: 1;
          overflow-y: auto;
          background:
            radial-gradient(
              circle at 70% 10%,
              rgba(99, 91, 255, 0.045),
              transparent 30%
            ),
            #f7f8fb;
          padding: 40px 32px 60px;
        }

        .settings-container {
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
        }

        .settings-eyebrow {
          margin-bottom: 8px;
          color: #635bff;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 0.12em;
        }

        .settings-heading h1 {
          margin: 0;
          color: #171923;
          font-size: 30px;
          font-weight: 750;
          letter-spacing: -0.035em;
        }

        .settings-heading p {
          margin: 8px 0 0;
          color: #8b919d;
          font-size: 13px;
          line-height: 1.6;
        }

        .settings-card {
          margin-top: 22px;
          padding: 23px;
          background: #fff;
          border: 1px solid #e7e9ee;
          border-radius: 17px;
          box-shadow:
            0 1px 2px rgba(16, 24, 40, 0.02),
            0 8px 28px rgba(16, 24, 40, 0.025);
        }

        .settings-card-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding-bottom: 18px;
          border-bottom: 1px solid #eef0f3;
        }

        .settings-card-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #635bff;
          background: rgba(99, 91, 255, 0.08);
          border-radius: 10px;
        }

        .settings-card-icon svg {
          width: 17px;
          height: 17px;
        }

        .settings-card-header h2 {
          margin: 0;
          color: #171923;
          font-size: 14px;
          font-weight: 700;
        }

        .settings-card-header p {
          margin: 4px 0 0;
          color: #969daa;
          font-size: 11px;
          line-height: 1.5;
        }

        .setting-row {
          padding: 18px 0;
          border-bottom: 1px solid #f0f1f4;
        }

        .setting-row:last-child {
          padding-bottom: 0;
          border-bottom: none;
        }

        .setting-row:first-child {
          padding-top: 18px;
        }

        .setting-info {
          flex: 1;
          min-width: 0;
        }

        .setting-title {
          color: #272a35;
          font-size: 12px;
          font-weight: 650;
        }

        .setting-description {
          margin-top: 4px;
          color: #969daa;
          font-size: 11px;
          line-height: 1.5;
        }

        .toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .toggle {
          position: relative;
          width: 38px;
          height: 22px;
          flex-shrink: 0;
          border: none;
          border-radius: 99px;
          background: #dfe2e8;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .toggle.active {
          background: #635bff;
        }

        .toggle-dot {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.16);
          transition: transform 0.2s ease;
        }

        .toggle.active .toggle-dot {
          transform: translateX(16px);
        }

        .setting-select-label {
          display: block;
          margin-bottom: 8px;
          color: #272a35;
          font-size: 12px;
          font-weight: 650;
        }

        .setting-select {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border: 1px solid #e1e4e9;
          border-radius: 9px;
          outline: none;
          background: #fff;
          color: #3c404b;
          font-family: inherit;
          font-size: 12px;
          cursor: pointer;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .setting-select:focus {
          border-color: rgba(99, 91, 255, 0.55);
          box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.08);
        }

        .about-content {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-top: 18px;
        }

        .about-logo {
          width: 46px;
          height: 46px;
          flex-shrink: 0;
        }

        .about-logo svg {
          width: 100%;
          height: 100%;
        }

        .about-content strong,
        .about-content span {
          display: block;
        }

        .about-content strong {
          color: #272a35;
          font-size: 13px;
        }

        .about-content span {
          margin-top: 3px;
          color: #969daa;
          font-size: 11px;
        }

        @media (max-width: 640px) {
          .settings-page {
            padding: 28px 16px 40px;
          }

          .settings-heading h1 {
            font-size: 26px;
          }

          .settings-card {
            padding: 18px;
          }
        }
      `}</style>
    </div>
  );
}

function SettingsCard({ icon, title, description, children }) {
  return (
    <section className="settings-card">

      <div className="settings-card-header">

        <div className="settings-card-icon">
          {icon}
        </div>

        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

      </div>

      {children}

    </section>
  );
}

function SettingToggle({
  checked,
  onChange,
  title,
  description,
}) {
  return (
    <div className="setting-row toggle-row">

      <div className="setting-info">
        <div className="setting-title">
          {title}
        </div>

        <div className="setting-description">
          {description}
        </div>
      </div>

      <button
        type="button"
        className={`toggle ${checked ? 'active' : ''}`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        <span className="toggle-dot" />
      </button>

    </div>
  );
}

function SettingSelect({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div className="setting-row">

      <label className="setting-select-label">
        {label}
      </label>

      <select
        className="setting-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option
            key={optionValue}
            value={optionValue}
          >
            {optionLabel}
          </option>
        ))}
      </select>

    </div>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  open,
  onToggle,
  activeTab,
  onTabChange,
  onLogout,
  userName,
  unreadCount,
}) {
  return (
    <aside
      className={`sidebar ${!open ? 'closed' : ''}`}
    >

      <div className="sidebar-header">

        <div className="sidebar-logo">
          <svg
            viewBox="0 0 48 48"
            fill="none"
          >
            <rect
              x="4"
              y="4"
              width="40"
              height="40"
              rx="12"
              fill="url(#sidebarGradient)"
            />

            <path
              d="M12.5 17.5L24 27L35.5 17.5"
              stroke="white"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M12.5 17.5V31.5C12.5 32.6046 13.3954 33.5 14.5 33.5H33.5C34.6046 33.5 35.5 32.6046 35.5 31.5V17.5"
              stroke="white"
              strokeWidth="2.8"
              strokeLinecap="round"
            />

            <defs>
              <linearGradient
                id="sidebarGradient"
                x1="6"
                y1="6"
                x2="42"
                y2="42"
              >
                <stop stopColor="#635BFF" />
                <stop
                  offset="1"
                  stopColor="#8B5CF6"
                />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="sidebar-brand">
          <h1>Gmail AI</h1>
          <p>v1.0</p>
        </div>

      </div>

      <nav className="sidebar-nav">

        <SidebarItem
          icon={<InboxIcon />}
          label="Inbox"
          badge={unreadCount > 0 ? unreadCount : null}
          active={activeTab === 'inbox'}
          onClick={() => onTabChange('inbox')}
        />

        <SidebarItem
          icon={<SendIcon />}
          label="Sent"
          active={activeTab === 'sent'}
          onClick={() => onTabChange('sent')}
        />

        <SidebarItem
          icon={<StarIcon />}
          label="Starred"
          active={activeTab === 'starred'}
          onClick={() => onTabChange('starred')}
        />

        <div className="sidebar-divider" />

        <SidebarItem
          icon={<SettingsIcon />}
          label="Settings"
          active={activeTab === 'settings'}
          onClick={() => onTabChange('settings')}
        />

      </nav>

      <div className="sidebar-footer">

        <div className="user-card">

          <div className="user-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>

          <div className="user-info">
            <div className="user-name">
              {userName}
            </div>

            <div className="user-status">
              Online
            </div>
          </div>

        </div>

        <button
          className="sidebar-logout"
          onClick={onLogout}
        >
          <LogoutIcon />
          Logout
        </button>

      </div>

      <style>{`
        .sidebar {
          width: 260px;
          flex-shrink: 0;
          background: #ffffff;
          border-right: 1px solid #e7e9ee;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 40;
          transition: transform 0.25s ease;
          overflow-y: auto;
        }

        .sidebar.closed {
          transform: translateX(-100%);
          position: absolute;
          height: 100%;
        }

        .sidebar-header {
          padding: 22px;
          border-bottom: 1px solid #eef0f3;
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .sidebar-logo {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
        }

        .sidebar-logo svg {
          width: 100%;
          height: 100%;
        }

        .sidebar-brand h1 {
          margin: 0;
          color: #171923;
          font-size: 15px;
          font-weight: 750;
          letter-spacing: -0.02em;
        }

        .sidebar-brand p {
          margin: 2px 0 0;
          color: #969daa;
          font-size: 9px;
          font-weight: 650;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 13px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .sidebar-divider {
          height: 1px;
          margin: 8px 4px;
          background: #eef0f3;
        }

        .sidebar-footer {
          padding: 14px;
          border-top: 1px solid #eef0f3;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .user-card {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px;
          border-radius: 10px;
          background: #fafbfc;
          border: 1px solid #eef0f3;
        }

        .user-avatar {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 50%;
          color: #fff;
          background: linear-gradient(135deg, #635bff, #8b5cf6);
          font-size: 13px;
          font-weight: 700;
        }

        .user-info {
          min-width: 0;
          flex: 1;
        }

        .user-name {
          overflow: hidden;
          color: #272a35;
          font-size: 12px;
          font-weight: 650;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-status {
          margin-top: 2px;
          color: #969daa;
          font-size: 10px;
        }

        .sidebar-logout {
          width: 100%;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #e4e6ea;
          border-radius: 9px;
          background: #fff;
          color: #7c828d;
          font-family: inherit;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sidebar-logout svg {
          width: 14px;
          height: 14px;
        }

        .sidebar-logout:hover {
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.2);
          background: rgba(239, 68, 68, 0.04);
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 100%;
            position: fixed;
            inset: 0 auto 0 0;
          }

          .sidebar.closed {
            position: fixed;
          }
        }
      `}</style>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  badge,
  active,
  onClick,
}) {
  return (
    <button
      className={`sidebar-item ${active ? 'active' : ''}`}
      onClick={onClick}
      type="button"
    >
      <div className="sidebar-item-icon">
        {icon}
      </div>

      <span className="sidebar-item-label">
        {label}
      </span>

      {badge && (
        <span className="sidebar-item-badge">
          {badge}
        </span>
      )}

      <style>{`
        .sidebar-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 9px 10px;
          border: 1px solid transparent;
          border-radius: 9px;
          background: transparent;
          color: #777d88;
          font-family: inherit;
          font-size: 12px;
          font-weight: 550;
          text-align: left;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .sidebar-item:hover {
          color: #635bff;
          background: rgba(99, 91, 255, 0.055);
        }

        .sidebar-item.active {
          color: #635bff;
          background: rgba(99, 91, 255, 0.085);
          border-color: rgba(99, 91, 255, 0.13);
        }

        .sidebar-item-icon {
          width: 19px;
          height: 19px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sidebar-item-icon svg {
          width: 100%;
          height: 100%;
        }

        .sidebar-item-label {
          flex: 1;
        }

        .sidebar-item-badge {
          min-width: 19px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          border-radius: 5px;
          color: #fff;
          background: #635bff;
          font-size: 9px;
          font-weight: 700;
        }
      `}</style>
    </button>
  );
}

/* =========================================================
   TOPBAR
========================================================= */

function Topbar({
  onToggle,
  onSync,
  loading,
  error,
  activeTab,
}) {
  const titles = {
    inbox: 'Inbox',
    sent: 'Sent',
    starred: 'Starred',
    settings: 'Settings',
  };

  return (
    <>
      <div className="topbar">

        <div className="topbar-left">

          <button
            className="topbar-toggle"
            onClick={onToggle}
            type="button"
          >
            <MenuIcon />
          </button>

          <div>
            <h2>
              {titles[activeTab] || 'Inbox'}
            </h2>

            <span>
              {activeTab === 'settings'
                ? 'Application preferences'
                : 'Gmail workspace'}
            </span>
          </div>

        </div>

        {activeTab !== 'settings' && (
          <button
            className="sync-button"
            onClick={onSync}
            disabled={loading}
            type="button"
          >
            <SyncIcon />

            {loading
              ? 'Synchronizing...'
              : 'Sync emails'}
          </button>
        )}

      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <style>{`
        .topbar {
          height: 68px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 0 24px;
          background: rgba(255,255,255,0.82);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid #e7e9ee;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .topbar-left h2 {
          margin: 0;
          color: #171923;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.015em;
        }

        .topbar-left span {
          display: block;
          margin-top: 2px;
          color: #a0a5ae;
          font-size: 10px;
        }

        .topbar-toggle {
          width: 34px;
          height: 34px;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 1px solid #e1e4e9;
          border-radius: 9px;
          background: #fff;
          color: #777d88;
          cursor: pointer;
        }

        .topbar-toggle svg {
          width: 17px;
          height: 17px;
        }

        .sync-button {
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 13px;
          border: none;
          border-radius: 9px;
          color: #fff;
          background: linear-gradient(135deg, #635bff, #8b5cf6);
          font-family: inherit;
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(99,91,255,0.18);
          transition: all 0.18s ease;
        }

        .sync-button svg {
          width: 14px;
          height: 14px;
        }

        .sync-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 7px 17px rgba(99,91,255,0.24);
        }

        .sync-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .error-banner {
          padding: 9px 24px;
          color: #b42318;
          background: #fff5f4;
          border-bottom: 1px solid #fecdca;
          font-size: 11px;
        }

        @media (max-width: 768px) {
          .topbar {
            padding: 0 15px;
          }

          .topbar-toggle {
            display: flex;
          }

          .sync-button {
            padding: 0 10px;
          }
        }
      `}</style>
    </>
  );
}

/* =========================================================
   ICONS
========================================================= */

function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M4 5H20C21.1 5 22 5.9 22 7V17C22 18.1 21.1 19 20 19H4C2.9 19 2 18.1 2 17V7C2 5.9 2.9 5 4 5Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M2 7L12 14L22 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M22 2L11 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M22 2L15 22L11 13L2 9L22 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12 2V4M12 20V22M2 12H4M20 12H22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6H20M4 12H20M4 18H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M20 11A8 8 0 0 0 6.5 5.5L4 8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 4V8H8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 13A8 8 0 0 0 17.5 18.5L20 16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 20V16H16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M9 5H5C3.9 5 3 5.9 3 7V17C3 18.1 3.9 19 5 19H9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M14 8L18 12L14 16M18 12H8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
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
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12 11V16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="8"
        r="0.8"
        fill="currentColor"
      />
    </svg>
  );
}
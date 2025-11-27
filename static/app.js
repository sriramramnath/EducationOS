/* ═══════════════════════════════════════════════════════════════════════════
   Eduverse — React Dashboard Application
   ═══════════════════════════════════════════════════════════════════════════ */

const { useState, useEffect, useCallback, useMemo, useRef } = React;

// ─────────────────────────────────────────────────────────────────────────────
// Global Config
// ─────────────────────────────────────────────────────────────────────────────
const CONFIG = window.__INITIAL_DATA__ || {
  user: { email: '', name: '', givenName: '', picture: '' },
  routes: { logout: '/logout/', apiEmails: '/api/emails/', apiTasks: '/api/tasks/', apiTasksCreate: '/api/tasks/create/', apiCalendar: '/api/calendar/' },
  csrfToken: ''
};

// ─────────────────────────────────────────────────────────────────────────────
// API Helpers
// ─────────────────────────────────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-CSRFToken': CONFIG.csrfToken, ...options.headers };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon Components
// ─────────────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, className = '' }) => (
  <i className={`bi bi-${name} ${className}`} style={{ fontSize: size }}></i>
);

// ─────────────────────────────────────────────────────────────────────────────
// Search Results Component
// ─────────────────────────────────────────────────────────────────────────────
const SearchResults = ({ query, emails, tasks, onClose, onNavigate }) => {
  if (!query || query.trim().length === 0) return null;
  
  const searchTerm = query.toLowerCase().trim();
  
  // Filter emails
  const filteredEmails = emails.filter(email => {
    const subject = (email.subject || '').toLowerCase();
    const sender = (email.sender || '').toLowerCase();
    const snippet = (email.snippet || '').toLowerCase();
    return subject.includes(searchTerm) || sender.includes(searchTerm) || snippet.includes(searchTerm);
  });
  
  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const title = (task.title || '').toLowerCase();
    const description = (task.description || '').toLowerCase();
    return title.includes(searchTerm) || description.includes(searchTerm);
  });
  
  const totalResults = filteredEmails.length + filteredTasks.length;
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const getInitials = (sender) => {
    const name = sender?.split('<')[0]?.trim() || 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const getAvatarColor = (text) => {
    const colors = ['blue', 'purple', 'teal', 'orange'];
    const hash = (text || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-results" onClick={e => e.stopPropagation()}>
        <div className="search-results__header">
          <h3 className="search-results__title">
            <Icon name="search" size={18} className="me-2" />
            Search Results
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <Icon name="x-lg" size={16} />
          </button>
        </div>
        <div className="search-results__query">
          <span className="text-muted">Searching for:</span> <strong>"{query}"</strong>
          <span className="badge bg-primary ms-2">{totalResults} results</span>
        </div>
        <div className="search-results__body">
          {totalResults === 0 ? (
            <div className="empty-state empty-state--compact">
              <Icon name="search" size={48} />
              <h4>No results found</h4>
              <p>Try a different search term</p>
            </div>
          ) : (
            <>
              {filteredEmails.length > 0 && (
                <div className="search-results__section">
                  <div className="search-results__section-header">
                    <Icon name="envelope-fill" size={16} className="me-2" />
                    <strong>Emails ({filteredEmails.length})</strong>
                    <button className="btn btn-link btn-sm ms-auto" onClick={() => { onNavigate('inbox'); onClose(); }}>
                      View all <Icon name="arrow-right" size={12} className="ms-1" />
                    </button>
                  </div>
                  <div className="search-results__list">
                    {filteredEmails.slice(0, 5).map(email => (
                      <div 
                        key={email.id} 
                        className="search-result-item"
                        onClick={() => { onNavigate('inbox'); onClose(); }}
                      >
                        <div className={`search-result-item__avatar search-result-item__avatar--${getAvatarColor(email.sender)}`}>
                          {getInitials(email.sender)}
                        </div>
                        <div className="search-result-item__content">
                          <div className="search-result-item__header">
                            <span className="search-result-item__title">{email.subject || '(No subject)'}</span>
                            <span className="search-result-item__date">{formatDate(email.date)}</span>
                          </div>
                          <div className="search-result-item__meta">{email.sender?.split('<')[0]?.trim() || 'Unknown'}</div>
                          <div className="search-result-item__snippet">{email.snippet}</div>
                        </div>
                      </div>
                    ))}
                    {filteredEmails.length > 5 && (
                      <div className="search-results__more">
                        +{filteredEmails.length - 5} more emails
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {filteredTasks.length > 0 && (
                <div className="search-results__section">
                  <div className="search-results__section-header">
                    <Icon name="check2-square" size={16} className="me-2" />
                    <strong>Tasks ({filteredTasks.length})</strong>
                    <button className="btn btn-link btn-sm ms-auto" onClick={() => { onNavigate('tasks'); onClose(); }}>
                      View all <Icon name="arrow-right" size={12} className="ms-1" />
                    </button>
                  </div>
                  <div className="search-results__list">
                    {filteredTasks.slice(0, 5).map(task => (
                      <div 
                        key={task.id} 
                        className="search-result-item"
                        onClick={() => { onNavigate('tasks'); onClose(); }}
                      >
                        <div className={`search-result-item__icon search-result-item__icon--${task.status === 'done' ? 'teal' : task.status === 'in-progress' ? 'blue' : 'purple'}`}>
                          <Icon 
                            name={task.status === 'done' ? 'check-circle-fill' : task.status === 'in-progress' ? 'play-circle-fill' : 'circle'} 
                            size={16} 
                          />
                        </div>
                        <div className="search-result-item__content">
                          <div className="search-result-item__header">
                            <span className="search-result-item__title">{task.title}</span>
                            <span className={`badge bg-${task.status === 'done' ? 'success' : task.status === 'in-progress' ? 'primary' : 'secondary'}`}>
                              {task.status === 'done' ? 'Done' : task.status === 'in-progress' ? 'In Progress' : 'To Do'}
                            </span>
                          </div>
                          {task.description && (
                            <div className="search-result-item__snippet">{task.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredTasks.length > 5 && (
                      <div className="search-results__more">
                        +{filteredTasks.length - 5} more tasks
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Header Component
// ─────────────────────────────────────────────────────────────────────────────
const Header = ({ user, onSearch, searchInputRef }) => {
  const initials = user.givenName ? user.givenName[0].toUpperCase() : user.email[0]?.toUpperCase() || '?';
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };
  
  return (
    <header className="app-header">
      <div className="container-fluid px-4">
        <div className="d-flex align-items-center justify-content-between py-3">
          <div className="d-flex align-items-center gap-3">
            <h1 className="brand-logo mb-0">Eduverse</h1>
            <div className="header-search">
              <Icon name="search" size={16} className="header-search__icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="header-search__input"
                placeholder="Search emails, tasks, events... (⌘K)"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="user-email d-none d-md-inline">{user.email}</span>
            {user.picture ? (
              <img src={user.picture} alt="" className="user-avatar" />
            ) : (
              <div className="user-avatar-placeholder">{initials}</div>
            )}
            <a href={CONFIG.routes.logout} className="btn btn-outline-secondary btn-sm">
              <Icon name="box-arrow-right" size={16} />
              <span className="d-none d-sm-inline ms-2">Sign out</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Quick Actions Panel
// ─────────────────────────────────────────────────────────────────────────────
const QuickActions = ({ onNavigate, onCreateTask }) => {
  const [showPanel, setShowPanel] = useState(false);
  
  const actions = [
    { icon: 'plus-circle', label: 'New Task', onClick: () => onCreateTask(), color: 'primary' },
    { icon: 'envelope-plus', label: 'Compose', onClick: () => {}, color: 'blue' },
    { icon: 'calendar-plus', label: 'New Event', onClick: () => onNavigate('calendar'), color: 'teal' },
    { icon: 'bullseye', label: 'Start Focus', onClick: () => onNavigate('focus'), color: 'orange' },
  ];
  
  return (
    <>
      <button 
        className="quick-actions__toggle"
        onClick={() => setShowPanel(!showPanel)}
        title="Quick Actions (?)"
      >
        <Icon name={showPanel ? 'x-lg' : 'lightning-charge-fill'} size={20} />
      </button>
      {showPanel && (
        <div className="quick-actions__panel">
          <div className="quick-actions__header">
            <h5>Quick Actions</h5>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowPanel(false)}>
              <Icon name="x-lg" size={14} />
            </button>
          </div>
          <div className="quick-actions__list">
            {actions.map((action, idx) => (
              <button
                key={idx}
                className={`quick-actions__item quick-actions__item--${action.color}`}
                onClick={() => {
                  action.onClick();
                  setShowPanel(false);
                }}
              >
                <Icon name={action.icon} size={20} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard Shortcuts Help
// ─────────────────────────────────────────────────────────────────────────────
const KeyboardShortcuts = ({ show, onClose }) => {
  if (!show) return null;
  
  const shortcuts = [
    { keys: ['⌘', 'K'], description: 'Focus search bar' },
    { keys: ['Esc'], description: 'Close modals/search' },
    { keys: ['1'], description: 'Go to Overview' },
    { keys: ['2'], description: 'Go to Inbox' },
    { keys: ['3'], description: 'Go to Tasks' },
    { keys: ['4'], description: 'Go to Calendar' },
    { keys: ['5'], description: 'Go to Focus' },
    { keys: ['?'], description: 'Show keyboard shortcuts' },
  ];
  
  return (
    <div className="modal-backdrop show" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <Icon name="keyboard" size={18} className="me-2" />
              Keyboard Shortcuts
            </h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="shortcuts-list">
              {shortcuts.map((shortcut, idx) => (
                <div key={idx} className="shortcut-item">
                  <div className="shortcut-keys">
                    {shortcut.keys.map((key, kIdx) => (
                      <kbd key={kIdx} className="shortcut-key">{key}</kbd>
                    ))}
                  </div>
                  <span className="shortcut-desc">{shortcut.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tab Navigation
// ─────────────────────────────────────────────────────────────────────────────
const TabNav = ({ activeTab, onTabChange, counts }) => {
  const tabs = [
    { id: 'overview', icon: 'grid-1x2-fill', label: 'Overview' },
    { id: 'inbox', icon: 'envelope-fill', label: 'Inbox', count: counts.emails },
    { id: 'tasks', icon: 'check2-square', label: 'Tasks', count: counts.tasks },
    { id: 'calendar', icon: 'calendar3', label: 'Calendar', count: counts.events },
    { id: 'goals', icon: 'target', label: 'Goals', count: counts.goals },
    { id: 'analytics', icon: 'graph-up-arrow', label: 'Analytics' },
    { id: 'habits', icon: 'fire', label: 'Habits', count: counts.habits },
    { id: 'focus', icon: 'bullseye', label: 'Focus' }
  ];

  return (
    <nav className="tab-nav">
      <div className="container-fluid px-4">
        <ul className="nav nav-pills gap-1" role="tablist">
          {tabs.map(tab => (
            <li className="nav-item" key={tab.id}>
              <button
                className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
              >
                <Icon name={tab.icon} size={16} />
                <span className="tab-label">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="tab-badge">{tab.count}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card Component
// ─────────────────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, accent, onClick, subtitle }) => (
  <div className={`stat-card ${accent ? 'stat-card--' + accent : ''}`} onClick={onClick} role={onClick ? 'button' : undefined}>
    <div className="stat-card__icon">
      <Icon name={icon} size={24} />
    </div>
    <div className="stat-card__content">
      <span className="stat-card__value">{value}</span>
      <span className="stat-card__label">{label}</span>
      {subtitle && <span className="stat-card__subtitle">{subtitle}</span>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Mini Chart Component for Overview
// ─────────────────────────────────────────────────────────────────────────────
const MiniBarChart = ({ data, labels, color = 'blue' }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="mini-chart">
      <div className="mini-chart__bars">
        {data.map((value, i) => (
          <div key={i} className="mini-chart__bar-wrapper">
            <div 
              className={`mini-chart__bar mini-chart__bar--${color}`}
              style={{ height: `${(value / max) * 100}%` }}
            />
            <span className="mini-chart__label">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Progress Ring Component
// ─────────────────────────────────────────────────────────────────────────────
const ProgressRing = ({ progress, size = 60, strokeWidth = 6, color = 'blue' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <svg width={size} height={size} className="progress-ring">
      <circle
        className="progress-ring__bg"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className={`progress-ring__progress progress-ring__progress--${color}`}
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{
          strokeDasharray: circumference,
          strokeDashoffset: offset,
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%'
        }}
      />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Overview Tab - Enhanced with more data
// ─────────────────────────────────────────────────────────────────────────────
const OverviewTab = ({ emails, tasks, events, pomodoroCount, focusMins, onNavigate }) => {
  const activeTasks = tasks.filter(t => t.status !== 'done').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  
  const todayEvents = useMemo(() => {
    const today = new Date().toDateString();
    return events.filter(e => new Date(e.start).toDateString() === today);
  }, [events]);

  const thisWeekEvents = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return events.filter(e => {
      const d = new Date(e.start);
      return d >= now && d <= weekEnd;
    });
  }, [events]);

  // Calculate productivity score
  const productivityScore = useMemo(() => {
    const taskScore = tasks.length > 0 ? (completedTasks / tasks.length) * 40 : 0;
    const focusScore = Math.min(pomodoroCount * 10, 40);
    const eventScore = Math.min(todayEvents.length * 5, 20);
    return Math.round(taskScore + focusScore + eventScore);
  }, [tasks, completedTasks, pomodoroCount, todayEvents]);

  // Weekly activity data (mock based on current data)
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date().getDay();
  const activityData = weekDays.map((_, i) => {
    if (i === (today === 0 ? 6 : today - 1)) return pomodoroCount;
    return Math.floor(Math.random() * 4);
  });

  // Task distribution
  const taskDistribution = [
    tasks.filter(t => t.status === 'not-started').length,
    inProgressTasks,
    completedTasks
  ];

  return (
    <div className="container-fluid px-4 py-4">
      {/* Welcome Banner */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="welcome-banner">
            <div className="welcome-banner__content">
              <h2 className="welcome-banner__title">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {CONFIG.user.givenName || 'there'}
              </h2>
              <p className="welcome-banner__subtitle">Here's your productivity snapshot for today</p>
            </div>
            <div className="welcome-banner__score">
              <ProgressRing progress={productivityScore} size={80} strokeWidth={8} color="blue" />
              <div className="welcome-banner__score-text">
                <span className="welcome-banner__score-value">{productivityScore}</span>
                <span className="welcome-banner__score-label">Score</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="row g-4 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard icon="envelope-fill" label="Unread emails" value={emails.length} accent="blue" onClick={() => onNavigate('inbox')} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="check2-square" label="Active tasks" value={activeTasks} accent="purple" onClick={() => onNavigate('tasks')} subtitle={`${completedTasks} completed`} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="calendar-event" label="Today's events" value={todayEvents.length} accent="teal" onClick={() => onNavigate('calendar')} subtitle={`${thisWeekEvents.length} this week`} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bullseye" label="Focus sessions" value={pomodoroCount} accent="orange" onClick={() => onNavigate('focus')} subtitle={`${Math.round(pomodoroCount * focusMins / 60 * 10) / 10}h total`} />
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="panel">
            <div className="panel__header">
              <h3 className="panel__title"><Icon name="graph-up" size={18} className="me-2" />Weekly Activity</h3>
            </div>
            <div className="panel__body">
              <MiniBarChart data={activityData} labels={weekDays} color="blue" />
              <div className="chart-legend mt-3">
                <span className="chart-legend__item"><span className="chart-legend__dot chart-legend__dot--blue"></span>Focus sessions</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="panel">
            <div className="panel__header">
              <h3 className="panel__title"><Icon name="pie-chart-fill" size={18} className="me-2" />Task Distribution</h3>
            </div>
            <div className="panel__body">
              <div className="task-distribution">
                <div className="task-distribution__bar">
                  {taskDistribution[0] > 0 && (
                    <div className="task-distribution__segment task-distribution__segment--todo" style={{ flex: taskDistribution[0] }}>
                      {taskDistribution[0]}
                    </div>
                  )}
                  {taskDistribution[1] > 0 && (
                    <div className="task-distribution__segment task-distribution__segment--progress" style={{ flex: taskDistribution[1] }}>
                      {taskDistribution[1]}
                    </div>
                  )}
                  {taskDistribution[2] > 0 && (
                    <div className="task-distribution__segment task-distribution__segment--done" style={{ flex: taskDistribution[2] }}>
                      {taskDistribution[2]}
                    </div>
                  )}
                  {tasks.length === 0 && <div className="task-distribution__empty">No tasks</div>}
                </div>
                <div className="chart-legend mt-3">
                  <span className="chart-legend__item"><span className="chart-legend__dot chart-legend__dot--orange"></span>To Do ({taskDistribution[0]})</span>
                  <span className="chart-legend__item"><span className="chart-legend__dot chart-legend__dot--blue"></span>In Progress ({taskDistribution[1]})</span>
                  <span className="chart-legend__item"><span className="chart-legend__dot chart-legend__dot--teal"></span>Done ({taskDistribution[2]})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Lists */}
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="panel">
            <div className="panel__header">
              <h3 className="panel__title"><Icon name="envelope" size={18} className="me-2" />Recent emails</h3>
              <button className="btn btn-link btn-sm" onClick={() => onNavigate('inbox')}>View all</button>
            </div>
            <div className="panel__body">
              {emails.length === 0 ? (
                <div className="empty-state empty-state--compact">
                  <Icon name="inbox" size={32} />
                  <p>No emails to show</p>
                </div>
              ) : (
                <ul className="quick-list">
                  {emails.slice(0, 4).map(email => (
                    <li key={email.id} className="quick-list__item">
                      <div className="quick-list__icon"><Icon name="envelope" size={16} /></div>
                      <div className="quick-list__content">
                        <span className="quick-list__title">{email.subject || '(No subject)'}</span>
                        <span className="quick-list__meta">{email.sender?.split('<')[0]?.trim()}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="panel">
            <div className="panel__header">
              <h3 className="panel__title"><Icon name="list-task" size={18} className="me-2" />Active tasks</h3>
              <button className="btn btn-link btn-sm" onClick={() => onNavigate('tasks')}>View all</button>
            </div>
            <div className="panel__body">
              {activeTasks === 0 ? (
                <div className="empty-state empty-state--compact">
                  <Icon name="check-circle" size={32} />
                  <p>All tasks completed!</p>
                </div>
              ) : (
                <ul className="quick-list">
                  {tasks.filter(t => t.status !== 'done').slice(0, 4).map(task => (
                    <li key={task.id} className="quick-list__item">
                      <div className={`quick-list__icon ${task.status === 'in-progress' ? 'quick-list__icon--blue' : 'quick-list__icon--purple'}`}>
                        <Icon name={task.status === 'in-progress' ? 'play-circle-fill' : 'circle'} size={16} />
                      </div>
                      <div className="quick-list__content">
                        <span className="quick-list__title">{task.title}</span>
                        <span className="quick-list__meta">{task.status === 'in-progress' ? 'In progress' : 'To do'}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="panel">
            <div className="panel__header">
              <h3 className="panel__title"><Icon name="calendar3" size={18} className="me-2" />Upcoming events</h3>
              <button className="btn btn-link btn-sm" onClick={() => onNavigate('calendar')}>View all</button>
            </div>
            <div className="panel__body">
              {events.length === 0 ? (
                <div className="empty-state empty-state--compact">
                  <Icon name="calendar-x" size={32} />
                  <p>No upcoming events</p>
                </div>
              ) : (
                <ul className="quick-list">
                  {events.slice(0, 4).map(event => {
                    const start = new Date(event.start);
                    return (
                      <li key={event.id} className="quick-list__item">
                        <div className="quick-list__icon quick-list__icon--teal"><Icon name="calendar-event" size={16} /></div>
                        <div className="quick-list__content">
                          <span className="quick-list__title">{event.title}</span>
                          <span className="quick-list__meta">
                            {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {event.start.includes('T') && ` at ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Inbox Tab - Better Email Formatting
// ─────────────────────────────────────────────────────────────────────────────
const InboxTab = ({ emails, loading, onRefresh }) => {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [sortBy, setSortBy] = useState('date'); // 'date', 'sender', 'subject'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [filterSender, setFilterSender] = useState('');

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (sender) => {
    const name = sender?.split('<')[0]?.trim() || 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (sender) => {
    const colors = ['blue', 'purple', 'teal', 'orange'];
    const hash = (sender || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Filter and sort emails
  const filteredAndSortedEmails = useMemo(() => {
    let filtered = [...emails];
    
    // Filter by sender
    if (filterSender) {
      filtered = filtered.filter(email => 
        (email.sender || '').toLowerCase().includes(filterSender.toLowerCase())
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'sender':
          aVal = (a.sender || '').toLowerCase();
          bVal = (b.sender || '').toLowerCase();
          break;
        case 'subject':
          aVal = (a.subject || '').toLowerCase();
          bVal = (b.subject || '').toLowerCase();
          break;
        case 'date':
        default:
          aVal = new Date(a.date || 0).getTime();
          bVal = new Date(b.date || 0).getTime();
          break;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
    
    return filtered;
  }, [emails, sortBy, sortOrder, filterSender]);

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header Banner */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="section-banner section-banner--blue">
            <div className="section-banner__content">
              <h2 className="section-banner__title">
                <Icon name="envelope-fill" size={28} className="me-3" />
                Inbox
              </h2>
              <p className="section-banner__subtitle">Your latest messages from Gmail</p>
            </div>
            <div className="section-banner__actions">
              <button className="btn btn-light btn-sm" onClick={onRefresh} disabled={loading}>
                <Icon name={loading ? 'arrow-repeat' : 'arrow-clockwise'} size={14} className={loading ? 'spin' : ''} />
                <span className="ms-2">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="row g-4 mb-4">
        <div className="col-6 col-md-3">
          <StatCard icon="envelope-fill" label="Total emails" value={emails.length} accent="blue" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="envelope-open" label="Unread" value={emails.length} accent="purple" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="star-fill" label="Starred" value={0} accent="orange" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="clock" label="Today" value={emails.filter(e => new Date(e.date).toDateString() === new Date().toDateString()).length} accent="teal" />
        </div>
      </div>

      {/* Email List */}
      <div className="row g-4">
        <div className={selectedEmail ? 'col-lg-5' : 'col-12'}>
          <div className="panel">
            <div className="panel__header">
              <h3 className="panel__title">Messages</h3>
              <div className="d-flex align-items-center gap-2">
                <div className="dropdown">
                  <button className="btn btn-ghost btn-sm" data-bs-toggle="dropdown">
                    <Icon name="funnel" size={14} className="me-1" />
                    Sort: {sortBy}
                    <Icon name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} size={12} className="ms-1" />
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><button className="dropdown-item" onClick={() => { setSortBy('date'); setSortOrder('desc'); }}>
                      <Icon name="calendar" size={14} className="me-2" />Date (Newest)
                    </button></li>
                    <li><button className="dropdown-item" onClick={() => { setSortBy('date'); setSortOrder('asc'); }}>
                      <Icon name="calendar" size={14} className="me-2" />Date (Oldest)
                    </button></li>
                    <li><button className="dropdown-item" onClick={() => { setSortBy('sender'); setSortOrder('asc'); }}>
                      <Icon name="person" size={14} className="me-2" />Sender (A-Z)
                    </button></li>
                    <li><button className="dropdown-item" onClick={() => { setSortBy('subject'); setSortOrder('asc'); }}>
                      <Icon name="file-text" size={14} className="me-2" />Subject (A-Z)
                    </button></li>
                  </ul>
                </div>
                <span className="badge bg-primary">{filteredAndSortedEmails.length}</span>
              </div>
            </div>
            <div className="panel__body p-0">
              {loading && emails.length === 0 ? (
                <div className="loading-state">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="ms-2">Loading emails...</span>
                </div>
              ) : filteredAndSortedEmails.length === 0 ? (
                <div className="empty-state">
                  <Icon name="inbox" size={48} />
                  <h4>No emails found</h4>
                  <p>{filterSender ? 'Try adjusting your filter' : 'No emails in your inbox'}</p>
                </div>
              ) : (
                <div className="email-list-container">
                  {filteredAndSortedEmails.map(email => (
                    <div
                      key={email.id}
                      className={`email-item ${selectedEmail?.id === email.id ? 'email-item--active' : ''}`}
                      onClick={() => setSelectedEmail(email)}
                    >
                      <div className={`email-item__avatar email-item__avatar--${getAvatarColor(email.sender)}`}>
                        {getInitials(email.sender)}
                      </div>
                      <div className="email-item__content">
                        <div className="email-item__header">
                          <span className="email-item__sender">{email.sender?.split('<')[0]?.trim() || 'Unknown'}</span>
                          <span className="email-item__date">{formatDate(email.date)}</span>
                        </div>
                        <div className="email-item__subject">{email.subject || '(No subject)'}</div>
                        <div className="email-item__snippet">{email.snippet}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedEmail && (
          <div className="col-lg-7">
            <div className="panel email-detail-panel">
              <div className="panel__header">
                <button className="btn btn-ghost btn-sm d-lg-none me-2" onClick={() => setSelectedEmail(null)}>
                  <Icon name="arrow-left" size={16} />
                </button>
                <h3 className="panel__title text-truncate">{selectedEmail.subject || '(No subject)'}</h3>
                <button className="btn btn-ghost btn-sm ms-auto d-none d-lg-block" onClick={() => setSelectedEmail(null)}>
                  <Icon name="x-lg" size={16} />
                </button>
              </div>
              <div className="panel__body">
                <div className="email-detail">
                  <div className="email-detail__header">
                    <div className={`email-detail__avatar email-detail__avatar--${getAvatarColor(selectedEmail.sender)}`}>
                      {getInitials(selectedEmail.sender)}
                    </div>
                    <div className="email-detail__meta">
                      <strong className="email-detail__sender">{selectedEmail.sender?.split('<')[0]?.trim()}</strong>
                      <span className="email-detail__email">{selectedEmail.sender?.match(/<(.+)>/)?.[1] || ''}</span>
                      <span className="email-detail__date">
                        {new Date(selectedEmail.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="email-detail__body">
                    {selectedEmail.body || selectedEmail.snippet || 'No content available'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tasks Tab - Drag and Drop
// ─────────────────────────────────────────────────────────────────────────────
const TasksTab = ({ tasks, loading, onRefresh, onCreateTask, onUpdateTask, onDeleteTask }) => {
  const [showModal, setShowModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [taskFilter, setTaskFilter] = useState('all'); // 'all', 'not-started', 'in-progress', 'done'
  const [taskSort, setTaskSort] = useState('title'); // 'title', 'status', 'created'

  const columns = [
    { id: 'not-started', label: 'To Do', icon: 'circle', color: 'secondary', accent: 'purple' },
    { id: 'in-progress', label: 'In Progress', icon: 'play-circle-fill', color: 'primary', accent: 'blue' },
    { id: 'done', label: 'Done', icon: 'check-circle-fill', color: 'success', accent: 'teal' }
  ];

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];
    
    // Filter by status
    if (taskFilter !== 'all') {
      filtered = filtered.filter(t => t.status === taskFilter);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (taskSort) {
        case 'title':
          return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase());
        case 'status':
          const statusOrder = { 'not-started': 0, 'in-progress': 1, 'done': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [tasks, taskFilter, taskSort]);

  const todoCount = tasks.filter(t => t.status === 'not-started').length;
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  const handleCreate = async () => {
    if (!newTaskTitle.trim()) return;
    setCreating(true);
    try {
      await onCreateTask(newTaskTitle, newTaskDesc);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setShowModal(false);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = (task, newStatus) => {
    onUpdateTask(task.id, { status: newStatus });
  };

  // Drag handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.target.classList.add('task-card--dragging');
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('task-card--dragging');
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== columnId) {
      handleStatusChange(draggedTask, columnId);
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header Banner */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="section-banner section-banner--purple">
            <div className="section-banner__content">
              <h2 className="section-banner__title">
                <Icon name="check2-square" size={28} className="me-3" />
                Tasks
              </h2>
              <p className="section-banner__subtitle">Drag and drop tasks between columns to update status</p>
            </div>
            <div className="section-banner__actions">
              <button className="btn btn-outline-light btn-sm me-2" onClick={onRefresh} disabled={loading}>
                <Icon name={loading ? 'arrow-repeat' : 'arrow-clockwise'} size={14} className={loading ? 'spin' : ''} />
                <span className="ms-2 d-none d-sm-inline">Refresh</span>
              </button>
              <button className="btn btn-light btn-sm" onClick={() => setShowModal(true)}>
                <Icon name="plus-lg" size={14} />
                <span className="ms-2">New task</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="row g-4 mb-4">
        <div className="col-6 col-md-3">
          <StatCard icon="list-task" label="Total tasks" value={tasks.length} accent="purple" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="circle" label="To Do" value={todoCount} accent="orange" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="play-circle-fill" label="In Progress" value={inProgressCount} accent="blue" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="check-circle-fill" label="Completed" value={doneCount} accent="teal" />
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="panel">
            <div className="panel__body">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div className="d-flex align-items-center gap-2">
                  <Icon name="funnel" size={14} />
                  <strong>Filter:</strong>
                  <div className="btn-group btn-group-sm">
                    <button className={`btn ${taskFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setTaskFilter('all')}>
                      All
                    </button>
                    <button className={`btn ${taskFilter === 'not-started' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setTaskFilter('not-started')}>
                      To Do
                    </button>
                    <button className={`btn ${taskFilter === 'in-progress' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setTaskFilter('in-progress')}>
                      In Progress
                    </button>
                    <button className={`btn ${taskFilter === 'done' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setTaskFilter('done')}>
                      Done
                    </button>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2 ms-auto">
                  <Icon name="arrow-down-up" size={14} />
                  <strong>Sort:</strong>
                  <select className="form-select form-select-sm" style={{ width: 'auto' }} value={taskSort} onChange={e => setTaskSort(e.target.value)}>
                    <option value="title">Title</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="row g-4">
        {columns.map(col => {
          // If filtering, show filtered tasks; otherwise show all tasks sorted
          const colTasks = taskFilter === 'all' 
            ? tasks.filter(t => t.status === col.id).sort((a, b) => {
                if (taskSort === 'title') {
                  return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase());
                }
                return 0;
              })
            : filteredAndSortedTasks.filter(t => t.status === col.id);
          const isDragOver = dragOverColumn === col.id;
          return (
            <div key={col.id} className="col-lg-4">
              <div 
                className={`panel kanban-column ${isDragOver ? 'kanban-column--drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className={`panel__header panel__header--${col.accent}`}>
                  <h3 className="panel__title">
                    <Icon name={col.icon} size={16} className="me-2" />
                    {col.label}
                  </h3>
                  <span className="badge bg-white bg-opacity-25">{colTasks.length}</span>
                </div>
                <div className="panel__body kanban-body">
                  {loading && tasks.length === 0 ? (
                    <div className="loading-state">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : colTasks.length === 0 ? (
                    <div className={`empty-state empty-state--compact ${isDragOver ? 'empty-state--drag-over' : ''}`}>
                      <Icon name={col.icon} size={32} />
                      <p>{isDragOver ? 'Drop here' : 'No tasks here'}</p>
                    </div>
                  ) : (
                    <div className="task-list">
                      {colTasks.map(task => (
                        <div 
                          key={task.id} 
                          className="task-card"
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="task-card__drag-handle">
                            <Icon name="grip-vertical" size={14} />
                          </div>
                          <div className="task-card__content">
                            <div className="task-card__header">
                              <span className="task-card__title">{task.title}</span>
                              <div className="dropdown">
                                <button className="btn btn-ghost btn-xs" data-bs-toggle="dropdown">
                                  <Icon name="three-dots" size={14} />
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                  {columns.filter(c => c.id !== col.id).map(c => (
                                    <li key={c.id}>
                                      <button className="dropdown-item" onClick={() => handleStatusChange(task, c.id)}>
                                        <Icon name={c.icon} size={14} className={`text-${c.color} me-2`} />
                                        Move to {c.label}
                                      </button>
                                    </li>
                                  ))}
                                  <li><hr className="dropdown-divider" /></li>
                                  <li>
                                    <button className="dropdown-item text-danger" onClick={() => onDeleteTask(task.id)}>
                                      <Icon name="trash" size={14} className="me-2" />
                                      Delete
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </div>
                            {task.description && (
                              <p className="task-card__desc">{task.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {showModal && (
        <div className="modal-backdrop show" onClick={() => setShowModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">New Task</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    autoFocus
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description (optional)</label>
                  <textarea
                    className="form-control"
                    value={newTaskDesc}
                    onChange={e => setNewTaskDesc(e.target.value)}
                    placeholder="Add more details..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !newTaskTitle.trim()}>
                  {creating ? 'Creating...' : 'Create task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Calendar Tab - Actual Calendar Grid View
// ─────────────────────────────────────────────────────────────────────────────
const CalendarTab = ({ events, loading, onRefresh }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Previous month days
    const prevMonth = new Date(year, month, 0);
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const getEventsForDate = (date) => {
    return events.filter(e => {
      const eventDate = new Date(e.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const todayEvents = useMemo(() => {
    return events.filter(e => new Date(e.start).toDateString() === today.toDateString());
  }, [events]);

  const thisWeekEvents = useMemo(() => {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return events.filter(e => {
      const d = new Date(e.start);
      return d >= today && d <= weekEnd;
    });
  }, [events]);

  const formatTime = (dateStr) => {
    if (!dateStr.includes('T')) return 'All day';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header Banner */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="section-banner section-banner--teal">
            <div className="section-banner__content">
              <h2 className="section-banner__title">
                <Icon name="calendar3" size={28} className="me-3" />
                Calendar
              </h2>
              <p className="section-banner__subtitle">Your upcoming events from Google Calendar</p>
            </div>
            <div className="section-banner__actions">
              <div className="btn-group me-2">
                <button 
                  className={`btn btn-sm ${viewMode === 'month' ? 'btn-light' : 'btn-outline-light'}`}
                  onClick={() => setViewMode('month')}
                >
                  <Icon name="grid-3x3" size={14} />
                </button>
                <button 
                  className={`btn btn-sm ${viewMode === 'list' ? 'btn-light' : 'btn-outline-light'}`}
                  onClick={() => setViewMode('list')}
                >
                  <Icon name="list-ul" size={14} />
                </button>
            </div>
              <button className="btn btn-light btn-sm" onClick={onRefresh} disabled={loading}>
                <Icon name={loading ? 'arrow-repeat' : 'arrow-clockwise'} size={14} className={loading ? 'spin' : ''} />
                <span className="ms-2">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="row g-4 mb-4">
        <div className="col-6 col-md-3">
          <StatCard icon="calendar-event" label="Total events" value={events.length} accent="teal" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="calendar-day" label="Today" value={todayEvents.length} accent="blue" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="calendar-week" label="This week" value={thisWeekEvents.length} accent="purple" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="calendar-range" label="This month" value={events.filter(e => new Date(e.start).getMonth() === currentDate.getMonth()).length} accent="orange" />
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="row g-4">
          <div className={selectedDate ? 'col-lg-8' : 'col-12'}>
            <div className="panel">
              <div className="panel__header">
                <div className="d-flex align-items-center gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={prevMonth}>
                    <Icon name="chevron-left" size={16} />
                  </button>
                  <h3 className="panel__title mb-0">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                  <button className="btn btn-ghost btn-sm" onClick={nextMonth}>
                    <Icon name="chevron-right" size={16} />
                  </button>
                </div>
                <button className="btn btn-outline-secondary btn-sm" onClick={goToToday}>Today</button>
              </div>
              <div className="panel__body p-0">
                <div className="calendar-grid">
                  <div className="calendar-grid__header">
                    {dayNames.map(day => (
                      <div key={day} className="calendar-grid__day-name">{day}</div>
                    ))}
                  </div>
                  <div className="calendar-grid__body">
                    {days.map((day, i) => {
                      const dayEvents = getEventsForDate(day.date);
                      const isToday = day.date.toDateString() === today.toDateString();
                      const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
                      
                      return (
                        <div
                          key={i}
                          className={`calendar-grid__cell ${!day.isCurrentMonth ? 'calendar-grid__cell--other' : ''} ${isToday ? 'calendar-grid__cell--today' : ''} ${isSelected ? 'calendar-grid__cell--selected' : ''}`}
                          onClick={() => setSelectedDate(day.date)}
                        >
                          <span className="calendar-grid__date">{day.date.getDate()}</span>
                          {dayEvents.length > 0 && (
                            <div className="calendar-grid__events">
                              {dayEvents.slice(0, 2).map(event => (
                                <div key={event.id} className="calendar-grid__event">
                                  {event.title}
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <div className="calendar-grid__more">+{dayEvents.length - 2} more</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selectedDate && (
            <div className="col-lg-4">
              <div className="panel">
                <div className="panel__header">
                  <h3 className="panel__title">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDate(null)}>
                    <Icon name="x-lg" size={14} />
                  </button>
                </div>
                <div className="panel__body">
                  {selectedDateEvents.length === 0 ? (
                    <div className="empty-state empty-state--compact">
                      <Icon name="calendar-x" size={32} />
                      <p>No events on this day</p>
                    </div>
                  ) : (
                    <div className="event-list">
                      {selectedDateEvents.map(event => (
                        <div key={event.id} className="event-list__item">
                          <div className="event-list__time">{formatTime(event.start)}</div>
                          <div className="event-list__content">
                            <span className="event-list__title">{event.title}</span>
                            {event.location && (
                              <span className="event-list__location">
                                <Icon name="geo-alt" size={12} className="me-1" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // List View
        <div className="row g-4">
          <div className="col-12">
            <div className="panel">
              <div className="panel__header">
                <h3 className="panel__title">Upcoming Events</h3>
                <span className="badge bg-primary">{events.length} events</span>
              </div>
              <div className="panel__body">
                {loading && events.length === 0 ? (
                  <div className="loading-state">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <span className="ms-2">Loading events...</span>
                  </div>
                ) : events.length === 0 ? (
                  <div className="empty-state">
                    <Icon name="calendar-x" size={48} />
                    <h4>No upcoming events</h4>
                    <p>Your calendar is clear</p>
                  </div>
                ) : (
                  <div className="calendar-timeline">
                    {Object.entries(
                      events.reduce((groups, event) => {
                        const date = new Date(event.start).toDateString();
                        if (!groups[date]) groups[date] = [];
                        groups[date].push(event);
                        return groups;
                      }, {})
                    ).sort((a, b) => new Date(a[0]) - new Date(b[0])).map(([dateStr, dayEvents]) => {
                      const date = new Date(dateStr);
                      const isToday = date.toDateString() === today.toDateString();
                      return (
                        <div key={dateStr} className="calendar-day">
                          <div className={`calendar-day__header ${isToday ? 'calendar-day__header--today' : ''}`}>
                            <span className="calendar-day__weekday">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <span className="calendar-day__date">{date.getDate()}</span>
                            <span className="calendar-day__month">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                          </div>
                          <div className="calendar-day__events">
                            {dayEvents.map(event => (
                              <div key={event.id} className="event-card">
                                <div className="event-card__time">{formatTime(event.start)}</div>
                                <div className="event-card__content">
                                  <span className="event-card__title">{event.title}</span>
                                  {event.location && (
                                    <span className="event-card__location">
                                      <Icon name="geo-alt" size={12} className="me-1" />
                                      {event.location}
                                    </span>
                                  )}
                                </div>
                                {event.htmlLink && (
                                  <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="event-card__link">
                                    <Icon name="box-arrow-up-right" size={14} />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Focus Tab (Pomodoro Timer) - With Dynamic Timeline
// ─────────────────────────────────────────────────────────────────────────────
const FocusTab = ({ pomodoroCount, onPomodoroComplete }) => {
  const [mode, setMode] = useState('focus'); // 'focus' or 'break'
  const [totalTimeMins, setTotalTimeMins] = useState(60); // Total time in minutes
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState([]); // Track completed sessions
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  
  // Auto-calculate 70% focus / 30% break split
  const focusMins = Math.round(totalTimeMins * 0.7);
  const breakMins = Math.round(totalTimeMins * 0.3);
  
  // Create session schedule: alternating small intervals (e.g., 2 min focus, 1 min break)
  // Maintains 70/30 ratio throughout the total time
  const sessionSchedule = useMemo(() => {
    const schedule = [];
    let remainingFocus = focusMins;
    let remainingBreak = breakMins;
    
    // Use 2 min focus / 1 min break intervals
    // This gives us a 2:1 ratio which is close to 70:30 (actually 66.7:33.3)
    // We'll adjust the last intervals to get closer to exact 70:30
    const focusInterval = 2; // 2 minutes focus per interval
    const breakInterval = 1; // 1 minute break per interval
    
    // Calculate how many full cycles we can fit
    const cycleTime = focusInterval + breakInterval; // 3 minutes per cycle
    const maxCycles = Math.ceil(totalTimeMins / cycleTime);
    
    // Add alternating intervals until we run out of time
    let totalScheduled = 0;
    for (let i = 0; i < maxCycles && totalScheduled < totalTimeMins; i++) {
      // Add focus interval if we have remaining focus time
      if (remainingFocus > 0 && totalScheduled < totalTimeMins) {
        const focusToAdd = Math.min(focusInterval, remainingFocus, totalTimeMins - totalScheduled);
        if (focusToAdd > 0) {
          schedule.push({ type: 'focus', duration: focusToAdd });
          remainingFocus -= focusToAdd;
          totalScheduled += focusToAdd;
        }
      }
      
      // Add break interval if we have remaining break time
      if (remainingBreak > 0 && totalScheduled < totalTimeMins) {
        const breakToAdd = Math.min(breakInterval, remainingBreak, totalTimeMins - totalScheduled);
        if (breakToAdd > 0) {
          schedule.push({ type: 'break', duration: breakToAdd });
          remainingBreak -= breakToAdd;
          totalScheduled += breakToAdd;
        }
      }
    }
    
    // Add any remaining time to maintain exact 70/30 ratio
    if (remainingFocus > 0 && totalScheduled < totalTimeMins) {
      const remaining = Math.min(remainingFocus, totalTimeMins - totalScheduled);
      if (remaining > 0) {
        schedule.push({ type: 'focus', duration: remaining });
      }
    }
    if (remainingBreak > 0 && totalScheduled < totalTimeMins) {
      const remaining = Math.min(remainingBreak, totalTimeMins - totalScheduled);
      if (remaining > 0) {
        schedule.push({ type: 'break', duration: remaining });
      }
    }
    
    return schedule;
  }, [focusMins, breakMins, totalTimeMins]);
  
  // Initialize timeLeft based on current session (start with focus session)
  const [timeLeft, setTimeLeft] = useState(focusMins * 60);
  
  // Update timeLeft and mode when session schedule or index changes
  useEffect(() => {
    if (sessionSchedule.length > 0 && currentSessionIndex < sessionSchedule.length) {
      const session = sessionSchedule[currentSessionIndex];
      setTimeLeft(session.duration * 60);
      setMode(session.type);
    }
  }, [sessionSchedule, currentSessionIndex, focusMins]);
  
  const currentSession = sessionSchedule[currentSessionIndex] || { duration: 0, type: 'focus' };
  const totalTime = currentSession.duration * 60;
  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const focusTimeHours = Math.round(pomodoroCount * focusMins / 60 * 10) / 10;

  // Calculate total cycle time and segments for timeline
  const totalCycleTime = totalTimeMins;
  const focusPercent = (focusMins / totalCycleTime) * 100;
  const breakPercent = (breakMins / totalCycleTime) * 100;

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && sessionSchedule.length > 0) {
      setIsRunning(false);
      
      // Record completed session
      const completedSession = sessionSchedule[currentSessionIndex];
      setSessions(prev => [...prev, { 
        type: completedSession.type, 
        duration: completedSession.duration, 
        completedAt: new Date() 
      }]);
      
      // Count focus sessions
      if (completedSession.type === 'focus') {
        onPomodoroComplete();
      }
      
      // Move to next session
      if (currentSessionIndex < sessionSchedule.length - 1) {
        setCurrentSessionIndex(prev => prev + 1);
        const nextSession = sessionSchedule[currentSessionIndex + 1];
        setTimeLeft(nextSession.duration * 60);
        setMode(nextSession.type);
        
        if (Notification.permission === 'granted') {
          new Notification(
            nextSession.type === 'focus' 
              ? 'Focus session starting! Time to work.' 
              : 'Break time! Time to rest.'
          );
        }
      } else {
        // All sessions completed
        if (Notification.permission === 'granted') {
          new Notification('All sessions complete! Great work!');
        }
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, sessionSchedule, currentSessionIndex, onPomodoroComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    setCurrentSessionIndex(0);
    if (sessionSchedule.length > 0) {
      const firstSession = sessionSchedule[0];
      setTimeLeft(firstSession.duration * 60);
      setMode(firstSession.type);
    }
  };

  const handleTotalTimeChange = (val) => {
    setTotalTimeMins(val);
    setIsRunning(false);
    setCurrentSessionIndex(0);
  };

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header Banner */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="section-banner section-banner--orange">
            <div className="section-banner__content">
              <h2 className="section-banner__title">
                <Icon name="bullseye" size={28} className="me-3" />
                Focus Mode
              </h2>
              <p className="section-banner__subtitle">Stay productive with the Pomodoro technique</p>
            </div>
            <div className="section-banner__actions">
              <span className="badge bg-white bg-opacity-25 fs-6">
                <Icon name="fire" size={14} className="me-1" />
                {pomodoroCount} sessions today
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="row g-4 mb-4">
        <div className="col-6 col-md-3">
          <StatCard icon="bullseye" label="Sessions today" value={pomodoroCount} accent="orange" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="clock-history" label="Focus time" value={`${focusTimeHours}h`} accent="blue" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="hourglass-split" label="Total time" value={`${totalTimeMins}m`} accent="purple" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="pie-chart-fill" label="Split" value="70/30" accent="teal" subtitle={`${focusMins}m focus / ${breakMins}m break`} />
        </div>
      </div>

      {/* Session Timeline */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="panel">
            <div className="panel__header">
              <h3 className="panel__title"><Icon name="clock-history" size={18} className="me-2" />Session Timeline</h3>
              <span className="text-muted">{totalTimeMins}m total ({focusMins}m focus / {breakMins}m break)</span>
            </div>
            <div className="panel__body">
              <div className="session-timeline">
                <div className="session-timeline__legend">
                  <span className="session-timeline__legend-item">
                    <span className="session-timeline__legend-dot session-timeline__legend-dot--focus"></span>
                    Focus ({focusMins}m - 70%)
                  </span>
                  <span className="session-timeline__legend-item">
                    <span className="session-timeline__legend-dot session-timeline__legend-dot--break"></span>
                    Break ({breakMins}m - 30%)
                  </span>
                </div>
                <div className="session-timeline__bar">
                  {sessionSchedule.map((session, idx) => {
                    const sessionPercent = (session.duration / totalTimeMins) * 100;
                    const isCompleted = idx < currentSessionIndex;
                    const isActive = idx === currentSessionIndex && isRunning;
                    return (
                      <div 
                        key={idx}
                        className={`session-timeline__segment session-timeline__segment--${session.type} ${isCompleted ? 'session-timeline__segment--completed' : ''} ${isActive ? 'session-timeline__segment--active' : ''}`}
                        style={{ width: `${sessionPercent}%` }}
                        title={`${session.type === 'focus' ? 'Focus' : 'Break'}: ${session.duration} min`}
                      >
                        {isCompleted && <Icon name="check" size={10} />}
                        {isActive && <Icon name="play-fill" size={10} />}
                      </div>
                    );
                  })}
                </div>
                <div className="session-timeline__labels">
                  <span className="session-timeline__label">
                    Session {currentSessionIndex + 1} of {sessionSchedule.length} • {currentSession.type === 'focus' ? 'Focus' : 'Break'} ({currentSession.duration} min)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timer and Settings */}
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="panel">
            <div className="panel__header">
              <h3 className="panel__title">Timer</h3>
              <span className={`badge bg-${mode === 'focus' ? 'primary' : 'success'}`}>
                {mode === 'focus' ? 'Focus' : 'Break'} Mode
              </span>
            </div>
            <div className="panel__body">
              <div className="focus-container">
                <div className="focus-timer">
                  <svg className="focus-timer__ring" viewBox="0 0 200 200">
                    <circle className="focus-timer__bg" cx="100" cy="100" r="90" />
                    <circle
                      className={`focus-timer__progress ${mode === 'break' ? 'focus-timer__progress--break' : ''}`}
                      cx="100"
                      cy="100"
                      r="90"
                      style={{ strokeDashoffset: 565.48 - (565.48 * progress / 100) }}
                    />
                  </svg>
                  <div className="focus-timer__display">
                    <span className="focus-timer__time">{formatTime(timeLeft)}</span>
                    <span className="focus-timer__label">{mode === 'focus' ? 'Stay focused' : 'Take a break'}</span>
                  </div>
                </div>

                <div className="focus-controls">
                  {!isRunning ? (
                    <button className="btn btn-primary btn-lg focus-btn" onClick={handleStart}>
                      <Icon name="play-fill" size={20} />
                      Start
                    </button>
                  ) : (
                    <button className="btn btn-secondary btn-lg focus-btn" onClick={handlePause}>
                      <Icon name="pause-fill" size={20} />
                      Pause
                    </button>
                  )}
                  <button className="btn btn-outline-secondary" onClick={handleReset}>
                    <Icon name="arrow-counterclockwise" size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="panel h-100">
            <div className="panel__header">
              <h3 className="panel__title">Settings</h3>
            </div>
            <div className="panel__body">
              <div className="focus-settings-panel">
                <div className="focus-setting-row">
                  <div className="focus-setting-info">
                    <Icon name="hourglass-split" size={20} className="text-primary me-3" />
                    <div>
                      <strong>Total Time</strong>
                      <p className="text-muted mb-0">Total session duration</p>
                    </div>
                  </div>
                  <div className="focus-setting-input">
                    <button className="btn btn-ghost btn-sm" onClick={() => handleTotalTimeChange(Math.max(10, totalTimeMins - 10))} disabled={isRunning}>
                      <Icon name="dash" size={14} />
                    </button>
                    <input
                      type="number"
                      value={totalTimeMins}
                      onChange={e => handleTotalTimeChange(parseInt(e.target.value) || 10)}
                      min="10"
                      max="180"
                      disabled={isRunning}
                    />
                    <button className="btn btn-ghost btn-sm" onClick={() => handleTotalTimeChange(Math.min(180, totalTimeMins + 10))} disabled={isRunning}>
                      <Icon name="plus" size={14} />
                    </button>
                    <span>min</span>
                  </div>
                </div>

                <div className="focus-setting-row">
                  <div className="focus-setting-info">
                    <Icon name="lightning-charge-fill" size={20} className="text-primary me-3" />
                    <div>
                      <strong>Focus Time</strong>
                      <p className="text-muted mb-0">Auto-calculated: 70% of total</p>
                    </div>
                  </div>
                  <div className="focus-setting-input">
                    <span className="text-muted">{focusMins} min</span>
                  </div>
                </div>

                <div className="focus-setting-row">
                  <div className="focus-setting-info">
                    <Icon name="cup-hot-fill" size={20} className="text-success me-3" />
                    <div>
                      <strong>Break Time</strong>
                      <p className="text-muted mb-0">Auto-calculated: 30% of total</p>
                    </div>
                  </div>
                  <div className="focus-setting-input">
                    <span className="text-muted">{breakMins} min</span>
                  </div>
                </div>

                {/* Visual ratio indicator */}
                <div className="focus-ratio">
                  <span className="focus-ratio__label">Auto Split: 70% Focus / 30% Break</span>
                  <div className="focus-ratio__bar">
                    <div className="focus-ratio__focus" style={{ width: `${focusPercent}%` }}>
                      {focusMins}m (70%)
                    </div>
                    <div className="focus-ratio__break" style={{ width: `${breakPercent}%` }}>
                      {breakMins}m (30%)
                    </div>
                  </div>
                </div>

                <div className="focus-tips">
                  <h6><Icon name="lightbulb" size={16} className="me-2" />Tips for better focus</h6>
                  <ul>
                    <li>Put your phone on silent or in another room</li>
                    <li>Close unnecessary browser tabs</li>
                    <li>Have water nearby to stay hydrated</li>
                    <li>Take proper breaks - stretch and move around</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Goals Tab - Goal Tracking & Progress Dashboard
// ─────────────────────────────────────────────────────────────────────────────
const GoalsTab = ({ goals, achievements, loading, onRefresh, onCreateGoal, onUpdateGoal, onDeleteGoal }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(100);
  const [newGoalUnit, setNewGoalUnit] = useState('points');
  const [newGoalCategory, setNewGoalCategory] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [creating, setCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const filteredGoals = filterStatus === 'all' ? goals : goals.filter(g => g.status === filterStatus);

  const handleCreate = async () => {
    if (!newGoalTitle.trim()) return;
    setCreating(true);
    try {
      await onCreateGoal({
        title: newGoalTitle,
        description: newGoalDesc,
        target_value: newGoalTarget,
        unit: newGoalUnit,
        category: newGoalCategory,
        deadline: newGoalDeadline || null,
      });
      setNewGoalTitle('');
      setNewGoalDesc('');
      setNewGoalTarget(100);
      setNewGoalUnit('points');
      setNewGoalCategory('');
      setNewGoalDeadline('');
      setShowModal(false);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateProgress = async (goal, newValue) => {
    await onUpdateGoal(goal.id, { current_value: newValue });
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="section-banner section-banner--purple">
            <div className="section-banner__content">
              <h2 className="section-banner__title">
                <Icon name="target" size={28} className="me-3" />
                Goals & Progress
              </h2>
              <p className="section-banner__subtitle">Track your progress and achieve your objectives</p>
            </div>
            <div className="section-banner__actions">
              <button className="btn btn-light btn-sm" onClick={onRefresh} disabled={loading}>
                <Icon name={loading ? 'arrow-repeat' : 'arrow-clockwise'} size={14} className={loading ? 'spin' : ''} />
                <span className="ms-2">Refresh</span>
              </button>
              <button className="btn btn-light btn-sm ms-2" onClick={() => setShowModal(true)}>
                <Icon name="plus-lg" size={14} />
                <span className="ms-2">New Goal</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="row g-4 mb-4">
        <div className="col-6 col-md-3">
          <StatCard icon="target" label="Total Goals" value={goals.length} accent="purple" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="play-circle" label="Active" value={activeGoals.length} accent="blue" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="check-circle-fill" label="Completed" value={completedGoals.length} accent="teal" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="trophy-fill" label="Achievements" value={achievements.length} accent="orange" />
        </div>
      </div>

      {/* Achievements Section */}
      {achievements.length > 0 && (
        <div className="row g-4 mb-4">
          <div className="col-12">
            <div className="panel">
              <div className="panel__header">
                <h3 className="panel__title"><Icon name="trophy-fill" size={18} className="me-2" />Recent Achievements</h3>
              </div>
              <div className="panel__body">
                <div className="achievements-grid">
                  {achievements.slice(0, 6).map(achievement => (
                    <div key={achievement.id} className="achievement-card">
                      <div className={`achievement-card__icon achievement-card__icon--${achievement.icon || 'trophy'}`}>
                        <Icon name={achievement.icon || 'trophy-fill'} size={24} />
                      </div>
                      <div className="achievement-card__content">
                        <h5 className="achievement-card__title">{achievement.title}</h5>
                        <p className="achievement-card__desc">{achievement.description}</p>
                        <span className="achievement-card__date">
                          {new Date(achievement.unlocked_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="btn-group">
            <button className={`btn ${filterStatus === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilterStatus('all')}>
              All
            </button>
            <button className={`btn ${filterStatus === 'active' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilterStatus('active')}>
              Active
            </button>
            <button className={`btn ${filterStatus === 'completed' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilterStatus('completed')}>
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Goals List */}
      <div className="row g-4">
        {filteredGoals.length === 0 ? (
          <div className="col-12">
            <div className="empty-state">
              <Icon name="target" size={48} />
              <h4>No goals found</h4>
              <p>Create your first goal to start tracking progress</p>
              <button className="btn btn-primary mt-3" onClick={() => setShowModal(true)}>
                Create Goal
              </button>
            </div>
          </div>
        ) : (
          filteredGoals.map(goal => (
            <div key={goal.id} className="col-lg-6">
              <div className={`panel goal-card ${goal.is_overdue ? 'goal-card--overdue' : ''}`}>
                <div className="panel__header">
                  <h3 className="panel__title">{goal.title}</h3>
                  <span className={`badge bg-${goal.status === 'completed' ? 'success' : goal.status === 'active' ? 'primary' : 'secondary'}`}>
                    {goal.status}
                  </span>
                </div>
                <div className="panel__body">
                  {goal.description && <p className="text-muted mb-3">{goal.description}</p>}
                  
                  <div className="goal-progress mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Progress</span>
                      <span className="fw-bold">{goal.progress_percentage.toFixed(1)}%</span>
                    </div>
                    <div className="progress" style={{ height: '12px' }}>
                      <div 
                        className={`progress-bar bg-${goal.status === 'completed' ? 'success' : 'primary'}`}
                        style={{ width: `${Math.min(100, goal.progress_percentage)}%` }}
                      />
                    </div>
                    <div className="d-flex justify-content-between mt-2 text-sm text-muted">
                      <span>{goal.current_value} {goal.unit}</span>
                      <span>{goal.target_value} {goal.unit}</span>
                    </div>
                  </div>

                  {goal.category && (
                    <div className="mb-2">
                      <span className="badge bg-secondary">{goal.category}</span>
                    </div>
                  )}

                  {goal.deadline && (
                    <div className="mb-3">
                      <Icon name="calendar" size={14} className="me-1" />
                      <span className="text-muted">
                        Deadline: {new Date(goal.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {goal.status === 'active' && (
                    <div className="d-flex gap-2">
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="Update progress"
                        min="0"
                        max={goal.target_value}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateProgress(goal, parseFloat(e.target.value));
                            e.target.value = '';
                          }
                        }}
                      />
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          const newValue = Math.min(goal.target_value, goal.current_value + (goal.target_value * 0.1));
                          handleUpdateProgress(goal, newValue);
                        }}
                      >
                        +10%
                      </button>
                    </div>
                  )}

                  <div className="d-flex gap-2 mt-3">
                    {goal.status === 'active' && (
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => onUpdateGoal(goal.id, { status: 'completed', current_value: goal.target_value })}
                      >
                        Complete
                      </button>
                    )}
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => onDeleteGoal(goal.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Goal Modal */}
      {showModal && (
        <div className="modal-backdrop show" onClick={() => setShowModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Goal</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newGoalTitle}
                    onChange={e => setNewGoalTitle(e.target.value)}
                    placeholder="What do you want to achieve?"
                    autoFocus
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    value={newGoalDesc}
                    onChange={e => setNewGoalDesc(e.target.value)}
                    placeholder="Add more details..."
                    rows={3}
                  />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Target Value</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newGoalTarget}
                      onChange={e => setNewGoalTarget(parseFloat(e.target.value) || 0)}
                      min="1"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Unit</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newGoalUnit}
                      onChange={e => setNewGoalUnit(e.target.value)}
                      placeholder="e.g., hours, pages, tasks"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newGoalCategory}
                    onChange={e => setNewGoalCategory(e.target.value)}
                    placeholder="e.g., Study, Fitness, Career"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Deadline (optional)</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={newGoalDeadline}
                    onChange={e => setNewGoalDeadline(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !newGoalTitle.trim()}>
                  {creating ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Analytics Tab - Time Analytics & Productivity Insights
// ─────────────────────────────────────────────────────────────────────────────
const AnalyticsTab = ({ timeData, loading, onRefresh }) => {
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedActivity, setSelectedActivity] = useState('all');

  const analytics = timeData?.analytics || {};
  const entries = timeData?.entries || [];
  const dailyBreakdown = analytics.daily_breakdown || [];
  const activityBreakdown = analytics.activity_breakdown || {};

  // Prepare chart data
  const chartData = dailyBreakdown.slice(-14).map(day => ({
    date: day.date,
    minutes: day.total_minutes,
    hours: (day.total_minutes / 60).toFixed(1),
  }));

  const maxMinutes = Math.max(...chartData.map(d => d.minutes), 1);

  // Activity type colors
  const activityColors = {
    study: 'blue',
    work: 'purple',
    exercise: 'teal',
    break: 'orange',
    other: 'gray',
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="section-banner section-banner--blue">
            <div className="section-banner__content">
              <h2 className="section-banner__title">
                <Icon name="graph-up-arrow" size={28} className="me-3" />
                Time Analytics
              </h2>
              <p className="section-banner__subtitle">Track and analyze your productivity patterns</p>
            </div>
            <div className="section-banner__actions">
              <div className="btn-group me-2">
                <button 
                  className={`btn btn-sm ${selectedDays === 7 ? 'btn-light' : 'btn-outline-light'}`}
                  onClick={() => setSelectedDays(7)}
                >
                  7 days
                </button>
                <button 
                  className={`btn btn-sm ${selectedDays === 30 ? 'btn-light' : 'btn-outline-light'}`}
                  onClick={() => setSelectedDays(30)}
                >
                  30 days
                </button>
                <button 
                  className={`btn btn-sm ${selectedDays === 90 ? 'btn-light' : 'btn-outline-light'}`}
                  onClick={() => setSelectedDays(90)}
                >
                  90 days
                </button>
              </div>
              <button className="btn btn-light btn-sm" onClick={onRefresh} disabled={loading}>
                <Icon name={loading ? 'arrow-repeat' : 'arrow-clockwise'} size={14} className={loading ? 'spin' : ''} />
                <span className="ms-2">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="row g-4 mb-4">
        <div className="col-6 col-md-3">
          <StatCard icon="clock-history" label="Total Time" value={`${analytics.total_hours || 0}h`} accent="blue" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="calendar-day" label="Avg Daily" value={`${Math.round(analytics.avg_daily_minutes || 0)}m`} accent="purple" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="calendar-week" label="Avg Weekly" value={`${analytics.avg_weekly_hours?.toFixed(1) || 0}h`} accent="teal" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="list-check" label="Total Sessions" value={entries.length} accent="orange" />
        </div>
      </div>

      {/* Activity Breakdown */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="panel">
            <div className="panel__header">
              <h3 className="panel__title"><Icon name="pie-chart-fill" size={18} className="me-2" />Activity Breakdown</h3>
            </div>
            <div className="panel__body">
              {Object.keys(activityBreakdown).length === 0 ? (
                <div className="empty-state empty-state--compact">
                  <Icon name="bar-chart" size={32} />
                  <p>No activity data yet</p>
                </div>
              ) : (
                <div className="activity-breakdown">
                  {Object.entries(activityBreakdown).map(([type, minutes]) => {
                    const hours = (minutes / 60).toFixed(1);
                    const percentage = analytics.total_minutes > 0 ? (minutes / analytics.total_minutes * 100).toFixed(1) : 0;
                    return (
                      <div key={type} className="activity-item">
                        <div className="activity-item__header">
                          <div className="d-flex align-items-center gap-2">
                            <span className={`badge bg-${activityColors[type] || 'secondary'}`}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                            <span className="fw-bold">{hours}h</span>
                            <span className="text-muted">({percentage}%)</span>
                          </div>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div 
                            className={`progress-bar bg-${activityColors[type] || 'secondary'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="panel">
            <div className="panel__header">
              <h3 className="panel__title"><Icon name="graph-up" size={18} className="me-2" />Daily Activity (Last 14 Days)</h3>
            </div>
            <div className="panel__body">
              {chartData.length === 0 ? (
                <div className="empty-state empty-state--compact">
                  <Icon name="bar-chart" size={32} />
                  <p>No data available</p>
                </div>
              ) : (
                <div className="analytics-chart">
                  <div className="analytics-chart__bars">
                    {chartData.map((day, i) => {
                      const date = new Date(day.date);
                      const dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      return (
                        <div key={i} className="analytics-chart__bar-wrapper">
                          <div 
                            className="analytics-chart__bar"
                            style={{ height: `${(day.minutes / maxMinutes) * 100}%` }}
                            title={`${day.hours}h on ${dayLabel}`}
                          />
                          <span className="analytics-chart__label">{dayLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="row g-4">
        <div className="col-12">
          <div className="panel">
            <div className="panel__header">
              <h3 className="panel__title"><Icon name="clock-history" size={18} className="me-2" />Recent Time Entries</h3>
            </div>
            <div className="panel__body">
              {entries.length === 0 ? (
                <div className="empty-state empty-state--compact">
                  <Icon name="clock" size={32} />
                  <p>No time entries yet. Start tracking your time!</p>
                </div>
              ) : (
                <div className="time-entries-list">
                  {entries.slice(0, 20).map(entry => {
                    const start = new Date(entry.start_time);
                    const end = entry.end_time ? new Date(entry.end_time) : null;
                    return (
                      <div key={entry.id} className="time-entry-item">
                        <div className={`time-entry-item__icon time-entry-item__icon--${activityColors[entry.activity_type] || 'gray'}`}>
                          <Icon name="circle-fill" size={12} />
                        </div>
                        <div className="time-entry-item__content">
                          <span className="time-entry-item__type">{entry.activity_type}</span>
                          {entry.description && (
                            <span className="time-entry-item__desc">{entry.description}</span>
                          )}
                          <span className="time-entry-item__time">
                            {start.toLocaleDateString()} {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            {end && ` - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                          </span>
                        </div>
                        <div className="time-entry-item__duration">
                          {entry.duration_minutes > 0 ? `${entry.duration_minutes}m` : 'Active'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Habits Tab - Habit Tracker & Streak System
// ─────────────────────────────────────────────────────────────────────────────
const HabitsTab = ({ habits, loading, onRefresh, onCreateHabit, onUpdateHabit, onDeleteHabit, onToggleCompletion }) => {
  const [showModal, setShowModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDesc, setNewHabitDesc] = useState('');
  const [newHabitColor, setNewHabitColor] = useState('blue');
  const [newHabitIcon, setNewHabitIcon] = useState('star');
  const [creating, setCreating] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [completions, setCompletions] = useState({});

  const activeHabits = habits.filter(h => h.is_active);
  const totalStreak = activeHabits.reduce((sum, h) => sum + h.current_streak, 0);

  useEffect(() => {
    // Fetch completions for all habits
    activeHabits.forEach(habit => {
      if (!completions[habit.id]) {
        fetchCompletions(habit.id);
      }
    });
  }, [habits]);

  const fetchCompletions = async (habitId) => {
    try {
      const data = await apiFetch(`${CONFIG.routes.apiHabits}${habitId}/completions/`);
      setCompletions(prev => ({ ...prev, [habitId]: data.completions || [] }));
    } catch (err) {
      console.error('Failed to fetch completions:', err);
    }
  };

  const handleCreate = async () => {
    if (!newHabitName.trim()) return;
    setCreating(true);
    try {
      await onCreateHabit({
        name: newHabitName,
        description: newHabitDesc,
        color: newHabitColor,
        icon: newHabitIcon,
      });
      setNewHabitName('');
      setNewHabitDesc('');
      setNewHabitColor('blue');
      setNewHabitIcon('star');
      setShowModal(false);
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (habitId) => {
    try {
      const result = await onToggleCompletion(habitId);
      if (result) {
        fetchCompletions(habitId);
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    }
  };

  const getStreakCalendar = (habit) => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const completion = completions[habit.id]?.find(c => c.date === dateStr);
      days.push({
        date: dateStr,
        dateObj: date,
        completed: completion?.completed || false,
      });
    }
    return days;
  };

  const colorOptions = ['blue', 'purple', 'teal', 'orange', 'green', 'red'];
  const iconOptions = ['star', 'heart', 'fire', 'trophy', 'check-circle', 'lightning', 'book', 'dumbbell'];

  return (
    <div className="container-fluid px-4 py-4">
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="section-banner section-banner--orange">
            <div className="section-banner__content">
              <h2 className="section-banner__title">
                <Icon name="fire" size={28} className="me-3" />
                Habit Tracker
              </h2>
              <p className="section-banner__subtitle">Build consistent study habits with visual streaks</p>
            </div>
            <div className="section-banner__actions">
              <button className="btn btn-light btn-sm" onClick={onRefresh} disabled={loading}>
                <Icon name={loading ? 'arrow-repeat' : 'arrow-clockwise'} size={14} className={loading ? 'spin' : ''} />
                <span className="ms-2">Refresh</span>
              </button>
              <button className="btn btn-light btn-sm ms-2" onClick={() => setShowModal(true)}>
                <Icon name="plus-lg" size={14} />
                <span className="ms-2">New Habit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="row g-4 mb-4">
        <div className="col-6 col-md-3">
          <StatCard icon="fire" label="Active Habits" value={activeHabits.length} accent="orange" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="lightning-charge" label="Total Streak" value={totalStreak} accent="blue" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="trophy" label="Longest Streak" value={Math.max(...activeHabits.map(h => h.longest_streak), 0)} accent="purple" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="calendar-check" label="Today's Completions" value={activeHabits.filter(h => {
            const today = new Date().toISOString().split('T')[0];
            return completions[h.id]?.some(c => c.date === today && c.completed);
          }).length} accent="teal" />
        </div>
      </div>

      {/* Habits Grid */}
      <div className="row g-4">
        {activeHabits.length === 0 ? (
          <div className="col-12">
            <div className="empty-state">
              <Icon name="fire" size={48} />
              <h4>No habits yet</h4>
              <p>Create your first habit to start building streaks</p>
              <button className="btn btn-primary mt-3" onClick={() => setShowModal(true)}>
                Create Habit
              </button>
            </div>
          </div>
        ) : (
          activeHabits.map(habit => {
            const streakCalendar = getStreakCalendar(habit);
            const today = new Date().toISOString().split('T')[0];
            const todayCompleted = completions[habit.id]?.find(c => c.date === today)?.completed || false;

            return (
              <div key={habit.id} className="col-lg-6">
                <div className="panel habit-card">
                  <div className="panel__header">
                    <div className="d-flex align-items-center gap-2">
                      <div className={`habit-icon habit-icon--${habit.color}`}>
                        <Icon name={habit.icon} size={20} />
                      </div>
                      <h3 className="panel__title mb-0">{habit.name}</h3>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-primary">
                        <Icon name="fire" size={12} className="me-1" />
                        {habit.current_streak} day streak
                      </span>
                    </div>
                  </div>
                  <div className="panel__body">
                    {habit.description && <p className="text-muted mb-3">{habit.description}</p>}

                    {/* Streak Calendar */}
                    <div className="habit-calendar mb-3">
                      <div className="habit-calendar__header">
                        <span className="text-muted">Last 30 days</span>
                        <span className="text-muted">
                          Longest: {habit.longest_streak} days
                        </span>
                      </div>
                      <div className="habit-calendar__grid">
                        {streakCalendar.map((day, i) => (
                          <div
                            key={i}
                            className={`habit-calendar__day ${day.completed ? `habit-calendar__day--${habit.color}` : ''} ${day.dateObj.toDateString() === new Date().toDateString() ? 'habit-calendar__day--today' : ''}`}
                            title={`${day.date} - ${day.completed ? 'Completed' : 'Not completed'}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Toggle Today */}
                    <div className="d-flex gap-2">
                      <button
                        className={`btn btn-lg flex-fill ${todayCompleted ? `btn-${habit.color}` : 'btn-outline-secondary'}`}
                        onClick={() => handleToggle(habit.id)}
                      >
                        <Icon name={todayCompleted ? 'check-circle-fill' : 'circle'} size={20} className="me-2" />
                        {todayCompleted ? 'Completed Today' : 'Mark as Complete'}
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => onDeleteHabit(habit.id)}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Habit Modal */}
      {showModal && (
        <div className="modal-backdrop show" onClick={() => setShowModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Habit</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Habit Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newHabitName}
                    onChange={e => setNewHabitName(e.target.value)}
                    placeholder="e.g., Read for 30 minutes"
                    autoFocus
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    value={newHabitDesc}
                    onChange={e => setNewHabitDesc(e.target.value)}
                    placeholder="Add more details..."
                    rows={2}
                  />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Color</label>
                    <div className="d-flex gap-2 flex-wrap">
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          className={`btn ${newHabitColor === color ? `btn-${color}` : `btn-outline-${color}`}`}
                          onClick={() => setNewHabitColor(color)}
                          style={{ width: '40px', height: '40px' }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Icon</label>
                    <select
                      className="form-select"
                      value={newHabitIcon}
                      onChange={e => setNewHabitIcon(e.target.value)}
                    >
                      {iconOptions.map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !newHabitName.trim()}>
                  {creating ? 'Creating...' : 'Create Habit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main App Component
// ─────────────────────────────────────────────────────────────────────────────
const App = () => {
  const initialPayload = CONFIG.initialPayload || {};
  
  const [activeTab, setActiveTab] = useState('overview');
  const [emails, setEmails] = useState(initialPayload.emails || []);
  const [tasks, setTasks] = useState(initialPayload.tasks || []);
  const [events, setEvents] = useState(initialPayload.events || []);
  const [goals, setGoals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [timeData, setTimeData] = useState(null);
  const [habits, setHabits] = useState([]);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [focusMins, setFocusMins] = useState(25);
  
  const [loading, setLoading] = useState({ 
    emails: !initialPayload.emails?.length, 
    tasks: !initialPayload.tasks?.length, 
    events: !initialPayload.events?.length,
    goals: true,
    achievements: true,
    timeTracking: true,
    habits: true,
  });

  useEffect(() => {
    if (!initialPayload.emails?.length) fetchEmails();
    if (!initialPayload.tasks?.length) fetchTasks();
    if (!initialPayload.events?.length) fetchEvents();
    fetchGoals();
    fetchAchievements();
    fetchTimeTracking();
    fetchHabits();
  }, []);

  const fetchEmails = async () => {
    setLoading(prev => ({ ...prev, emails: true }));
    try {
      const data = await apiFetch(CONFIG.routes.apiEmails);
      setEmails(data.emails || []);
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setLoading(prev => ({ ...prev, emails: false }));
    }
  };

  const fetchTasks = async () => {
    setLoading(prev => ({ ...prev, tasks: true }));
    try {
      const data = await apiFetch(CONFIG.routes.apiTasks);
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  const fetchEvents = async () => {
    setLoading(prev => ({ ...prev, events: true }));
    try {
      const data = await apiFetch(CONFIG.routes.apiCalendar);
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
  };

  const handleCreateTask = async (title, description) => {
    const data = await apiFetch(CONFIG.routes.apiTasksCreate, {
      method: 'POST',
      body: JSON.stringify({ title, description })
    });
    if (data.task) {
      setTasks(prev => [...prev, data.task]);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    
    try {
      const data = await apiFetch(`/api/tasks/${taskId}/update/`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      if (data.task) {
        setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
      }
    } catch (err) {
      // Revert on error
      fetchTasks();
    }
  };

  const handleDeleteTask = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await apiFetch(`/api/tasks/${taskId}/delete/`, { method: 'DELETE' });
    } catch (err) {
      fetchTasks();
    }
  };

  // Goals handlers
  const fetchGoals = async () => {
    setLoading(prev => ({ ...prev, goals: true }));
    try {
      const data = await apiFetch(CONFIG.routes.apiGoals);
      setGoals(data.goals || []);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(prev => ({ ...prev, goals: false }));
    }
  };

  const fetchAchievements = async () => {
    setLoading(prev => ({ ...prev, achievements: true }));
    try {
      const data = await apiFetch(CONFIG.routes.apiAchievements);
      setAchievements(data.achievements || []);
    } catch (err) {
      console.error('Failed to fetch achievements:', err);
    } finally {
      setLoading(prev => ({ ...prev, achievements: false }));
    }
  };

  const handleCreateGoal = async (goalData) => {
    const data = await apiFetch(CONFIG.routes.apiGoalsCreate, {
      method: 'POST',
      body: JSON.stringify(goalData)
    });
    if (data.goal) {
      setGoals(prev => [...prev, data.goal]);
      fetchAchievements();
    }
  };

  const handleUpdateGoal = async (goalId, updates) => {
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...updates } : g));
    try {
      const data = await apiFetch(`/api/goals/${goalId}/update/`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      if (data.goal) {
        setGoals(prev => prev.map(g => g.id === goalId ? data.goal : g));
        fetchAchievements();
      }
    } catch (err) {
      fetchGoals();
    }
  };

  const handleDeleteGoal = async (goalId) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
    try {
      await apiFetch(`/api/goals/${goalId}/delete/`, { method: 'DELETE' });
    } catch (err) {
      fetchGoals();
    }
  };

  // Time Tracking handlers
  const fetchTimeTracking = async () => {
    setLoading(prev => ({ ...prev, timeTracking: true }));
    try {
      const data = await apiFetch(CONFIG.routes.apiTimeTracking);
      setTimeData(data);
    } catch (err) {
      console.error('Failed to fetch time tracking:', err);
    } finally {
      setLoading(prev => ({ ...prev, timeTracking: false }));
    }
  };

  // Habits handlers
  const fetchHabits = async () => {
    setLoading(prev => ({ ...prev, habits: true }));
    try {
      const data = await apiFetch(CONFIG.routes.apiHabits);
      setHabits(data.habits || []);
    } catch (err) {
      console.error('Failed to fetch habits:', err);
    } finally {
      setLoading(prev => ({ ...prev, habits: false }));
    }
  };

  const handleCreateHabit = async (habitData) => {
    const data = await apiFetch(CONFIG.routes.apiHabitsCreate, {
      method: 'POST',
      body: JSON.stringify(habitData)
    });
    if (data.habit) {
      setHabits(prev => [...prev, data.habit]);
    }
  };

  const handleUpdateHabit = async (habitId, updates) => {
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, ...updates } : h));
    try {
      const data = await apiFetch(`/api/habits/${habitId}/update/`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      if (data.habit) {
        setHabits(prev => prev.map(h => h.id === habitId ? data.habit : h));
      }
    } catch (err) {
      fetchHabits();
    }
  };

  const handleDeleteHabit = async (habitId) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    try {
      await apiFetch(`/api/habits/${habitId}/delete/`, { method: 'DELETE' });
    } catch (err) {
      fetchHabits();
    }
  };

  const handleToggleHabitCompletion = async (habitId) => {
    try {
      const data = await apiFetch(`/api/habits/${habitId}/toggle/`, { method: 'POST' });
      if (data.success) {
        fetchHabits();
        return true;
      }
    } catch (err) {
      console.error('Failed to toggle habit:', err);
    }
    return false;
  };

  const counts = {
    emails: emails.length,
    tasks: tasks.filter(t => t.status !== 'done').length,
    events: events.length,
    goals: goals.filter(g => g.status === 'active').length,
    habits: habits.filter(h => h.is_active).length,
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef(null);
  
  const handleSearch = (query) => {
    setSearchQuery(query);
    setShowSearchResults(query && query.trim().length > 0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
      // Escape to close search results
      if (e.key === 'Escape' && showSearchResults) {
        setShowSearchResults(false);
        setSearchQuery('');
        if (searchInputRef.current) {
          searchInputRef.current.blur();
        }
      }
      // Number keys 1-8 to switch tabs
      if (e.key >= '1' && e.key <= '8' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const tabs = ['overview', 'inbox', 'tasks', 'calendar', 'goals', 'analytics', 'habits', 'focus'];
        const tabIndex = parseInt(e.key) - 1;
        if (tabIndex < tabs.length) {
          setActiveTab(tabs[tabIndex]);
        }
      }
      // ? to show keyboard shortcuts
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setShowShortcuts(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearchResults]);
  
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const handleCreateTaskQuick = () => {
    setActiveTab('tasks');
    // The task creation modal will be handled by TasksTab
  };

  return (
    <div className="app-shell">
      <Header user={CONFIG.user} onSearch={handleSearch} searchInputRef={searchInputRef} />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />
      {showSearchResults && (
        <SearchResults
          query={searchQuery}
          emails={emails}
          tasks={tasks}
          onClose={() => {
            setShowSearchResults(false);
            setSearchQuery('');
          }}
          onNavigate={setActiveTab}
        />
      )}
      <KeyboardShortcuts show={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <QuickActions onNavigate={setActiveTab} onCreateTask={handleCreateTaskQuick} />
      <main className="app-main">
        {activeTab === 'overview' && (
          <OverviewTab
            emails={emails}
            tasks={tasks}
            events={events}
            pomodoroCount={pomodoroCount}
            focusMins={focusMins}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'inbox' && (
          <InboxTab emails={emails} loading={loading.emails} onRefresh={fetchEmails} />
        )}
        {activeTab === 'tasks' && (
          <TasksTab
            tasks={tasks}
            loading={loading.tasks}
            onRefresh={fetchTasks}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarTab events={events} loading={loading.events} onRefresh={fetchEvents} />
        )}
        {activeTab === 'goals' && (
          <GoalsTab
            goals={goals}
            achievements={achievements}
            loading={loading.goals}
            onRefresh={fetchGoals}
            onCreateGoal={handleCreateGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab
            timeData={timeData}
            loading={loading.timeTracking}
            onRefresh={fetchTimeTracking}
          />
        )}
        {activeTab === 'habits' && (
          <HabitsTab
            habits={habits}
            loading={loading.habits}
            onRefresh={fetchHabits}
            onCreateHabit={handleCreateHabit}
            onUpdateHabit={handleUpdateHabit}
            onDeleteHabit={handleDeleteHabit}
            onToggleCompletion={handleToggleHabitCompletion}
          />
        )}
        {activeTab === 'focus' && (
          <FocusTab
            pomodoroCount={pomodoroCount}
            onPomodoroComplete={() => setPomodoroCount(prev => prev + 1)}
          />
        )}
      </main>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Mount Application
// ─────────────────────────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('app-root'));
root.render(<App />);

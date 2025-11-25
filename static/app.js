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
// Header Component
// ─────────────────────────────────────────────────────────────────────────────
const Header = ({ user }) => {
  const initials = user.givenName ? user.givenName[0].toUpperCase() : user.email[0]?.toUpperCase() || '?';
  
  return (
    <header className="app-header">
      <div className="container-fluid px-4">
        <div className="d-flex align-items-center justify-content-between py-3">
          <div className="d-flex align-items-center gap-3">
            <h1 className="brand-logo mb-0">Eduverse</h1>
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
// Tab Navigation
// ─────────────────────────────────────────────────────────────────────────────
const TabNav = ({ activeTab, onTabChange, counts }) => {
  const tabs = [
    { id: 'overview', icon: 'grid-1x2-fill', label: 'Overview' },
    { id: 'inbox', icon: 'envelope-fill', label: 'Inbox', count: counts.emails },
    { id: 'tasks', icon: 'check2-square', label: 'Tasks', count: counts.tasks },
    { id: 'calendar', icon: 'calendar3', label: 'Calendar', count: counts.events },
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
              <span className="badge bg-primary">{emails.length}</span>
            </div>
            <div className="panel__body p-0">
              {loading && emails.length === 0 ? (
                <div className="loading-state">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="ms-2">Loading emails...</span>
                </div>
              ) : emails.length === 0 ? (
                <div className="empty-state">
                  <Icon name="inbox" size={48} />
                  <h4>All caught up!</h4>
                  <p>No emails in your inbox</p>
                </div>
              ) : (
                <div className="email-list-container">
                  {emails.map(email => (
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

  const columns = [
    { id: 'not-started', label: 'To Do', icon: 'circle', color: 'secondary', accent: 'purple' },
    { id: 'in-progress', label: 'In Progress', icon: 'play-circle-fill', color: 'primary', accent: 'blue' },
    { id: 'done', label: 'Done', icon: 'check-circle-fill', color: 'success', accent: 'teal' }
  ];

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

      {/* Kanban Board */}
      <div className="row g-4">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
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
  const [focusMins, setFocusMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState([]); // Track completed sessions

  const totalTime = mode === 'focus' ? focusMins * 60 : breakMins * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const focusTimeHours = Math.round(pomodoroCount * focusMins / 60 * 10) / 10;

  // Calculate total cycle time and segments for timeline
  const totalCycleTime = focusMins + breakMins;
  const focusPercent = (focusMins / totalCycleTime) * 100;
  const breakPercent = (breakMins / totalCycleTime) * 100;

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      
      // Record completed session
      setSessions(prev => [...prev, { type: mode, duration: mode === 'focus' ? focusMins : breakMins, completedAt: new Date() }]);
      
      if (mode === 'focus') {
        onPomodoroComplete();
        setMode('break');
        setTimeLeft(breakMins * 60);
      } else {
        setMode('focus');
        setTimeLeft(focusMins * 60);
      }
      if (Notification.permission === 'granted') {
        new Notification(mode === 'focus' ? 'Focus session complete! Time for a break.' : 'Break is over! Ready to focus?');
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, focusMins, breakMins, onPomodoroComplete]);

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
    setTimeLeft(mode === 'focus' ? focusMins * 60 : breakMins * 60);
  };

  const handleModeSwitch = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? focusMins * 60 : breakMins * 60);
  };

  const handleFocusChange = (val) => {
    setFocusMins(val);
    if (mode === 'focus' && !isRunning) setTimeLeft(val * 60);
  };

  const handleBreakChange = (val) => {
    setBreakMins(val);
    if (mode === 'break' && !isRunning) setTimeLeft(val * 60);
  };

  // Generate planned sessions for the day (e.g., 8 cycles)
  const plannedCycles = 8;

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
          <StatCard icon="lightning-charge-fill" label="Focus duration" value={`${focusMins}m`} accent="purple" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="cup-hot-fill" label="Break duration" value={`${breakMins}m`} accent="teal" />
        </div>
      </div>

      {/* Session Timeline */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="panel">
            <div className="panel__header">
              <h3 className="panel__title"><Icon name="clock-history" size={18} className="me-2" />Session Timeline</h3>
              <span className="text-muted">{focusMins}m focus + {breakMins}m break = {totalCycleTime}m cycle</span>
            </div>
            <div className="panel__body">
              <div className="session-timeline">
                <div className="session-timeline__legend">
                  <span className="session-timeline__legend-item">
                    <span className="session-timeline__legend-dot session-timeline__legend-dot--focus"></span>
                    Focus ({focusMins}m)
                  </span>
                  <span className="session-timeline__legend-item">
                    <span className="session-timeline__legend-dot session-timeline__legend-dot--break"></span>
                    Break ({breakMins}m)
                  </span>
                </div>
                <div className="session-timeline__bar">
                  {Array.from({ length: plannedCycles }).map((_, i) => (
                    <div key={i} className="session-timeline__cycle" style={{ flex: 1 }}>
                      <div 
                        className={`session-timeline__segment session-timeline__segment--focus ${i < pomodoroCount ? 'session-timeline__segment--completed' : ''} ${i === pomodoroCount && mode === 'focus' && isRunning ? 'session-timeline__segment--active' : ''}`}
                        style={{ width: `${focusPercent}%` }}
                      >
                        {i < pomodoroCount && <Icon name="check" size={10} />}
                      </div>
                      <div 
                        className={`session-timeline__segment session-timeline__segment--break ${i < pomodoroCount ? 'session-timeline__segment--completed' : ''} ${i === pomodoroCount && mode === 'break' && isRunning ? 'session-timeline__segment--active' : ''}`}
                        style={{ width: `${breakPercent}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="session-timeline__labels">
                  {Array.from({ length: plannedCycles }).map((_, i) => (
                    <span key={i} className="session-timeline__label">{i + 1}</span>
                  ))}
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
              <div className="focus-mode-toggle-sm">
                <button
                  className={`focus-mode-btn-sm ${mode === 'focus' ? 'focus-mode-btn-sm--active' : ''}`}
                  onClick={() => handleModeSwitch('focus')}
                >
                  Focus
                </button>
                <button
                  className={`focus-mode-btn-sm ${mode === 'break' ? 'focus-mode-btn-sm--active focus-mode-btn-sm--break' : ''}`}
                  onClick={() => handleModeSwitch('break')}
                >
                  Break
                </button>
              </div>
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
                    <Icon name="lightning-charge-fill" size={20} className="text-primary me-3" />
                    <div>
                      <strong>Focus Duration</strong>
                      <p className="text-muted mb-0">Time for deep work</p>
                    </div>
                  </div>
                  <div className="focus-setting-input">
                    <button className="btn btn-ghost btn-sm" onClick={() => handleFocusChange(Math.max(5, focusMins - 5))} disabled={isRunning}>
                      <Icon name="dash" size={14} />
                    </button>
                    <input
                      type="number"
                      value={focusMins}
                      onChange={e => handleFocusChange(parseInt(e.target.value) || 1)}
                      min="5"
                      max="60"
                      disabled={isRunning}
                    />
                    <button className="btn btn-ghost btn-sm" onClick={() => handleFocusChange(Math.min(60, focusMins + 5))} disabled={isRunning}>
                      <Icon name="plus" size={14} />
                    </button>
                    <span>min</span>
                  </div>
                </div>

                <div className="focus-setting-row">
                  <div className="focus-setting-info">
                    <Icon name="cup-hot-fill" size={20} className="text-success me-3" />
                    <div>
                      <strong>Break Duration</strong>
                      <p className="text-muted mb-0">Time to rest and recharge</p>
                    </div>
                  </div>
                  <div className="focus-setting-input">
                    <button className="btn btn-ghost btn-sm" onClick={() => handleBreakChange(Math.max(1, breakMins - 1))} disabled={isRunning}>
                      <Icon name="dash" size={14} />
                    </button>
                    <input
                      type="number"
                      value={breakMins}
                      onChange={e => handleBreakChange(parseInt(e.target.value) || 1)}
                      min="1"
                      max="30"
                      disabled={isRunning}
                    />
                    <button className="btn btn-ghost btn-sm" onClick={() => handleBreakChange(Math.min(30, breakMins + 1))} disabled={isRunning}>
                      <Icon name="plus" size={14} />
                    </button>
                    <span>min</span>
                  </div>
                </div>

                {/* Visual ratio indicator */}
                <div className="focus-ratio">
                  <span className="focus-ratio__label">Session ratio</span>
                  <div className="focus-ratio__bar">
                    <div className="focus-ratio__focus" style={{ width: `${focusPercent}%` }}>
                      {focusMins}m
                    </div>
                    <div className="focus-ratio__break" style={{ width: `${breakPercent}%` }}>
                      {breakMins}m
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
// Main App Component
// ─────────────────────────────────────────────────────────────────────────────
const App = () => {
  const initialPayload = CONFIG.initialPayload || {};
  
  const [activeTab, setActiveTab] = useState('overview');
  const [emails, setEmails] = useState(initialPayload.emails || []);
  const [tasks, setTasks] = useState(initialPayload.tasks || []);
  const [events, setEvents] = useState(initialPayload.events || []);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [focusMins, setFocusMins] = useState(25);
  
  const [loading, setLoading] = useState({ 
    emails: !initialPayload.emails?.length, 
    tasks: !initialPayload.tasks?.length, 
    events: !initialPayload.events?.length 
  });

  useEffect(() => {
    if (!initialPayload.emails?.length) fetchEmails();
    if (!initialPayload.tasks?.length) fetchTasks();
    if (!initialPayload.events?.length) fetchEvents();
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

  const counts = {
    emails: emails.length,
    tasks: tasks.filter(t => t.status !== 'done').length,
    events: events.length
  };

  return (
    <div className="app-shell">
      <Header user={CONFIG.user} />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />
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

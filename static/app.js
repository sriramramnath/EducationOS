/* ═══════════════════════════════════════════════════════════════════════════
   Eduverse — React Dashboard Application
   ═══════════════════════════════════════════════════════════════════════════ */

const { useState, useEffect, useCallback, useMemo } = React;

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
const StatCard = ({ icon, label, value, accent, onClick }) => (
  <div className={`stat-card ${accent ? 'stat-card--' + accent : ''}`} onClick={onClick} role={onClick ? 'button' : undefined}>
    <div className="stat-card__icon">
      <Icon name={icon} size={24} />
    </div>
    <div className="stat-card__content">
      <span className="stat-card__value">{value}</span>
      <span className="stat-card__label">{label}</span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Overview Tab
// ─────────────────────────────────────────────────────────────────────────────
const OverviewTab = ({ emails, tasks, events, pomodoroCount, onNavigate }) => {
  const activeTasks = tasks.filter(t => t.status !== 'done').length;
  const todayEvents = useMemo(() => {
    const today = new Date().toDateString();
    return events.filter(e => new Date(e.start).toDateString() === today);
  }, [events]);

  return (
    <div className="container-fluid px-4 py-4">
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="welcome-banner">
            <div className="welcome-banner__content">
              <h2 className="welcome-banner__title">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {CONFIG.user.givenName || 'there'}
              </h2>
              <p className="welcome-banner__subtitle">Here's your productivity snapshot for today</p>
            </div>
            <div className="welcome-banner__illustration">
              <Icon name="rocket-takeoff-fill" size={48} />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard icon="envelope-fill" label="Unread emails" value={emails.length} accent="blue" onClick={() => onNavigate('inbox')} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="check2-square" label="Active tasks" value={activeTasks} accent="purple" onClick={() => onNavigate('tasks')} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="calendar-event" label="Today's events" value={todayEvents.length} accent="teal" onClick={() => onNavigate('calendar')} />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard icon="bullseye" label="Focus sessions" value={pomodoroCount} accent="orange" onClick={() => onNavigate('focus')} />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
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

        <div className="col-lg-6">
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
// Inbox Tab
// ─────────────────────────────────────────────────────────────────────────────
const InboxTab = ({ emails, loading, onRefresh }) => {
  const [selectedEmail, setSelectedEmail] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="panel panel--full-height">
        <div className="panel__header">
          <h3 className="panel__title"><Icon name="envelope-fill" size={18} className="me-2" />Inbox</h3>
          <button className="btn btn-outline-secondary btn-sm" onClick={onRefresh} disabled={loading}>
            <Icon name={loading ? 'arrow-repeat' : 'arrow-clockwise'} size={14} className={loading ? 'spin' : ''} />
            <span className="ms-2">Refresh</span>
          </button>
        </div>
        <div className="panel__body p-0">
          <div className="inbox-layout">
            <div className={`inbox-list ${selectedEmail ? 'inbox-list--collapsed' : ''}`}>
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
                emails.map(email => (
                  <div
                    key={email.id}
                    className={`email-row ${selectedEmail?.id === email.id ? 'email-row--active' : ''}`}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="email-row__sender">{email.sender?.split('<')[0]?.trim() || 'Unknown'}</div>
                    <div className="email-row__content">
                      <span className="email-row__subject">{email.subject || '(No subject)'}</span>
                      <span className="email-row__snippet"> — {email.snippet}</span>
                    </div>
                    <div className="email-row__date">{formatDate(email.date)}</div>
                  </div>
                ))
              )}
            </div>
            {selectedEmail && (
              <div className="inbox-detail">
                <div className="inbox-detail__header">
                  <button className="btn btn-ghost btn-sm d-lg-none" onClick={() => setSelectedEmail(null)}>
                    <Icon name="arrow-left" size={16} />
                    <span className="ms-2">Back</span>
                  </button>
                  <h4 className="inbox-detail__subject">{selectedEmail.subject || '(No subject)'}</h4>
                </div>
                <div className="inbox-detail__meta">
                  <strong>{selectedEmail.sender}</strong>
                  <span className="text-muted ms-2">{formatDate(selectedEmail.date)}</span>
                </div>
                <div className="inbox-detail__body">
                  {selectedEmail.body || selectedEmail.snippet || 'No content available'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tasks Tab
// ─────────────────────────────────────────────────────────────────────────────
const TasksTab = ({ tasks, loading, onRefresh, onCreateTask, onUpdateTask, onDeleteTask }) => {
  const [showModal, setShowModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const columns = [
    { id: 'not-started', label: 'To Do', icon: 'circle', color: 'secondary' },
    { id: 'in-progress', label: 'In Progress', icon: 'play-circle-fill', color: 'primary' },
    { id: 'done', label: 'Done', icon: 'check-circle-fill', color: 'success' }
  ];

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

  return (
    <div className="container-fluid px-4 py-4">
      <div className="panel panel--full-height">
        <div className="panel__header">
          <h3 className="panel__title"><Icon name="check2-square" size={18} className="me-2" />Tasks</h3>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={onRefresh} disabled={loading}>
              <Icon name={loading ? 'arrow-repeat' : 'arrow-clockwise'} size={14} className={loading ? 'spin' : ''} />
              <span className="ms-2 d-none d-sm-inline">Refresh</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <Icon name="plus-lg" size={14} />
              <span className="ms-2">New task</span>
            </button>
          </div>
        </div>
        <div className="panel__body">
          {loading && tasks.length === 0 ? (
            <div className="loading-state">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="ms-2">Loading tasks...</span>
            </div>
          ) : (
            <div className="kanban-board">
              {columns.map(col => {
                const colTasks = tasks.filter(t => t.status === col.id);
                return (
                  <div key={col.id} className="kanban-column">
                    <div className="kanban-column__header">
                      <Icon name={col.icon} size={14} className={`text-${col.color}`} />
                      <span className="kanban-column__title">{col.label}</span>
                      <span className="kanban-column__count">{colTasks.length}</span>
                    </div>
                    <div className="kanban-column__body">
                      {colTasks.length === 0 ? (
                        <div className="kanban-empty">No tasks</div>
                      ) : (
                        colTasks.map(task => (
                          <div key={task.id} className="task-card">
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
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
// Calendar Tab
// ─────────────────────────────────────────────────────────────────────────────
const CalendarTab = ({ events, loading, onRefresh }) => {
  const groupedEvents = useMemo(() => {
    const groups = {};
    events.forEach(event => {
      const date = new Date(event.start).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(event);
    });
    return Object.entries(groups).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  }, [events]);

  const formatTime = (dateStr) => {
    if (!dateStr.includes('T')) return 'All day';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="container-fluid px-4 py-4">
      <div className="panel panel--full-height">
        <div className="panel__header">
          <h3 className="panel__title"><Icon name="calendar3" size={18} className="me-2" />Calendar</h3>
          <button className="btn btn-outline-secondary btn-sm" onClick={onRefresh} disabled={loading}>
            <Icon name={loading ? 'arrow-repeat' : 'arrow-clockwise'} size={14} className={loading ? 'spin' : ''} />
            <span className="ms-2">Refresh</span>
          </button>
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
              <p>Your calendar is clear for the next 30 days</p>
            </div>
          ) : (
            <div className="calendar-timeline">
              {groupedEvents.map(([dateStr, dayEvents]) => {
                const date = new Date(dateStr);
                const isToday = date.toDateString() === new Date().toDateString();
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
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Focus Tab (Pomodoro Timer)
// ─────────────────────────────────────────────────────────────────────────────
const FocusTab = ({ pomodoroCount, onPomodoroComplete }) => {
  const [mode, setMode] = useState('focus'); // 'focus' or 'break'
  const [focusMins, setFocusMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  const totalTime = mode === 'focus' ? focusMins * 60 : breakMins * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (mode === 'focus') {
        onPomodoroComplete();
        // Auto switch to break
        setMode('break');
        setTimeLeft(breakMins * 60);
      } else {
        setMode('focus');
        setTimeLeft(focusMins * 60);
      }
      // Play notification sound or show notification
      if (Notification.permission === 'granted') {
        new Notification(mode === 'focus' ? 'Focus session complete!' : 'Break is over!');
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

  return (
    <div className="container-fluid px-4 py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          <div className="panel">
            <div className="panel__header">
              <h3 className="panel__title"><Icon name="bullseye" size={18} className="me-2" />Focus Timer</h3>
            </div>
            <div className="panel__body">
              <div className="focus-container">
                <div className="focus-mode-toggle">
                  <button
                    className={`focus-mode-btn ${mode === 'focus' ? 'focus-mode-btn--active' : ''}`}
                    onClick={() => handleModeSwitch('focus')}
                  >
                    <Icon name="lightning-charge-fill" size={16} />
                    Focus
                  </button>
                  <button
                    className={`focus-mode-btn ${mode === 'break' ? 'focus-mode-btn--active focus-mode-btn--break' : ''}`}
                    onClick={() => handleModeSwitch('break')}
                  >
                    <Icon name="cup-hot-fill" size={16} />
                    Break
                  </button>
                </div>

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

                <div className="focus-settings">
                  <div className="focus-setting">
                    <label>Focus</label>
                    <input
                      type="number"
                      value={focusMins}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 1;
                        setFocusMins(val);
                        if (mode === 'focus' && !isRunning) setTimeLeft(val * 60);
                      }}
                      min="1"
                      max="60"
                    />
                    <span>min</span>
                  </div>
                  <div className="focus-setting">
                    <label>Break</label>
                    <input
                      type="number"
                      value={breakMins}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 1;
                        setBreakMins(val);
                        if (mode === 'break' && !isRunning) setTimeLeft(val * 60);
                      }}
                      min="1"
                      max="30"
                    />
                    <span>min</span>
                  </div>
                </div>

                <div className="focus-stats">
                  <div className="focus-stat">
                    <span className="focus-stat__value">{pomodoroCount}</span>
                    <span className="focus-stat__label">Sessions today</span>
                  </div>
                  <div className="focus-stat">
                    <span className="focus-stat__value">{Math.round(pomodoroCount * focusMins / 60 * 10) / 10}h</span>
                    <span className="focus-stat__label">Focus time</span>
                  </div>
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
  // Use server-provided initial payload if available to avoid redundant API calls
  const initialPayload = CONFIG.initialPayload || {};
  
  const [activeTab, setActiveTab] = useState('overview');
  const [emails, setEmails] = useState(initialPayload.emails || []);
  const [tasks, setTasks] = useState(initialPayload.tasks || []);
  const [events, setEvents] = useState(initialPayload.events || []);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  
  // Only show loading if we don't have initial data
  const hasInitialData = !!(initialPayload.emails || initialPayload.tasks || initialPayload.events);
  const [loading, setLoading] = useState({ 
    emails: !initialPayload.emails?.length, 
    tasks: !initialPayload.tasks?.length, 
    events: !initialPayload.events?.length 
  });

  // Only fetch data on mount if we don't have initial payload
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
    const data = await apiFetch(`/api/tasks/${taskId}/update/`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    if (data.task) {
      setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
    }
  };

  const handleDeleteTask = async (taskId) => {
    await apiFetch(`/api/tasks/${taskId}/delete/`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t.id !== taskId));
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


document.addEventListener('DOMContentLoaded', function () {
    // ---------------------------------------------------------------------
    // Pomodoro Timer
    // ---------------------------------------------------------------------
    let timerInterval;
    let focusTimeLeft = 25 * 60;
    let breakTimeLeft = 5 * 60;
    let focusTotalTime = 25 * 60;
    let breakTotalTime = 5 * 60;
    let isRunning = false;
    let isBreak = false;
    let completedPomodoros = parseInt(localStorage.getItem('pomodoros-today') || '0', 10);
    let currentStreak = parseInt(localStorage.getItem('current-streak') || '0', 10);

    const focusCard = document.getElementById('focus-card');
    const breakCard = document.getElementById('break-card');
    const focusTimeDisplay = document.getElementById('focus-time');
    const breakTimeDisplay = document.getElementById('break-time');
    const focusBtn = document.getElementById('focus-btn');
    const breakBtn = document.getElementById('break-btn');
    const completedDisplay = document.getElementById('completed-pomodoros');
    const streakDisplay = document.getElementById('current-streak');
    const focusMinutesInput = document.getElementById('focus-minutes');
    const breakMinutesInput = document.getElementById('break-minutes');
    const focusProgressRing = document.getElementById('focus-progress');
    const breakProgressRing = document.getElementById('break-progress');
    const focusDot = document.getElementById('focus-dot');
    const breakDot = document.getElementById('break-dot');
    const focusModeLabel = document.getElementById('focus-mode-label');
    const ambientToggle = document.getElementById('ambient-toggle');
    let ambientPlaying = false;

    if (ambientToggle) {
        ambientToggle.addEventListener('click', () => {
            ambientPlaying = !ambientPlaying;
            ambientToggle.classList.toggle('active', ambientPlaying);
            ambientToggle.textContent = ambientPlaying ? 'Stop soundscape' : 'Play soundscape';
        });
    }

    function setModeLabel(label) {
        if (focusModeLabel) {
            focusModeLabel.textContent = label;
        }
    }
    setModeLabel('Focused');

    function updateTimerDisplay() {
        const focusMinutes = Math.floor(focusTimeLeft / 60);
        const focusSeconds = focusTimeLeft % 60;
        focusTimeDisplay.textContent = `${focusMinutes.toString().padStart(2, '0')}:${focusSeconds.toString().padStart(2, '0')}`;
        
        const breakMinutes = Math.floor(breakTimeLeft / 60);
        const breakSecondsVal = breakTimeLeft % 60;
        breakTimeDisplay.textContent = `${breakMinutes.toString().padStart(2, '0')}:${breakSecondsVal.toString().padStart(2, '0')}`;
        
        const focusProgress = ((focusTotalTime - focusTimeLeft) / focusTotalTime) * 754;
        const breakProgress = ((breakTotalTime - breakTimeLeft) / breakTotalTime) * 754;
        
        focusProgressRing.style.strokeDashoffset = 754 - focusProgress;
        breakProgressRing.style.strokeDashoffset = 754 - breakProgress;
        
        const focusAngle = (focusProgress / 754) * 360 - 90;
        const breakAngle = (breakProgress / 754) * 360 - 90;
        
        const focusX = 140 + 120 * Math.cos(focusAngle * Math.PI / 180);
        const focusY = 140 + 120 * Math.sin(focusAngle * Math.PI / 180);
        const breakX = 140 + 120 * Math.cos(breakAngle * Math.PI / 180);
        const breakY = 140 + 120 * Math.sin(breakAngle * Math.PI / 180);
        
        focusDot.style.left = `${focusX - 8}px`;
        focusDot.style.top = `${focusY - 8}px`;
        breakDot.style.left = `${breakX - 8}px`;
        breakDot.style.top = `${breakY - 8}px`;
    }

    function updatePomodoroStats() {
        completedDisplay.textContent = completedPomodoros;
        streakDisplay.textContent = currentStreak;
        localStorage.setItem('pomodoros-today', completedPomodoros.toString());
        localStorage.setItem('current-streak', currentStreak.toString());
    }

    function updateTimerSettings() {
        if (isRunning) return;
        let focusMinutes = parseInt(focusMinutesInput.value, 10) || 25;
        let breakMinutes = parseInt(breakMinutesInput.value, 10) || 5;

            focusMinutes = Math.max(1, Math.min(60, focusMinutes));
            breakMinutes = Math.max(1, Math.min(30, breakMinutes));
            
            focusMinutesInput.value = focusMinutes;
            breakMinutesInput.value = breakMinutes;
            
            focusTimeLeft = focusMinutes * 60;
            focusTotalTime = focusMinutes * 60;
            breakTimeLeft = breakMinutes * 60;
            breakTotalTime = breakMinutes * 60;
            
            updateTimerDisplay();
    }

    function switchToBreak() {
        focusCard.style.display = 'none';
        breakCard.classList.add('active');
        setModeLabel('On break');
        isBreak = true;
    }

    function switchToFocus() {
        breakCard.classList.remove('active');
        focusCard.style.display = 'flex';
        setModeLabel('Focused');
        isBreak = false;
    }

    function startFocusTimer() {
        if (!isRunning) {
            isRunning = true;
            focusBtn.querySelector('.btn-icon').textContent = '⏸';
            focusBtn.querySelector('.btn-label').textContent = 'Pause';
            
            timerInterval = setInterval(() => {
                focusTimeLeft--;
                updateTimerDisplay();
                if (focusTimeLeft === 0) {
                    clearInterval(timerInterval);
                    isRunning = false;
                    completedPomodoros++;
                    currentStreak++;
                    updatePomodoroStats();
                    switchToBreak();
                    if (Notification.permission === 'granted') {
                        new Notification('Pomodoro Timer', {
                            body: 'Focus session complete! Time for a break.',
                            icon: '/static/favicon.ico'
                        });
                    }
                }
            }, 1000);
        } else {
            clearInterval(timerInterval);
            isRunning = false;
            focusBtn.querySelector('.btn-icon').textContent = '▶';
            focusBtn.querySelector('.btn-label').textContent = 'Resume';
        }
    }

    function startBreakTimer() {
        if (!isRunning) {
            isRunning = true;
            breakBtn.querySelector('.btn-icon').textContent = '⏸';
            breakBtn.querySelector('.btn-label').textContent = 'Pause';
            
            timerInterval = setInterval(() => {
                breakTimeLeft--;
                updateTimerDisplay();
                if (breakTimeLeft === 0) {
                    clearInterval(timerInterval);
                    isRunning = false;
                    const breakMinutes = parseInt(breakMinutesInput.value, 10) || 5;
                    breakTimeLeft = breakMinutes * 60;
                    breakTotalTime = breakMinutes * 60;
                    switchToFocus();
                    updateTimerDisplay();
                    if (Notification.permission === 'granted') {
                        new Notification('Pomodoro Timer', {
                            body: 'Break time over! Ready to focus?',
                            icon: '/static/favicon.ico'
                        });
                    }
                }
            }, 1000);
        } else {
            clearInterval(timerInterval);
            isRunning = false;
            breakBtn.querySelector('.btn-icon').textContent = '▶';
            breakBtn.querySelector('.btn-label').textContent = 'Resume';
        }
    }

    focusBtn.addEventListener('click', startFocusTimer);
    breakBtn.addEventListener('click', startBreakTimer);
    focusMinutesInput.addEventListener('change', updateTimerSettings);
    breakMinutesInput.addEventListener('change', updateTimerSettings);
    document.getElementById('back-to-break').addEventListener('click', switchToBreak);
    document.getElementById('back-to-focus').addEventListener('click', switchToFocus);

    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }

    // ---------------------------------------------------------------------
    // Workspace / API-driven panels
    // ---------------------------------------------------------------------
    const dashboardData = {
        emails: [],
        tasks: [],
        events: [],
    };

    const statNodes = {
        emails: document.getElementById('stat-emails'),
        tasksActive: document.getElementById('stat-tasks-active'),
        tasksTotal: document.getElementById('stat-tasks-total'),
        events: document.getElementById('stat-events'),
    };

    function updateDashboardStats() {
        if (statNodes.emails) statNodes.emails.textContent = dashboardData.emails.length;
        if (statNodes.tasksTotal) statNodes.tasksTotal.textContent = dashboardData.tasks.length;
        if (statNodes.tasksActive) {
            const activeCount = dashboardData.tasks.filter(task => task.status !== 'done').length;
            statNodes.tasksActive.textContent = activeCount;
        }
        if (statNodes.events) statNodes.events.textContent = dashboardData.events.length;
    }

    function broadcastDashboardState() {
        updateDashboardStats();
        if (typeof window.renderSnapshotReact === 'function') {
            window.renderSnapshotReact({
                emails: dashboardData.emails,
                tasks: dashboardData.tasks,
                events: dashboardData.events,
            });
        }
    }

    const tabButtons = document.querySelectorAll('.view-tab');
    const tabPanels = document.querySelectorAll('.tab-panel');
    tabButtons.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            tabPanels.forEach(panel => panel.classList.remove('active'));
            const targetSelector = tab.getAttribute('data-tab-target');
            const targetPanel = document.querySelector(targetSelector);
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
            if (targetSelector !== '#tab-inbox') {
                hideEmailDetail();
            }
        });
    });

    const addTaskBtn = document.getElementById('add-task-btn');
    const modal = document.getElementById('add-task-modal');
    const closeModal = document.getElementById('close-modal');
    const cancelTask = document.getElementById('cancel-task');
    const saveTask = document.getElementById('save-task');
    const taskTitleInput = document.getElementById('task-title');
    const taskDescriptionInput = document.getElementById('task-description');
    const tasksList = document.getElementById('gtasks-list');
    const tasksEmptyState = document.getElementById('tasks-empty-state');
    const tasksPermissionBanner = document.getElementById('tasks-permission-banner');

    const emailList = document.getElementById('email-list');
    const emailEmptyState = document.getElementById('email-empty-state');
    const emailSkeleton = document.getElementById('email-skeleton');
    const emailPermissionBanner = document.getElementById('email-permission-banner');
    const refreshEmailBtn = document.getElementById('refresh-email-btn');
    const emailDetailPane = document.getElementById('email-detail-pane');
    const inboxShell = document.getElementById('inbox-shell');

    const calendarList = document.getElementById('calendar-events');
    const calendarEmptyState = document.getElementById('calendar-empty-state');
    const calendarSkeleton = document.getElementById('calendar-skeleton');
    const calendarPermissionBanner = document.getElementById('calendar-permission-banner');
    const refreshCalendarBtn = document.getElementById('refresh-calendar-btn');

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');

    function escapeHtml(value = '') {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatEmailDate(value) {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    function formatEventTime(value, fallback = '') {
        if (!value) return fallback;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return fallback;
        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }

    function formatEmailBody(value = '') {
        return escapeHtml(value).replace(/\n/g, '<br>');
    }

    function hideEmailDetail() {
        if (emailDetailPane) {
            emailDetailPane.classList.add('hidden');
            emailDetailPane.innerHTML = '';
        }
        if (inboxShell) {
            inboxShell.classList.remove('has-detail');
        }
    }

    async function fetchEmails() {
        if (!emailList) return;
        if (emailSkeleton) emailSkeleton.style.display = 'grid';
        hideEmailDetail();
        try {
            const response = await fetch('/api/emails/');
            if (!response.ok) {
                if (response.status === 403 && emailPermissionBanner) {
                    emailPermissionBanner.style.display = 'block';
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            dashboardData.emails = data.emails || [];
            renderEmails();
            if (emailPermissionBanner) emailPermissionBanner.style.display = 'none';
            broadcastDashboardState();
        } catch (error) {
            console.error('Error fetching emails:', error);
        } finally {
            if (emailSkeleton) emailSkeleton.style.display = 'none';
        }
    }

    function renderEmails() {
        if (!emailList) return;
        emailList.innerHTML = '';
        if (!dashboardData.emails.length) {
            if (emailEmptyState) emailEmptyState.style.display = 'flex';
            hideEmailDetail();
            return;
        }
        if (emailEmptyState) emailEmptyState.style.display = 'none';
        dashboardData.emails.forEach((email, index) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'gmail-email-item';
            item.dataset.emailIndex = index;
            const sender = escapeHtml(email.sender || 'Unknown sender');
            const subject = escapeHtml(email.subject || 'No subject');
            const snippet = escapeHtml(email.snippet || '');
            const date = formatEmailDate(email.date);
            item.innerHTML = `
                <div class="email-sender">${sender}</div>
                <div class="email-content">
                    <div class="email-subject-line">
                        <span class="email-subject">${subject}</span>
                        ${snippet ? `<span class="email-snippet"> — ${snippet}</span>` : ''}
                    </div>
                </div>
                <div class="email-date">${date}</div>
            `;
            item.addEventListener('click', () => selectEmail(index));
            emailList.appendChild(item);
        });
    }

    function selectEmail(index) {
        if (!emailList || !dashboardData.emails[index]) {
            hideEmailDetail();
            return;
        }
        emailList.querySelectorAll('.gmail-email-item').forEach(btn => btn.classList.remove('active'));
        const targetBtn = emailList.querySelector(`[data-email-index="${index}"]`);
        if (targetBtn) targetBtn.classList.add('active');
        renderEmailDetail(dashboardData.emails[index]);
    }

    function renderEmailDetail(email) {
        if (!emailDetailPane || !email) {
            if (emailDetailPane) {
                emailDetailPane.classList.add('hidden');
                emailDetailPane.innerHTML = '';
            }
            return;
        }
        emailDetailPane.classList.remove('hidden');
        if (inboxShell) {
            inboxShell.classList.add('has-detail');
        }
        const sender = escapeHtml(email.sender || 'Unknown sender');
        const subject = escapeHtml(email.subject || 'No subject');
        const date = formatEmailDate(email.date);
        const body = formatEmailBody(email.body || email.snippet || '');
        emailDetailPane.innerHTML = `
            <div class="email-detail-fixed">
                <div class="email-detail-meta">
                    <p class="panel-label">From</p>
                    <strong>${sender}</strong>
                    <span>${date}</span>
                </div>
                <h4>${subject}</h4>
                <div class="email-detail-body">${body}</div>
            </div>
        `;
    }

    async function fetchTasks() {
        try {
            const response = await fetch('/api/tasks/');
            if (!response.ok) {
                if (response.status === 403 && tasksPermissionBanner) {
                    tasksPermissionBanner.style.display = 'block';
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            dashboardData.tasks = data.tasks || [];
                renderTasks();
            if (tasksPermissionBanner) tasksPermissionBanner.style.display = 'none';
            broadcastDashboardState();
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    }

    async function fetchCalendarEvents() {
        if (!calendarList) return;
        if (calendarSkeleton) calendarSkeleton.style.display = 'grid';
        try {
            const response = await fetch('/api/calendar/');
            if (!response.ok) {
                if (response.status === 403 && calendarPermissionBanner) {
                    calendarPermissionBanner.style.display = 'block';
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            dashboardData.events = data.events || [];
            renderCalendarEvents();
            if (calendarPermissionBanner) calendarPermissionBanner.style.display = 'none';
            broadcastDashboardState();
        } catch (error) {
            console.error('Error fetching calendar events:', error);
        } finally {
            if (calendarSkeleton) calendarSkeleton.style.display = 'none';
        }
    }

    async function createTaskAPI(title, description) {
        try {
            const response = await fetch('/api/tasks/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify({ title, description })
            });
            const data = await response.json();
            if (!response.ok) {
                return { 
                    success: false, 
                    error: data.error || `HTTP error! status: ${response.status}`,
                    needs_reauth: data.needs_reauth || false
                };
            }
            if (data.success) {
                await fetchTasks();
                return { success: true };
            }
            return { success: false, error: data.error || 'Unknown error' };
        } catch (error) {
            console.error('Error creating task:', error);
            return { success: false, error: error.message };
        }
    }

    async function updateTaskAPI(taskId, updates) {
        try {
            const response = await fetch(`/api/tasks/${taskId}/update/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(updates)
            });
            const data = await response.json();
            if (data.success) {
                await fetchTasks();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating task:', error);
            return false;
        }
    }

    async function deleteTaskAPI(taskId) {
        try {
            const response = await fetch(`/api/tasks/${taskId}/delete/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': csrftoken
                }
            });
            const data = await response.json();
            if (data.success) {
                await fetchTasks();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting task:', error);
            return false;
        }
    }

    function createTaskElement(task) {
        const taskEl = document.createElement('div');
        taskEl.className = 'gtasks-item';
        if (task.status === 'done') {
            taskEl.classList.add('completed');
        }
        taskEl.dataset.taskId = task.id;
        const title = escapeHtml(task.title || 'Untitled');
        const description = escapeHtml(task.description || '');
        taskEl.innerHTML = `
            <div class="gtasks-checkbox"></div>
            <div class="gtasks-item-content">
                <div class="gtasks-item-title">${title}</div>
                ${description ? `<div class="gtasks-item-details">${description}</div>` : ''}
            </div>
            <div class="gtasks-item-actions">
                <button class="gtasks-item-btn edit" aria-label="Edit task">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                </button>
                <button class="gtasks-item-btn delete" aria-label="Delete task">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
        `;

        const checkbox = taskEl.querySelector('.gtasks-checkbox');
        checkbox.addEventListener('click', async (e) => {
            e.stopPropagation();
            const newStatus = task.status === 'done' ? 'not-started' : 'done';
            await updateTaskAPI(task.id, { status: newStatus });
        });

        const editBtn = taskEl.querySelector('.edit');
        editBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const newTitle = prompt('Edit task title:', task.title);
            if (newTitle && newTitle.trim()) {
                await updateTaskAPI(task.id, { title: newTitle.trim() });
            }
        });

        const deleteBtn = taskEl.querySelector('.delete');
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Delete this task?')) {
                await deleteTaskAPI(task.id);
            }
        });

        return taskEl;
    }

    function renderTasks() {
        if (!tasksList) return;
        tasksList.innerHTML = '';
        if (!dashboardData.tasks.length) {
            if (tasksEmptyState) tasksEmptyState.style.display = 'block';
            return;
        }
        if (tasksEmptyState) tasksEmptyState.style.display = 'none';
        const sortedTasks = [...dashboardData.tasks].sort((a, b) => {
            if (a.status === 'done' && b.status !== 'done') return 1;
            if (a.status !== 'done' && b.status === 'done') return -1;
            return 0;
        });
        sortedTasks.forEach(task => tasksList.appendChild(createTaskElement(task)));
    }

    function renderCalendarEvents() {
        if (!calendarList) return;
        calendarList.innerHTML = '';
        if (!dashboardData.events.length) {
            if (calendarEmptyState) calendarEmptyState.style.display = 'flex';
            return;
        }
        if (calendarEmptyState) calendarEmptyState.style.display = 'none';
        dashboardData.events.forEach((event) => {
            const item = document.createElement('div');
            item.className = 'gcal-event-item';
            const startLabel = formatEventTime(event.start, 'All day');
            const endLabel = formatEventTime(event.end, '');
            const location = escapeHtml(event.location || '');
            const title = escapeHtml(event.title || 'No title');
            item.innerHTML = `
                <div class="gcal-event-indicator"></div>
                <div class="gcal-event-content">
                    <div class="gcal-event-time">${startLabel}${endLabel ? ` – ${endLabel}` : ''}</div>
                    <div class="gcal-event-title">${title}</div>
                    ${location ? `<div class="gcal-event-location">${location}</div>` : ''}
                </div>
                ${event.htmlLink ? `<a href="${event.htmlLink}" target="_blank" class="gcal-event-link" aria-label="Open in Google Calendar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                    </svg>
                </a>` : ''}
            `;
            calendarList.appendChild(item);
        });
    }

    if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => {
        modal.classList.add('active');
            taskTitleInput.focus();
    });
    }

    if (closeModal) {
    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
            taskTitleInput.value = '';
            taskDescriptionInput.value = '';
    });
    }

    if (cancelTask) {
    cancelTask.addEventListener('click', () => {
        modal.classList.remove('active');
            taskTitleInput.value = '';
            taskDescriptionInput.value = '';
    });
    }

    if (saveTask) {
    saveTask.addEventListener('click', async () => {
            const title = taskTitleInput.value.trim();
            const description = taskDescriptionInput.value.trim();
        if (!title) {
            alert('Please enter a task title');
                taskTitleInput.focus();
            return;
        }
        if (title.length > 200) {
            alert('Task title is too long (max 200 characters)');
                taskTitleInput.focus();
            return;
        }
        if (description.length > 1000) {
            alert('Task description is too long (max 1000 characters)');
                taskDescriptionInput.focus();
            return;
        }
        saveTask.disabled = true;
        saveTask.textContent = 'Creating...';
        const result = await createTaskAPI(title, description);
        saveTask.disabled = false;
        saveTask.textContent = 'Save';
        if (result.success) {
            modal.classList.remove('active');
                taskTitleInput.value = '';
                taskDescriptionInput.value = '';
            } else if (result.needs_reauth) {
                if (confirm('Google Tasks permission required. Sign out and sign in again to grant access?')) {
                    window.location.href = '/logout';
                }
            } else {
                alert(`Failed to create task: ${result.error || 'Please try again.'}`);
            }
        });
        }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            taskTitleInput.value = '';
            taskDescriptionInput.value = '';
        }
    });

    const refreshTasksBtn = document.getElementById('refresh-tasks-btn');
    if (refreshTasksBtn) {
        refreshTasksBtn.addEventListener('click', async () => {
            refreshTasksBtn.disabled = true;
            refreshTasksBtn.classList.add('spinning');
            await fetchTasks();
            setTimeout(() => {
                refreshTasksBtn.disabled = false;
                refreshTasksBtn.classList.remove('spinning');
            }, 500);
        });
    }

    if (refreshEmailBtn) {
        refreshEmailBtn.addEventListener('click', async () => {
            refreshEmailBtn.disabled = true;
            await fetchEmails();
            refreshEmailBtn.disabled = false;
        });
    }

    if (refreshCalendarBtn) {
        refreshCalendarBtn.addEventListener('click', async () => {
            refreshCalendarBtn.disabled = true;
            await fetchCalendarEvents();
            refreshCalendarBtn.disabled = false;
        });
    }

    // ---------------------------------------------------------------------
    // Initial load
    // ---------------------------------------------------------------------
    updateTimerDisplay();
    updatePomodoroStats();
    broadcastDashboardState();
    fetchEmails();
    fetchTasks();
    fetchCalendarEvents();
});




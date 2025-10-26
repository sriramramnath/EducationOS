// Floating sidebar and navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('floating-sidebar');
    const sidebarTrigger = document.getElementById('sidebar-trigger');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mainContent = document.getElementById('main-content');
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    let sidebarTimeout;

    // Sidebar toggle button functionality
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Sidebar hover functionality
    sidebarTrigger.addEventListener('mouseenter', () => {
        clearTimeout(sidebarTimeout);
        sidebar.classList.add('open');
    });

    sidebar.addEventListener('mouseenter', () => {
        clearTimeout(sidebarTimeout);
    });

    sidebar.addEventListener('mouseleave', () => {
        sidebarTimeout = setTimeout(() => {
            sidebar.classList.remove('open');
        }, 300);
    });

    // Keyboard shortcut: Option + S to toggle sidebar
    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            sidebar.classList.toggle('open');
        }
    });

    // Navigation functionality
    navItems.forEach(nav => {
        nav.addEventListener('click', () => {
            const targetTab = nav.getAttribute('data-tab');
            
            // Remove active class from all nav items and contents
            navItems.forEach(n => n.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked nav item and corresponding content
            nav.classList.add('active');
            document.getElementById(targetTab + '-content').classList.add('active');
            
            // Close sidebar after selection on mobile
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
    });

    // Enhanced Pomodoro Timer
    let timerInterval;
    let focusTimeLeft = 25 * 60;
    let breakTimeLeft = 5 * 60;
    let focusTotalTime = 25 * 60;
    let breakTotalTime = 5 * 60;
    let isRunning = false;
    let isBreak = false;
    let completedPomodoros = parseInt(localStorage.getItem('pomodoros-today') || '0');
    let currentStreak = parseInt(localStorage.getItem('current-streak') || '0');

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
    const focusProgress = document.getElementById('focus-progress');
    const breakProgress = document.getElementById('break-progress');
    const focusDot = document.getElementById('focus-dot');
    const breakDot = document.getElementById('break-dot');

    function updateTimerDisplay() {
        // Update focus timer
        const focusMinutes = Math.floor(focusTimeLeft / 60);
        const focusSeconds = focusTimeLeft % 60;
        focusTimeDisplay.textContent = `${focusMinutes.toString().padStart(2, '0')}:${focusSeconds.toString().padStart(2, '0')}`;
        
        // Update break timer
        const breakMinutes = Math.floor(breakTimeLeft / 60);
        const breakSecondsVal = breakTimeLeft % 60;
        breakTimeDisplay.textContent = `${breakMinutes.toString().padStart(2, '0')}:${breakSecondsVal.toString().padStart(2, '0')}`;
        
        // Update progress circles
        const focusProgress = ((focusTotalTime - focusTimeLeft) / focusTotalTime) * 754;
        const breakProgress = ((breakTotalTime - breakTimeLeft) / breakTotalTime) * 754;
        
        document.getElementById('focus-progress').style.strokeDashoffset = 754 - focusProgress;
        document.getElementById('break-progress').style.strokeDashoffset = 754 - breakProgress;
        
        // Update progress dots
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

    function updateStats() {
        completedDisplay.textContent = completedPomodoros;
        streakDisplay.textContent = currentStreak;
        
        // Save to localStorage
        localStorage.setItem('pomodoros-today', completedPomodoros.toString());
        localStorage.setItem('current-streak', currentStreak.toString());
    }

    function updateTimerSettings() {
        if (!isRunning) {
            const focusMinutes = parseInt(focusMinutesInput.value) || 25;
            const breakMinutes = parseInt(breakMinutesInput.value) || 5;
            
            focusTimeLeft = focusMinutes * 60;
            focusTotalTime = focusMinutes * 60;
            breakTimeLeft = breakMinutes * 60;
            breakTotalTime = breakMinutes * 60;
            
            updateTimerDisplay();
        }
    }

    function switchToBreak() {
        focusCard.style.display = 'none';
        breakCard.classList.add('active');
        isBreak = true;
    }

    function switchToFocus() {
        breakCard.classList.remove('active');
        focusCard.style.display = 'flex';
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
                    updateStats();
                    
                    // Switch to break
                    switchToBreak();
                    
                    // Show notification
                    if (Notification.permission === 'granted') {
                        new Notification('Pomodoro Timer', {
                            body: 'Focus session complete! Time for a break.',
                            icon: '/static/favicon.ico'
                        });
                    }
                }
            }, 1000);
        } else {
            // Pause timer
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
                    
                    // Reset break time
                    const breakMinutes = parseInt(breakMinutesInput.value) || 5;
                    breakTimeLeft = breakMinutes * 60;
                    breakTotalTime = breakMinutes * 60;
                    
                    // Switch back to focus
                    switchToFocus();
                    updateTimerDisplay();
                    
                    // Show notification
                    if (Notification.permission === 'granted') {
                        new Notification('Pomodoro Timer', {
                            body: 'Break time over! Ready to focus?',
                            icon: '/static/favicon.ico'
                        });
                    }
                }
            }, 1000);
        } else {
            // Pause timer
            clearInterval(timerInterval);
            isRunning = false;
            breakBtn.querySelector('.btn-icon').textContent = '▶';
            breakBtn.querySelector('.btn-label').textContent = 'Resume';
        }
    }

    // Event listeners
    focusBtn.addEventListener('click', startFocusTimer);
    breakBtn.addEventListener('click', startBreakTimer);
    focusMinutesInput.addEventListener('change', updateTimerSettings);
    breakMinutesInput.addEventListener('change', updateTimerSettings);

    // Back button functionality
    document.getElementById('back-to-break').addEventListener('click', switchToBreak);
    document.getElementById('back-to-focus').addEventListener('click', switchToFocus);

    // Request notification permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }

    // To-Do List functionality
    let tasks = JSON.parse(localStorage.getItem('eduverse-tasks')) || [];
    let taskIdCounter = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;

    const addTaskBtn = document.getElementById('add-task-btn');
    const modal = document.getElementById('add-task-modal');
    const closeModal = document.getElementById('close-modal');
    const cancelTask = document.getElementById('cancel-task');
    const saveTask = document.getElementById('save-task');
    const taskTitle = document.getElementById('task-title');
    const taskDescription = document.getElementById('task-description');

    function saveTasks() {
        localStorage.setItem('eduverse-tasks', JSON.stringify(tasks));
    }

    function updateTaskCounts() {
        const notStarted = tasks.filter(t => t.status === 'not-started').length;
        const inProgress = tasks.filter(t => t.status === 'in-progress').length;
        const done = tasks.filter(t => t.status === 'done').length;

        document.getElementById('not-started-count').textContent = notStarted;
        document.getElementById('in-progress-count').textContent = inProgress;
        document.getElementById('done-count').textContent = done;
    }

    function createTaskElement(task) {
        const taskEl = document.createElement('div');
        taskEl.className = 'task-item';
        taskEl.draggable = true;
        taskEl.dataset.taskId = task.id;
        
        taskEl.innerHTML = `
            <div class="task-title">${task.title}</div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
        `;

        // Add drag and drop functionality
        taskEl.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
        });

        // Add click to edit functionality
        taskEl.addEventListener('dblclick', () => {
            const newTitle = prompt('Edit task title:', task.title);
            if (newTitle && newTitle.trim()) {
                task.title = newTitle.trim();
                saveTasks();
                renderTasks();
            }
        });

        return taskEl;
    }

    function renderTasks() {
        const notStartedList = document.getElementById('not-started-tasks');
        const inProgressList = document.getElementById('in-progress-tasks');
        const doneList = document.getElementById('done-tasks');

        // Clear existing tasks
        notStartedList.innerHTML = '';
        inProgressList.innerHTML = '';
        doneList.innerHTML = '';

        // Render tasks in their respective columns
        tasks.forEach(task => {
            const taskEl = createTaskElement(task);
            
            switch (task.status) {
                case 'not-started':
                    notStartedList.appendChild(taskEl);
                    break;
                case 'in-progress':
                    inProgressList.appendChild(taskEl);
                    break;
                case 'done':
                    doneList.appendChild(taskEl);
                    break;
            }
        });

        updateTaskCounts();
    }

    function addDragDropToColumn(columnId, status) {
        const column = document.getElementById(columnId);
        
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            column.style.background = '#1a1a1a';
        });

        column.addEventListener('dragleave', () => {
            column.style.background = '';
        });

        column.addEventListener('drop', (e) => {
            e.preventDefault();
            column.style.background = '';
            
            const taskId = parseInt(e.dataTransfer.getData('text/plain'));
            const task = tasks.find(t => t.id === taskId);
            
            if (task && task.status !== status) {
                task.status = status;
                saveTasks();
                renderTasks();
            }
        });
    }

    // Add drag and drop to all columns
    addDragDropToColumn('not-started-tasks', 'not-started');
    addDragDropToColumn('in-progress-tasks', 'in-progress');
    addDragDropToColumn('done-tasks', 'done');

    // Modal functionality
    addTaskBtn.addEventListener('click', () => {
        modal.classList.add('active');
        taskTitle.focus();
    });

    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
        taskTitle.value = '';
        taskDescription.value = '';
    });

    cancelTask.addEventListener('click', () => {
        modal.classList.remove('active');
        taskTitle.value = '';
        taskDescription.value = '';
    });

    saveTask.addEventListener('click', () => {
        const title = taskTitle.value.trim();
        const description = taskDescription.value.trim();

        if (title) {
            const newTask = {
                id: taskIdCounter++,
                title: title,
                description: description,
                status: 'not-started',
                createdAt: new Date().toISOString()
            };

            tasks.push(newTask);
            saveTasks();
            renderTasks();

            modal.classList.remove('active');
            taskTitle.value = '';
            taskDescription.value = '';
        }
    });

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            taskTitle.value = '';
            taskDescription.value = '';
        }
    });

    // Initialize
    updateTimerDisplay();
    updateStats();
    renderTasks();
}); 
   // Gmail-like email functionality
    function initializeGmailFeatures() {
        // Email selection functionality
        const emailItems = document.querySelectorAll('.gmail-email-item');
        const emailCheckboxes = document.querySelectorAll('.email-select');
        const emailStars = document.querySelectorAll('.email-star');

        // Handle email item clicks
        emailItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking on checkbox or star
                if (e.target.type === 'checkbox' || e.target.closest('.email-star')) {
                    return;
                }
                
                // Remove selection from other items
                emailItems.forEach(i => i.classList.remove('selected'));
                // Add selection to clicked item
                item.classList.add('selected');
            });
        });

        // Handle checkbox changes
        emailCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const emailItem = e.target.closest('.gmail-email-item');
                if (e.target.checked) {
                    emailItem.classList.add('selected');
                } else {
                    emailItem.classList.remove('selected');
                }
            });
        });

        // Handle star clicks
        emailStars.forEach(star => {
            star.addEventListener('click', (e) => {
                e.stopPropagation();
                star.classList.toggle('starred');
                
                // Update star icon
                const svg = star.querySelector('svg');
                if (star.classList.contains('starred')) {
                    svg.setAttribute('fill', 'currentColor');
                } else {
                    svg.setAttribute('fill', 'none');
                }
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab && activeTab.id === 'inbox-content') {
                const selectedEmail = document.querySelector('.gmail-email-item.selected');
                const allEmails = Array.from(document.querySelectorAll('.gmail-email-item'));
                
                if (e.key === 'ArrowDown' && selectedEmail) {
                    e.preventDefault();
                    const currentIndex = allEmails.indexOf(selectedEmail);
                    const nextEmail = allEmails[currentIndex + 1];
                    if (nextEmail) {
                        selectedEmail.classList.remove('selected');
                        nextEmail.classList.add('selected');
                        nextEmail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                } else if (e.key === 'ArrowUp' && selectedEmail) {
                    e.preventDefault();
                    const currentIndex = allEmails.indexOf(selectedEmail);
                    const prevEmail = allEmails[currentIndex - 1];
                    if (prevEmail) {
                        selectedEmail.classList.remove('selected');
                        prevEmail.classList.add('selected');
                        prevEmail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                } else if (e.key === 's' && selectedEmail) {
                    e.preventDefault();
                    const star = selectedEmail.querySelector('.email-star');
                    star.click();
                }
            }
        });
    }

    // Initialize Gmail features
    initializeGmailFeatures();
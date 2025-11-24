# Google Tasks & Calendar Integration Guide

## What's New

Your Eduverse app now integrates with:
- **Google Tasks** - Your to-do list syncs with Google Tasks
- **Google Calendar** - View your upcoming events

## Setup Instructions

### Step 1: Sign Out and Revoke Access

Since we added new Google API scopes, you need to re-authenticate:

1. Sign out: http://127.0.0.1:8000/logout
2. Go to: https://myaccount.google.com/permissions
3. Find "Eduverse" and click "Remove access"

### Step 2: Sign In Again

1. Go to: http://127.0.0.1:8000/login
2. Click "Sign in with Google"
3. **IMPORTANT**: You'll now see additional permissions:
   - ✓ See your personal info
   - ✓ See your email address
   - ✓ Read your Gmail messages
   - ✓ **View and manage your tasks** ← NEW!
   - ✓ **View your calendars** ← NEW!
4. Click "Allow" to grant all permissions

### Step 3: Verify Integration

After signing in, you should see:
- **Inbox tab**: Your Gmail emails
- **To-Do tab**: Your Google Tasks (synced!)
- **Calendar tab**: Your upcoming events (NEW!)

## Features

### Google Tasks Integration

**What it does:**
- Syncs your to-do list with Google Tasks
- All tasks are stored in your Google account
- Changes sync across all your devices
- Tasks persist even if you clear browser data

**How to use:**
1. Click the "To-Do" tab
2. Click "+ New" to create a task
3. Drag tasks between columns (To Do, In Progress, Done)
4. Double-click a task to edit it
5. Hover over a task and click "×" to delete it

**Task Statuses:**
- **To Do**: Tasks that need to be started
- **In Progress**: Tasks you're working on
- **Done**: Completed tasks (marked as completed in Google Tasks)

**Note**: The "In Progress" status is custom to Eduverse. In Google Tasks, it's stored as "not completed" but we track it separately in the app.

### Google Calendar Integration

**What it does:**
- Shows your upcoming events from Google Calendar
- Displays events for the next 30 days
- Read-only view (you can't create/edit events from Eduverse)

**What you see:**
- Event title
- Date and time
- Description (if available)
- Location (if available)
- Link to open in Google Calendar

**How to use:**
1. Click the "Calendar" tab
2. View your upcoming events
3. Click the arrow icon to open the event in Google Calendar

## API Endpoints

The app now includes REST API endpoints for tasks:

- `GET /api/tasks/` - Get all tasks
- `POST /api/tasks/create/` - Create a new task
- `PUT /api/tasks/<task_id>/update/` - Update a task
- `DELETE /api/tasks/<task_id>/delete/` - Delete a task

## Troubleshooting

### Issue: "No tasks showing"

**Solution:**
1. Check if you have tasks in Google Tasks: https://tasks.google.com/
2. Sign out and sign in again
3. Check browser console for errors (F12)
4. Check Django logs: `cat django.log | grep -i task`

### Issue: "No calendar events showing"

**Solution:**
1. Check if you have events in Google Calendar: https://calendar.google.com/
2. Make sure events are within the next 30 days
3. Sign out and sign in again
4. Check Django logs: `cat django.log | grep -i calendar`

### Issue: "Failed to create task"

**Possible causes:**
- OAuth token expired
- Network error
- Google Tasks API quota exceeded

**Solution:**
1. Check browser console for error messages
2. Sign out and sign in again
3. Check Django logs for detailed error

### Issue: "Token has been expired or revoked"

**Solution:**
1. Sign out: http://127.0.0.1:8000/logout
2. Revoke access: https://myaccount.google.com/permissions
3. Sign in again and grant all permissions

## Technical Details

### New Files Created

- `Core/google_tasks_service.py` - Google Tasks API integration
- `Core/google_calendar_service.py` - Google Calendar API integration

### Updated Files

- `AuthenticationProject/settings.py` - Added new OAuth scopes
- `Core/views.py` - Added API endpoints and data fetching
- `Core/urls.py` - Added API routes
- `templates/index.html` - Added calendar tab
- `static/app.js` - Integrated with Google Tasks API
- `static/style.css` - Added calendar styles

### OAuth Scopes

The app now requests these Google API scopes:
- `profile` - Basic profile info
- `email` - Email address
- `https://www.googleapis.com/auth/gmail.readonly` - Read Gmail
- `https://www.googleapis.com/auth/tasks` - Manage Google Tasks
- `https://www.googleapis.com/auth/calendar.readonly` - Read Google Calendar

### Data Storage

- **Tasks**: Stored in Google Tasks (not in local database)
- **Calendar**: Read from Google Calendar (not stored locally)
- **Emails**: Fetched from Gmail (not stored locally)

This means:
- ✓ Your data is always in sync with Google
- ✓ Works across all devices
- ✓ No data loss if you clear browser cache
- ✓ Privacy: We don't store your personal data

## Testing

### Test Google Tasks Integration

```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User
from Core.google_tasks_service import GoogleTasksService

user = User.objects.first()
tasks_service = GoogleTasksService(user)

# Get tasks
tasks = tasks_service.get_tasks()
print(f"Found {len(tasks)} tasks")

# Create a test task
result = tasks_service.create_task("Test Task", "This is a test")
print(f"Created task: {result}")
```

### Test Google Calendar Integration

```python
from Core.google_calendar_service import GoogleCalendarService

calendar_service = GoogleCalendarService(user)

# Get upcoming events
events = calendar_service.get_upcoming_events(max_results=5)
print(f"Found {len(events)} events")
for event in events:
    print(f"- {event['title']} on {event['start']}")
```

## Limitations

### Google Tasks
- Maximum 100 tasks fetched at once
- Task lists are not shown (uses default list only)
- No support for subtasks
- No support for task notes formatting

### Google Calendar
- Read-only (can't create/edit events)
- Shows next 30 days only
- Primary calendar only
- No recurring event expansion

## Future Enhancements

Possible improvements:
- [ ] Support multiple task lists
- [ ] Add task due dates
- [ ] Create calendar events from Eduverse
- [ ] Show calendar in month/week view
- [ ] Add task reminders
- [ ] Support recurring tasks
- [ ] Sync task status changes in real-time
- [ ] Add calendar event notifications

## Need Help?

Check the logs for detailed error messages:
```bash
cat django.log | tail -50
```

Or run the debug script:
```bash
python debug_gmail.py
```

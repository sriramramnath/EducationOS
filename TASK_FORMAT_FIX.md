# Task Format Standardization - Fixed

## Problem

The task format between Google Tasks API and Eduverse frontend was inconsistent:

**Google Tasks Format:**
- Status: `'needsAction'` or `'completed'` (only 2 states)
- No "in-progress" status

**Eduverse Frontend Format:**
- Status: `'not-started'`, `'in-progress'`, `'done'` (3 states)

This caused sync issues and data loss.

## Solution

Created a unified format that works with both systems:

### Unified Task Format

```javascript
{
  id: "task_id_from_google",
  title: "Task title",
  description: "Task description",
  status: "not-started" | "in-progress" | "done",
  due: "2025-11-02T00:00:00.000Z",
  completed: "2025-11-02T10:00:00.000Z",
  updated: "2025-11-02T10:00:00.000Z"
}
```

### Status Mapping

**From Google Tasks → Eduverse:**
- `status: 'completed'` → `'done'`
- `status: 'needsAction'` + `notes: '[IN_PROGRESS] ...'` → `'in-progress'`
- `status: 'needsAction'` → `'not-started'`

**From Eduverse → Google Tasks:**
- `'done'` → `status: 'completed'`
- `'in-progress'` → `status: 'needsAction'` + `notes: '[IN_PROGRESS] description'`
- `'not-started'` → `status: 'needsAction'`

### How It Works

1. **In-Progress Status Storage:**
   - We store the "in-progress" state in the task's notes field
   - Add `[IN_PROGRESS]` marker at the beginning of notes
   - When reading, we detect this marker and set status to 'in-progress'
   - When displaying, we remove the marker from the description

2. **Consistent Formatting:**
   - All API responses use the same format
   - Frontend always receives consistent data structure
   - No data transformation needed in JavaScript

3. **Bidirectional Sync:**
   - Changes in Eduverse sync to Google Tasks
   - Changes in Google Tasks sync to Eduverse
   - Status is preserved across both platforms

## Changes Made

### Core/google_tasks_service.py

**Added `_format_task()` helper:**
```python
def _format_task(self, task):
    """Format a Google Tasks task to our app format"""
    # Detects [IN_PROGRESS] marker
    # Maps Google status to our status
    # Returns consistent format
```

**Updated methods:**
- `get_tasks()` - Uses `_format_task()` for all tasks
- `create_task()` - Returns formatted task
- `update_task()` - Handles status markers, returns formatted task

### Benefits

✅ **Consistent Format** - Same structure everywhere
✅ **No Data Loss** - All 3 statuses preserved
✅ **Bidirectional Sync** - Works both ways
✅ **Clean Code** - Single source of truth for formatting
✅ **Easy Debugging** - Predictable data structure

## Testing

### Test Status Mapping

1. **Create task in Eduverse:**
   ```
   Title: "Test Task"
   Status: not-started
   ```
   Check Google Tasks: Should show as "needsAction"

2. **Move to In Progress:**
   ```
   Drag to "In Progress" column
   ```
   Check Google Tasks: Notes should contain "[IN_PROGRESS]"

3. **Mark as Done:**
   ```
   Drag to "Done" column
   ```
   Check Google Tasks: Status should be "completed"

4. **Create in Google Tasks:**
   ```
   Create a task in Google Tasks app
   ```
   Click Sync in Eduverse: Should appear in "To Do" column

5. **Edit in Google Tasks:**
   ```
   Add "[IN_PROGRESS]" to notes in Google Tasks
   ```
   Click Sync in Eduverse: Should appear in "In Progress" column

### Verify Format

Check browser console after fetching tasks:
```javascript
// Should see consistent format:
{
  id: "...",
  title: "...",
  description: "...",  // No [IN_PROGRESS] marker
  status: "in-progress",  // Mapped correctly
  ...
}
```

## Example Flow

### Creating a Task

**User Action:** Create task "Buy groceries" with description "Milk, eggs, bread"

**Frontend → Backend:**
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"
}
```

**Backend → Google Tasks:**
```json
{
  "title": "Buy groceries",
  "notes": "Milk, eggs, bread",
  "status": "needsAction"
}
```

**Google Tasks → Backend:**
```json
{
  "id": "abc123",
  "title": "Buy groceries",
  "notes": "Milk, eggs, bread",
  "status": "needsAction",
  ...
}
```

**Backend → Frontend:**
```json
{
  "id": "abc123",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": "not-started",
  ...
}
```

### Moving to In Progress

**User Action:** Drag task to "In Progress" column

**Frontend → Backend:**
```json
{
  "status": "in-progress"
}
```

**Backend → Google Tasks:**
```json
{
  "notes": "[IN_PROGRESS] Milk, eggs, bread",
  "status": "needsAction"
}
```

**Backend → Frontend:**
```json
{
  "status": "in-progress",
  "description": "Milk, eggs, bread"  // Marker removed
}
```

## Notes

- The `[IN_PROGRESS]` marker is invisible to users
- It's automatically added/removed by the backend
- Frontend never sees the marker
- Works seamlessly with Google Tasks app
- If you edit notes in Google Tasks, the marker is preserved

## Future Improvements

Possible enhancements:
- [ ] Use custom task metadata instead of notes marker
- [ ] Support multiple custom statuses
- [ ] Add status history tracking
- [ ] Sync status changes in real-time
- [ ] Add status change notifications

## Troubleshooting

### Status not syncing?

1. Click the Sync button
2. Check browser console for errors
3. Check Django logs: `cat django.log | grep -i task`

### [IN_PROGRESS] showing in description?

This shouldn't happen. If it does:
1. Check `_format_task()` is being called
2. Verify the marker is being removed
3. Check browser console for the raw task data

### Tasks showing wrong status?

1. Refresh the page
2. Click Sync button
3. Check the task in Google Tasks app
4. Verify the notes field contains correct marker

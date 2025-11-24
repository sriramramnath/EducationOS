# Re-Authentication Required

## The Issue

You're seeing this error:
```
WARNING: No social token found for user
ERROR: Internal Server Error: /api/tasks/create/
```

## Why This Happens

When we added Google Tasks and Calendar integration, we added new OAuth scopes:
- `https://www.googleapis.com/auth/tasks` (NEW)
- `https://www.googleapis.com/auth/calendar.readonly` (NEW)

Your current OAuth token doesn't have these permissions because you signed in before we added them.

## How to Fix (2 Steps)

### Step 1: Sign Out
Click the "Sign out" button in the top right, or go to:
```
http://127.0.0.1:8000/logout
```

### Step 2: Sign In Again
1. Go to: http://127.0.0.1:8000/login
2. Click "Sign in with Google"
3. **IMPORTANT**: You'll see a new permissions screen with:
   - ✓ See your personal info
   - ✓ See your email address
   - ✓ Read your Gmail messages
   - ✓ **View and manage your tasks** ← NEW!
   - ✓ **View your calendars** ← NEW!
4. Click "Allow" or "Continue"

### That's It!

After signing in, everything will work:
- ✅ Create tasks
- ✅ View tasks
- ✅ Edit tasks
- ✅ Delete tasks
- ✅ View calendar events
- ✅ Sync with Google

## What You'll See

### Before Re-Auth
- Purple banner: "Google Tasks permission required"
- "Sign Out & Reconnect" button
- Tasks won't load
- Create task fails

### After Re-Auth
- Banner disappears
- Tasks load from Google
- Everything works perfectly!

## Alternative: Revoke and Re-Grant

If signing out doesn't work:

1. **Revoke access in Google:**
   - Go to: https://myaccount.google.com/permissions
   - Find "Eduverse" (or your app name)
   - Click "Remove access"

2. **Sign in again:**
   - Go to: http://127.0.0.1:8000/login
   - Grant all permissions

## Helpful Features Added

### 1. Permission Banner
- Shows when Tasks permission is missing
- Purple gradient design
- "Sign Out & Reconnect" button
- Auto-hides when permission granted

### 2. Better Error Messages
- "Google Tasks not connected" instead of generic error
- Suggests signing out and in again
- Prompts to reconnect automatically

### 3. Auto-Detection
- Checks if service is available
- Shows banner if not
- Hides banner when working

## Technical Details

### What Changed in Code

**Core/views.py:**
- Added service availability check
- Returns 403 with `needs_reauth: true`
- Better error messages

**static/app.js:**
- Detects 403 errors
- Shows permission banner
- Prompts user to reconnect
- Auto-hides banner when fixed

**templates/index.html:**
- Added permission banner HTML
- Beautiful gradient design
- Clear call-to-action

**static/google-style.css:**
- Banner styling
- Slide-in animation
- Responsive design

### OAuth Scopes Now Required

```python
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': [
            'profile',
            'email',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/tasks',  # NEW
            'https://www.googleapis.com/auth/calendar.readonly',  # NEW
        ],
    }
}
```

## Troubleshooting

### "Still not working after re-auth"

1. Check Django logs:
   ```bash
   cat django.log | tail -20
   ```

2. Check browser console (F12)

3. Try clearing browser cache:
   - Chrome: Ctrl+Shift+Delete
   - Select "Cookies and site data"
   - Clear

4. Try incognito/private window

### "Permission screen doesn't show new scopes"

Google might be using cached consent. To force new consent:

1. Go to: https://myaccount.google.com/permissions
2. Remove "Eduverse"
3. Clear browser cookies
4. Sign in again

### "Token expired" error

This is normal. The refresh token will automatically renew it. Just:
1. Sign out
2. Sign in again

## Why This is Better

### Before
- ❌ Generic error messages
- ❌ No guidance for users
- ❌ Confusing 500 errors
- ❌ No visual feedback

### After
- ✅ Clear error messages
- ✅ Beautiful permission banner
- ✅ One-click reconnect
- ✅ Auto-detection
- ✅ Helpful prompts

## Summary

**Problem:** OAuth token missing new permissions
**Solution:** Sign out and sign in again
**Time:** 30 seconds
**Result:** Everything works!

Just click "Sign Out & Reconnect" when you see the purple banner, or manually sign out and back in. That's it!

# Gmail Inbox Empty - Fix Guide

## Why Your Inbox is Empty

Your inbox is showing empty because of one or more of these issues:

1. **Missing Google API libraries** (MOST LIKELY)
2. **OAuth token doesn't have Gmail permissions**
3. **Token expired**
4. **Gmail scope not granted during sign-in**

## Step-by-Step Fix

### Step 1: Install Missing Dependencies

The Google API client libraries are missing from your installation.

```bash
pip install -r requirements.txt
```

This will install:
- `google-api-python-client` - Gmail API client
- `google-auth` - Authentication library
- `google-auth-httplib2` - HTTP library for Google Auth
- `google-auth-oauthlib` - OAuth2 support

### Step 2: Run the Debug Script

```bash
python debug_gmail.py
```

This will check:
- ✓ If Google API libraries are installed
- ✓ If Google OAuth app is configured
- ✓ If you have a social account
- ✓ If your OAuth token exists and is valid
- ✓ If Gmail API access is working
- ✓ If emails can be fetched

### Step 3: Check Your OAuth Token

The most common issue is that your OAuth token doesn't have Gmail permissions.

**To fix this:**

1. Sign out of the application
2. Go to your Google Account: https://myaccount.google.com/permissions
3. Remove "Eduverse" from connected apps
4. Sign in again to the application
5. **IMPORTANT**: When Google asks for permissions, make sure you see and approve:
   - "See your personal info"
   - "See your email address"
   - **"Read your Gmail messages"** ← This is critical!

### Step 4: Verify in Django Admin

1. Go to: http://127.0.0.1:8000/admin/
2. Navigate to: **Social accounts** → **Social application tokens**
3. Check if your token exists
4. Check the expiration date

### Step 5: Check Django Logs

After signing in, check the logs:

```bash
# Check console output
# Or check the log file
cat django.log | grep -i gmail
```

Look for:
- "Building Gmail service for user..."
- "Fetched X emails for user..."
- Any error messages

## Common Issues & Solutions

### Issue 1: "ModuleNotFoundError: No module named 'google'"

**Solution:**
```bash
pip install google-api-python-client google-auth google-auth-oauthlib
```

### Issue 2: "No social token found"

**Solution:**
- Sign out and sign in again
- Make sure you're using Google OAuth (not regular login)

### Issue 3: "Gmail API error: 403"

**Solution:**
- Your token doesn't have Gmail permissions
- Sign out, revoke app access in Google, sign in again
- Make sure to grant Gmail access when prompted

### Issue 4: "Token is expired"

**Solution:**
- Sign out and sign in again
- The refresh token should automatically renew it

### Issue 5: "No Google app configured"

**Solution:**
1. Go to Django admin: http://127.0.0.1:8000/admin/
2. Navigate to: **Sites** → **Social applications**
3. Add a new social application:
   - Provider: Google
   - Name: Google
   - Client ID: (from Google Cloud Console)
   - Secret key: (from Google Cloud Console)
   - Sites: Select your site

## Verify Gmail Scope in Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Go to: **APIs & Services** → **OAuth consent screen**
4. Check that scopes include:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `.../auth/gmail.readonly` ← **This must be present!**

## Test in Python Shell

You can also test directly in Django shell:

```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User
from Core.gmail_service import GmailService

# Get your user
user = User.objects.first()

# Try to fetch emails
gmail = GmailService(user)
emails = gmail.get_emails(5)

print(f"Fetched {len(emails)} emails")
for email in emails:
    print(f"- {email['subject']}")
```

## Still Not Working?

If you've tried everything above and it's still not working:

1. **Check the browser console** for JavaScript errors
2. **Check Django logs** for Python errors
3. **Verify your Gmail actually has emails** (check in Gmail directly)
4. **Try with a different Google account**
5. **Check if Gmail API is enabled** in Google Cloud Console:
   - Go to: APIs & Services → Library
   - Search for "Gmail API"
   - Make sure it's enabled

## Quick Checklist

- [ ] Installed Google API libraries (`pip install -r requirements.txt`)
- [ ] Ran debug script (`python debug_gmail.py`)
- [ ] Signed out and signed in again
- [ ] Granted Gmail permissions during OAuth
- [ ] Checked Django logs for errors
- [ ] Verified Gmail scope in Google Cloud Console
- [ ] Verified OAuth token exists in Django admin
- [ ] Checked that Gmail API is enabled in Google Cloud Console

## Need More Help?

Check the logs at `django.log` for detailed error messages with full stack traces.

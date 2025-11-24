#!/usr/bin/env python
"""
Debug script to check Gmail integration
Run with: python debug_gmail.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AuthenticationProject.settings')
django.setup()

from django.contrib.auth.models import User
from allauth.socialaccount.models import SocialAccount, SocialToken, SocialApp
from Core.gmail_service import GmailService

def debug_gmail():
    print("=" * 60)
    print("Gmail Integration Debug Report")
    print("=" * 60)
    
    # Check if Google API libraries are installed
    print("\n1. Checking Google API libraries...")
    try:
        import google.oauth2.credentials
        import googleapiclient.discovery
        print("   ✓ Google API libraries are installed")
    except ImportError as e:
        print(f"   ✗ Missing Google API libraries: {e}")
        print("   → Run: pip install -r requirements.txt")
        return
    
    # Check if Google app is configured
    print("\n2. Checking Google OAuth app configuration...")
    try:
        google_app = SocialApp.objects.get(provider='google')
        print(f"   ✓ Google app configured: {google_app.name}")
        print(f"   - Client ID: {google_app.client_id[:20]}...")
        print(f"   - Has secret: {'Yes' if google_app.secret else 'No'}")
    except SocialApp.DoesNotExist:
        print("   ✗ No Google app configured in Django admin")
        print("   → Go to /admin/socialaccount/socialapp/ and add Google OAuth credentials")
        return
    
    # Check for users
    print("\n3. Checking for authenticated users...")
    users = User.objects.all()
    if not users.exists():
        print("   ✗ No users found")
        print("   → Sign in with Google first")
        return
    
    print(f"   ✓ Found {users.count()} user(s)")
    
    # Check each user's social account
    for user in users:
        print(f"\n4. Checking user: {user.email}")
        
        # Check social account
        try:
            social_account = SocialAccount.objects.get(user=user, provider='google')
            print(f"   ✓ Social account found")
            print(f"   - Provider: {social_account.provider}")
            print(f"   - UID: {social_account.uid}")
            
            # Check scopes
            extra_data = social_account.extra_data
            print(f"   - Email: {extra_data.get('email', 'N/A')}")
            print(f"   - Name: {extra_data.get('name', 'N/A')}")
            
        except SocialAccount.DoesNotExist:
            print(f"   ✗ No social account found for {user.email}")
            continue
        
        # Check social token
        try:
            social_token = SocialToken.objects.get(
                account__user=user,
                account__provider='google'
            )
            print(f"   ✓ OAuth token found")
            print(f"   - Token: {social_token.token[:20]}...")
            print(f"   - Has refresh token: {'Yes' if social_token.token_secret else 'No'}")
            print(f"   - Expires: {social_token.expires_at}")
            
            # Check if token is expired
            from django.utils import timezone
            if social_token.expires_at and social_token.expires_at < timezone.now():
                print(f"   ⚠ Token is EXPIRED!")
                print(f"   → Sign out and sign in again to refresh token")
            
        except SocialToken.DoesNotExist:
            print(f"   ✗ No OAuth token found")
            print(f"   → Sign out and sign in again")
            continue
        
        # Try to fetch emails
        print(f"\n5. Testing Gmail API for {user.email}...")
        try:
            gmail_service = GmailService(user)
            if not gmail_service.service:
                print("   ✗ Failed to build Gmail service")
                print("   → Check logs for details")
                continue
            
            print("   ✓ Gmail service built successfully")
            
            # Try to get labels first (simpler API call)
            print("   - Testing Gmail API access...")
            labels = gmail_service.get_labels()
            if labels:
                print(f"   ✓ Gmail API access working! Found {len(labels)} labels")
                print(f"   - Labels: {', '.join([l['name'] for l in labels[:5]])}")
            else:
                print("   ✗ No labels returned (API might not have access)")
            
            # Try to fetch emails
            print("   - Fetching emails...")
            emails = gmail_service.get_emails(5)
            if emails:
                print(f"   ✓ Successfully fetched {len(emails)} emails!")
                for i, email in enumerate(emails[:3], 1):
                    print(f"   {i}. {email['subject'][:50]}")
                    print(f"      From: {email['sender'][:40]}")
            else:
                print("   ✗ No emails returned")
                print("   Possible reasons:")
                print("   - Gmail inbox is actually empty")
                print("   - Gmail scope not granted during OAuth")
                print("   - Token doesn't have gmail.readonly permission")
                print("\n   → Try signing out and signing in again")
                print("   → Make sure to grant Gmail access when prompted")
                
        except Exception as e:
            print(f"   ✗ Error: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("Debug complete!")
    print("=" * 60)

if __name__ == '__main__':
    debug_gmail()

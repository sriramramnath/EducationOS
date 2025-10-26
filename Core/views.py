from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from .gmail_service import GmailService

@login_required
def Home(request):
    # Get user's profile picture and email from Google OAuth
    from allauth.socialaccount.models import SocialAccount
    
    # Default values
    user_data = {}
    all_data = {}
    emails = []
    
    try:
        # Get the social account data - try by user first (provider ID might be numeric)
        social_account = SocialAccount.objects.filter(user=request.user).first()
        
        if social_account:
            extra_data = social_account.extra_data
            
            # Store ALL data from Google
            all_data = extra_data
            
            # Extract all available data from Google
            user_data = {
                'email': extra_data.get('email', request.user.email),
                'name': extra_data.get('name', ''),
                'given_name': extra_data.get('given_name', ''),
                'family_name': extra_data.get('family_name', ''),
                'picture': extra_data.get('picture', ''),
                'verified_email': extra_data.get('email_verified', False),
                'locale': extra_data.get('locale', ''),
            }
            
            # Try to fetch Gmail emails
            try:
                gmail_service = GmailService(request.user)
                emails = gmail_service.get_emails(10)
                print(f"Fetched {len(emails)} emails")
            except Exception as e:
                print(f"Error fetching emails: {e}")
                emails = []
        else:
            raise SocialAccount.DoesNotExist
        
    except (SocialAccount.DoesNotExist, AttributeError):
        user_data = {
            'email': request.user.email,
            'name': request.user.get_full_name(),
            'picture': '',
        }

    context = {
        'user_data': user_data,
        'all_data': all_data,
        'emails': emails,
    }

    return render(request, 'index.html', context)

def LoginView(request):
    return render(request, 'login.html')

def LogoutView(request):
    logout(request)
    return redirect('login')
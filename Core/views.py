from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
import json
from datetime import datetime
from .gmail_service import GmailService
from .google_tasks_service import GoogleTasksService
from .google_calendar_service import GoogleCalendarService
import logging

logger = logging.getLogger(__name__)

@login_required
def Home(request):
    # Get user's profile picture and email from Google OAuth
    from allauth.socialaccount.models import SocialAccount
    
    # Default values
    user_data = {}
    emails = []
    tasks = []
    calendar_events = []
    
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
                logger.info(f"Fetched {len(emails)} emails for user {request.user.email}")
            except Exception as e:
                logger.error(f"Error fetching emails for user {request.user.email}: {e}", exc_info=True)
                emails = []
            
            # Try to fetch Google Tasks
            try:
                tasks_service = GoogleTasksService(request.user)
                tasks = tasks_service.get_tasks()
                logger.info(f"Fetched {len(tasks)} tasks for user {request.user.email}")
            except Exception as e:
                logger.error(f"Error fetching tasks for user {request.user.email}: {e}", exc_info=True)
            
            # Try to fetch Google Calendar events
            try:
                calendar_service = GoogleCalendarService(request.user)
                calendar_events = calendar_service.get_upcoming_events(max_results=20, days_ahead=30)
                logger.info(f"Fetched {len(calendar_events)} calendar events for user {request.user.email}")
            except Exception as e:
                logger.error(f"Error fetching calendar events for user {request.user.email}: {e}", exc_info=True)
        else:
            raise SocialAccount.DoesNotExist
        
    except (SocialAccount.DoesNotExist, AttributeError):
        user_data = {
            'email': request.user.email,
            'name': request.user.get_full_name(),
            'picture': '',
        }

    serialized_emails = []
    for email in emails:
        email_copy = email.copy()
        email_date = email_copy.get('date')
        if isinstance(email_date, datetime):
            email_copy['date'] = email_date.isoformat()
        serialized_emails.append(email_copy)

    initial_payload = {
        'user': user_data,
        'emails': serialized_emails,
        'tasks': tasks,
        'events': calendar_events,
    }

    context = {
        'user_data': user_data,
        'initial_payload': initial_payload,
    }

    return render(request, 'index.html', context)

def LoginView(request):
    return render(request, 'login.html')

def LogoutView(request):
    logout(request)
    return redirect('login')


# API endpoints for Google Tasks
@login_required
@require_http_methods(["POST"])
def create_task(request):
    """Create a new task in Google Tasks"""
    try:
        data = json.loads(request.body)
        title = data.get('title')
        description = data.get('description', '')
        
        if not title:
            return JsonResponse({'error': 'Title is required'}, status=400)
        
        tasks_service = GoogleTasksService(request.user)
        
        # Check if service was built successfully
        if not tasks_service.service:
            return JsonResponse({
                'error': 'Google Tasks not connected. Please sign out and sign in again to grant Tasks permission.',
                'needs_reauth': True
            }, status=403)
        
        result = tasks_service.create_task(title, description)
        
        if result:
            return JsonResponse({'success': True, 'task': result})
        else:
            return JsonResponse({'error': 'Failed to create task'}, status=500)
            
    except Exception as e:
        logger.error(f"Error creating task: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["PUT"])
def update_task(request, task_id):
    """Update a task in Google Tasks"""
    try:
        data = json.loads(request.body)
        title = data.get('title')
        description = data.get('description')
        status = data.get('status')
        
        tasks_service = GoogleTasksService(request.user)
        result = tasks_service.update_task(task_id, title, description, status)
        
        if result:
            return JsonResponse({'success': True, 'task': result})
        else:
            return JsonResponse({'error': 'Failed to update task'}, status=500)
            
    except Exception as e:
        logger.error(f"Error updating task: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["DELETE"])
def delete_task(request, task_id):
    """Delete a task from Google Tasks"""
    try:
        tasks_service = GoogleTasksService(request.user)
        success = tasks_service.delete_task(task_id)
        
        if success:
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'error': 'Failed to delete task'}, status=500)
            
    except Exception as e:
        logger.error(f"Error deleting task: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def get_tasks(request):
    """Get all tasks from Google Tasks"""
    try:
        tasks_service = GoogleTasksService(request.user)

        if not tasks_service.service:
            return JsonResponse({
                'error': 'Google Tasks not connected. Please sign out and sign in again to grant Tasks permission.',
                'needs_reauth': True
            }, status=403)
        
        tasks = tasks_service.get_tasks()
        return JsonResponse({'tasks': tasks})
    except Exception as e:
        logger.error(f"Error getting tasks: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def get_emails(request):
    """Expose recent Gmail messages via JSON."""
    try:
        gmail_service = GmailService(request.user)
        if not gmail_service.service:
            return JsonResponse(
                {
                    'error': 'Gmail not connected. Please sign out and sign back in to grant Gmail permission.',
                    'needs_reauth': True,
                },
                status=403,
            )

        emails = gmail_service.get_emails(25)
        serialized = []
        for email in emails:
            email_date = email.get('date')
            if isinstance(email_date, datetime):
                email_date = email_date.isoformat()

            serialized.append(
                {
                    'id': email.get('id'),
                    'subject': email.get('subject'),
                    'sender': email.get('sender'),
                    'snippet': email.get('snippet', ''),
                    'date': email_date,
                    'body': email.get('body', ''),
                }
            )

        return JsonResponse({'emails': serialized})
    except Exception as exc:
        logger.error("Error getting emails: %s", exc, exc_info=True)
        return JsonResponse({'error': str(exc)}, status=500)


@login_required
def get_calendar_events(request):
    """Return upcoming Google Calendar events as JSON."""
    try:
        calendar_service = GoogleCalendarService(request.user)
        if not calendar_service.service:
            return JsonResponse(
                {
                    'error': 'Google Calendar not connected. Please sign out and sign back in to grant Calendar permission.',
                    'needs_reauth': True,
                },
                status=403,
            )

        events = calendar_service.get_upcoming_events(max_results=20, days_ahead=30)
        return JsonResponse({'events': events})
    except Exception as exc:
        logger.error("Error getting calendar events: %s", exc, exc_info=True)
        return JsonResponse({'error': str(exc)}, status=500)

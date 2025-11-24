from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
import json
from datetime import datetime
from allauth.socialaccount.models import SocialAccount
from .gmail_service import GmailService
from .google_tasks_service import GoogleTasksService
from .google_calendar_service import GoogleCalendarService
import logging

logger = logging.getLogger(__name__)

@login_required
def Home(request):
    # Get user's profile picture and email from Google OAuth

    user_data = {
        'email': request.user.email,
        'name': request.user.get_full_name(),
        'given_name': request.user.first_name,
        'family_name': request.user.last_name,
        'picture': '',
        'verified_email': False,
        'locale': '',
    }

    try:
        social_account = SocialAccount.objects.filter(user=request.user).first()  # type: ignore[attr-defined]
        if social_account:
            extra_data = social_account.extra_data or {}
            user_data.update({
                'email': extra_data.get('email', user_data['email']),
                'name': extra_data.get('name', user_data['name']),
                'given_name': extra_data.get('given_name', user_data['given_name']),
                'family_name': extra_data.get('family_name', user_data['family_name']),
                'picture': extra_data.get('picture', user_data['picture']),
                'verified_email': extra_data.get('email_verified', user_data['verified_email']),
                'locale': extra_data.get('locale', user_data['locale']),
            })
    except Exception as exc:  # pragma: no cover - defensive; we still render the dashboard
        logger.warning("Unable to load social profile for %s: %s", request.user.email, exc, exc_info=True)

    context = {
        'user_data': user_data,
        'stats': {
            'emails': 0,
            'tasks_total': 0,
            'tasks_active': 0,
            'events': 0,
        },
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
        
        if not tasks_service.service:
            return JsonResponse({
                'error': 'Google Tasks not connected. Please sign out and sign in again to grant Tasks permission.',
                'needs_reauth': True
            }, status=403)
        
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
        
        if not tasks_service.service:
            return JsonResponse({
                'error': 'Google Tasks not connected. Please sign out and sign in again to grant Tasks permission.',
                'needs_reauth': True
            }, status=403)
        
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
        
        # Check if service was built successfully
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
    """Expose recent Gmail messages via JSON so the UI can stay API-driven."""
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

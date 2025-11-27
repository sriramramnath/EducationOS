from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.db.models import Sum, Count, Q, Avg
from django.db.models.functions import TruncDate
import json
from datetime import datetime, timedelta
from .gmail_service import GmailService
from .google_tasks_service import GoogleTasksService
from .google_calendar_service import GoogleCalendarService
from .models import Goal, Achievement, TimeTracking, Habit, HabitCompletion
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


# ─────────────────────────────────────────────────────────────────────────────
# Goals API Endpoints
# ─────────────────────────────────────────────────────────────────────────────
@login_required
def get_goals(request):
    """Get all goals for the user"""
    try:
        goals = Goal.objects.filter(user=request.user)
        goals_data = []
        for goal in goals:
            goals_data.append({
                'id': goal.id,
                'title': goal.title,
                'description': goal.description,
                'target_value': float(goal.target_value),
                'current_value': float(goal.current_value),
                'unit': goal.unit,
                'status': goal.status,
                'category': goal.category,
                'deadline': goal.deadline.isoformat() if goal.deadline else None,
                'progress_percentage': goal.progress_percentage,
                'is_overdue': goal.is_overdue,
                'created_at': goal.created_at.isoformat(),
                'updated_at': goal.updated_at.isoformat(),
            })
        return JsonResponse({'goals': goals_data})
    except Exception as e:
        logger.error(f"Error getting goals: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
def create_goal(request):
    """Create a new goal"""
    try:
        data = json.loads(request.body)
        goal = Goal.objects.create(
            user=request.user,
            title=data.get('title'),
            description=data.get('description', ''),
            target_value=data.get('target_value', 100),
            current_value=data.get('current_value', 0),
            unit=data.get('unit', 'points'),
            category=data.get('category', ''),
            deadline=datetime.fromisoformat(data['deadline']) if data.get('deadline') else None,
        )
        return JsonResponse({
            'success': True,
            'goal': {
                'id': goal.id,
                'title': goal.title,
                'description': goal.description,
                'target_value': float(goal.target_value),
                'current_value': float(goal.current_value),
                'unit': goal.unit,
                'status': goal.status,
                'category': goal.category,
                'deadline': goal.deadline.isoformat() if goal.deadline else None,
                'progress_percentage': goal.progress_percentage,
            }
        })
    except Exception as e:
        logger.error(f"Error creating goal: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["PUT"])
def update_goal(request, goal_id):
    """Update a goal"""
    try:
        goal = Goal.objects.get(id=goal_id, user=request.user)
        data = json.loads(request.body)
        
        if 'title' in data:
            goal.title = data['title']
        if 'description' in data:
            goal.description = data.get('description', '')
        if 'target_value' in data:
            goal.target_value = data['target_value']
        if 'current_value' in data:
            goal.current_value = data['current_value']
        if 'unit' in data:
            goal.unit = data['unit']
        if 'status' in data:
            goal.status = data['status']
            if data['status'] == 'completed' and not goal.completed_at:
                goal.completed_at = timezone.now()
        if 'category' in data:
            goal.category = data['category']
        if 'deadline' in data:
            goal.deadline = datetime.fromisoformat(data['deadline']) if data['deadline'] else None
        
        goal.save()
        
        # Check for achievements
        if goal.status == 'completed' and goal.progress_percentage >= 100:
            Achievement.objects.get_or_create(
                user=request.user,
                goal=goal,
                defaults={
                    'title': f'Completed: {goal.title}',
                    'description': f'You achieved your goal of {goal.title}!',
                    'icon': 'trophy-fill',
                }
            )
        
        return JsonResponse({
            'success': True,
            'goal': {
                'id': goal.id,
                'title': goal.title,
                'description': goal.description,
                'target_value': float(goal.target_value),
                'current_value': float(goal.current_value),
                'unit': goal.unit,
                'status': goal.status,
                'category': goal.category,
                'deadline': goal.deadline.isoformat() if goal.deadline else None,
                'progress_percentage': goal.progress_percentage,
            }
        })
    except Goal.DoesNotExist:
        return JsonResponse({'error': 'Goal not found'}, status=404)
    except Exception as e:
        logger.error(f"Error updating goal: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["DELETE"])
def delete_goal(request, goal_id):
    """Delete a goal"""
    try:
        goal = Goal.objects.get(id=goal_id, user=request.user)
        goal.delete()
        return JsonResponse({'success': True})
    except Goal.DoesNotExist:
        return JsonResponse({'error': 'Goal not found'}, status=404)
    except Exception as e:
        logger.error(f"Error deleting goal: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def get_achievements(request):
    """Get all achievements for the user"""
    try:
        achievements = Achievement.objects.filter(user=request.user)
        achievements_data = []
        for achievement in achievements:
            achievements_data.append({
                'id': achievement.id,
                'title': achievement.title,
                'description': achievement.description,
                'icon': achievement.icon,
                'unlocked_at': achievement.unlocked_at.isoformat(),
            })
        return JsonResponse({'achievements': achievements_data})
    except Exception as e:
        logger.error(f"Error getting achievements: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


# ─────────────────────────────────────────────────────────────────────────────
# Time Tracking API Endpoints
# ─────────────────────────────────────────────────────────────────────────────
@login_required
def get_time_tracking(request):
    """Get time tracking data with analytics"""
    try:
        days = int(request.GET.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Get all time tracking entries
        entries = TimeTracking.objects.filter(
            user=request.user,
            start_time__gte=start_date
        ).order_by('-start_time')
        
        entries_data = []
        for entry in entries:
            entries_data.append({
                'id': entry.id,
                'activity_type': entry.activity_type,
                'description': entry.description,
                'start_time': entry.start_time.isoformat(),
                'end_time': entry.end_time.isoformat() if entry.end_time else None,
                'duration_minutes': entry.duration_minutes,
                'created_at': entry.created_at.isoformat(),
            })
        
        # Calculate analytics
        total_minutes = entries.aggregate(Sum('duration_minutes'))['duration_minutes__sum'] or 0
        total_hours = total_minutes / 60
        
        # Daily breakdown
        daily_data = entries.values('start_time__date').annotate(
            total_minutes=Sum('duration_minutes')
        ).order_by('start_time__date')
        
        daily_breakdown = []
        for day in daily_data:
            daily_breakdown.append({
                'date': day['start_time__date'].isoformat(),
                'total_minutes': day['total_minutes'] or 0,
            })
        
        # Activity type breakdown
        activity_breakdown = entries.values('activity_type').annotate(
            total_minutes=Sum('duration_minutes')
        )
        
        activity_data = {}
        for activity in activity_breakdown:
            activity_data[activity['activity_type']] = activity['total_minutes'] or 0
        
        # Weekly averages
        weeks = days // 7 if days >= 7 else 1
        avg_daily_minutes = total_minutes / days if days > 0 else 0
        avg_weekly_hours = (total_minutes / weeks) / 60 if weeks > 0 else 0
        
        return JsonResponse({
            'entries': entries_data,
            'analytics': {
                'total_minutes': total_minutes,
                'total_hours': round(total_hours, 2),
                'avg_daily_minutes': round(avg_daily_minutes, 2),
                'avg_weekly_hours': round(avg_weekly_hours, 2),
                'daily_breakdown': daily_breakdown,
                'activity_breakdown': activity_data,
            }
        })
    except Exception as e:
        logger.error(f"Error getting time tracking: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
def create_time_entry(request):
    """Create a new time tracking entry"""
    try:
        data = json.loads(request.body)
        entry = TimeTracking.objects.create(
            user=request.user,
            activity_type=data.get('activity_type', 'study'),
            description=data.get('description', ''),
            start_time=datetime.fromisoformat(data['start_time']) if data.get('start_time') else timezone.now(),
            end_time=datetime.fromisoformat(data['end_time']) if data.get('end_time') else None,
        )
        return JsonResponse({
            'success': True,
            'entry': {
                'id': entry.id,
                'activity_type': entry.activity_type,
                'description': entry.description,
                'start_time': entry.start_time.isoformat(),
                'end_time': entry.end_time.isoformat() if entry.end_time else None,
                'duration_minutes': entry.duration_minutes,
            }
        })
    except Exception as e:
        logger.error(f"Error creating time entry: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["PUT"])
def update_time_entry(request, entry_id):
    """Update a time tracking entry"""
    try:
        entry = TimeTracking.objects.get(id=entry_id, user=request.user)
        data = json.loads(request.body)
        
        if 'end_time' in data:
            entry.end_time = datetime.fromisoformat(data['end_time']) if data['end_time'] else None
        if 'activity_type' in data:
            entry.activity_type = data['activity_type']
        if 'description' in data:
            entry.description = data['description']
        
        entry.save()
        
        return JsonResponse({
            'success': True,
            'entry': {
                'id': entry.id,
                'activity_type': entry.activity_type,
                'description': entry.description,
                'start_time': entry.start_time.isoformat(),
                'end_time': entry.end_time.isoformat() if entry.end_time else None,
                'duration_minutes': entry.duration_minutes,
            }
        })
    except TimeTracking.DoesNotExist:
        return JsonResponse({'error': 'Entry not found'}, status=404)
    except Exception as e:
        logger.error(f"Error updating time entry: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["DELETE"])
def delete_time_entry(request, entry_id):
    """Delete a time tracking entry"""
    try:
        entry = TimeTracking.objects.get(id=entry_id, user=request.user)
        entry.delete()
        return JsonResponse({'success': True})
    except TimeTracking.DoesNotExist:
        return JsonResponse({'error': 'Entry not found'}, status=404)
    except Exception as e:
        logger.error(f"Error deleting time entry: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


# ─────────────────────────────────────────────────────────────────────────────
# Habits API Endpoints
# ─────────────────────────────────────────────────────────────────────────────
@login_required
def get_habits(request):
    """Get all habits with streak information"""
    try:
        habits = Habit.objects.filter(user=request.user)
        habits_data = []
        for habit in habits:
            habits_data.append({
                'id': habit.id,
                'name': habit.name,
                'description': habit.description,
                'frequency': habit.frequency,
                'target_count': habit.target_count,
                'color': habit.color,
                'icon': habit.icon,
                'is_active': habit.is_active,
                'current_streak': habit.current_streak,
                'longest_streak': habit.longest_streak,
                'created_at': habit.created_at.isoformat(),
            })
        return JsonResponse({'habits': habits_data})
    except Exception as e:
        logger.error(f"Error getting habits: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@login_required
def get_habit_completions(request, habit_id):
    """Get completion history for a habit"""
    try:
        habit = Habit.objects.get(id=habit_id, user=request.user)
        days = int(request.GET.get('days', 90))
        start_date = timezone.now().date() - timedelta(days=days)
        
        completions = HabitCompletion.objects.filter(
            habit=habit,
            date__gte=start_date
        ).order_by('-date')
        
        completions_data = []
        for completion in completions:
            completions_data.append({
                'id': completion.id,
                'date': completion.date.isoformat(),
                'completed': completion.completed,
                'notes': completion.notes,
            })
        
        return JsonResponse({'completions': completions_data})
    except Habit.DoesNotExist:
        return JsonResponse({'error': 'Habit not found'}, status=404)
    except Exception as e:
        logger.error(f"Error getting habit completions: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
def create_habit(request):
    """Create a new habit"""
    try:
        data = json.loads(request.body)
        habit = Habit.objects.create(
            user=request.user,
            name=data.get('name'),
            description=data.get('description', ''),
            frequency=data.get('frequency', 'daily'),
            target_count=data.get('target_count', 1),
            color=data.get('color', 'blue'),
            icon=data.get('icon', 'star'),
        )
        return JsonResponse({
            'success': True,
            'habit': {
                'id': habit.id,
                'name': habit.name,
                'description': habit.description,
                'frequency': habit.frequency,
                'target_count': habit.target_count,
                'color': habit.color,
                'icon': habit.icon,
                'is_active': habit.is_active,
                'current_streak': habit.current_streak,
                'longest_streak': habit.longest_streak,
            }
        })
    except Exception as e:
        logger.error(f"Error creating habit: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["PUT"])
def update_habit(request, habit_id):
    """Update a habit"""
    try:
        habit = Habit.objects.get(id=habit_id, user=request.user)
        data = json.loads(request.body)
        
        if 'name' in data:
            habit.name = data['name']
        if 'description' in data:
            habit.description = data.get('description', '')
        if 'frequency' in data:
            habit.frequency = data['frequency']
        if 'target_count' in data:
            habit.target_count = data['target_count']
        if 'color' in data:
            habit.color = data['color']
        if 'icon' in data:
            habit.icon = data['icon']
        if 'is_active' in data:
            habit.is_active = data['is_active']
        
        habit.save()
        
        return JsonResponse({
            'success': True,
            'habit': {
                'id': habit.id,
                'name': habit.name,
                'description': habit.description,
                'frequency': habit.frequency,
                'target_count': habit.target_count,
                'color': habit.color,
                'icon': habit.icon,
                'is_active': habit.is_active,
                'current_streak': habit.current_streak,
                'longest_streak': habit.longest_streak,
            }
        })
    except Habit.DoesNotExist:
        return JsonResponse({'error': 'Habit not found'}, status=404)
    except Exception as e:
        logger.error(f"Error updating habit: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["DELETE"])
def delete_habit(request, habit_id):
    """Delete a habit"""
    try:
        habit = Habit.objects.get(id=habit_id, user=request.user)
        habit.delete()
        return JsonResponse({'success': True})
    except Habit.DoesNotExist:
        return JsonResponse({'error': 'Habit not found'}, status=404)
    except Exception as e:
        logger.error(f"Error deleting habit: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


@login_required
@require_http_methods(["POST"])
def toggle_habit_completion(request, habit_id):
    """Toggle habit completion for today"""
    try:
        habit = Habit.objects.get(id=habit_id, user=request.user)
        today = timezone.now().date()
        
        completion, created = HabitCompletion.objects.get_or_create(
            habit=habit,
            date=today,
            defaults={'completed': True}
        )
        
        if not created:
            completion.completed = not completion.completed
            completion.save()
        
        return JsonResponse({
            'success': True,
            'completed': completion.completed,
            'current_streak': habit.current_streak,
        })
    except Habit.DoesNotExist:
        return JsonResponse({'error': 'Habit not found'}, status=404)
    except Exception as e:
        logger.error(f"Error toggling habit completion: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)

from django.urls import path
from . import views

urlpatterns = [
    path('', views.Home, name='home'),
    path('login/', views.LoginView, name='login'),
    path('logout/', views.LogoutView, name='logout'),
    
    # Google Tasks API endpoints
    path('api/tasks/', views.get_tasks, name='get_tasks'),
    path('api/tasks/create/', views.create_task, name='create_task'),
    path('api/tasks/<str:task_id>/update/', views.update_task, name='update_task'),
    path('api/tasks/<str:task_id>/delete/', views.delete_task, name='delete_task'),

    # Gmail and Calendar API endpoints
    path('api/emails/', views.get_emails, name='get_emails'),
    path('api/calendar/', views.get_calendar_events, name='get_calendar_events'),
    
    # Goals API endpoints
    path('api/goals/', views.get_goals, name='get_goals'),
    path('api/goals/create/', views.create_goal, name='create_goal'),
    path('api/goals/<int:goal_id>/update/', views.update_goal, name='update_goal'),
    path('api/goals/<int:goal_id>/delete/', views.delete_goal, name='delete_goal'),
    path('api/achievements/', views.get_achievements, name='get_achievements'),
    
    # Time Tracking API endpoints
    path('api/time-tracking/', views.get_time_tracking, name='get_time_tracking'),
    path('api/time-tracking/create/', views.create_time_entry, name='create_time_entry'),
    path('api/time-tracking/<int:entry_id>/update/', views.update_time_entry, name='update_time_entry'),
    path('api/time-tracking/<int:entry_id>/delete/', views.delete_time_entry, name='delete_time_entry'),
    
    # Habits API endpoints
    path('api/habits/', views.get_habits, name='get_habits'),
    path('api/habits/create/', views.create_habit, name='create_habit'),
    path('api/habits/<int:habit_id>/update/', views.update_habit, name='update_habit'),
    path('api/habits/<int:habit_id>/delete/', views.delete_habit, name='delete_habit'),
    path('api/habits/<int:habit_id>/completions/', views.get_habit_completions, name='get_habit_completions'),
    path('api/habits/<int:habit_id>/toggle/', views.toggle_habit_completion, name='toggle_habit_completion'),
]
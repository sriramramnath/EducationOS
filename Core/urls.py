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
]
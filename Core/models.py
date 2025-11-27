from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

class PasswordReset(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    reset_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_when = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Password reset for {self.user.username} at {self.created_when}"


class Goal(models.Model):
    GOAL_STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('paused', 'Paused'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    target_value = models.DecimalField(max_digits=10, decimal_places=2, default=100.0)
    current_value = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    unit = models.CharField(max_length=50, default='points', blank=True)  # e.g., 'hours', 'tasks', 'pages'
    status = models.CharField(max_length=20, choices=GOAL_STATUS_CHOICES, default='active')
    category = models.CharField(max_length=100, blank=True)  # e.g., 'Study', 'Fitness', 'Career'
    deadline = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"
    
    @property
    def progress_percentage(self):
        if self.target_value == 0:
            return 0
        return min(100, (self.current_value / self.target_value) * 100)
    
    @property
    def is_overdue(self):
        if self.deadline and self.status == 'active':
            return timezone.now() > self.deadline
        return False


class Achievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='achievements', null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default='trophy', blank=True)  # Icon name for display
    unlocked_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-unlocked_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"


class TimeTracking(models.Model):
    ACTIVITY_TYPES = [
        ('study', 'Study'),
        ('work', 'Work'),
        ('exercise', 'Exercise'),
        ('break', 'Break'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='time_tracking')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES, default='study')
    description = models.CharField(max_length=200, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(default=0)  # Duration in minutes
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-start_time']
    
    def __str__(self):
        return f"{self.activity_type} - {self.user.username} - {self.start_time}"
    
    def save(self, *args, **kwargs):
        if self.end_time and self.start_time:
            delta = self.end_time - self.start_time
            self.duration_minutes = int(delta.total_seconds() / 60)
        super().save(*args, **kwargs)


class Habit(models.Model):
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('custom', 'Custom'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='habits')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    target_count = models.IntegerField(default=1)  # How many times per period
    color = models.CharField(max_length=20, default='blue', blank=True)  # For UI display
    icon = models.CharField(max_length=50, default='star', blank=True)  # Icon name
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.user.username}"
    
    @property
    def current_streak(self):
        """Calculate current streak in days"""
        completions = self.completions.filter(completed=True).order_by('-date')
        if not completions.exists():
            return 0
        
        streak = 0
        today = timezone.now().date()
        current_date = today
        
        for completion in completions:
            if completion.date == current_date:
                streak += 1
                current_date = current_date - timezone.timedelta(days=1)
            elif completion.date < current_date:
                break
        
        return streak
    
    @property
    def longest_streak(self):
        """Calculate longest streak ever"""
        completions = self.completions.filter(completed=True).order_by('date')
        if not completions.exists():
            return 0
        
        max_streak = 0
        current_streak = 0
        prev_date = None
        
        for completion in completions:
            if prev_date is None:
                current_streak = 1
            elif (completion.date - prev_date).days == 1:
                current_streak += 1
            else:
                max_streak = max(max_streak, current_streak)
                current_streak = 1
            prev_date = completion.date
        
        return max(max_streak, current_streak)


class HabitCompletion(models.Model):
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='completions')
    date = models.DateField(default=timezone.now)
    completed = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['habit', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.habit.name} - {self.date} - {'Completed' if self.completed else 'Missed'}"
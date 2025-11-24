from googleapiclient.errors import HttpError
import logging

from .google_client import build_google_service

logger = logging.getLogger(__name__)


class GoogleTasksService:
    def __init__(self, user):
        self.user = user
        self.service = build_google_service(user, 'tasks', 'v1')
    
    def _format_task(self, task):
        """Format a Google Tasks task to our app format"""
        google_status = task.get('status')
        notes = task.get('notes', '')
        
        # Check if notes contain status marker
        if google_status == 'completed':
            status = 'done'
        elif '[IN_PROGRESS]' in notes:
            status = 'in-progress'
        else:
            status = 'not-started'
        
        # Remove status marker from description
        description = notes.replace('[IN_PROGRESS]', '').strip()
        
        return {
            'id': task['id'],
            'title': task.get('title', 'Untitled'),
            'description': description,
            'status': status,
            'due': task.get('due'),
            'completed': task.get('completed'),
            'updated': task.get('updated'),
        }
    
    def get_task_lists(self):
        """Get all task lists"""
        if not self.service:
            return []
        
        try:
            results = self.service.tasklists().list().execute()
            return results.get('items', [])
        except HttpError as error:
            logger.error(f"Error getting task lists: {error}", exc_info=True)
            return []
    
    def get_tasks(self, tasklist_id='@default', max_results=100):
        """Get tasks from a specific task list"""
        if not self.service:
            return []
        
        try:
            results = self.service.tasks().list(
                tasklist=tasklist_id,
                maxResults=max_results,
                showCompleted=True,
                showHidden=True
            ).execute()
            
            tasks = results.get('items', [])
            
            # Format tasks for our application
            formatted_tasks = [self._format_task(task) for task in tasks]
            
            return formatted_tasks
            
        except HttpError as error:
            logger.error(f"Error getting tasks: {error}", exc_info=True)
            return []
    
    def create_task(self, title, description='', tasklist_id='@default', due=None, status='not-started'):
        """Create a new task"""
        if not self.service:
            return None
        
        try:
            task = {
                'title': title,
                'status': 'needsAction',  # Default to not completed
            }
            
            # Add status marker to description if in-progress
            if status == 'in-progress':
                task['notes'] = f"[IN_PROGRESS] {description}".strip()
            elif description:
                task['notes'] = description
            
            if due:
                task['due'] = due
            
            result = self.service.tasks().insert(
                tasklist=tasklist_id,
                body=task
            ).execute()
            
            logger.info(f"Created task: {title}")
            
            # Format the result to match our app format
            return self._format_task(result)
            
        except HttpError as error:
            logger.error(f"Error creating task: {error}", exc_info=True)
            return None
    
    def update_task(self, task_id, title=None, description=None, status=None, tasklist_id='@default'):
        """Update an existing task"""
        if not self.service:
            return None
        
        try:
            # Get the current task first
            task = self.service.tasks().get(
                tasklist=tasklist_id,
                task=task_id
            ).execute()
            
            # Update fields
            if title:
                task['title'] = title
            
            # Handle status and description together
            # We store 'in-progress' status in the notes field
            if description is not None or status is not None:
                current_notes = task.get('notes', '')
                # Remove old status marker
                current_notes = current_notes.replace('[IN_PROGRESS]', '').strip()
                
                # Use new description if provided, otherwise keep current
                new_description = description if description is not None else current_notes
                
                # Add status marker if in-progress
                if status == 'in-progress':
                    task['notes'] = f"[IN_PROGRESS] {new_description}".strip()
                else:
                    task['notes'] = new_description
                
                # Set Google Tasks status
                if status == 'done':
                    task['status'] = 'completed'
                elif status in ['not-started', 'in-progress']:
                    task['status'] = 'needsAction'
            
            result = self.service.tasks().update(
                tasklist=tasklist_id,
                task=task_id,
                body=task
            ).execute()
            
            logger.info(f"Updated task: {task_id}")
            
            # Format the result to match our app format
            return self._format_task(result)
            
        except HttpError as error:
            logger.error(f"Error updating task: {error}", exc_info=True)
            return None
    
    def delete_task(self, task_id, tasklist_id='@default'):
        """Delete a task"""
        if not self.service:
            return False
        
        try:
            self.service.tasks().delete(
                tasklist=tasklist_id,
                task=task_id
            ).execute()
            
            logger.info(f"Deleted task: {task_id}")
            return True
            
        except HttpError as error:
            logger.error(f"Error deleting task: {error}", exc_info=True)
            return False

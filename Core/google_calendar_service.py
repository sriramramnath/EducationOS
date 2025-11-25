from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from allauth.socialaccount.models import SocialToken, SocialApp
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class GoogleCalendarService:
    def __init__(self, user):
        self.user = user
        self.service = self._build_service()
    
    def _build_service(self):
        """Build Google Calendar service using stored OAuth tokens"""
        try:
            social_token = SocialToken.objects.filter(
                account__user=self.user,
                account__provider='google'
            ).first()
            
            if not social_token:
                logger.warning(f"No social token found for user {self.user.email}")
                return None
            
            google_app = SocialApp.objects.filter(provider='google').first()
            if not google_app:
                logger.error("No Google app configured in Django admin")
                return None
            
            creds = Credentials(
                token=social_token.token,
                refresh_token=social_token.token_secret,
                token_uri='https://oauth2.googleapis.com/token',
                client_id=google_app.client_id,
                client_secret=google_app.secret,
            )
            
            logger.info(f"Building Google Calendar service for user {self.user.email}")
            return build('calendar', 'v3', credentials=creds)
            
        except Exception as e:
            logger.error(f"Error building Google Calendar service: {e}", exc_info=True)
            return None
    
    def get_calendars(self):
        """Get all calendars"""
        if not self.service:
            return []
        
        try:
            results = self.service.calendarList().list().execute()
            return results.get('items', [])
        except HttpError as error:
            logger.error(f"Error getting calendars: {error}", exc_info=True)
            return []
    
    def get_upcoming_events(self, max_results=10, days_ahead=7):
        """Get upcoming events from primary calendar"""
        if not self.service:
            return []
        
        try:
            now = datetime.utcnow()
            time_min = now.isoformat() + 'Z'
            time_max = (now + timedelta(days=days_ahead)).isoformat() + 'Z'
            
            results = self.service.events().list(
                calendarId='primary',
                timeMin=time_min,
                timeMax=time_max,
                maxResults=max_results,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = results.get('items', [])
            
            # Format events for our application
            formatted_events = []
            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))
                
                formatted_event = {
                    'id': event['id'],
                    'title': event.get('summary', 'No Title'),
                    'description': event.get('description', ''),
                    'start': start,
                    'end': end,
                    'location': event.get('location', ''),
                    'attendees': event.get('attendees', []),
                    'htmlLink': event.get('htmlLink', ''),
                    'colorId': event.get('colorId', ''),
                }
                formatted_events.append(formatted_event)
            
            return formatted_events
            
        except HttpError as error:
            logger.error(f"Error getting events: {error}", exc_info=True)
            return []
    
    def get_events_for_date(self, date):
        """Get events for a specific date"""
        if not self.service:
            return []
        
        try:
            # Start and end of the day
            start_of_day = datetime.combine(date, datetime.min.time())
            end_of_day = datetime.combine(date, datetime.max.time())
            
            time_min = start_of_day.isoformat() + 'Z'
            time_max = end_of_day.isoformat() + 'Z'
            
            results = self.service.events().list(
                calendarId='primary',
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            return results.get('items', [])
            
        except HttpError as error:
            logger.error(f"Error getting events for date: {error}", exc_info=True)
            return []

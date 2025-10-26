from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from allauth.socialaccount.models import SocialToken, SocialApp
import base64
import email
from datetime import datetime


class GmailService:
    def __init__(self, user):
        self.user = user
        self.service = self._build_service()
    
    def _build_service(self):
        """Build Gmail service using stored OAuth tokens"""
        try:
            # Get the social token from allauth - try different approaches
            social_token = None
            
            # Try to get token by provider name
            try:
                social_token = SocialToken.objects.get(
                    account__user=self.user,
                    account__provider='google'
                )
            except SocialToken.DoesNotExist:
                # Try to get token by provider ID (numeric)
                try:
                    social_token = SocialToken.objects.filter(
                        account__user=self.user
                    ).first()
                except:
                    pass
            
            if not social_token:
                print("No social token found")
                return None
            
            # Get the Google app credentials
            try:
                google_app = SocialApp.objects.get(provider='google')
            except SocialApp.DoesNotExist:
                # Try to get by ID if provider name doesn't work
                google_app = SocialApp.objects.first()
            
            if not google_app:
                print("No Google app found")
                return None
            
            # Create credentials object
            creds = Credentials(
                token=social_token.token,
                refresh_token=social_token.token_secret,
                token_uri='https://oauth2.googleapis.com/token',
                client_id=google_app.client_id,
                client_secret=google_app.secret,
            )
            
            print(f"Building Gmail service with token: {social_token.token[:20]}...")
            
            # Build and return Gmail service
            return build('gmail', 'v1', credentials=creds)
            
        except Exception as e:
            print(f"Error building Gmail service: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def get_emails(self, max_results=10):
        """Fetch recent emails"""
        if not self.service:
            return []
        
        try:
            # Get list of messages
            results = self.service.users().messages().list(
                userId='me',
                maxResults=max_results,
                q='in:inbox'
            ).execute()
            
            messages = results.get('messages', [])
            emails = []
            
            for message in messages:
                # Get full message details
                msg = self.service.users().messages().get(
                    userId='me',
                    id=message['id']
                ).execute()
                
                # Extract email data
                email_data = self._extract_email_data(msg)
                if email_data:
                    emails.append(email_data)
            
            return emails
            
        except HttpError as error:
            print(f"Gmail API error: {error}")
            return []
    
    def _extract_email_data(self, message):
        """Extract relevant data from Gmail message"""
        try:
            payload = message['payload']
            headers = payload.get('headers', [])
            
            # Extract headers
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown Sender')
            date_str = next((h['value'] for h in headers if h['name'] == 'Date'), '')
            
            # Parse date
            try:
                date = datetime.strptime(date_str.split(' (')[0], '%a, %d %b %Y %H:%M:%S %z')
            except:
                date = datetime.now()
            
            # Extract body
            body = self._extract_body(payload)
            
            return {
                'id': message['id'],
                'subject': subject,
                'sender': sender,
                'date': date,
                'body': body[:200] + '...' if len(body) > 200 else body,
                'snippet': message.get('snippet', ''),
            }
            
        except Exception as e:
            print(f"Error extracting email data: {e}")
            return None
    
    def _extract_body(self, payload):
        """Extract email body from payload"""
        body = ""
        
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    data = part['body']['data']
                    body = base64.urlsafe_b64decode(data).decode('utf-8')
                    break
        elif payload['mimeType'] == 'text/plain':
            data = payload['body']['data']
            body = base64.urlsafe_b64decode(data).decode('utf-8')
        
        return body
    
    def get_labels(self):
        """Get Gmail labels"""
        if not self.service:
            return []
        
        try:
            results = self.service.users().labels().list(userId='me').execute()
            return results.get('labels', [])
        except HttpError as error:
            print(f"Error getting labels: {error}")
            return []
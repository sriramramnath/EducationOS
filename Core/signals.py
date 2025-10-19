from django.dispatch import receiver
from allauth.account.signals import user_signed_up

@receiver(user_signed_up)
def handle_user_signed_up(request, sociallogin, user, **kwargs):
    # Grab the user's data from Google OAuth
    new_user_data = sociallogin.account.extra_data

    print("=" * 50)
    print("New user signed up via Google!")
    print(f"Email: {new_user_data.get('email')}")
    print(f"Name: {new_user_data.get('name')}")
    print(f"Profile Picture: {new_user_data.get('picture')}")
    print(f"Full data: {new_user_data}")
    print("=" * 50)

    # You can perform additional tasks here, like:
    # - Send welcome email
    # - Create user profile
    # - Log analytics event
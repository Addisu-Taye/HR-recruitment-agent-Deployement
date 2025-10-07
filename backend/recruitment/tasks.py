# backend/recruitment/tasks.py
from __future__ import absolute_import
import os
import brevo_python
from brevo_python.rest import ApiException
from brevo_python.api import transactional_emails_api
from brevo_python.models import send_smtp_email

def send_shortlist_notification(candidate_id):
    from .models import Candidate
    candidate = Candidate.objects.get(id=candidate_id)
    
    # Get config from environment variables
    api_key = os.environ.get('BREVO_API_KEY')
    sender_email = os.environ.get('SENDER_EMAIL', 'recruitment@abcdbank.com')
    sender_name = os.environ.get('SENDER_NAME', 'HR Team')
    
    if not api_key:
        raise ValueError("BREVO_API_KEY environment variable not set")
    
    # Configure Brevo
    configuration = brevo_python.Configuration()
    configuration.api_key['api-key'] = api_key
    
    # Create API instance
    api_client = brevo_python.ApiClient(configuration)
    api_instance = transactional_emails_api.TransactionalEmailsApi(api_client)
    
    # Create email (using env variables for sender)
    email = send_smtp_email.SendSmtpEmail(
        sender={"email": sender_email, "name": sender_name},
        to=[{"email": candidate.email, "name": candidate.name}],
        subject="Congratulations! Shortlisted at ABCD Bank",
        text_content=f"""Dear {candidate.name},

Congratulations! You've been shortlisted for {candidate.job.title}.
Match Score: {candidate.match_score:.1f}%

Next Steps:
- Interview scheduling: https://cal.com/abcd-bank/interview
- Required documents: ID, Degree certificates, CV

Best regards,
{sender_name}"""
    )
    
    try:
        api_response = api_instance.send_transac_email(email)
        print(f"✅ Email sent to {candidate.email}")
    except ApiException as e:
        print(f"❌ Brevo error: {e}")
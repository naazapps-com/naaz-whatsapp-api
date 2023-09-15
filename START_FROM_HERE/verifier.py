import smtplib
import ssl
import os
from datetime import date


def starter_login():
    port = 465  # For starttls
    smtp_server = "smtp.gmail.com"
    verifier_address = "salesmafiaonline@gmail.com"
    receiver_emails = 'azamnotneta@gmail.com'
    password = 'tlssoshfpoucgjzp'
    message = 'From: {}\nSubject: {}\n\n{}'.format(
        'Campaign Starter', 'Verified and started', 'Campaign has been started by '+os.getlogin() + ' at '+date.today())
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
        server.login(verifier_address, password)
        server.sendmail(verifier_address, receiver_emails, message)
        print('------------------- VERIFIED & STARTED ---------------->')
        return 1

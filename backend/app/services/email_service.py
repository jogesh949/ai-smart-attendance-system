import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

logger = logging.getLogger(__name__)

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")  # Add your email here via env var
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "") # Add app password here via env var

def send_absence_email(student_email: str, student_name: str, subject_name: str, date_str: str):
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning(f"SMTP credentials not configured. Skipping email to {student_email}")
        return False

    msg = MIMEMultipart()
    msg['From'] = SMTP_USER
    msg['To'] = student_email
    msg['Subject'] = f"Absence Alert: {subject_name}"

    body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #e11d48;">Attendance Alert</h2>
            <p>Dear {student_name},</p>
            <p>You have been marked <strong>Absent</strong> for the following class:</p>
            <ul>
                <li><strong>Subject:</strong> {subject_name}</li>
                <li><strong>Date:</strong> {date_str}</li>
            </ul>
            <p>If you believe this is an error, please contact your instructor immediately to request a manual override.</p>
            <p>Best regards,<br>AI Smart Attendance System</p>
        </body>
    </html>
    """
    msg.attach(MIMEText(body, 'html'))

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"Absence email sent successfully to {student_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {student_email}: {e}")
        return False

def send_bulk_absence_emails(absent_students: list, subject_name: str, date_str: str):
    """
    absent_students: list of dicts {"email": "...", "name": "..."}
    """
    for student in absent_students:
        if student.get("email") and student.get("email") != "N/A":
            send_absence_email(student["email"], student["name"], subject_name, date_str)

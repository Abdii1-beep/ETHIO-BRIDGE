# SMTP Configuration for OTP Delivery

## Overview

The ETHIO-BRIDGE API uses SMTP for sending OTP (One-Time Password) codes during user registration and authentication. This guide covers configuring SMTP for production deployment.

## Environment Variables

Add the following environment variables to your backend API service on Render:

### Required SMTP Variables

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=ETHIO-BRIDGE <no-reply@yourdomain.com>
SMTP_TLS_REJECT_UNAUTHORIZED=true
```

### OTP Configuration

```
OTP_REQUIRED=true
OTP_TRANSPORT=smtp
OTP_TTL_MINUTES=10
```

## SMTP Providers

### Gmail (Recommended for Testing)

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password:
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - App Passwords → Generate → Select "Mail" → Enter name
   - Copy the 16-character password

**Configuration:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### SendGrid (Production Recommended)

1. Create account at https://sendgrid.com
2. Generate API Key or use SMTP credentials
3. Verify sender domain

**Configuration:**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun

1. Create account at https://mailgun.com
2. Verify domain
3. Get SMTP credentials from dashboard

**Configuration:**
```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@yourdomain.com
SMTP_PASS=your-mailgun-password
```

### AWS SES (Enterprise)

1. Set up Amazon SES
2. Verify identities (domains/emails)
3. Create SMTP credentials in SES console

**Configuration:**
```
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
```

## Testing SMTP Configuration

After adding environment variables to Render:

1. **Redeploy** the API service
2. **Test SMTP status** via API:
```bash
curl https://ethio-bridge-c3ab.onrender.com/api/v1/admin/smtp/status
```

3. **Send test email** via API:
```bash
curl -X POST https://ethio-bridge-c3ab.onrender.com/api/v1/admin/smtp/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"to":"test@example.com"}'
```

## Security Notes

- **Never commit** SMTP credentials to Git
- **Use app passwords** instead of regular passwords
- **Enable TLS** for secure email transmission
- **Verify sender domains** to avoid spam classification
- **Rotate credentials** periodically

## Troubleshooting

### Emails Not Sending

- Verify SMTP credentials are correct
- Check if port 587 is accessible (some networks block it)
- Verify sender email is authenticated with SMTP provider
- Check Render logs for SMTP errors

### OTP Not Received

- Check spam/junk folder
- Verify `OTP_REQUIRED=true` is set
- Ensure `OTP_TRANSPORT=smtp` is set
- Check email delivery logs from SMTP provider

### Authentication Errors

- Verify username/password are correct
- For Gmail: ensure you're using an App Password, not regular password
- Check if 2FA is enabled on the email account
- Verify SMTP host and port are correct for your provider

## Development vs Production

**Development (Local):**
```
OTP_TRANSPORT=ethereal
```
Uses Ethereal email testing service - no credentials needed.

**Production (Render):**
```
OTP_TRANSPORT=smtp
```
Requires full SMTP configuration as documented above.

# 📧 Email Configuration Guide for Password Reset

This guide explains how to set up email functionality for the password reset feature in your Dream Nest application.

## 🚀 Quick Setup Options

### Option 1: Gmail SMTP (Recommended for Development)

**Step 1: Enable 2-Factor Authentication**
1. Go to your Google Account settings
2. Enable 2-Factor Authentication if not already enabled

**Step 2: Generate App Password**
1. Go to Google Account > Security > 2-Step Verification
2. Click "App passwords" at the bottom
3. Select "Mail" and your device
4. Copy the 16-character password (format: xxxx xxxx xxxx xxxx)

**Step 3: Configure Environment**
```bash
# Add to server/.env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=abcd efgh ijkl mnop  # 16-character app password
EMAIL_FROM=Dream Nest <noreply@dreamnest.com>
CLIENT_URL=http://localhost:3000
```

### Option 2: Custom SMTP (Production)

**For production, use a dedicated email service:**
- **SendGrid** (Free tier: 100 emails/day)
- **Mailgun** (Free tier: 5,000 emails/month)
- **Amazon SES** (Pay as you use)
- **Your hosting provider's SMTP**

**Configuration:**
```bash
# Add to server/.env
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-smtp-password
EMAIL_FROM=Dream Nest <noreply@yourdomain.com>
CLIENT_URL=https://yourdomain.com
```

## 🧪 Testing Email Setup

### 1. Start the Server
```bash
cd server
npm start
```

### 2. Test Email Configuration
The server will automatically verify email config on startup and show:
```
✅ Email configuration verified successfully
```

### 3. Test Password Reset
```bash
# Test the forgot password endpoint
curl -X POST http://localhost:3001/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 4. Development Mode Benefits
In development mode, you get extra debugging info:
- Reset links logged to console
- Preview URLs for email testing
- Detailed error messages

## 🔧 Troubleshooting

### Common Issues:

**1. "Invalid login" error with Gmail**
- ✅ Make sure 2FA is enabled
- ✅ Use App Password, not regular password
- ✅ Remove spaces from app password

**2. "Connection timeout" error**
- ✅ Check firewall settings
- ✅ Try different SMTP ports (25, 465, 587)
- ✅ Verify SMTP credentials

**3. Emails not being received**
- ✅ Check spam folder
- ✅ Verify EMAIL_FROM address
- ✅ Check email service logs

**4. "Email service failed" in development**
- ✅ Check server logs for detailed error
- ✅ The reset link is still logged to console
- ✅ Email failure doesn't break the flow

## 📧 Email Service Providers

### Free Options:
1. **Gmail** (Good for development)
   - Limit: 500 emails/day
   - Setup: App Password required

2. **SendGrid Free Tier**
   - Limit: 100 emails/day forever
   - Setup: Register + API key

### Paid Options:
1. **SendGrid Pro**
   - $14.95/month for 40,000 emails
   - Excellent deliverability

2. **Mailgun**
   - $0.80 per 1,000 emails
   - Developer-friendly API

3. **Amazon SES**
   - $0.10 per 1,000 emails
   - AWS integration

## 🎨 Email Template Features

The included email template has:
- ✅ **Responsive design** (mobile-friendly)
- ✅ **Brand styling** with Dream Nest colors
- ✅ **Security notices** for user awareness
- ✅ **Fallback text** version
- ✅ **Professional appearance**
- ✅ **Clear call-to-action** button

## 🔐 Security Best Practices

1. **Never commit real credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Use App Passwords** instead of main passwords
4. **Set short token expiration** (1 hour default)
5. **Log security events** for monitoring
6. **Use HTTPS** in production reset links

## 📝 Email Configuration Examples

### Gmail Configuration
```env
EMAIL_SERVICE=gmail
EMAIL_USER=support@yourdomain.com
EMAIL_APP_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM=Dream Nest <support@yourdomain.com>
CLIENT_URL=https://yourdomain.com
```

### SendGrid Configuration
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key
EMAIL_FROM=Dream Nest <noreply@yourdomain.com>
CLIENT_URL=https://yourdomain.com
```

### Mailgun Configuration
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.com
SMTP_PASSWORD=your-mailgun-password
EMAIL_FROM=Dream Nest <noreply@yourdomain.com>
CLIENT_URL=https://yourdomain.com
```

## ✅ Ready to Go!

Once configured, your users can:
1. Click "Forgot Password" on login page
2. Enter their email address
3. Receive a professional reset email
4. Click the secure link to reset password
5. Login with their new password

The system handles all edge cases and provides excellent user experience! 🎉
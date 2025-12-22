# Email Service Fix - Password Reset Feature

## Problem
The password reset email feature was failing with error:
```
TypeError: nodemailer.createTransporter is not a function
```

## Root Cause
The error occurred because:
1. The code was using `nodemailer.createTransporter()` which doesn't exist
2. The correct method is `nodemailer.createTransport()` (without the 'er')
3. The Gmail App Password in `.env` had spaces which could cause authentication issues

## Fixes Applied

### 1. Fixed emailService.js
Updated `/server/services/emailService.js` to use the correct method:
- Changed from: `nodemailer.createTransporter()` 
- Changed to: `nodemailer.createTransport()`

### 2. Fixed .env configuration
Removed spaces from the Gmail App Password:
- Before: `EMAIL_APP_PASSWORD=qovq effh gfkb hjbh`
- After: `EMAIL_APP_PASSWORD=qovqeffhgfkbhjbh`

## How to Restart the Server

### Option 1: Using the restart script
```bash
cd "/Volumes/Data/SourceCode/Visual Studio Code/Rental Home Project/server"
chmod +x restart.sh
./restart.sh
```

### Option 2: Manual restart
```bash
cd "/Volumes/Data/SourceCode/Visual Studio Code/Rental Home Project/server"

# Kill existing server
lsof -ti:5000 | xargs kill -9 2>/dev/null || true

# Start server
npm start
```

### Option 3: Development mode with auto-reload
```bash
cd "/Volumes/Data/SourceCode/Visual Studio Code/Rental Home Project/server"
npm run dev
```

## Testing the Fix

### Test 1: Email service verification
```bash
cd "/Volumes/Data/SourceCode/Visual Studio Code/Rental Home Project/server"
node test-email.js
```

Expected output:
```
=== Nodemailer Test ===
✅ Successfully created Gmail transporter
✅ Transporter verified - ready to send emails
✅ emailService module imported successfully
✅ Successfully created transporter from emailService
🎉 All tests passed! Email service is ready.
```

### Test 2: Password reset flow
1. Start the server
2. Go to the forgot password page
3. Enter an email address that exists in the database
4. Check that the email is sent successfully
5. Check the server logs for:
   ```
   Password reset email sent successfully to: [email]
   ```

## Environment Variables Required

Make sure these are set in `/server/.env`:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=anhaaa2305@gmail.com
EMAIL_APP_PASSWORD=qovqeffhgfkbhjbh
EMAIL_FROM=Rental Home<noreply@dreamnest.com>
CLIENT_URL=http://localhost:3000
```

## Troubleshooting

### If you still see the error:
1. **Clear Node.js cache:**
   ```bash
   rm -rf node_modules
   npm install
   ```

2. **Verify nodemailer installation:**
   ```bash
   npm list nodemailer
   ```
   Should show: `nodemailer@7.0.10` or similar

3. **Check the actual code:**
   ```bash
   grep -n "createTransport" server/services/emailService.js
   ```
   All instances should be `createTransport`, NOT `createTransporter`

4. **Make sure the server actually restarted:**
   - The old code might still be running in memory
   - Kill ALL node processes: `pkill -f node`
   - Then start fresh

### Gmail App Password Issues:
If Gmail authentication fails:
1. Go to https://myaccount.google.com/apppasswords
2. Generate a new app password for "Mail"
3. Copy it WITHOUT spaces
4. Update `.env` file
5. Restart server

## Status
✅ Code fixed
✅ Environment variables updated  
⏳ **Server needs to be restarted** to apply changes

## Next Steps
1. Restart the server using one of the methods above
2. Test the password reset feature
3. Verify emails are being sent successfully


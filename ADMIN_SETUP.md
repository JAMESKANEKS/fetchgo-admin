# Admin Access Setup Guide

## Overview
Your FetchGo Admin panel now requires admin-only access. Only users with emails in the `ADMIN_EMAILS` list can access the admin panel.

## Current Admin Configuration

### Allowed Admin Emails
- `admin@fetchgo.com`

### How It Works
1. **Login Check**: Users can only log in if their email is in the admin list
2. **Route Protection**: All admin routes check if the user is authenticated AND is an admin
3. **Automatic Redirect**: Non-admin users are automatically redirected to the login page

## Setting Up Admin Users

### Method 1: Add More Admin Emails (Recommended)
Edit `src/contexts/AuthContext.jsx` and add emails to the `ADMIN_EMAILS` array:

```javascript
const ADMIN_EMAILS = [
  'admin@fetchgo.com',
  'manager@fetchgo.com',  // Add this line
  'supervisor@fetchgo.com',  // Add this line
  // Add other admin emails here
];
```

### Method 2: Create Admin User in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `fetchgo-73a4c`
3. Go to **Authentication** → **Users** tab
4. Click **Add user**
5. Enter email: `admin@fetchgo.com`
6. Set a secure password
7. Click **Add user**

### Method 3: Create Admin User via Code (Temporary)
You can create an admin user using Firebase Admin SDK or by temporarily modifying the login logic.

## Security Features

### Email Whitelisting
- Only pre-approved emails can access the admin panel
- Prevents unauthorized users from even attempting to log in

### Double Authentication Check
1. **Login Level**: Email must be in admin list to authenticate
2. **Route Level**: User must be authenticated AND be admin to access routes

### Session Management
- Firebase handles secure session tokens
- Automatic logout on session expiration
- Real-time auth state updates

## Testing Admin Access

### Test Valid Admin Login
1. Go to `http://localhost:5174/login`
2. Email: `admin@fetchgo.com`
3. Password: (the password you set in Firebase Console)
4. Should successfully redirect to admin dashboard

### Test Non-Admin Access
1. Try logging in with any other email
2. Should see error: "Access denied. This account is not authorized for admin access"

## Production Considerations

### Security Best Practices
1. **Strong Passwords**: Use complex passwords for admin accounts
2. **Limited Admins**: Keep the admin email list minimal
3. **Regular Audits**: Periodically review who has admin access
4. **2FA**: Consider enabling two-factor authentication in Firebase

### Firebase Security Rules
Update your Firebase Realtime Database rules to only allow admin users:

```json
{
  "rules": {
    ".read": "auth != null && root.child('admins').child(auth.token.email).exists()",
    ".write": "auth != null && root.child('admins').child(auth.token.email).exists()"
  }
}
```

## Troubleshooting

### "Access denied" Error
- Check if the email is in the `ADMIN_EMAILS` array
- Verify the user exists in Firebase Authentication
- Ensure the email is spelled correctly

### Can't Access Admin Routes
- Verify the user is logged in
- Check browser console for authentication errors
- Ensure the user's email is in the admin list

### User Creation Issues
- Make sure Email/Password sign-in method is enabled in Firebase Console
- Check Firebase Authentication settings
- Verify email configuration is correct

## Next Steps
1. Create your admin user in Firebase Console
2. Test the login functionality
3. Add any additional admin emails as needed
4. Consider implementing additional security measures for production

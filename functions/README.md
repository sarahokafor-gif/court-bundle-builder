# Court Bundle Builder - Firebase Cloud Functions

This directory contains Firebase Cloud Functions for the Court Bundle Builder application.

## Functions

### `onUserCreated`
Triggered when a new user registers. Sends an email notification with the user's details.

### `weeklyUserSummary`
Scheduled function that runs every Monday at 9am (London time). Sends a summary of total users and new registrations from the past week.

## Setup

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Configure Email Credentials
Set up your Gmail credentials for sending notifications:

```bash
# Set your Gmail address
firebase functions:config:set gmail.email="your-email@gmail.com"

# Set your Gmail App Password (NOT your regular password)
# Create an App Password at: https://myaccount.google.com/apppasswords
firebase functions:config:set gmail.password="your-app-password"

# Optionally, set a different notification recipient email
firebase functions:config:set notification.email="notifications@yourdomain.com"
```

### 4. Deploy Functions
```bash
cd functions
npm run deploy
```

Or from the project root:
```bash
firebase deploy --only functions
```

## Creating a Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not already enabled
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select "Mail" and "Other (Custom name)"
5. Enter "Court Bundle Builder" as the name
6. Copy the 16-character password generated
7. Use this password in the `gmail.password` config

## Local Development

To test functions locally:

```bash
# Get the current config for local use
firebase functions:config:get > .runtimeconfig.json

# Start the emulator
npm run serve
```

## Viewing Logs

```bash
firebase functions:log
```

Or view in the [Firebase Console](https://console.firebase.google.com/project/court-bundle-builder/functions/logs).

## Troubleshooting

### Emails not sending
- Check that Gmail credentials are configured: `firebase functions:config:get`
- Ensure you're using an App Password, not your regular Gmail password
- Check function logs for errors: `firebase functions:log`

### Function not triggering
- Verify the function is deployed: `firebase functions:list`
- Check that Firebase Authentication is enabled in your project

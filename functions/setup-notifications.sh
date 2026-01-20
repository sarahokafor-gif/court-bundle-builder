#!/bin/bash

# Court Bundle Builder - User Registration Notifications Setup
# Run this script in your terminal to configure email notifications

echo "================================================"
echo "Court Bundle Builder - Notification Setup"
echo "================================================"
echo ""

# Check if Firebase CLI is logged in
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Step 1: Logging into Firebase..."
    firebase login
fi

echo ""
echo "Step 2: Configure email notifications"
echo "--------------------------------------"
echo ""
echo "You need a Gmail App Password (not your regular password)."
echo "Create one at: https://myaccount.google.com/apppasswords"
echo ""

read -p "Enter your Gmail address: " gmail_email
read -s -p "Enter your Gmail App Password: " gmail_password
echo ""
read -p "Enter notification recipient email (press Enter to use $gmail_email): " notification_email

if [ -z "$notification_email" ]; then
    notification_email=$gmail_email
fi

echo ""
echo "Setting Firebase configuration..."

firebase functions:config:set gmail.email="$gmail_email" gmail.password="$gmail_password" notification.email="$notification_email"

echo ""
echo "Step 3: Deploying Cloud Functions..."
cd "$(dirname "$0")"
npm run deploy

echo ""
echo "================================================"
echo "Setup Complete!"
echo "================================================"
echo ""
echo "You will now receive email notifications when:"
echo "  - A new user registers"
echo "  - Weekly summary (Mondays 9am)"
echo ""
echo "View function logs: firebase functions:log"
echo "View users: https://console.firebase.google.com/project/court-bundle-builder/authentication/users"
echo ""

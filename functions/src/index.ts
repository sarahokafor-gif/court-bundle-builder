import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as nodemailer from 'nodemailer'

// Initialize Firebase Admin
admin.initializeApp()

// Configure nodemailer transporter
// Uses Gmail by default - configure SMTP settings in Firebase environment config
const getTransporter = () => {
  const gmailEmail = functions.config().gmail?.email
  const gmailPassword = functions.config().gmail?.password

  if (!gmailEmail || !gmailPassword) {
    console.error('Gmail credentials not configured. Run: firebase functions:config:set gmail.email="your@gmail.com" gmail.password="your-app-password"')
    return null
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailEmail,
      pass: gmailPassword
    }
  })
}

// Notification recipient email - configure in Firebase environment config
const getNotificationEmail = () => {
  return functions.config().notification?.email || functions.config().gmail?.email
}

// Cloud Function: Triggered when a new user registers
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const transporter = getTransporter()
  const notificationEmail = getNotificationEmail()

  if (!transporter || !notificationEmail) {
    console.error('Email not configured properly. Skipping notification.')
    return null
  }

  const { email, displayName, uid, metadata } = user
  const creationTime = metadata.creationTime

  // Format the email
  const mailOptions = {
    from: `Court Bundle Builder <${functions.config().gmail?.email}>`,
    to: notificationEmail,
    subject: `New User Registration - Court Bundle Builder`,
    html: `
      <div style="font-family: 'Century Gothic', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">New User Registration</h1>
        </div>

        <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; font-size: 18px; margin-top: 0;">A new user has registered on Court Bundle Builder</h2>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #6b7280;">Email:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${email || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #6b7280;">Display Name:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${displayName || 'Not set'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #6b7280;">User ID:</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-family: monospace; font-size: 12px;">${uid}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; color: #6b7280;">Registered:</td>
              <td style="padding: 10px; color: #1f2937;">${creationTime ? new Date(creationTime).toLocaleString('en-GB', { timeZone: 'Europe/London' }) : 'Unknown'}</td>
            </tr>
          </table>

          <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
            View all users in the <a href="https://console.firebase.google.com/project/court-bundle-builder/authentication/users" style="color: #7c3aed;">Firebase Console</a>.
          </p>
        </div>

        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
          This is an automated notification from Court Bundle Builder
        </p>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`New user notification sent for: ${email}`)
    return { success: true, email }
  } catch (error) {
    console.error('Error sending notification email:', error)
    return { success: false, error }
  }
})

// Cloud Function: Weekly summary of users (optional - runs every Monday at 9am)
export const weeklyUserSummary = functions.pubsub
  .schedule('0 9 * * 1')
  .timeZone('Europe/London')
  .onRun(async () => {
    const transporter = getTransporter()
    const notificationEmail = getNotificationEmail()

    if (!transporter || !notificationEmail) {
      console.error('Email not configured properly. Skipping weekly summary.')
      return null
    }

    try {
      // Get all users
      const listUsersResult = await admin.auth().listUsers(1000)
      const users = listUsersResult.users

      // Get users registered in the last 7 days
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const newUsers = users.filter(user => {
        const creationTime = user.metadata.creationTime
        return creationTime && new Date(creationTime) >= oneWeekAgo
      })

      const mailOptions = {
        from: `Court Bundle Builder <${functions.config().gmail?.email}>`,
        to: notificationEmail,
        subject: `Weekly User Summary - Court Bundle Builder`,
        html: `
          <div style="font-family: 'Century Gothic', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Weekly User Summary</h1>
            </div>

            <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                <div style="flex: 1; background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center;">
                  <div style="font-size: 32px; font-weight: bold; color: #7c3aed;">${users.length}</div>
                  <div style="color: #6b7280; font-size: 14px;">Total Users</div>
                </div>
                <div style="flex: 1; background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center;">
                  <div style="font-size: 32px; font-weight: bold; color: #10b981;">${newUsers.length}</div>
                  <div style="color: #6b7280; font-size: 14px;">New This Week</div>
                </div>
              </div>

              ${newUsers.length > 0 ? `
                <h3 style="color: #1f2937; margin-bottom: 10px;">New Registrations This Week:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="background: #e5e7eb;">
                    <th style="padding: 10px; text-align: left; color: #374151;">Email</th>
                    <th style="padding: 10px; text-align: left; color: #374151;">Registered</th>
                  </tr>
                  ${newUsers.map(user => `
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${user.email || 'No email'}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-GB') : 'Unknown'}</td>
                    </tr>
                  `).join('')}
                </table>
              ` : '<p style="color: #6b7280;">No new registrations this week.</p>'}

              <p style="color: #6b7280; font-size: 14px; margin-top: 20px; margin-bottom: 0;">
                View all users in the <a href="https://console.firebase.google.com/project/court-bundle-builder/authentication/users" style="color: #7c3aed;">Firebase Console</a>.
              </p>
            </div>

            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
              This is an automated weekly summary from Court Bundle Builder
            </p>
          </div>
        `
      }

      await transporter.sendMail(mailOptions)
      console.log('Weekly user summary sent')
      return { success: true }
    } catch (error) {
      console.error('Error sending weekly summary:', error)
      return { success: false, error }
    }
  })

/**
 * Email Templates Service
 * 
 * Manages email templates with variable substitution for Bgr8 platform.
 * Templates can be stored in Firebase or loaded from local files.
 */

import { EmailService } from './emailService';
import { loggers } from '../utils/logger';

export interface EmailTemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  content: string;
  category: 'announcement' | 'newsletter' | 'notification' | 'invitation' | 'reminder' | 'custom';
  description?: string;
}

/**
 * Replace variables in template strings
 * Variables should be in format: {{variableName}}
 */
function replaceVariables(template: string, variables: EmailTemplateVariables): string {
  let result = template;
  
  // Replace all {{variable}} patterns
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, String(value || ''));
  });
  
  return result;
}

/**
 * Get base email HTML wrapper
 */
function getEmailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bgr8</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #3b82f6;
    }
    .email-header h1 {
      color: #3b82f6;
      margin: 0;
      font-size: 28px;
    }
    .email-content {
      color: #333333;
      font-size: 16px;
    }
    .email-footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      font-size: 12px;
      color: #666666;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #3b82f6;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
    .button:hover {
      background-color: #2563eb;
    }
    .button-secondary {
      background-color: #10b981;
    }
    .button-secondary:hover {
      background-color: #059669;
    }
    .button-danger {
      background-color: #ef4444;
    }
    .button-danger:hover {
      background-color: #dc2626;
    }
    .info-box {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .success-box {
      background-color: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .error-box {
      background-color: #fee2e2;
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>Bgr8</h1>
    </div>
    <div class="email-content">
      ${content}
    </div>
    <div class="email-footer">
      <p>© ${new Date().getFullYear()} Bgr8. All rights reserved.</p>
      <p>
        <a href="{{unsubscribeUrl}}" style="color: #666666; text-decoration: none;">Unsubscribe</a> | 
        <a href="{{contactUrl}}" style="color: #666666; text-decoration: none;">Contact Us</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Email Templates
 * These are the base templates that can be customized
 */
export const EmailTemplates: Record<string, EmailTemplate> = {
  // Registration & Account
  'registration-welcome': {
    name: 'Registration Welcome',
    subject: 'Welcome to Bgr8! 🎉',
    category: 'announcement',
    description: 'Sent when a new user registers',
    content: `
      <h2>Welcome to Bgr8, {{firstName}}!</h2>
      <p>Thank you for joining our community. We're excited to have you on board!</p>
      <p>Your account has been successfully created. Here's what you can do next:</p>
      <ul>
        <li>Complete your profile</li>
        <li>Explore mentorship opportunities</li>
        <li>Connect with mentors or mentees</li>
      </ul>
      <p><a href="{{profileUrl}}" class="button">Complete Your Profile</a></p>
      <p>If you have any questions, feel free to reach out to us.</p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'account-created': {
    name: 'Account Created Confirmation',
    subject: 'Your Bgr8 Account Has Been Created',
    category: 'notification',
    description: 'Confirmation that account was created',
    content: `
      <h2>Account Created Successfully</h2>
      <p>Hi {{firstName}},</p>
      <p>Your Bgr8 account has been successfully created!</p>
      <div class="info-box">
        <strong>Account Details:</strong><br>
        Email: {{email}}<br>
        Created: {{createdDate}}
      </div>
      <p>You can now start using all the features of Bgr8.</p>
      <p><a href="{{loginUrl}}" class="button">Log In to Your Account</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'email-verification': {
    name: 'Email Verification',
    subject: 'Verify Your Email Address - Bgr8',
    category: 'notification',
    description: 'Email verification request',
    content: `
      <h2>Verify Your Email Address</h2>
      <p>Hi {{firstName}},</p>
      <p>Please verify your email address to complete your registration.</p>
      <p><a href="{{verificationUrl}}" class="button button-secondary">Verify Email Address</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666666;">{{verificationUrl}}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'email-verified': {
    name: 'Email Verified',
    subject: 'Email Verified Successfully - Bgr8',
    category: 'notification',
    description: 'Confirmation that email was verified',
    content: `
      <div class="success-box">
        <h2>✓ Email Verified Successfully!</h2>
      </div>
      <p>Hi {{firstName}},</p>
      <p>Your email address has been successfully verified. You now have full access to all Bgr8 features.</p>
      <p><a href="{{dashboardUrl}}" class="button">Go to Dashboard</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  // Mentor Profile
  'mentor-profile-created': {
    name: 'Mentor Profile Created',
    subject: 'Your Mentor Profile Has Been Created - Bgr8',
    category: 'notification',
    description: 'Sent when mentor profile is created',
    content: `
      <h2>Mentor Profile Created</h2>
      <p>Hi {{firstName}},</p>
      <p>Great news! Your mentor profile has been successfully created.</p>
      <div class="info-box">
        <strong>Next Steps:</strong><br>
        Your profile is now pending verification. Our team will review it and get back to you soon.
      </div>
      <p>You'll receive an email once your profile has been verified.</p>
      <p><a href="{{profileUrl}}" class="button">View Your Profile</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'mentor-profile-submitted': {
    name: 'Mentor Profile Submitted for Verification',
    subject: 'Mentor Profile Submitted for Verification - Bgr8',
    category: 'notification',
    description: 'Sent when mentor profile is submitted for verification',
    content: `
      <h2>Profile Submitted for Verification</h2>
      <p>Hi {{firstName}},</p>
      <p>Your mentor profile has been submitted for verification.</p>
      <div class="info-box">
        <strong>What happens next?</strong><br>
        Our vetting team will review your profile and get back to you within 2-3 business days.
      </div>
      <p>You'll receive an email notification once the review is complete.</p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'mentor-profile-verified': {
    name: 'Mentor Profile Verified',
    subject: 'Congratulations! Your Mentor Profile Has Been Verified - Bgr8',
    category: 'announcement',
    description: 'Sent when mentor profile is verified',
    content: `
      <div class="success-box">
        <h2>🎉 Profile Verified Successfully!</h2>
      </div>
      <p>Hi {{firstName}},</p>
      <p>Great news! Your mentor profile has been verified and approved.</p>
      <p>You can now:</p>
      <ul>
        <li>Start receiving mentee requests</li>
        <li>Set your availability</li>
        <li>Begin mentoring sessions</li>
      </ul>
      <p><a href="{{profileUrl}}" class="button button-secondary">View Your Profile</a></p>
      <p>Welcome to the Bgr8 mentor community!</p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'mentor-profile-rejected': {
    name: 'Mentor Profile Rejected',
    subject: 'Mentor Profile Verification Update - Bgr8',
    category: 'notification',
    description: 'Sent when mentor profile is rejected',
    content: `
      <div class="error-box">
        <h2>Profile Verification Update</h2>
      </div>
      <p>Hi {{firstName}},</p>
      <p>Thank you for your interest in becoming a mentor on Bgr8.</p>
      <p>Unfortunately, your mentor profile could not be verified at this time.</p>
      <div class="warning-box">
        <strong>Reason:</strong><br>
        {{rejectionReason}}
      </div>
      <p>You can update your profile and resubmit it for verification.</p>
      <p><a href="{{profileUrl}}" class="button">Update Your Profile</a></p>
      <p>If you have any questions, please contact our support team.</p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  // Mentee Profile
  'mentee-profile-created': {
    name: 'Mentee Profile Created',
    subject: 'Your Mentee Profile Has Been Created - Bgr8',
    category: 'notification',
    description: 'Sent when mentee profile is created',
    content: `
      <h2>Mentee Profile Created</h2>
      <p>Hi {{firstName}},</p>
      <p>Your mentee profile has been successfully created!</p>
      <p>You can now:</p>
      <ul>
        <li>Search for mentors</li>
        <li>Book mentorship sessions</li>
        <li>Start your learning journey</li>
      </ul>
      <p><a href="{{mentorSearchUrl}}" class="button button-secondary">Find a Mentor</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  // Password Reset
  'password-reset': {
    name: 'Password Reset',
    subject: 'Reset Your Password - Bgr8',
    category: 'notification',
    description: 'Password reset request',
    content: `
      <h2>Reset Your Password</h2>
      <p>Hi {{firstName}},</p>
      <p>We received a request to reset your password.</p>
      <p><a href="{{resetUrl}}" class="button">Reset Password</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666666;">{{resetUrl}}</p>
      <p>This link will expire in 1 hour.</p>
      <div class="warning-box">
        <strong>Didn't request this?</strong><br>
        If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
      </div>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'password-reset-success': {
    name: 'Password Reset Success',
    subject: 'Password Changed Successfully - Bgr8',
    category: 'notification',
    description: 'Confirmation that password was changed',
    content: `
      <div class="success-box">
        <h2>✓ Password Changed Successfully</h2>
      </div>
      <p>Hi {{firstName}},</p>
      <p>Your password has been successfully changed.</p>
      <div class="info-box">
        <strong>Security Tip:</strong><br>
        If you didn't make this change, please contact our support team immediately.
      </div>
      <p><a href="{{loginUrl}}" class="button">Log In</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'password-changed': {
    name: 'Password Changed Confirmation',
    subject: 'Your Password Has Been Changed - Bgr8',
    category: 'notification',
    description: 'Confirmation when user changes password from account settings',
    content: `
      <div class="success-box">
        <h2>✓ Password Changed</h2>
      </div>
      <p>Hi {{firstName}},</p>
      <p>Your password has been successfully changed.</p>
      <div class="warning-box">
        <strong>Security Alert:</strong><br>
        If you didn't make this change, please contact our support team immediately and secure your account.
      </div>
      <p><a href="{{profileUrl}}" class="button">Manage Account Settings</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'email-verification-expired': {
    name: 'Email Verification Expired',
    subject: 'Email Verification Link Expired - Bgr8',
    category: 'notification',
    description: 'Sent when email verification link expires',
    content: `
      <div class="error-box">
        <h2>Verification Link Expired</h2>
      </div>
      <p>Hi {{firstName}},</p>
      <p>Your email verification link has expired.</p>
      <p>Don't worry! You can request a new verification email.</p>
      <p><a href="{{verificationUrl}}" class="button">Request New Verification Email</a></p>
      <p>This link will be valid for 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'first-login-welcome': {
    name: 'First Login Welcome',
    subject: 'Welcome to Bgr8! Let\'s Get Started 🚀',
    category: 'announcement',
    description: 'Sent on first login after registration',
    content: `
      <h2>Welcome to Bgr8, {{firstName}}!</h2>
      <p>We're thrilled to have you here! This is your first login, so let's get you started.</p>
      <div class="info-box">
        <strong>Quick Start Guide:</strong>
        <ul>
          <li>Complete your profile to get matched</li>
          <li>Explore our mentor community</li>
          <li>Set your learning goals</li>
          <li>Book your first session</li>
        </ul>
      </div>
      <p><a href="{{dashboardUrl}}" class="button">Go to Dashboard</a></p>
      <p>Need help? Check out our <a href="{{helpUrl}}">help center</a> or reach out to our support team.</p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'profile-setup-reminder': {
    name: 'Profile Setup Reminder',
    subject: 'Complete Your Profile - Bgr8',
    category: 'reminder',
    description: 'Reminder to complete incomplete profile',
    content: `
      <h2>Complete Your Profile, {{firstName}}</h2>
      <p>Your profile is only {{completionPercentage}}% complete.</p>
      <p>Complete your profile to:</p>
      <ul>
        <li>Get better mentor/mentee matches</li>
        <li>Increase your visibility</li>
        <li>Build trust with the community</li>
      </ul>
      <div class="info-box">
        <strong>What's Missing:</strong><br>
        {{missingFields}}
      </div>
      <p><a href="{{profileUrl}}" class="button">Complete Your Profile</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'mentor-profile-revision-needed': {
    name: 'Mentor Profile Revision Needed',
    subject: 'Mentor Profile Needs Updates - Bgr8',
    category: 'notification',
    description: 'Sent when mentor profile needs revision before approval',
    content: `
      <div class="warning-box">
        <h2>Profile Revision Required</h2>
      </div>
      <p>Hi {{firstName}},</p>
      <p>Thank you for submitting your mentor profile. We need a few updates before we can approve it.</p>
      <div class="info-box">
        <strong>Required Updates:</strong><br>
        {{revisionNotes}}
      </div>
      <p>Please update your profile with the requested information and resubmit it for verification.</p>
      <p><a href="{{profileUrl}}" class="button">Update Your Profile</a></p>
      <p>If you have any questions, please contact our support team.</p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'mentor-profile-resubmitted': {
    name: 'Mentor Profile Resubmitted',
    subject: 'Mentor Profile Resubmitted for Verification - Bgr8',
    category: 'notification',
    description: 'Sent when mentor resubmits profile after rejection',
    content: `
      <h2>Profile Resubmitted</h2>
      <p>Hi {{firstName}},</p>
      <p>Thank you for updating your mentor profile. We've received your resubmission.</p>
      <div class="info-box">
        <strong>What happens next?</strong><br>
        Our vetting team will review your updated profile and get back to you within 2-3 business days.
      </div>
      <p>You'll receive an email notification once the review is complete.</p>
      <p><a href="{{profileUrl}}" class="button">View Your Profile</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'mentor-welcome': {
    name: 'Welcome Email for New Mentors',
    subject: 'Welcome to the Bgr8 Mentor Community! 🎓',
    category: 'announcement',
    description: 'Welcome email for newly verified mentors',
    content: `
      <h2>Welcome to the Bgr8 Mentor Community, {{firstName}}!</h2>
      <p>Congratulations on becoming a verified mentor! We're excited to have you join our community of dedicated mentors.</p>
      <div class="info-box">
        <strong>What You Can Do Now:</strong>
        <ul>
          <li>Set your availability for sessions</li>
          <li>Receive mentee requests</li>
          <li>Start booking mentorship sessions</li>
          <li>Share your expertise and make an impact</li>
        </ul>
      </div>
      <p><a href="{{profileUrl}}" class="button">Set Up Your Mentor Profile</a></p>
      <p>Check out our <a href="{{mentorResourcesUrl}}">mentor resources</a> for tips and best practices.</p>
      <p>Thank you for being part of the Bgr8 community!</p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'mentee-welcome': {
    name: 'Welcome Email for New Mentees',
    subject: 'Welcome to Bgr8! Your Learning Journey Starts Here 🎯',
    category: 'announcement',
    description: 'Welcome email for new mentees',
    content: `
      <h2>Welcome to Bgr8, {{firstName}}!</h2>
      <p>We're excited to help you on your learning journey! Your mentee profile is ready.</p>
      <div class="info-box">
        <strong>Get Started:</strong>
        <ul>
          <li>Complete your profile to get better matches</li>
          <li>Search for mentors in your field</li>
          <li>Book your first mentorship session</li>
          <li>Set your learning goals</li>
        </ul>
      </div>
      <p><a href="{{mentorSearchUrl}}" class="button">Find a Mentor</a></p>
      <p>Need help? Check out our <a href="{{helpUrl}}">mentee guide</a> for tips on getting the most out of mentorship.</p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'session-booking-confirmation': {
    name: 'Session Booking Confirmation',
    subject: 'Mentorship Session Booked - Bgr8',
    category: 'notification',
    description: 'Confirmation when a session is booked',
    content: `
      <div class="success-box">
        <h2>✓ Session Booked Successfully!</h2>
      </div>
      <p>Hi {{firstName}},</p>
      <p>Your mentorship session has been confirmed.</p>
      <div class="info-box">
        <strong>Session Details:</strong><br>
        <strong>Date:</strong> {{sessionDate}}<br>
        <strong>Time:</strong> {{sessionTime}}<br>
        <strong>Duration:</strong> {{sessionDuration}}<br>
        <strong>Mentor:</strong> {{mentorName}}<br>
        <strong>Meeting Link:</strong> <a href="{{sessionLink}}">{{sessionLink}}</a>
      </div>
      <p>We'll send you a reminder 24 hours before your session.</p>
      <p><a href="{{sessionUrl}}" class="button">View Session Details</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'session-reminder-24h': {
    name: 'Session Reminder (24 Hours)',
    subject: 'Reminder: Your Session is Tomorrow - Bgr8',
    category: 'reminder',
    description: 'Reminder sent 24 hours before session',
    content: `
      <h2>Session Reminder</h2>
      <p>Hi {{firstName}},</p>
      <p>This is a friendly reminder that you have a mentorship session tomorrow.</p>
      <div class="info-box">
        <strong>Session Details:</strong><br>
        <strong>Date:</strong> {{sessionDate}}<br>
        <strong>Time:</strong> {{sessionTime}}<br>
        <strong>Duration:</strong> {{sessionDuration}}<br>
        <strong>Mentor:</strong> {{mentorName}}<br>
        <strong>Meeting Link:</strong> <a href="{{sessionLink}}">{{sessionLink}}</a>
      </div>
      <p>Please make sure you're prepared and ready for your session.</p>
      <p><a href="{{sessionUrl}}" class="button">View Session Details</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'session-reminder-1h': {
    name: 'Session Reminder (1 Hour)',
    subject: 'Reminder: Your Session Starts in 1 Hour - Bgr8',
    category: 'reminder',
    description: 'Reminder sent 1 hour before session',
    content: `
      <h2>Session Starting Soon!</h2>
      <p>Hi {{firstName}},</p>
      <p>Your mentorship session starts in 1 hour!</p>
      <div class="info-box">
        <strong>Session Details:</strong><br>
        <strong>Time:</strong> {{sessionTime}}<br>
        <strong>Duration:</strong> {{sessionDuration}}<br>
        <strong>Mentor:</strong> {{mentorName}}<br>
        <strong>Meeting Link:</strong> <a href="{{sessionLink}}">{{sessionLink}}</a>
      </div>
      <p><a href="{{sessionLink}}" class="button">Join Session Now</a></p>
      <p>See you soon!</p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'session-booking-request': {
    name: 'Session Booking Request (to Mentor)',
    subject: 'New Session Booking Request - Bgr8',
    category: 'invitation',
    description: 'Sent to mentor when mentee requests a session',
    content: `
      <h2>New Session Booking Request</h2>
      <p>Hi {{mentorFirstName}},</p>
      <p>{{menteeName}} has requested to book a mentorship session with you.</p>
      <div class="info-box">
        <strong>Requested Session Details:</strong><br>
        <strong>Date:</strong> {{sessionDate}}<br>
        <strong>Time:</strong> {{sessionTime}}<br>
        <strong>Duration:</strong> {{sessionDuration}}<br>
        <strong>Mentee:</strong> {{menteeName}}<br>
        <strong>Message:</strong> {{menteeMessage}}
      </div>
      <p>Please review and respond to this booking request.</p>
      <p><a href="{{sessionUrl}}" class="button">View Booking Request</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'session-booking-accepted': {
    name: 'Session Booking Accepted',
    subject: 'Your Session Request Has Been Accepted - Bgr8',
    category: 'notification',
    description: 'Sent to mentee when mentor accepts session request',
    content: `
      <div class="success-box">
        <h2>✓ Session Request Accepted!</h2>
      </div>
      <p>Hi {{firstName}},</p>
      <p>Great news! {{mentorName}} has accepted your session booking request.</p>
      <div class="info-box">
        <strong>Session Details:</strong><br>
        <strong>Date:</strong> {{sessionDate}}<br>
        <strong>Time:</strong> {{sessionTime}}<br>
        <strong>Duration:</strong> {{sessionDuration}}<br>
        <strong>Mentor:</strong> {{mentorName}}<br>
        <strong>Meeting Link:</strong> <a href="{{sessionLink}}">{{sessionLink}}</a>
      </div>
      <p>We'll send you a reminder 24 hours before your session.</p>
      <p><a href="{{sessionUrl}}" class="button">View Session Details</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'session-booking-declined': {
    name: 'Session Booking Declined',
    subject: 'Session Booking Request Update - Bgr8',
    category: 'notification',
    description: 'Sent to mentee when mentor declines session request',
    content: `
      <h2>Session Booking Update</h2>
      <p>Hi {{firstName}},</p>
      <p>Unfortunately, {{mentorName}} is unable to accept your session booking request at this time.</p>
      <div class="info-box">
        <strong>Requested Session:</strong><br>
        <strong>Date:</strong> {{sessionDate}}<br>
        <strong>Time:</strong> {{sessionTime}}
      </div>
      <div class="info-box">
        <strong>Reason:</strong><br>
        {{declineReason}}
      </div>
      <p>Don't worry! You can request a session with another mentor or try a different time.</p>
      <p><a href="{{mentorSearchUrl}}" class="button">Find Another Mentor</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'session-booking-cancelled': {
    name: 'Session Booking Cancelled',
    subject: 'Session Cancelled - Bgr8',
    category: 'notification',
    description: 'Sent when a session is cancelled',
    content: `
      <h2>Session Cancelled</h2>
      <p>Hi {{firstName}},</p>
      <p>Your mentorship session has been cancelled.</p>
      <div class="info-box">
        <strong>Cancelled Session:</strong><br>
        <strong>Date:</strong> {{sessionDate}}<br>
        <strong>Time:</strong> {{sessionTime}}<br>
        <strong>Mentor:</strong> {{mentorName}}
      </div>
      <div class="info-box">
        <strong>Reason:</strong><br>
        {{cancellationReason}}
      </div>
      <p>If you'd like to book a new session, you can do so from your dashboard.</p>
      <p><a href="{{dashboardUrl}}" class="button">Go to Dashboard</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'session-rescheduled': {
    name: 'Session Rescheduled',
    subject: 'Your Session Has Been Rescheduled - Bgr8',
    category: 'notification',
    description: 'Sent when a session is rescheduled',
    content: `
      <h2>Session Rescheduled</h2>
      <p>Hi {{firstName}},</p>
      <p>Your mentorship session has been rescheduled.</p>
      <div class="info-box">
        <strong>New Session Details:</strong><br>
        <strong>Date:</strong> {{sessionDate}}<br>
        <strong>Time:</strong> {{sessionTime}}<br>
        <strong>Duration:</strong> {{sessionDuration}}<br>
        <strong>Mentor:</strong> {{mentorName}}<br>
        <strong>Meeting Link:</strong> <a href="{{sessionLink}}">{{sessionLink}}</a>
      </div>
      <p>We'll send you a reminder 24 hours before your session.</p>
      <p><a href="{{sessionUrl}}" class="button">View Session Details</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'session-completed': {
    name: 'Session Completed',
    subject: 'Session Completed - Share Your Feedback - Bgr8',
    category: 'invitation',
    description: 'Sent after session completion (includes feedback request)',
    content: `
      <h2>Session Completed</h2>
      <p>Hi {{firstName}},</p>
      <p>Your mentorship session with {{mentorName}} has been completed.</p>
      <div class="info-box">
        <strong>Session Details:</strong><br>
        <strong>Date:</strong> {{sessionDate}}<br>
        <strong>Duration:</strong> {{sessionDuration}}
      </div>
      <p>We'd love to hear about your experience! Your feedback helps us improve and helps other mentees find great mentors.</p>
      <p><a href="{{feedbackUrl}}" class="button">Share Your Feedback</a></p>
      <p>Thank you for being part of the Bgr8 community!</p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'session-no-show': {
    name: 'Session No-Show Notification',
    subject: 'Missed Session Notification - Bgr8',
    category: 'reminder',
    description: 'Sent when a session is marked as no-show',
    content: `
      <div class="warning-box">
        <h2>Missed Session</h2>
      </div>
      <p>Hi {{firstName}},</p>
      <p>We noticed you missed your scheduled mentorship session.</p>
      <div class="info-box">
        <strong>Missed Session:</strong><br>
        <strong>Date:</strong> {{sessionDate}}<br>
        <strong>Time:</strong> {{sessionTime}}<br>
        <strong>Mentor:</strong> {{mentorName}}
      </div>
      <p>If you'd like to reschedule, please contact your mentor or book a new session.</p>
      <p><a href="{{dashboardUrl}}" class="button">View Sessions</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  // Matching Process
  'mentor-match-found': {
    name: 'New Mentor Match Found (to Mentee)',
    subject: 'We Found a Great Mentor Match for You! - Bgr8',
    category: 'announcement',
    description: 'Sent to mentee when a matching mentor is found',
    content: `
      <h2>🎯 Great News! We Found a Mentor Match</h2>
      <p>Hi {{firstName}},</p>
      <p>We've found a mentor who matches your interests and goals!</p>
      <div class="info-box">
        <strong>Mentor Profile:</strong><br>
        <strong>Name:</strong> {{mentorName}}<br>
        <strong>Expertise:</strong> {{mentorExpertise}}<br>
        <strong>Experience:</strong> {{mentorExperience}}
      </div>
      <p>Check out their profile and book a session if you're interested.</p>
      <p><a href="{{mentorProfileUrl}}" class="button">View Mentor Profile</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'mentee-match-found': {
    name: 'New Mentee Match Found (to Mentor)',
    subject: 'New Mentee Match - Bgr8',
    category: 'announcement',
    description: 'Sent to mentor when a matching mentee is found',
    content: `
      <h2>New Mentee Match</h2>
      <p>Hi {{firstName}},</p>
      <p>We've found a mentee who could benefit from your expertise!</p>
      <div class="info-box">
        <strong>Mentee Profile:</strong><br>
        <strong>Name:</strong> {{menteeName}}<br>
        <strong>Goals:</strong> {{menteeGoals}}<br>
        <strong>Interests:</strong> {{menteeInterests}}
      </div>
      <p>Check out their profile and see if you'd like to connect.</p>
      <p><a href="{{menteeProfileUrl}}" class="button">View Mentee Profile</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'match-accepted': {
    name: 'Match Accepted',
    subject: 'Match Accepted - Bgr8',
    category: 'announcement',
    description: 'Sent when a match is accepted',
    content: `
      <div class="success-box">
        <h2>✓ Match Accepted!</h2>
      </div>
      <p>Hi {{firstName}},</p>
      <p>Your match with {{matchedUserName}} has been accepted!</p>
      <p>You can now start communicating and book your first session.</p>
      <p><a href="{{profileUrl}}" class="button">View Profile</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'match-declined': {
    name: 'Match Declined',
    subject: 'Match Update - Bgr8',
    category: 'notification',
    description: 'Sent when a match is declined',
    content: `
      <h2>Match Update</h2>
      <p>Hi {{firstName}},</p>
      <p>Your match with {{matchedUserName}} was declined.</p>
      <p>Don't worry! We'll continue to suggest other matches based on your preferences.</p>
      <p><a href="{{mentorSearchUrl}}" class="button">Find More Matches</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  // Profile Completion Reminders
  'mentor-profile-completion-reminder': {
    name: 'Mentor Profile Completion Reminder',
    subject: 'Complete Your Mentor Profile - Bgr8',
    category: 'reminder',
    description: 'Reminder to complete mentor profile',
    content: `
      <h2>Complete Your Mentor Profile</h2>
      <p>Hi {{firstName}},</p>
      <p>Your mentor profile is {{completionPercentage}}% complete. Complete it to start receiving mentee requests!</p>
      <div class="info-box">
        <strong>What's Missing:</strong><br>
        {{missingFields}}
      </div>
      <p><a href="{{profileUrl}}" class="button">Complete Your Profile</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'mentee-profile-completion-reminder': {
    name: 'Mentee Profile Completion Reminder',
    subject: 'Complete Your Mentee Profile - Bgr8',
    category: 'reminder',
    description: 'Reminder to complete mentee profile',
    content: `
      <h2>Complete Your Mentee Profile</h2>
      <p>Hi {{firstName}},</p>
      <p>Your mentee profile is {{completionPercentage}}% complete. Complete it to get better mentor matches!</p>
      <div class="info-box">
        <strong>What's Missing:</strong><br>
        {{missingFields}}
      </div>
      <p><a href="{{profileUrl}}" class="button">Complete Your Profile</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  // Ambassador Application
  'ambassador-application-submitted': {
    name: 'Ambassador Application Submitted',
    subject: 'Ambassador Application Received - Bgr8',
    category: 'notification',
    description: 'Sent when ambassador application is submitted',
    content: `
      <h2>Application Received</h2>
      <p>Hi {{firstName}},</p>
      <p>Thank you for applying to become a Bgr8 Ambassador!</p>
      <p>We've received your application and our team will review it within 5-7 business days.</p>
      <p>You'll receive an email notification once we've reviewed your application.</p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'ambassador-application-approved': {
    name: 'Ambassador Application Approved',
    subject: 'Congratulations! You\'re Now a Bgr8 Ambassador - Bgr8',
    category: 'announcement',
    description: 'Sent when ambassador application is approved',
    content: `
      <div class="success-box">
        <h2>🎉 Welcome to the Ambassador Program!</h2>
      </div>
      <p>Hi {{firstName}},</p>
      <p>Congratulations! Your application to become a Bgr8 Ambassador has been approved.</p>
      <p>As an ambassador, you'll have access to exclusive resources and opportunities to help grow our community.</p>
      <p><a href="{{ambassadorDashboardUrl}}" class="button">Access Ambassador Dashboard</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'ambassador-application-rejected': {
    name: 'Ambassador Application Rejected',
    subject: 'Ambassador Application Update - Bgr8',
    category: 'notification',
    description: 'Sent when ambassador application is rejected',
    content: `
      <h2>Application Update</h2>
      <p>Hi {{firstName}},</p>
      <p>Thank you for your interest in becoming a Bgr8 Ambassador.</p>
      <p>Unfortunately, we're unable to approve your application at this time.</p>
      <div class="info-box">
        <strong>Reason:</strong><br>
        {{rejectionReason}}
      </div>
      <p>You can reapply in the future as you gain more experience with the platform.</p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  // Newsletters & Regular Communications
  'weekly-newsletter': {
    name: 'Weekly Community Newsletter',
    subject: 'Bgr8 Weekly Update - {{weekDate}}',
    category: 'newsletter',
    description: 'Weekly community newsletter',
    content: `
      <h2>Bgr8 Weekly Update</h2>
      <p>Hi {{firstName}},</p>
      <p>Here's what's happening in the Bgr8 community this week:</p>
      <div class="info-box">
        <h3>📊 Community Stats</h3>
        <ul>
          <li>{{newMentors}} new mentors joined</li>
          <li>{{newMentees}} new mentees joined</li>
          <li>{{sessionsCompleted}} sessions completed</li>
          <li>{{matchesMade}} new matches made</li>
        </ul>
      </div>
      <div class="info-box">
        <h3>🌟 Success Stories</h3>
        {{successStories}}
      </div>
      <div class="info-box">
        <h3>💡 Tips & Resources</h3>
        {{tipsAndResources}}
      </div>
      <p><a href="{{dashboardUrl}}" class="button">Visit Your Dashboard</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'monthly-newsletter': {
    name: 'Monthly Mentorship Newsletter',
    subject: 'Bgr8 Monthly Newsletter - {{monthName}}',
    category: 'newsletter',
    description: 'Monthly mentorship newsletter',
    content: `
      <h2>Bgr8 Monthly Newsletter</h2>
      <p>Hi {{firstName}},</p>
      <p>Here's your monthly roundup of mentorship insights and community updates:</p>
      <div class="info-box">
        <h3>📈 This Month's Highlights</h3>
        {{monthlyHighlights}}
      </div>
      <div class="info-box">
        <h3>🎓 Featured Mentor</h3>
        {{featuredMentor}}
      </div>
      <div class="info-box">
        <h3>🏆 Success Story</h3>
        {{successStory}}
      </div>
      <div class="info-box">
        <h3>📚 Learning Resources</h3>
        {{learningResources}}
      </div>
      <p><a href="{{siteUrl}}" class="button">Explore More</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'mentorship-tips': {
    name: 'Mentorship Tips Email',
    subject: 'Mentorship Tips & Best Practices - Bgr8',
    category: 'newsletter',
    description: 'Educational content about mentorship',
    content: `
      <h2>Mentorship Tips & Best Practices</h2>
      <p>Hi {{firstName}},</p>
      <p>Here are some tips to help you get the most out of your mentorship experience:</p>
      <div class="info-box">
        <h3>💡 This Week's Tips</h3>
        {{tipsContent}}
      </div>
      <div class="info-box">
        <h3>📖 Recommended Reading</h3>
        {{recommendedReading}}
      </div>
      <p><a href="{{resourcesUrl}}" class="button">View All Resources</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  // Special Occasions
  'new-year-greeting': {
    name: 'New Year Greetings',
    subject: 'Happy New Year from Bgr8! 🎉',
    category: 'announcement',
    description: 'New Year greeting email',
    content: `
      <h2>Happy New Year, {{firstName}}!</h2>
      <p>As we welcome {{newYear}}, we want to thank you for being part of the Bgr8 community.</p>
      <div class="info-box">
        <h3>Your {{previousYear}} Achievements:</h3>
        {{yearlyAchievements}}
      </div>
      <p>We're excited to see what {{newYear}} brings for your mentorship journey!</p>
      <p><a href="{{dashboardUrl}}" class="button">Set Your Goals for {{newYear}}</a></p>
      <p>Best wishes for the new year!<br>The Bgr8 Team</p>
    `
  },

  'birthday-wish': {
    name: 'Birthday Wishes',
    subject: 'Happy Birthday, {{firstName}}! 🎂',
    category: 'announcement',
    description: 'Birthday greeting email',
    content: `
      <h2>🎂 Happy Birthday, {{firstName}}!</h2>
      <p>We hope your special day is filled with joy and celebration!</p>
      <p>As a birthday gift, we're offering you a special discount on your next mentorship session.</p>
      <p><a href="{{dashboardUrl}}" class="button">Claim Your Birthday Gift</a></p>
      <p>Have a wonderful birthday!<br>The Bgr8 Team</p>
    `
  },

  'thank-you-mentor': {
    name: 'Thank You for Being a Mentor',
    subject: 'Thank You for Being an Amazing Mentor - Bgr8',
    category: 'announcement',
    description: 'Thank you email for mentors',
    content: `
      <h2>Thank You, {{firstName}}!</h2>
      <p>We want to take a moment to express our gratitude for your dedication as a mentor.</p>
      <div class="info-box">
        <h3>Your Impact:</h3>
        <ul>
          <li>{{sessionsCompleted}} sessions completed</li>
          <li>{{menteesHelped}} mentees helped</li>
          <li>{{hoursDonated}} hours of mentorship</li>
        </ul>
      </div>
      <p>Your commitment to helping others grow is what makes Bgr8 special.</p>
      <p>Thank you for being part of our community!</p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'thank-you-mentee': {
    name: 'Thank You for Being a Mentee',
    subject: 'Thank You for Being Part of Bgr8 - Bgr8',
    category: 'announcement',
    description: 'Thank you email for mentees',
    content: `
      <h2>Thank You, {{firstName}}!</h2>
      <p>Thank you for being an active member of the Bgr8 community!</p>
      <div class="info-box">
        <h3>Your Progress:</h3>
        <ul>
          <li>{{sessionsCompleted}} sessions completed</li>
          <li>{{goalsAchieved}} goals achieved</li>
          <li>{{skillsLearned}} new skills learned</li>
        </ul>
      </div>
      <p>Keep up the great work on your learning journey!</p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  // Platform Announcements
  'new-feature-release': {
    name: 'New Feature Release',
    subject: 'Exciting New Feature: {{featureName}} - Bgr8',
    category: 'announcement',
    description: 'Announcement of new platform features',
    content: `
      <h2>🎉 New Feature: {{featureName}}</h2>
      <p>Hi {{firstName}},</p>
      <p>We're excited to announce a new feature that will enhance your Bgr8 experience!</p>
      <div class="info-box">
        <h3>{{featureName}}</h3>
        <p>{{featureDescription}}</p>
        <p><strong>What's New:</strong></p>
        <ul>
          {{featureBenefits}}
        </ul>
      </div>
      <p><a href="{{featureUrl}}" class="button">Try It Now</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'system-maintenance': {
    name: 'System Maintenance Notification',
    subject: 'Scheduled Maintenance - Bgr8',
    category: 'announcement',
    description: 'Notification about scheduled maintenance',
    content: `
      <h2>Scheduled Maintenance</h2>
      <p>Hi {{firstName}},</p>
      <p>We'll be performing scheduled maintenance on the Bgr8 platform.</p>
      <div class="info-box">
        <strong>Maintenance Window:</strong><br>
        <strong>Start:</strong> {{maintenanceStart}}<br>
        <strong>End:</strong> {{maintenanceEnd}}<br>
        <strong>Duration:</strong> {{maintenanceDuration}}
      </div>
      <p>During this time, the platform will be temporarily unavailable. We apologize for any inconvenience.</p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  'system-maintenance-complete': {
    name: 'System Maintenance Complete',
    subject: 'Maintenance Complete - Bgr8 is Back Online!',
    category: 'announcement',
    description: 'Notification that maintenance is complete',
    content: `
      <div class="success-box">
        <h2>✓ Maintenance Complete</h2>
      </div>
      <p>Hi {{firstName}},</p>
      <p>Maintenance has been completed and Bgr8 is back online!</p>
      <p>You can now access all platform features.</p>
      <p><a href="{{siteUrl}}" class="button">Access Platform</a></p>
      <p>Thank you for your patience!<br>The Bgr8 Team</p>
    `
  },

  // Feedback & Surveys
  'feedback-request': {
    name: 'Feedback Request',
    subject: 'We\'d Love Your Feedback - Bgr8',
    category: 'invitation',
    description: 'Request for platform feedback',
    content: `
      <h2>Share Your Feedback</h2>
      <p>Hi {{firstName}},</p>
      <p>Your opinion matters! We'd love to hear about your experience with Bgr8.</p>
      <p>Your feedback helps us improve the platform for everyone.</p>
      <p><a href="{{feedbackUrl}}" class="button">Share Your Feedback</a></p>
      <p>This will only take 2-3 minutes.</p>
      <p>Thank you!<br>The Bgr8 Team</p>
    `
  },

  'session-feedback-request': {
    name: 'Session Feedback Request',
    subject: 'How Was Your Session? - Bgr8',
    category: 'invitation',
    description: 'Request for session feedback',
    content: `
      <h2>How Was Your Session?</h2>
      <p>Hi {{firstName}},</p>
      <p>We hope you enjoyed your session with {{mentorName}}!</p>
      <p>Your feedback helps us improve and helps other mentees find great mentors.</p>
      <div class="info-box">
        <strong>Session Details:</strong><br>
        <strong>Date:</strong> {{sessionDate}}<br>
        <strong>Mentor:</strong> {{mentorName}}
      </div>
      <p><a href="{{feedbackUrl}}" class="button">Leave Feedback</a></p>
      <p>Thank you!<br>The Bgr8 Team</p>
    `
  },

  // Inactive User Re-engagement
  'inactive-user-reengagement': {
    name: 'Inactive User Re-engagement',
    subject: 'We Miss You! Come Back to Bgr8',
    category: 'reminder',
    description: 'Re-engagement email for inactive users',
    content: `
      <h2>We Miss You, {{firstName}}!</h2>
      <p>It's been a while since we've seen you on Bgr8.</p>
      <p>We'd love to have you back! Here's what you've been missing:</p>
      <div class="info-box">
        <ul>
          <li>{{newMentors}} new mentors have joined</li>
          <li>{{newFeatures}} new features added</li>
          <li>{{communityUpdates}} community updates</li>
        </ul>
      </div>
      <p><a href="{{dashboardUrl}}" class="button">Return to Bgr8</a></p>
      <p>Best regards,<br>The Bgr8 Team</p>
    `
  },

  // Admin Notifications
  'admin-new-user-registration': {
    name: 'New User Registration (to Admin)',
    subject: 'New User Registration - {{userName}}',
    category: 'notification',
    description: 'Notification to admin about new user registration',
    content: `
      <h2>New User Registration</h2>
      <p>A new user has registered on Bgr8.</p>
      <div class="info-box">
        <strong>User Details:</strong><br>
        <strong>Name:</strong> {{userName}}<br>
        <strong>Email:</strong> {{userEmail}}<br>
        <strong>Role:</strong> {{userRole}}<br>
        <strong>Registration Date:</strong> {{registrationDate}}
      </div>
      <p><a href="{{userProfileUrl}}" class="button">View User Profile</a></p>
    `
  },

  'admin-new-mentor-submission': {
    name: 'New Mentor Profile Submitted (to Admin)',
    subject: 'New Mentor Profile Submitted - {{mentorName}}',
    category: 'notification',
    description: 'Notification to admin about new mentor profile submission',
    content: `
      <h2>New Mentor Profile Submitted</h2>
      <p>A new mentor profile has been submitted for verification.</p>
      <div class="info-box">
        <strong>Mentor Details:</strong><br>
        <strong>Name:</strong> {{mentorName}}<br>
        <strong>Email:</strong> {{mentorEmail}}<br>
        <strong>Expertise:</strong> {{mentorExpertise}}<br>
        <strong>Submitted:</strong> {{submissionDate}}
      </div>
      <p><a href="{{profileUrl}}" class="button">Review Profile</a></p>
    `
  },
};

/**
 * Render an email template with variables
 */
export function renderEmailTemplate(
  templateKey: string,
  variables: EmailTemplateVariables = {}
): { subject: string; content: string } | null {
  const template = EmailTemplates[templateKey];
  
  if (!template) {
    loggers.email.error(`Template not found: ${templateKey}`);
    return null;
  }

  // Add default variables
  const defaultVariables: EmailTemplateVariables = {
    siteUrl: 'https://bgr8.uk',
    contactUrl: 'https://bgr8.uk/contact',
    unsubscribeUrl: 'https://bgr8.uk/unsubscribe',
    loginUrl: 'https://bgr8.uk/signin',
    dashboardUrl: 'https://bgr8.uk/dashboard',
    profileUrl: 'https://bgr8.uk/profile',
    mentorSearchUrl: 'https://bgr8.uk/mentor',
    ...variables
  };

  const subject = replaceVariables(template.subject, defaultVariables);
  const content = replaceVariables(template.content, defaultVariables);
  const wrappedContent = getEmailWrapper(content);
  
  // Replace variables in wrapper too
  const finalContent = replaceVariables(wrappedContent, defaultVariables);

  return {
    subject,
    content: finalContent
  };
}

/**
 * Send an email using a template
 */
export async function sendTemplateEmail(
  templateKey: string,
  recipientEmail: string,
  variables: EmailTemplateVariables = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const rendered = renderEmailTemplate(templateKey, variables);
    
    if (!rendered) {
      return {
        success: false,
        error: `Template ${templateKey} not found`
      };
    }

    const result = await EmailService.sendEmail({
      subject: rendered.subject,
      content: rendered.content,
      recipients: [recipientEmail],
      recipientGroups: [],
      isScheduled: false,
      priority: 'normal',
      trackOpens: true,
      trackClicks: true,
      status: 'sent',
      createdBy: 'system'
    });

    loggers.email.log(`Template email sent: ${templateKey} to ${recipientEmail}`);
    return result;
  } catch (error) {
    loggers.email.error(`Error sending template email ${templateKey}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get all available templates
 */
export function getAvailableTemplates(): EmailTemplate[] {
  return Object.values(EmailTemplates);
}

/**
 * Get template by key
 */
export function getTemplate(templateKey: string): EmailTemplate | null {
  return EmailTemplates[templateKey] || null;
}


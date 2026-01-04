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
    category: 'notification',
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
    category: 'notification',
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


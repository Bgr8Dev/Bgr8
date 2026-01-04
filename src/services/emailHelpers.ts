/**
 * Email Helpers
 * 
 * Helper functions for sending automated emails at specific points in the application.
 * These functions integrate with the email template system.
 */

import { sendTemplateEmail, EmailTemplateVariables } from './emailTemplates';
import { loggers } from '../utils/logger';

/**
 * Send registration welcome email
 */
export async function sendRegistrationWelcomeEmail(
  email: string,
  firstName: string,
  lastName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    lastName,
    email,
    profileUrl: `https://bgr8.uk/profile`,
    createdDate: new Date().toLocaleDateString()
  };

  return await sendTemplateEmail('registration-welcome', email, variables);
}

/**
 * Send account created confirmation
 */
export async function sendAccountCreatedEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    email,
    createdDate: new Date().toLocaleDateString(),
    loginUrl: 'https://bgr8.uk/signin'
  };

  return await sendTemplateEmail('account-created', email, variables);
}

/**
 * Send email verification request
 */
export async function sendEmailVerificationEmail(
  email: string,
  firstName: string,
  verificationUrl: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    email,
    verificationUrl
  };

  return await sendTemplateEmail('email-verification', email, variables);
}

/**
 * Send email verified confirmation
 */
export async function sendEmailVerifiedEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    dashboardUrl: 'https://bgr8.uk/dashboard'
  };

  return await sendTemplateEmail('email-verified', email, variables);
}

/**
 * Send mentor profile created email
 */
export async function sendMentorProfileCreatedEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    profileUrl: 'https://bgr8.uk/mentor'
  };

  return await sendTemplateEmail('mentor-profile-created', email, variables);
}

/**
 * Send mentor profile submitted for verification
 */
export async function sendMentorProfileSubmittedEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName
  };

  return await sendTemplateEmail('mentor-profile-submitted', email, variables);
}

/**
 * Send mentor profile verified email
 */
export async function sendMentorProfileVerifiedEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    profileUrl: 'https://bgr8.uk/mentor'
  };

  return await sendTemplateEmail('mentor-profile-verified', email, variables);
}

/**
 * Send mentor profile rejected email
 */
export async function sendMentorProfileRejectedEmail(
  email: string,
  firstName: string,
  rejectionReason: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    rejectionReason,
    profileUrl: 'https://bgr8.uk/mentor'
  };

  return await sendTemplateEmail('mentor-profile-rejected', email, variables);
}

/**
 * Send mentee profile created email
 */
export async function sendMenteeProfileCreatedEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    mentorSearchUrl: 'https://bgr8.uk/mentor'
  };

  return await sendTemplateEmail('mentee-profile-created', email, variables);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    resetUrl
  };

  return await sendTemplateEmail('password-reset', email, variables);
}

/**
 * Send password reset success email
 */
export async function sendPasswordResetSuccessEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    loginUrl: 'https://bgr8.uk/signin'
  };

  return await sendTemplateEmail('password-reset-success', email, variables);
}

/**
 * Send email to admin/vetting officer when mentor profile is submitted
 */
export async function sendMentorProfileSubmittedToAdminEmail(
  adminEmail: string,
  mentorName: string,
  mentorEmail: string,
  profileUrl: string
): Promise<{ success: boolean; error?: string }> {
  // This would use a custom template or we can create one
  // For now, using a simple notification
  const { EmailService } = await import('./emailService');
  
  return await EmailService.sendEmail({
    subject: `New Mentor Profile Submitted for Verification - ${mentorName}`,
    content: `
      <h2>New Mentor Profile Submitted</h2>
      <p>A new mentor profile has been submitted for verification.</p>
      <p><strong>Mentor:</strong> ${mentorName}</p>
      <p><strong>Email:</strong> ${mentorEmail}</p>
      <p><a href="${profileUrl}">Review Profile</a></p>
    `,
    recipients: [adminEmail],
    recipientGroups: [],
    isScheduled: false,
    priority: 'high',
    trackOpens: true,
    trackClicks: true,
    status: 'sent',
    createdBy: 'system'
  });
}


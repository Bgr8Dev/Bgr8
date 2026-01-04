/**
 * Email Integration Examples
 * 
 * This file shows example integrations of email sending into various parts of the application.
 * Copy and adapt these examples to integrate emails into your codebase.
 */

import { 
  sendRegistrationWelcomeEmail,
  sendAccountCreatedEmail,
  sendMentorProfileCreatedEmail,
  sendMentorProfileSubmittedEmail,
  sendMentorProfileVerifiedEmail,
  sendMentorProfileRejectedEmail,
  sendMenteeProfileCreatedEmail
} from './emailHelpers';
import { loggers } from '../utils/logger';

/**
 * EXAMPLE 1: User Registration Integration
 * 
 * Location: src/pages/authPages/SignInPage.tsx
 * 
 * Add this after user profile creation:
 */
export async function exampleRegistrationIntegration(
  email: string,
  firstName: string,
  lastName: string
) {
  try {
    // Send welcome email (non-blocking)
    sendRegistrationWelcomeEmail(email, firstName, lastName)
      .then(result => {
        if (result.success) {
          loggers.email.log(`Welcome email sent to ${email}`);
        } else {
          loggers.email.error(`Failed to send welcome email: ${result.error}`);
        }
      })
      .catch(error => {
        loggers.email.error('Error sending welcome email:', error);
      });

    // Send account created confirmation (non-blocking)
    sendAccountCreatedEmail(email, firstName)
      .then(result => {
        if (result.success) {
          loggers.email.log(`Account created email sent to ${email}`);
        } else {
          loggers.email.error(`Failed to send account created email: ${result.error}`);
        }
      })
      .catch(error => {
        loggers.email.error('Error sending account created email:', error);
      });
  } catch (error) {
    // Don't fail registration if email fails
    loggers.email.error('Error in email integration:', error);
  }
}

/**
 * EXAMPLE 2: Mentor Profile Creation Integration
 * 
 * Location: src/pages/mentorPages/types/useMentorData.ts
 * 
 * Add this after mentor profile is created:
 */
export async function exampleMentorProfileCreationIntegration(
  email: string,
  firstName: string,
  isMentor: boolean
) {
  if (!isMentor) return;

  try {
    const result = await sendMentorProfileCreatedEmail(email, firstName);
    
    if (result.success) {
      loggers.email.log(`Mentor profile created email sent to ${email}`);
    } else {
      loggers.email.error(`Failed to send mentor profile email: ${result.error}`);
    }
  } catch (error) {
    loggers.email.error('Error sending mentor profile email:', error);
  }
}

/**
 * EXAMPLE 3: Mentor Profile Verification Integration
 * 
 * Location: src/services/verificationService.ts or admin verification handler
 * 
 * Add this when mentor profile is submitted for verification:
 */
export async function exampleMentorProfileSubmittedIntegration(
  email: string,
  firstName: string
) {
  try {
    const result = await sendMentorProfileSubmittedEmail(email, firstName);
    
    if (result.success) {
      loggers.email.log(`Mentor profile submitted email sent to ${email}`);
    } else {
      loggers.email.error(`Failed to send profile submitted email: ${result.error}`);
    }
  } catch (error) {
    loggers.email.error('Error sending profile submitted email:', error);
  }
}

/**
 * EXAMPLE 4: Mentor Profile Verification Result Integration
 * 
 * Location: Admin verification handler
 * 
 * Add this when mentor profile verification is completed:
 */
export async function exampleMentorVerificationResultIntegration(
  email: string,
  firstName: string,
  isVerified: boolean,
  rejectionReason?: string
) {
  try {
    let result;
    
    if (isVerified) {
      result = await sendMentorProfileVerifiedEmail(email, firstName);
      loggers.email.log(`Mentor profile verified email sent to ${email}`);
    } else {
      result = await sendMentorProfileRejectedEmail(
        email, 
        firstName, 
        rejectionReason || 'Profile did not meet verification requirements.'
      );
      loggers.email.log(`Mentor profile rejected email sent to ${email}`);
    }
    
    if (!result.success) {
      loggers.email.error(`Failed to send verification result email: ${result.error}`);
    }
  } catch (error) {
    loggers.email.error('Error sending verification result email:', error);
  }
}

/**
 * EXAMPLE 5: Mentee Profile Creation Integration
 * 
 * Location: src/pages/mentorPages/types/useMentorData.ts
 * 
 * Add this after mentee profile is created:
 */
export async function exampleMenteeProfileCreationIntegration(
  email: string,
  firstName: string,
  isMentee: boolean
) {
  if (!isMentee) return;

  try {
    const result = await sendMenteeProfileCreatedEmail(email, firstName);
    
    if (result.success) {
      loggers.email.log(`Mentee profile created email sent to ${email}`);
    } else {
      loggers.email.error(`Failed to send mentee profile email: ${result.error}`);
    }
  } catch (error) {
    loggers.email.error('Error sending mentee profile email:', error);
  }
}

/**
 * Helper function to safely send emails without blocking user actions
 */
export async function sendEmailSafely(
  emailFunction: () => Promise<{ success: boolean; error?: string }>,
  context: string
): Promise<void> {
  try {
    const result = await emailFunction();
    if (result.success) {
      loggers.email.log(`Email sent successfully: ${context}`);
    } else {
      loggers.email.error(`Email failed: ${context} - ${result.error}`);
    }
  } catch (error) {
    loggers.email.error(`Email error: ${context}`, error);
    // Don't throw - email failures shouldn't break user flows
  }
}

/**
 * Example usage of sendEmailSafely:
 * 
 * await sendEmailSafely(
 *   () => sendRegistrationWelcomeEmail(email, firstName, lastName),
 *   `Welcome email to ${email}`
 * );
 */


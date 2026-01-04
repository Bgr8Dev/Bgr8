/**
 * Email Integration Examples
 * 
 * Comprehensive examples showing how to integrate email helper functions
 * into various parts of the Bgr8 application.
 * 
 * These examples demonstrate best practices for:
 * - When to send emails
 * - How to handle errors
 * - How to pass the right data
 * - Integration points in the codebase
 */

import { loggers } from '../utils/logger';
import {
  // Registration & Account
  sendRegistrationWelcomeEmail,
  sendAccountCreatedEmail,
  sendEmailVerificationEmail,
  sendEmailVerifiedEmail,
  sendEmailVerificationExpiredEmail,
  sendFirstLoginWelcomeEmail,
  sendProfileSetupReminderEmail,
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
  sendPasswordChangedEmail,
  
  // Mentor Profile
  sendMentorProfileCreatedEmail,
  sendMentorProfileSubmittedEmail,
  sendMentorProfileVerifiedEmail,
  sendMentorProfileRejectedEmail,
  sendMentorProfileRevisionNeededEmail,
  sendMentorProfileResubmittedEmail,
  sendMentorWelcomeEmail,
  sendMentorProfileCompletionReminderEmail,
  
  // Mentee Profile
  sendMenteeProfileCreatedEmail,
  sendMenteeWelcomeEmail,
  sendMenteeProfileCompletionReminderEmail,
  
  // Sessions
  sendSessionBookingConfirmationEmail,
  sendSessionBookingRequestEmail,
  sendSessionBookingAcceptedEmail,
  sendSessionBookingDeclinedEmail,
  sendSessionBookingCancelledEmail,
  sendSessionRescheduledEmail,
  sendSessionReminder24hEmail,
  sendSessionReminder1hEmail,
  sendSessionCompletedEmail,
  sendSessionNoShowEmail,
  sendSessionFeedbackRequestEmail,
  
  // Matching
  sendMentorMatchFoundEmail,
  sendMenteeMatchFoundEmail,
  sendMatchAcceptedEmail,
  sendMatchDeclinedEmail,
  
  // Ambassador
  sendAmbassadorApplicationSubmittedEmail,
  sendAmbassadorApplicationApprovedEmail,
  sendAmbassadorApplicationRejectedEmail,
  
  // Newsletters & Communications
  sendWeeklyNewsletterEmail,
  sendMonthlyNewsletterEmail,
  sendMentorshipTipsEmail,
  
  // Special Occasions
  sendNewYearGreetingEmail,
  sendBirthdayWishEmail,
  sendThankYouMentorEmail,
  sendThankYouMenteeEmail,
  
  // Platform Announcements
  sendNewFeatureReleaseEmail,
  sendSystemMaintenanceEmail,
  sendSystemMaintenanceCompleteEmail,
  
  // Feedback
  sendFeedbackRequestEmail,
  
  // Re-engagement
  sendInactiveUserReengagementEmail,
  
  // Admin Notifications
  sendAdminNewUserRegistrationEmail,
  sendAdminNewMentorSubmissionEmail
} from './emailHelpers';

// ============================================================================
// REGISTRATION & ACCOUNT MANAGEMENT
// ============================================================================

/**
 * Example: Send emails after user registration
 * Integration point: src/pages/authPages/SignInPage.tsx (after createUserProfile)
 */
export async function handleUserRegistrationEmails(
  email: string,
  firstName: string,
  lastName: string
) {
  try {
    // Send welcome email
    await sendRegistrationWelcomeEmail(email, firstName, lastName);
    
    // Send account created confirmation
    await sendAccountCreatedEmail(email, firstName);
    
    loggers.email.log('Registration emails sent successfully');
  } catch (error) {
    loggers.email.error('Failed to send registration emails:', error);
    // Don't throw - registration should still succeed even if emails fail
  }
}

/**
 * Example: Send email verification
 * Integration point: After user signs up, when verification is needed
 */
export async function handleEmailVerification(
  email: string,
  firstName: string,
  verificationToken: string
) {
  try {
    const verificationUrl = `https://bgr8.uk/verify?token=${verificationToken}`;
    await sendEmailVerificationEmail(email, firstName, verificationUrl);
    loggers.email.log('Verification email sent');
  } catch (error) {
    loggers.email.error('Failed to send verification email:', error);
  }
}

/**
 * Example: Handle email verification success
 * Integration point: src/pages/authPages/EmailVerificationPage.tsx (on successful verification)
 */
export async function handleEmailVerificationSuccess(
  email: string,
  firstName: string
) {
  try {
    await sendEmailVerifiedEmail(email, firstName);
    loggers.email.log('Verification success email sent');
  } catch (error) {
    loggers.email.error('Failed to send verification success email:', error);
  }
}

/**
 * Example: Handle expired verification link
 * Integration point: When verification link is clicked but expired
 */
export async function handleEmailVerificationExpired(
  email: string,
  firstName: string,
  verificationToken: string
) {
  try {
    const verificationUrl = `https://bgr8.uk/verify?token=${verificationToken}`;
    await sendEmailVerificationExpiredEmail(email, firstName, verificationUrl);
    loggers.email.log('Verification expired email sent');
  } catch (error) {
    loggers.email.error('Failed to send verification expired email:', error);
  }
}

/**
 * Example: Send first login welcome
 * Integration point: src/hooks/useAuth.ts (on first login after registration)
 */
export async function handleFirstLogin(
  email: string,
  firstName: string,
  isFirstLogin: boolean
) {
  if (isFirstLogin) {
    try {
      await sendFirstLoginWelcomeEmail(email, firstName);
      loggers.email.log('First login welcome email sent');
    } catch (error) {
      loggers.email.error('Failed to send first login email:', error);
    }
  }
}

/**
 * Example: Profile setup reminder
 * Integration point: Scheduled job or on profile view if incomplete
 */
export async function handleProfileSetupReminder(
  email: string,
  firstName: string,
  completionPercentage: number,
  missingFields: string[]
) {
  if (completionPercentage < 80) {
    try {
      const missingFieldsText = missingFields.join(', ');
      await sendProfileSetupReminderEmail(
        email,
        firstName,
        completionPercentage,
        missingFieldsText
      );
      loggers.email.log('Profile setup reminder sent');
    } catch (error) {
      loggers.email.error('Failed to send profile reminder:', error);
    }
  }
}

/**
 * Example: Password reset flow
 * Integration point: src/pages/authPages/ForgotPasswordPage.tsx
 */
export async function handlePasswordReset(
  email: string,
  firstName: string,
  resetToken: string
) {
  try {
    const resetUrl = `https://bgr8.uk/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(email, firstName, resetUrl);
    loggers.email.log('Password reset email sent');
  } catch (error) {
    loggers.email.error('Failed to send password reset email:', error);
  }
}

/**
 * Example: Password reset success
 * Integration point: After password is successfully reset
 */
export async function handlePasswordResetSuccess(
  email: string,
  firstName: string
) {
  try {
    await sendPasswordResetSuccessEmail(email, firstName);
    loggers.email.log('Password reset success email sent');
  } catch (error) {
    loggers.email.error('Failed to send password reset success email:', error);
  }
}

/**
 * Example: Password changed from settings
 * Integration point: src/pages/userPages/AccountSettingsPage.tsx (on password change)
 */
export async function handlePasswordChanged(
  email: string,
  firstName: string
) {
  try {
    await sendPasswordChangedEmail(email, firstName);
    loggers.email.log('Password changed email sent');
  } catch (error) {
    loggers.email.error('Failed to send password changed email:', error);
  }
}

// ============================================================================
// MENTOR PROFILE & VERIFICATION
// ============================================================================

/**
 * Example: Mentor profile created
 * Integration point: src/pages/mentorPages/types/useMentorData.ts (createProfile)
 */
export async function handleMentorProfileCreated(
  email: string,
  firstName: string
) {
  try {
    await sendMentorProfileCreatedEmail(email, firstName);
    loggers.email.log('Mentor profile created email sent');
  } catch (error) {
    loggers.email.error('Failed to send mentor profile created email:', error);
  }
}

/**
 * Example: Mentor profile submitted for verification
 * Integration point: src/services/verificationService.ts (createInitialVerification)
 */
export async function handleMentorProfileSubmitted(
  email: string,
  firstName: string
) {
  try {
    await sendMentorProfileSubmittedEmail(email, firstName);
    loggers.email.log('Mentor profile submitted email sent');
  } catch (error) {
    loggers.email.error('Failed to send mentor profile submitted email:', error);
  }
}

/**
 * Example: Mentor profile verified
 * Integration point: src/services/verificationService.ts (approveMentor)
 */
export async function handleMentorProfileVerified(
  email: string,
  firstName: string
) {
  try {
    // Send verification confirmation
    await sendMentorProfileVerifiedEmail(email, firstName);
    
    // Send welcome email for verified mentors
    await sendMentorWelcomeEmail(email, firstName);
    
    loggers.email.log('Mentor profile verified emails sent');
  } catch (error) {
    loggers.email.error('Failed to send mentor profile verified emails:', error);
  }
}

/**
 * Example: Mentor profile rejected
 * Integration point: src/services/verificationService.ts (rejectMentor)
 */
export async function handleMentorProfileRejected(
  email: string,
  firstName: string,
  rejectionReason: string
) {
  try {
    await sendMentorProfileRejectedEmail(email, firstName, rejectionReason);
    loggers.email.log('Mentor profile rejected email sent');
  } catch (error) {
    loggers.email.error('Failed to send mentor profile rejected email:', error);
  }
}

/**
 * Example: Mentor profile needs revision
 * Integration point: Admin panel when requesting profile updates
 */
export async function handleMentorProfileRevisionNeeded(
  email: string,
  firstName: string,
  revisionNotes: string
) {
  try {
    await sendMentorProfileRevisionNeededEmail(email, firstName, revisionNotes);
    loggers.email.log('Mentor profile revision email sent');
  } catch (error) {
    loggers.email.error('Failed to send mentor profile revision email:', error);
  }
}

/**
 * Example: Mentor profile resubmitted
 * Integration point: When mentor updates and resubmits profile
 */
export async function handleMentorProfileResubmitted(
  email: string,
  firstName: string
) {
  try {
    await sendMentorProfileResubmittedEmail(email, firstName);
    loggers.email.log('Mentor profile resubmitted email sent');
  } catch (error) {
    loggers.email.error('Failed to send mentor profile resubmitted email:', error);
  }
}

/**
 * Example: Mentor profile completion reminder
 * Integration point: Scheduled job or on profile view
 */
export async function handleMentorProfileCompletionReminder(
  email: string,
  firstName: string,
  completionPercentage: number,
  missingFields: string[]
) {
  if (completionPercentage < 100) {
    try {
      const missingFieldsText = missingFields.join(', ');
      await sendMentorProfileCompletionReminderEmail(
        email,
        firstName,
        completionPercentage,
        missingFieldsText
      );
      loggers.email.log('Mentor profile completion reminder sent');
    } catch (error) {
      loggers.email.error('Failed to send mentor profile reminder:', error);
    }
  }
}

// ============================================================================
// MENTEE PROFILE
// ============================================================================

/**
 * Example: Mentee profile created
 * Integration point: src/pages/mentorPages/types/useMentorData.ts (createProfile for mentee)
 */
export async function handleMenteeProfileCreated(
  email: string,
  firstName: string
) {
  try {
    await sendMenteeProfileCreatedEmail(email, firstName);
    await sendMenteeWelcomeEmail(email, firstName);
    loggers.email.log('Mentee profile created emails sent');
  } catch (error) {
    loggers.email.error('Failed to send mentee profile created emails:', error);
  }
}

/**
 * Example: Mentee profile completion reminder
 * Integration point: Scheduled job or on profile view
 */
export async function handleMenteeProfileCompletionReminder(
  email: string,
  firstName: string,
  completionPercentage: number,
  missingFields: string[]
) {
  if (completionPercentage < 100) {
    try {
      const missingFieldsText = missingFields.join(', ');
      await sendMenteeProfileCompletionReminderEmail(
        email,
        firstName,
        completionPercentage,
        missingFieldsText
      );
      loggers.email.log('Mentee profile completion reminder sent');
    } catch (error) {
      loggers.email.error('Failed to send mentee profile reminder:', error);
    }
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Example: Session booking workflow
 * Integration point: Session booking service/component
 */
export async function handleSessionBooking(
  menteeEmail: string,
  menteeFirstName: string,
  mentorEmail: string,
  mentorFirstName: string,
  sessionData: {
    id: string;
    date: string;
    time: string;
    duration: string;
    mentorName: string;
    menteeName: string;
    sessionLink: string;
    menteeMessage?: string;
  }
) {
  try {
    // Send booking request to mentor
    await sendSessionBookingRequestEmail(
      mentorEmail,
      mentorFirstName,
      sessionData.menteeName,
      sessionData.date,
      sessionData.time,
      sessionData.duration,
      sessionData.menteeMessage || 'No message provided',
      `https://bgr8.uk/sessions/${sessionData.id}`
    );
    
    loggers.email.log('Session booking request sent to mentor');
  } catch (error) {
    loggers.email.error('Failed to send session booking request:', error);
  }
}

/**
 * Example: Session booking confirmation (when booking is confirmed)
 * Integration point: When a session booking is confirmed/created
 */
export async function handleSessionBookingConfirmation(
  email: string,
  firstName: string,
  sessionData: {
    id: string;
    date: string;
    time: string;
    duration: string;
    mentorName: string;
    sessionLink: string;
  }
) {
  try {
    await sendSessionBookingConfirmationEmail(
      email,
      firstName,
      sessionData.date,
      sessionData.time,
      sessionData.duration,
      sessionData.mentorName,
      sessionData.sessionLink,
      `https://bgr8.uk/sessions/${sessionData.id}`
    );
    
    loggers.email.log('Session booking confirmation email sent');
  } catch (error) {
    loggers.email.error('Failed to send session booking confirmation email:', error);
  }
}

/**
 * Example: Session booking accepted
 * Integration point: When mentor accepts session request
 */
export async function handleSessionBookingAccepted(
  menteeEmail: string,
  menteeFirstName: string,
  sessionData: {
    id: string;
    date: string;
    time: string;
    duration: string;
    mentorName: string;
    sessionLink: string;
  }
) {
  try {
    await sendSessionBookingAcceptedEmail(
      menteeEmail,
      menteeFirstName,
      sessionData.mentorName,
      sessionData.date,
      sessionData.time,
      sessionData.duration,
      sessionData.sessionLink,
      `https://bgr8.uk/sessions/${sessionData.id}`
    );
    
    loggers.email.log('Session booking accepted email sent');
  } catch (error) {
    loggers.email.error('Failed to send session booking accepted email:', error);
  }
}

/**
 * Example: Session booking declined
 * Integration point: When mentor declines session request
 */
export async function handleSessionBookingDeclined(
  menteeEmail: string,
  menteeFirstName: string,
  mentorName: string,
  sessionDate: string,
  sessionTime: string,
  declineReason: string
) {
  try {
    await sendSessionBookingDeclinedEmail(
      menteeEmail,
      menteeFirstName,
      mentorName,
      sessionDate,
      sessionTime,
      declineReason
    );
    
    loggers.email.log('Session booking declined email sent');
  } catch (error) {
    loggers.email.error('Failed to send session booking declined email:', error);
  }
}

/**
 * Example: Session booking cancelled
 * Integration point: When a session is cancelled
 */
export async function handleSessionBookingCancelled(
  email: string,
  firstName: string,
  sessionDate: string,
  sessionTime: string,
  mentorName: string,
  cancellationReason: string
) {
  try {
    await sendSessionBookingCancelledEmail(
      email,
      firstName,
      sessionDate,
      sessionTime,
      mentorName,
      cancellationReason
    );
    
    loggers.email.log('Session booking cancelled email sent');
  } catch (error) {
    loggers.email.error('Failed to send session booking cancelled email:', error);
  }
}

/**
 * Example: Session rescheduled
 * Integration point: When a session is rescheduled
 */
export async function handleSessionRescheduled(
  email: string,
  firstName: string,
  sessionData: {
    id: string;
    date: string;
    time: string;
    duration: string;
    mentorName: string;
    sessionLink: string;
  }
) {
  try {
    await sendSessionRescheduledEmail(
      email,
      firstName,
      sessionData.date,
      sessionData.time,
      sessionData.duration,
      sessionData.mentorName,
      sessionData.sessionLink,
      `https://bgr8.uk/sessions/${sessionData.id}`
    );
    
    loggers.email.log('Session rescheduled email sent');
  } catch (error) {
    loggers.email.error('Failed to send session rescheduled email:', error);
  }
}

/**
 * Example: Session no-show
 * Integration point: When a session is marked as no-show
 */
export async function handleSessionNoShow(
  email: string,
  firstName: string,
  sessionDate: string,
  sessionTime: string,
  mentorName: string
) {
  try {
    await sendSessionNoShowEmail(
      email,
      firstName,
      sessionDate,
      sessionTime,
      mentorName
    );
    
    loggers.email.log('Session no-show email sent');
  } catch (error) {
    loggers.email.error('Failed to send session no-show email:', error);
  }
}

/**
 * Example: Session reminders
 * Integration point: Scheduled job (cron) that runs daily
 */
export async function handleSessionReminders(sessions: Array<{
  id: string;
  date: Date;
  time: string;
  duration: string;
  mentorName: string;
  menteeEmail: string;
  menteeFirstName: string;
  sessionLink: string;
}>) {
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  
  for (const session of sessions) {
    const sessionDate = new Date(`${session.date.toISOString().split('T')[0]}T${session.time}`);
    
    try {
      // 24-hour reminder
      if (sessionDate.getTime() - oneDayFromNow.getTime() < 60 * 60 * 1000 && 
          sessionDate.getTime() - oneDayFromNow.getTime() > 0) {
        await sendSessionReminder24hEmail(
          session.menteeEmail,
          session.menteeFirstName,
          session.date.toLocaleDateString(),
          session.time,
          session.duration,
          session.mentorName,
          session.sessionLink,
          `https://bgr8.uk/sessions/${session.id}`
        );
        loggers.email.log(`24h reminder sent for session ${session.id}`);
      }
      
      // 1-hour reminder
      if (sessionDate.getTime() - oneHourFromNow.getTime() < 15 * 60 * 1000 && 
          sessionDate.getTime() - oneHourFromNow.getTime() > 0) {
        await sendSessionReminder1hEmail(
          session.menteeEmail,
          session.menteeFirstName,
          session.time,
          session.duration,
          session.mentorName,
          session.sessionLink
        );
        loggers.email.log(`1h reminder sent for session ${session.id}`);
      }
    } catch (error) {
      loggers.email.error(`Failed to send reminder for session ${session.id}:`, error);
    }
  }
}

/**
 * Example: Session completed
 * Integration point: After session is marked as completed
 */
export async function handleSessionCompleted(
  email: string,
  firstName: string,
  mentorName: string,
  sessionDate: string,
  sessionDuration: string,
  sessionId: string
) {
  try {
    const feedbackUrl = `https://bgr8.uk/sessions/${sessionId}/feedback`;
    await sendSessionCompletedEmail(
      email,
      firstName,
      mentorName,
      sessionDate,
      sessionDuration,
      feedbackUrl
    );
    
    // Also request feedback
    await sendSessionFeedbackRequestEmail(
      email,
      firstName,
      mentorName,
      sessionDate,
      feedbackUrl
    );
    
    loggers.email.log('Session completed emails sent');
  } catch (error) {
    loggers.email.error('Failed to send session completed emails:', error);
  }
}

// ============================================================================
// MATCHING PROCESS
// ============================================================================

/**
 * Example: Mentor match found
 * Integration point: Matching algorithm when finding suitable mentors
 */
export async function handleMentorMatchFound(
  menteeEmail: string,
  menteeFirstName: string,
  mentorData: {
    name: string;
    expertise: string;
    experience: string;
    profileUrl: string;
  }
) {
  try {
    await sendMentorMatchFoundEmail(
      menteeEmail,
      menteeFirstName,
      mentorData.name,
      mentorData.expertise,
      mentorData.experience,
      mentorData.profileUrl
    );
    
    loggers.email.log('Mentor match found email sent');
  } catch (error) {
    loggers.email.error('Failed to send mentor match found email:', error);
  }
}

/**
 * Example: Mentee match found
 * Integration point: Matching algorithm when finding suitable mentees for mentor
 */
export async function handleMenteeMatchFound(
  mentorEmail: string,
  mentorFirstName: string,
  menteeData: {
    name: string;
    goals: string;
    interests: string;
    profileUrl: string;
  }
) {
  try {
    await sendMenteeMatchFoundEmail(
      mentorEmail,
      mentorFirstName,
      menteeData.name,
      menteeData.goals,
      menteeData.interests,
      menteeData.profileUrl
    );
    
    loggers.email.log('Mentee match found email sent');
  } catch (error) {
    loggers.email.error('Failed to send mentee match found email:', error);
  }
}

/**
 * Example: Match accepted
 * Integration point: When user accepts a match
 */
export async function handleMatchAccepted(
  userEmail: string,
  firstName: string,
  matchedUserName: string,
  matchedUserProfileUrl: string
) {
  try {
    await sendMatchAcceptedEmail(
      userEmail,
      firstName,
      matchedUserName,
      matchedUserProfileUrl
    );
    
    loggers.email.log('Match accepted email sent');
  } catch (error) {
    loggers.email.error('Failed to send match accepted email:', error);
  }
}

/**
 * Example: Match declined
 * Integration point: When user declines a match
 */
export async function handleMatchDeclined(
  userEmail: string,
  firstName: string,
  matchedUserName: string
) {
  try {
    await sendMatchDeclinedEmail(
      userEmail,
      firstName,
      matchedUserName
    );
    
    loggers.email.log('Match declined email sent');
  } catch (error) {
    loggers.email.error('Failed to send match declined email:', error);
  }
}

// ============================================================================
// ADMIN NOTIFICATIONS
// ============================================================================

/**
 * Example: Notify admin of new user registration
 * Integration point: After user registration
 */
export async function handleAdminNewUserNotification(
  adminEmail: string,
  userData: {
    name: string;
    email: string;
    role: string;
    registrationDate: string;
    profileUrl: string;
  }
) {
  try {
    await sendAdminNewUserRegistrationEmail(
      adminEmail,
      userData.name,
      userData.email,
      userData.role,
      userData.registrationDate,
      userData.profileUrl
    );
    
    loggers.email.log('Admin notification sent for new user');
  } catch (error) {
    loggers.email.error('Failed to send admin notification:', error);
  }
}

/**
 * Example: Notify admin of new mentor submission
 * Integration point: When mentor profile is submitted for verification
 */
export async function handleAdminNewMentorNotification(
  adminEmail: string,
  mentorData: {
    name: string;
    email: string;
    expertise: string;
    submissionDate: string;
    profileUrl: string;
  }
) {
  try {
    await sendAdminNewMentorSubmissionEmail(
      adminEmail,
      mentorData.name,
      mentorData.email,
      mentorData.expertise,
      mentorData.submissionDate,
      mentorData.profileUrl
    );
    
    loggers.email.log('Admin notification sent for new mentor');
  } catch (error) {
    loggers.email.error('Failed to send admin notification:', error);
  }
}

// ============================================================================
// SCHEDULED EMAILS (Newsletters, etc.)
// ============================================================================

/**
 * Example: Send weekly newsletter
 * Integration point: Scheduled job (cron) that runs weekly
 */
export async function handleWeeklyNewsletter(users: Array<{
  email: string;
  firstName: string;
}>) {
  const weekDate = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  // Fetch community stats (example - replace with actual data)
  const stats = {
    newMentors: 15,
    newMentees: 42,
    sessionsCompleted: 128,
    matchesMade: 35
  };
  
  const successStories = '<p>Read about how Sarah achieved her career goals...</p>';
  const tipsAndResources = '<ul><li>How to prepare for your first session</li><li>Setting effective goals</li></ul>';
  
  for (const user of users) {
    try {
      await sendWeeklyNewsletterEmail(
        user.email,
        user.firstName,
        weekDate,
        stats.newMentors,
        stats.newMentees,
        stats.sessionsCompleted,
        stats.matchesMade,
        successStories,
        tipsAndResources
      );
    } catch (error) {
      loggers.email.error(`Failed to send newsletter to ${user.email}:`, error);
    }
  }
  
  loggers.email.log(`Weekly newsletter sent to ${users.length} users`);
}

/**
 * Example: Send monthly newsletter
 * Integration point: Scheduled job (cron) that runs monthly
 */
export async function handleMonthlyNewsletter(users: Array<{
  email: string;
  firstName: string;
}>) {
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const monthlyHighlights = '<ul><li>Platform reached 1000 users</li><li>New matching algorithm launched</li></ul>';
  const featuredMentor = '<p>Meet John, our featured mentor this month...</p>';
  const successStory = '<p>Read about how mentorship changed Sarah\'s career...</p>';
  const learningResources = '<ul><li>New course: Leadership Fundamentals</li><li>Workshop: Career Planning</li></ul>';
  
  for (const user of users) {
    try {
      await sendMonthlyNewsletterEmail(
        user.email,
        user.firstName,
        monthName,
        monthlyHighlights,
        featuredMentor,
        successStory,
        learningResources
      );
    } catch (error) {
      loggers.email.error(`Failed to send monthly newsletter to ${user.email}:`, error);
    }
  }
  
  loggers.email.log(`Monthly newsletter sent to ${users.length} users`);
}

/**
 * Example: Send mentorship tips
 * Integration point: Scheduled job or triggered by user activity
 */
export async function handleMentorshipTips(
  email: string,
  firstName: string,
  tipsContent: string,
  recommendedReading: string
) {
  try {
    await sendMentorshipTipsEmail(
      email,
      firstName,
      tipsContent,
      recommendedReading
    );
    
    loggers.email.log('Mentorship tips email sent');
  } catch (error) {
    loggers.email.error('Failed to send mentorship tips email:', error);
  }
}

/**
 * Example: Send inactive user re-engagement
 * Integration point: Scheduled job that identifies inactive users
 */
export async function handleInactiveUserReengagement(
  email: string,
  firstName: string,
  lastActiveDate: Date
) {
  const daysInactive = Math.floor((Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Only send if inactive for 30+ days
  if (daysInactive >= 30) {
    try {
      await sendInactiveUserReengagementEmail(
        email,
        firstName,
        25, // new mentors
        3,  // new features
        'New matching algorithm, improved session booking, and more!'
      );
      
      loggers.email.log(`Re-engagement email sent to ${email}`);
    } catch (error) {
      loggers.email.error(`Failed to send re-engagement email to ${email}:`, error);
    }
  }
}

/**
 * Example: Send special occasion emails
 * Integration point: Scheduled job that checks for special occasions
 */
export async function handleSpecialOccasions(
  email: string,
  firstName: string,
  occasion: 'birthday' | 'new-year'
) {
  try {
    if (occasion === 'birthday') {
      await sendBirthdayWishEmail(email, firstName);
      loggers.email.log('Birthday wish email sent');
    } else if (occasion === 'new-year') {
      const currentYear = new Date().getFullYear();
      await sendNewYearGreetingEmail(
        email,
        firstName,
        currentYear,
        currentYear - 1,
        'Completed 10 sessions, achieved 3 goals, helped 2 mentees'
      );
      loggers.email.log('New Year greeting email sent');
    }
  } catch (error) {
    loggers.email.error('Failed to send special occasion email:', error);
  }
}

/**
 * Example: Send thank you emails
 * Integration point: Scheduled job or after milestone achievements
 */
export async function handleThankYouEmails(
  email: string,
  firstName: string,
  role: 'mentor' | 'mentee',
  stats: {
    sessionsCompleted: number;
    menteesHelped?: number;
    hoursDonated?: number;
    goalsAchieved?: number;
    skillsLearned?: number;
  }
) {
  try {
    if (role === 'mentor') {
      await sendThankYouMentorEmail(
        email,
        firstName,
        stats.sessionsCompleted,
        stats.menteesHelped || 0,
        stats.hoursDonated || 0
      );
      loggers.email.log('Thank you mentor email sent');
    } else {
      await sendThankYouMenteeEmail(
        email,
        firstName,
        stats.sessionsCompleted,
        stats.goalsAchieved || 0,
        stats.skillsLearned || 0
      );
      loggers.email.log('Thank you mentee email sent');
    }
  } catch (error) {
    loggers.email.error('Failed to send thank you email:', error);
  }
}

/**
 * Example: Send platform announcements
 * Integration point: When new features are released or maintenance is scheduled
 */
export async function handlePlatformAnnouncements(
  email: string,
  firstName: string,
  type: 'feature-release' | 'maintenance' | 'maintenance-complete',
  data: {
    featureName?: string;
    featureDescription?: string;
    featureBenefits?: string;
    featureUrl?: string;
    maintenanceStart?: string;
    maintenanceEnd?: string;
    maintenanceDuration?: string;
  }
) {
  try {
    if (type === 'feature-release') {
      await sendNewFeatureReleaseEmail(
        email,
        firstName,
        data.featureName || '',
        data.featureDescription || '',
        data.featureBenefits || '',
        data.featureUrl || ''
      );
      loggers.email.log('Feature release email sent');
    } else if (type === 'maintenance') {
      await sendSystemMaintenanceEmail(
        email,
        firstName,
        data.maintenanceStart || '',
        data.maintenanceEnd || '',
        data.maintenanceDuration || ''
      );
      loggers.email.log('Maintenance notification sent');
    } else if (type === 'maintenance-complete') {
      await sendSystemMaintenanceCompleteEmail(email, firstName);
      loggers.email.log('Maintenance complete email sent');
    }
  } catch (error) {
    loggers.email.error('Failed to send platform announcement:', error);
  }
}

/**
 * Example: Send feedback request
 * Integration point: Periodically or after specific actions
 */
export async function handleFeedbackRequest(
  email: string,
  firstName: string,
  feedbackType: 'platform' | 'session',
  sessionData?: {
    mentorName: string;
    sessionDate: string;
  }
) {
  try {
    const feedbackUrl = feedbackType === 'platform' 
      ? 'https://bgr8.uk/feedback'
      : `https://bgr8.uk/sessions/feedback`;
    
    if (feedbackType === 'platform') {
      await sendFeedbackRequestEmail(email, firstName, feedbackUrl);
      loggers.email.log('Platform feedback request sent');
    } else if (sessionData) {
      await sendSessionFeedbackRequestEmail(
        email,
        firstName,
        sessionData.mentorName,
        sessionData.sessionDate,
        feedbackUrl
      );
      loggers.email.log('Session feedback request sent');
    }
  } catch (error) {
    loggers.email.error('Failed to send feedback request:', error);
  }
}

/**
 * Example: Handle ambassador application workflow
 * Integration point: Ambassador application service
 */
export async function handleAmbassadorApplication(
  email: string,
  firstName: string,
  status: 'submitted' | 'approved' | 'rejected',
  rejectionReason?: string
) {
  try {
    if (status === 'submitted') {
      await sendAmbassadorApplicationSubmittedEmail(email, firstName);
      loggers.email.log('Ambassador application submitted email sent');
    } else if (status === 'approved') {
      await sendAmbassadorApplicationApprovedEmail(email, firstName);
      loggers.email.log('Ambassador application approved email sent');
    } else if (status === 'rejected' && rejectionReason) {
      await sendAmbassadorApplicationRejectedEmail(email, firstName, rejectionReason);
      loggers.email.log('Ambassador application rejected email sent');
    }
  } catch (error) {
    loggers.email.error('Failed to send ambassador application email:', error);
  }
}

// ============================================================================
// EXPORT ALL EXAMPLES
// ============================================================================

export const EmailIntegrationExamples = {
  // Registration & Account
  handleUserRegistrationEmails,
  handleEmailVerification,
  handleEmailVerificationSuccess,
  handleEmailVerificationExpired,
  handleFirstLogin,
  handleProfileSetupReminder,
  handlePasswordReset,
  handlePasswordResetSuccess,
  handlePasswordChanged,
  
  // Mentor Profile
  handleMentorProfileCreated,
  handleMentorProfileSubmitted,
  handleMentorProfileVerified,
  handleMentorProfileRejected,
  handleMentorProfileRevisionNeeded,
  handleMentorProfileResubmitted,
  handleMentorProfileCompletionReminder,
  
  // Mentee Profile
  handleMenteeProfileCreated,
  handleMenteeProfileCompletionReminder,
  
  // Sessions
  handleSessionBooking,
  handleSessionBookingConfirmation,
  handleSessionBookingAccepted,
  handleSessionBookingDeclined,
  handleSessionBookingCancelled,
  handleSessionRescheduled,
  handleSessionReminders,
  handleSessionCompleted,
  handleSessionNoShow,
  
  // Matching
  handleMentorMatchFound,
  handleMenteeMatchFound,
  handleMatchAccepted,
  handleMatchDeclined,
  
  // Ambassador
  handleAmbassadorApplication,
  
  // Admin
  handleAdminNewUserNotification,
  handleAdminNewMentorNotification,
  
  // Scheduled
  handleWeeklyNewsletter,
  handleMonthlyNewsletter,
  handleMentorshipTips,
  handleInactiveUserReengagement,
  handleSpecialOccasions,
  handleThankYouEmails,
  handlePlatformAnnouncements,
  handleFeedbackRequest
};

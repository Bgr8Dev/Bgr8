/**
 * Email Helpers
 * 
 * Helper functions for sending automated emails at specific points in the application.
 * These functions integrate with the email template system.
 */

import { sendTemplateEmail, EmailTemplateVariables } from './emailTemplates';

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

/**
 * Send password changed confirmation
 */
export async function sendPasswordChangedEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    profileUrl: 'https://bgr8.uk/profile'
  };

  return await sendTemplateEmail('password-changed', email, variables);
}

/**
 * Send email verification expired notification
 */
export async function sendEmailVerificationExpiredEmail(
  email: string,
  firstName: string,
  verificationUrl: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    verificationUrl
  };

  return await sendTemplateEmail('email-verification-expired', email, variables);
}

/**
 * Send first login welcome email
 */
export async function sendFirstLoginWelcomeEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    dashboardUrl: 'https://bgr8.uk/dashboard',
    helpUrl: 'https://bgr8.uk/help'
  };

  return await sendTemplateEmail('first-login-welcome', email, variables);
}

/**
 * Send profile setup reminder
 */
export async function sendProfileSetupReminderEmail(
  email: string,
  firstName: string,
  completionPercentage: number,
  missingFields: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    completionPercentage,
    missingFields,
    profileUrl: 'https://bgr8.uk/profile'
  };

  return await sendTemplateEmail('profile-setup-reminder', email, variables);
}

/**
 * Send mentor profile revision needed email
 */
export async function sendMentorProfileRevisionNeededEmail(
  email: string,
  firstName: string,
  revisionNotes: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    revisionNotes,
    profileUrl: 'https://bgr8.uk/mentor'
  };

  return await sendTemplateEmail('mentor-profile-revision-needed', email, variables);
}

/**
 * Send mentor profile resubmitted email
 */
export async function sendMentorProfileResubmittedEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    profileUrl: 'https://bgr8.uk/mentor'
  };

  return await sendTemplateEmail('mentor-profile-resubmitted', email, variables);
}

/**
 * Send welcome email for new mentors
 */
export async function sendMentorWelcomeEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    profileUrl: 'https://bgr8.uk/mentor',
    mentorResourcesUrl: 'https://bgr8.uk/mentor/resources'
  };

  return await sendTemplateEmail('mentor-welcome', email, variables);
}

/**
 * Send welcome email for new mentees
 */
export async function sendMenteeWelcomeEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    mentorSearchUrl: 'https://bgr8.uk/mentor',
    helpUrl: 'https://bgr8.uk/help/mentee'
  };

  return await sendTemplateEmail('mentee-welcome', email, variables);
}

/**
 * Send session booking confirmation
 */
export async function sendSessionBookingConfirmationEmail(
  email: string,
  firstName: string,
  sessionDate: string,
  sessionTime: string,
  sessionDuration: string,
  mentorName: string,
  sessionLink: string,
  sessionUrl: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    sessionDate,
    sessionTime,
    sessionDuration,
    mentorName,
    sessionLink,
    sessionUrl
  };

  return await sendTemplateEmail('session-booking-confirmation', email, variables);
}

/**
 * Send session reminder (24 hours before)
 */
export async function sendSessionReminder24hEmail(
  email: string,
  firstName: string,
  sessionDate: string,
  sessionTime: string,
  sessionDuration: string,
  mentorName: string,
  sessionLink: string,
  sessionUrl: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    sessionDate,
    sessionTime,
    sessionDuration,
    mentorName,
    sessionLink,
    sessionUrl
  };

  return await sendTemplateEmail('session-reminder-24h', email, variables);
}

/**
 * Send session reminder (1 hour before)
 */
export async function sendSessionReminder1hEmail(
  email: string,
  firstName: string,
  sessionTime: string,
  sessionDuration: string,
  mentorName: string,
  sessionLink: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    sessionTime,
    sessionDuration,
    mentorName,
    sessionLink
  };

  return await sendTemplateEmail('session-reminder-1h', email, variables);
}

/**
 * Send session booking request to mentor
 */
export async function sendSessionBookingRequestEmail(
  mentorEmail: string,
  mentorFirstName: string,
  menteeName: string,
  sessionDate: string,
  sessionTime: string,
  sessionDuration: string,
  menteeMessage: string,
  sessionUrl: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    mentorFirstName,
    menteeName,
    sessionDate,
    sessionTime,
    sessionDuration,
    menteeMessage,
    sessionUrl
  };

  return await sendTemplateEmail('session-booking-request', mentorEmail, variables);
}

/**
 * Send session booking accepted email
 */
export async function sendSessionBookingAcceptedEmail(
  menteeEmail: string,
  firstName: string,
  mentorName: string,
  sessionDate: string,
  sessionTime: string,
  sessionDuration: string,
  sessionLink: string,
  sessionUrl: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    mentorName,
    sessionDate,
    sessionTime,
    sessionDuration,
    sessionLink,
    sessionUrl
  };

  return await sendTemplateEmail('session-booking-accepted', menteeEmail, variables);
}

/**
 * Send session booking declined email
 */
export async function sendSessionBookingDeclinedEmail(
  menteeEmail: string,
  firstName: string,
  mentorName: string,
  sessionDate: string,
  sessionTime: string,
  declineReason: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    mentorName,
    sessionDate,
    sessionTime,
    declineReason,
    mentorSearchUrl: 'https://bgr8.uk/mentor'
  };

  return await sendTemplateEmail('session-booking-declined', menteeEmail, variables);
}

/**
 * Send session booking cancelled email
 */
export async function sendSessionBookingCancelledEmail(
  email: string,
  firstName: string,
  sessionDate: string,
  sessionTime: string,
  mentorName: string,
  cancellationReason: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    sessionDate,
    sessionTime,
    mentorName,
    cancellationReason,
    dashboardUrl: 'https://bgr8.uk/dashboard'
  };

  return await sendTemplateEmail('session-booking-cancelled', email, variables);
}

/**
 * Send session rescheduled email
 */
export async function sendSessionRescheduledEmail(
  email: string,
  firstName: string,
  sessionDate: string,
  sessionTime: string,
  sessionDuration: string,
  mentorName: string,
  sessionLink: string,
  sessionUrl: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    sessionDate,
    sessionTime,
    sessionDuration,
    mentorName,
    sessionLink,
    sessionUrl
  };

  return await sendTemplateEmail('session-rescheduled', email, variables);
}

/**
 * Send session completed email
 */
export async function sendSessionCompletedEmail(
  email: string,
  firstName: string,
  mentorName: string,
  sessionDate: string,
  sessionDuration: string,
  feedbackUrl: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    mentorName,
    sessionDate,
    sessionDuration,
    feedbackUrl
  };

  return await sendTemplateEmail('session-completed', email, variables);
}

/**
 * Send session no-show notification
 */
export async function sendSessionNoShowEmail(
  email: string,
  firstName: string,
  sessionDate: string,
  sessionTime: string,
  mentorName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    sessionDate,
    sessionTime,
    mentorName,
    dashboardUrl: 'https://bgr8.uk/dashboard'
  };

  return await sendTemplateEmail('session-no-show', email, variables);
}

/**
 * Send mentor match found email to mentee
 */
export async function sendMentorMatchFoundEmail(
  menteeEmail: string,
  firstName: string,
  mentorName: string,
  mentorExpertise: string,
  mentorExperience: string,
  mentorProfileUrl: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    mentorName,
    mentorExpertise,
    mentorExperience,
    mentorProfileUrl
  };

  return await sendTemplateEmail('mentor-match-found', menteeEmail, variables);
}

/**
 * Send mentee match found email to mentor
 */
export async function sendMenteeMatchFoundEmail(
  mentorEmail: string,
  firstName: string,
  menteeName: string,
  menteeGoals: string,
  menteeInterests: string,
  menteeProfileUrl: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    menteeName,
    menteeGoals,
    menteeInterests,
    menteeProfileUrl
  };

  return await sendTemplateEmail('mentee-match-found', mentorEmail, variables);
}

/**
 * Send match accepted email
 */
export async function sendMatchAcceptedEmail(
  email: string,
  firstName: string,
  matchedUserName: string,
  profileUrl: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    matchedUserName,
    profileUrl
  };

  return await sendTemplateEmail('match-accepted', email, variables);
}

/**
 * Send match declined email
 */
export async function sendMatchDeclinedEmail(
  email: string,
  firstName: string,
  matchedUserName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    matchedUserName,
    mentorSearchUrl: 'https://bgr8.uk/mentor'
  };

  return await sendTemplateEmail('match-declined', email, variables);
}

/**
 * Send mentor profile completion reminder
 */
export async function sendMentorProfileCompletionReminderEmail(
  email: string,
  firstName: string,
  completionPercentage: number,
  missingFields: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    completionPercentage,
    missingFields,
    profileUrl: 'https://bgr8.uk/mentor'
  };

  return await sendTemplateEmail('mentor-profile-completion-reminder', email, variables);
}

/**
 * Send mentee profile completion reminder
 */
export async function sendMenteeProfileCompletionReminderEmail(
  email: string,
  firstName: string,
  completionPercentage: number,
  missingFields: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    completionPercentage,
    missingFields,
    profileUrl: 'https://bgr8.uk/profile'
  };

  return await sendTemplateEmail('mentee-profile-completion-reminder', email, variables);
}

/**
 * Send ambassador application submitted email
 */
export async function sendAmbassadorApplicationSubmittedEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName
  };

  return await sendTemplateEmail('ambassador-application-submitted', email, variables);
}

/**
 * Send ambassador application approved email
 */
export async function sendAmbassadorApplicationApprovedEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    ambassadorDashboardUrl: 'https://bgr8.uk/ambassador/dashboard'
  };

  return await sendTemplateEmail('ambassador-application-approved', email, variables);
}

/**
 * Send ambassador application rejected email
 */
export async function sendAmbassadorApplicationRejectedEmail(
  email: string,
  firstName: string,
  rejectionReason: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    rejectionReason
  };

  return await sendTemplateEmail('ambassador-application-rejected', email, variables);
}

/**
 * Send weekly newsletter
 */
export async function sendWeeklyNewsletterEmail(
  email: string,
  firstName: string,
  weekDate: string,
  newMentors: number,
  newMentees: number,
  sessionsCompleted: number,
  matchesMade: number,
  successStories: string,
  tipsAndResources: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    weekDate,
    newMentors,
    newMentees,
    sessionsCompleted,
    matchesMade,
    successStories,
    tipsAndResources,
    dashboardUrl: 'https://bgr8.uk/dashboard'
  };

  return await sendTemplateEmail('weekly-newsletter', email, variables);
}

/**
 * Send monthly newsletter
 */
export async function sendMonthlyNewsletterEmail(
  email: string,
  firstName: string,
  monthName: string,
  monthlyHighlights: string,
  featuredMentor: string,
  successStory: string,
  learningResources: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    monthName,
    monthlyHighlights,
    featuredMentor,
    successStory,
    learningResources,
    siteUrl: 'https://bgr8.uk'
  };

  return await sendTemplateEmail('monthly-newsletter', email, variables);
}

/**
 * Send mentorship tips email
 */
export async function sendMentorshipTipsEmail(
  email: string,
  firstName: string,
  tipsContent: string,
  recommendedReading: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    tipsContent,
    recommendedReading,
    resourcesUrl: 'https://bgr8.uk/resources'
  };

  return await sendTemplateEmail('mentorship-tips', email, variables);
}

/**
 * Send New Year greeting
 */
export async function sendNewYearGreetingEmail(
  email: string,
  firstName: string,
  newYear: number,
  previousYear: number,
  yearlyAchievements: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    newYear,
    previousYear,
    yearlyAchievements,
    dashboardUrl: 'https://bgr8.uk/dashboard'
  };

  return await sendTemplateEmail('new-year-greeting', email, variables);
}

/**
 * Send birthday wish
 */
export async function sendBirthdayWishEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    dashboardUrl: 'https://bgr8.uk/dashboard'
  };

  return await sendTemplateEmail('birthday-wish', email, variables);
}

/**
 * Send thank you email to mentor
 */
export async function sendThankYouMentorEmail(
  email: string,
  firstName: string,
  sessionsCompleted: number,
  menteesHelped: number,
  hoursDonated: number
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    sessionsCompleted,
    menteesHelped,
    hoursDonated
  };

  return await sendTemplateEmail('thank-you-mentor', email, variables);
}

/**
 * Send thank you email to mentee
 */
export async function sendThankYouMenteeEmail(
  email: string,
  firstName: string,
  sessionsCompleted: number,
  goalsAchieved: number,
  skillsLearned: number
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    sessionsCompleted,
    goalsAchieved,
    skillsLearned
  };

  return await sendTemplateEmail('thank-you-mentee', email, variables);
}

/**
 * Send new feature release announcement
 */
export async function sendNewFeatureReleaseEmail(
  email: string,
  firstName: string,
  featureName: string,
  featureDescription: string,
  featureBenefits: string,
  featureUrl: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    featureName,
    featureDescription,
    featureBenefits,
    featureUrl
  };

  return await sendTemplateEmail('new-feature-release', email, variables);
}

/**
 * Send system maintenance notification
 */
export async function sendSystemMaintenanceEmail(
  email: string,
  firstName: string,
  maintenanceStart: string,
  maintenanceEnd: string,
  maintenanceDuration: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    maintenanceStart,
    maintenanceEnd,
    maintenanceDuration
  };

  return await sendTemplateEmail('system-maintenance', email, variables);
}

/**
 * Send system maintenance complete notification
 */
export async function sendSystemMaintenanceCompleteEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    siteUrl: 'https://bgr8.uk'
  };

  return await sendTemplateEmail('system-maintenance-complete', email, variables);
}

/**
 * Send feedback request
 */
export async function sendFeedbackRequestEmail(
  email: string,
  firstName: string,
  feedbackUrl: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    feedbackUrl
  };

  return await sendTemplateEmail('feedback-request', email, variables);
}

/**
 * Send session feedback request
 */
export async function sendSessionFeedbackRequestEmail(
  email: string,
  firstName: string,
  mentorName: string,
  sessionDate: string,
  feedbackUrl: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    mentorName,
    sessionDate,
    feedbackUrl
  };

  return await sendTemplateEmail('session-feedback-request', email, variables);
}

/**
 * Send inactive user re-engagement email
 */
export async function sendInactiveUserReengagementEmail(
  email: string,
  firstName: string,
  newMentors: number,
  newFeatures: number,
  communityUpdates: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName,
    newMentors,
    newFeatures,
    communityUpdates,
    dashboardUrl: 'https://bgr8.uk/dashboard'
  };

  return await sendTemplateEmail('inactive-user-reengagement', email, variables);
}

/**
 * Send admin notification for new user registration
 */
export async function sendAdminNewUserRegistrationEmail(
  adminEmail: string,
  userName: string,
  userEmail: string,
  userRole: string,
  registrationDate: string,
  userProfileUrl: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    userName,
    userEmail,
    userRole,
    registrationDate,
    userProfileUrl
  };

  return await sendTemplateEmail('admin-new-user-registration', adminEmail, variables);
}

/**
 * Send admin notification for new mentor submission
 */
export async function sendAdminNewMentorSubmissionEmail(
  adminEmail: string,
  mentorName: string,
  mentorEmail: string,
  mentorExpertise: string,
  submissionDate: string,
  profileUrl: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    mentorName,
    mentorEmail,
    mentorExpertise,
    submissionDate,
    profileUrl
  };

  return await sendTemplateEmail('admin-new-mentor-submission', adminEmail, variables);
}


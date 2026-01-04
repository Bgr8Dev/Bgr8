# 📧 Email Implementation Guide for Bgr8

This guide explains how to implement and use the email system for automated emails in Bgr8.

## 🏗️ Architecture Overview

The email system consists of three main components:

1. **Email Templates** (`src/services/emailTemplates.ts`)
   - Template definitions with variable substitution
   - HTML email rendering with consistent styling
   - Template management

2. **Email Helpers** (`src/services/emailHelpers.ts`)
   - Pre-built functions for common email scenarios
   - Easy-to-use API for sending emails

3. **Email Service** (`src/services/emailService.ts`)
   - Low-level email sending via API
   - Template storage in Firebase
   - Email tracking and analytics

## 📝 Template System

### Template Variables

Templates use `{{variableName}}` syntax for variable substitution:

```typescript
{
  firstName: "John",
  email: "john@example.com",
  verificationUrl: "https://bgr8.uk/verify?token=abc123"
}
```

### Available Templates

Current templates include:
- `registration-welcome` - Welcome email for new users
- `account-created` - Account creation confirmation
- `email-verification` - Email verification request
- `email-verified` - Email verified confirmation
- `mentor-profile-created` - Mentor profile created
- `mentor-profile-submitted` - Profile submitted for verification
- `mentor-profile-verified` - Profile verified successfully
- `mentor-profile-rejected` - Profile verification rejected
- `mentee-profile-created` - Mentee profile created
- `password-reset` - Password reset request
- `password-reset-success` - Password reset confirmation

## 🚀 Usage Examples

### Example 1: Send Registration Welcome Email

```typescript
import { sendRegistrationWelcomeEmail } from '../services/emailHelpers';

// In your registration handler
const handleRegistration = async (email: string, firstName: string, lastName: string) => {
  // ... create user account ...
  
  // Send welcome email
  const emailResult = await sendRegistrationWelcomeEmail(email, firstName, lastName);
  
  if (!emailResult.success) {
    loggers.email.error('Failed to send welcome email:', emailResult.error);
    // Don't fail registration if email fails, but log it
  }
};
```

### Example 2: Send Mentor Profile Verified Email

```typescript
import { sendMentorProfileVerifiedEmail } from '../services/emailHelpers';

// In your verification handler
const handleMentorVerification = async (mentorUid: string, isVerified: boolean) => {
  const mentorProfile = await getMentorProfile(mentorUid);
  const userProfile = await getUserProfile(mentorUid);
  
  if (isVerified) {
    // Send verification success email
    await sendMentorProfileVerifiedEmail(
      userProfile.email,
      userProfile.firstName
    );
  }
};
```

### Example 3: Using Templates Directly

```typescript
import { sendTemplateEmail } from '../services/emailTemplates';

// Send a custom email using a template
await sendTemplateEmail(
  'registration-welcome',
  'user@example.com',
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'user@example.com'
  }
);
```

## 🔌 Integration Points

### 1. User Registration

**Location:** `src/pages/authPages/SignInPage.tsx`

```typescript
// After successful registration
await createUserProfile(uid, email, firstName, lastName);

// Send welcome email
import { sendRegistrationWelcomeEmail, sendAccountCreatedEmail } from '../../services/emailHelpers';

await sendRegistrationWelcomeEmail(email, firstName, lastName);
await sendAccountCreatedEmail(email, firstName);
```

### 2. Email Verification

**Location:** Email verification handler (to be created)

```typescript
import { sendEmailVerificationEmail, sendEmailVerifiedEmail } from '../services/emailHelpers';

// When user requests verification
await sendEmailVerificationEmail(email, firstName, verificationUrl);

// When verification succeeds
await sendEmailVerifiedEmail(email, firstName);
```

### 3. Mentor Profile Creation

**Location:** `src/pages/mentorPages/types/useMentorData.ts`

```typescript
// After mentor profile is created
import { sendMentorProfileCreatedEmail } from '../../../services/emailHelpers';

const createProfile = async (profileData) => {
  // ... create profile ...
  
  if (profileData.isMentor) {
    await sendMentorProfileCreatedEmail(
      currentUser.email,
      userProfile.firstName
    );
  }
};
```

### 4. Mentor Profile Verification

**Location:** `src/services/verificationService.ts` or admin verification handler

```typescript
import { 
  sendMentorProfileSubmittedEmail,
  sendMentorProfileVerifiedEmail,
  sendMentorProfileRejectedEmail,
  sendMentorProfileSubmittedToAdminEmail
} from './emailHelpers';

// When profile is submitted
await sendMentorProfileSubmittedEmail(email, firstName);
await sendMentorProfileSubmittedToAdminEmail(
  adminEmail,
  `${firstName} ${lastName}`,
  email,
  profileUrl
);

// When profile is verified
if (isVerified) {
  await sendMentorProfileVerifiedEmail(email, firstName);
} else {
  await sendMentorProfileRejectedEmail(email, firstName, rejectionReason);
}
```

### 5. Password Reset

**Location:** Password reset handler

```typescript
import { sendPasswordResetEmail, sendPasswordResetSuccessEmail } from '../services/emailHelpers';

// When password reset is requested
await sendPasswordResetEmail(email, firstName, resetUrl);

// When password is successfully reset
await sendPasswordResetSuccessEmail(email, firstName);
```

## 📋 Implementation Checklist

### High Priority (Do First)
- [ ] Integrate registration welcome email
- [ ] Integrate account created email
- [ ] Integrate email verification emails
- [ ] Integrate mentor profile created email
- [ ] Integrate mentor profile verification emails
- [ ] Integrate password reset emails

### Medium Priority
- [ ] Integrate mentee profile created email
- [ ] Create session booking emails
- [ ] Create matching notification emails
- [ ] Create reminder emails

### Low Priority
- [ ] Create newsletter templates
- [ ] Create announcement templates
- [ ] Create ambassador application emails

## 🎨 Customizing Templates

### Adding a New Template

1. Add template to `EmailTemplates` object in `src/services/emailTemplates.ts`:

```typescript
'new-template-key': {
  name: 'New Template Name',
  subject: 'Email Subject {{firstName}}',
  category: 'notification',
  description: 'What this email is for',
  content: `
    <h2>Hello {{firstName}}</h2>
    <p>Your custom content here...</p>
  `
}
```

2. Create helper function in `src/services/emailHelpers.ts`:

```typescript
export async function sendNewTemplateEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  const variables: EmailTemplateVariables = {
    firstName
  };
  return await sendTemplateEmail('new-template-key', email, variables);
}
```

3. Use it in your code:

```typescript
import { sendNewTemplateEmail } from '../services/emailHelpers';
await sendNewTemplateEmail(email, firstName);
```

### Template Styling

Templates use a consistent HTML wrapper with:
- Responsive design
- Bgr8 branding
- Button styles (`.button`, `.button-secondary`, `.button-danger`)
- Info boxes (`.info-box`, `.success-box`, `.warning-box`, `.error-box`)

## 🔍 Testing

### Testing Email Templates

1. Use the admin email panel to test templates
2. Check email delivery in your email service logs
3. Verify HTML rendering in different email clients
4. Test variable substitution

### Testing Integration

1. Test each integration point
2. Verify emails are sent at the right time
3. Check error handling when email sending fails
4. Ensure user experience isn't blocked by email failures

## 📊 Best Practices

1. **Don't Block User Actions**: Email sending should not block critical user flows
2. **Error Handling**: Always handle email failures gracefully
3. **Logging**: Log email sending attempts and failures
4. **Testing**: Test emails in development before deploying
5. **Personalization**: Use user's name and relevant information
6. **Clear CTAs**: Include clear call-to-action buttons
7. **Mobile Responsive**: Ensure emails look good on mobile devices

## 🐛 Troubleshooting

### Email Not Sending
- Check email service configuration
- Verify API keys and credentials
- Check email service logs
- Verify recipient email addresses

### Template Not Found
- Check template key spelling
- Verify template exists in `EmailTemplates` object
- Check import paths

### Variables Not Replacing
- Verify variable names match exactly (case-sensitive)
- Check that variables are passed correctly
- Ensure `{{variableName}}` syntax is correct

## 📚 Next Steps

1. Start with high-priority integrations
2. Test each integration thoroughly
3. Monitor email delivery rates
4. Gather user feedback on email content
5. Iterate and improve templates based on feedback


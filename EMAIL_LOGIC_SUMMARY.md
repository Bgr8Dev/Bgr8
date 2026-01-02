# Email Logic - Complete Codebase Summary

This document provides a comprehensive overview of all email-related logic in the codebase.

## 📁 File Structure

### Core Services (Frontend)
- **`src/services/emailApiService.ts`** - API client for communicating with backend email server
- **`src/services/emailService.ts`** - Main email service managing templates, drafts, sent emails, and recipients
- **`src/services/zohoMailService.ts`** - Legacy/alternative Zoho Mail service (not currently used)

### Backend Server
- **`email-server/server.js`** - Express.js backend server handling email sending via Zoho Mail (SMTP)

### Configuration
- **`src/config/emailConfig.ts`** - Frontend email configuration (API URL, API key)
- **`email-server/env.example`** - Backend environment variables template
- **`env.local.example`** - Frontend environment variables template

### UI Components
- **`src/pages/adminPages/AdminEmails.tsx`** - Main admin email management page
- **`src/components/admin/emails/`** - Email-related components:
  - `ComposeTab.tsx` - Compose new emails
  - `TemplatesTab.tsx` - Manage email templates
  - `DraftsTab.tsx` - Manage email drafts
  - `SentTab.tsx` - View sent emails
  - `AnalyticsTab.tsx` - Email analytics
  - `DeveloperTab.tsx` - Developer testing tools
  - `RecipientSelector.tsx` - Select email recipients
  - `EmailHeader.tsx` - Email page header
  - `EmailTabs.tsx` - Tab navigation
  - `EmailPreview.tsx` - Preview emails
  - `RichTextEditor.tsx` - Rich text editor for email content
  - `TemplateModal.tsx` - Template creation/edit modal
  - `TestButton.tsx` - Testing utilities
  - `MobileAdminEmails.tsx` - Mobile version

### Documentation
- **`docs/email-service-architecture.md`** - Architecture overview
- **`docs/ZOHO_MAIL_SETUP.md`** - Zoho Mail setup guide
- **`email-server/README.md`** - Email server documentation

---

## 🔧 Core Services Breakdown

### 1. EmailApiService (`src/services/emailApiService.ts`)

**Purpose:** Frontend API client that communicates with the backend email server.

**Key Methods:**
- `initialize(config: EmailApiConfig)` - Initialize with API URL and API key
- `testConnection()` - Test connection to email server (`GET /api/health`)
- `sendEmail(message: EmailApiMessage)` - Send single email (`POST /api/email/send`)
- `sendBulkEmail(messages: EmailApiMessage[])` - Send multiple emails (`POST /api/email/send-bulk`)
- `testConfiguration()` - Test email configuration (`POST /api/email/test`)
- `getEmailStats()` - Get email statistics (`GET /api/email/stats`)

**Features:**
- Email address validation (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Request validation (recipients, subject, content)
- 30-second timeout for single emails, 60 seconds for bulk
- Bearer token authentication
- Error handling and logging

**Interfaces:**
```typescript
EmailApiConfig: { apiBaseUrl: string; apiKey: string }
EmailApiMessage: { to, cc?, bcc?, subject, content, contentType, fromEmail?, fromName?, attachments? }
EmailApiResponse: { success, messageId?, error?, details? }
```

---

### 2. EmailService (`src/services/emailService.ts`)

**Purpose:** High-level email management service with Firebase integration for templates, drafts, and sent emails.

**Firebase Collections:**
- `email-templates` - Saved email templates
- `email-drafts` - Draft emails
- `sent-emails` - Sent email records
- `recipient-groups` - Email recipient groups
- `recipients` - Individual email recipients

**Key Methods:**

#### Template Management
- `getTemplates()` - Get all templates
- `getTemplate(id)` - Get template by ID
- `saveTemplate(template)` - Save new template
- `updateTemplate(id, updates)` - Update template
- `deleteTemplate(id)` - Delete template
- `incrementTemplateUsage(id)` - Increment usage count

#### Draft Management
- `getDrafts()` - Get all drafts
- `saveDraft(draft)` - Save draft
- `updateDraft(id, updates)` - Update draft
- `deleteDraft(id)` - Delete draft

#### Sent Email Management
- `getSentEmails()` - Get all sent emails
- `saveSentEmail(sentEmail)` - Save sent email record

#### Recipient Management
- `getRecipients()` - Get all recipients
- `getRecipient(id)` - Get recipient by ID
- `saveRecipient(recipient)` - Save recipient
- `updateRecipient(id, updates)` - Update recipient
- `deleteRecipient(id)` - Delete recipient
- `searchRecipients(term)` - Search recipients
- `getRecipientsByTags(tags)` - Get recipients by tags
- `getRecipientsByGroup(groupId)` - Get recipients by group
- `addRecipientToGroup(recipientId, groupId)` - Add recipient to group
- `removeRecipientFromGroup(recipientId, groupId)` - Remove from group

#### Email Sending
- `sendEmail(draft)` - Send email using EmailApiService
  - Resolves recipients (individual + groups)
  - Calls EmailApiService.sendEmail()
  - Saves sent email record
  - Increments template usage if applicable
  - Handles success/failure states

#### Analytics
- `getEmailAnalytics()` - Calculate analytics:
  - Total sent, opens, clicks, bounces
  - Open rate, click rate, bounce rate

#### Recipient Groups
- `getRecipientGroups()` - Get all recipient groups
- `getDefaultRecipientGroups()` - Get default groups (all, admins, mentors, mentees, students)

**Interfaces:**
```typescript
EmailTemplate: { id, name, subject, content, category, createdAt, updatedAt, createdBy, isPublic, tags, usageCount }
EmailDraft: { id, subject, content, recipients, recipientGroups, templateId?, isScheduled, scheduledDate?, priority, trackOpens, trackClicks, createdAt, updatedAt, createdBy, status }
SentEmail: { id, subject, content, recipients, recipientGroups, templateId?, sentAt, sentBy, status, openCount, clickCount, bounceCount, unsubscribeCount }
RecipientGroup: { id, name, description, count, type, filters? }
Recipient: { id, email, name?, firstName?, lastName?, tags, groups, isActive, isVerified, lastUsed?, createdAt, updatedAt, createdBy, notes?, metadata? }
```

---

### 3. ZohoMailService (`src/services/zohoMailService.ts`)

**Purpose:** Alternative Zoho Mail service (appears to be legacy/unused, current implementation uses SMTP via backend)

**Note:** This service is defined but not actively used. The current implementation uses SMTP via the backend server instead of direct Zoho API calls from the frontend.

---

## 🖥️ Backend Server (`email-server/server.js`)

**Framework:** Express.js with Node.js

**Key Features:**
- CORS enabled for frontend
- Helmet security headers
- Rate limiting:
  - General API: 100 requests per 15 minutes
  - Email API: 10 requests per minute
- Input validation using Joi
- SMTP email sending via Nodemailer (Zoho SMTP)

### API Endpoints

#### Health & Testing
- `GET /api/health` - Health check
- `GET /api/config-test` - Test email configuration
- `GET /api/zoho-test` - Test Zoho API setup
- `POST /api/email/test` - Test email configuration

#### Email Operations
- `POST /api/email/send` - Send single email
  - Validates input using Joi schema
  - Uses SMTP (sendSMTPEmail function)
  - Returns message ID or error

- `POST /api/email/send-bulk` - Send multiple emails (up to 50)
  - Processes in batches of 5
  - 2-second delay between batches
  - Returns array of results

- `GET /api/email/stats` - Get email statistics (placeholder implementation)

### SMTP Configuration

**Function:** `sendSMTPEmail(emailData)`

**Configuration:**
- Primary: `smtp.zoho.com:587` (TLS)
- Fallback: `smtp.zoho.com:465` (SSL)
- Authentication: Zoho email and password from environment variables
- From email: `info@bgr8.uk` (default)
- From name: `Bgr8 Team` (default)

**Environment Variables Required:**
- `ZOHO_CLIENT_ID` - Zoho OAuth client ID
- `ZOHO_CLIENT_SECRET` - Zoho OAuth client secret
- `ZOHO_REFRESH_TOKEN` - Zoho OAuth refresh token
- `ZOHO_SMTP_EMAIL` or `ZOHO_FROM_EMAIL` - SMTP email
- `ZOHO_SMTP_PASSWORD` or `ZOHO_APP_PASSWORD` or `ZOHO_PASSWORD` - SMTP password
- `ZOHO_FROM_NAME` - From name (optional)
- `API_KEY` - API key for authentication (shared with frontend)
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)

### Validation Schema (Joi)

```javascript
emailSchema: {
  to: array of valid emails (min 1, required)
  cc: array of valid emails (optional)
  bcc: array of valid emails (optional)
  subject: string (1-200 chars, required)
  content: string (1-1M chars, required)
  contentType: 'text/plain' | 'text/html' (default: 'text/html')
  fromEmail: valid email (optional)
  fromName: string (max 100 chars, optional)
  attachments: array of { fileName, content (base64), contentType } (optional)
}
```

---

## ⚙️ Configuration

### Frontend Configuration (`src/config/emailConfig.ts`)

**Environment Variables:**
- `VITE_EMAIL_API_BASE_URL` - Backend API URL
  - Default (dev): `http://localhost:3001`
  - Default (prod): `https://bgr8-email-server.onrender.com`
- `VITE_EMAIL_API_KEY` - API key (must match backend)

**Auto-detection:**
- Automatically switches to localhost if hostname is `localhost` or `127.0.0.1`
- Can be manually overridden

**Functions:**
- `validateEmailConfig()` - Validates configuration
  - Checks for API URL
  - Checks for API key (not default value)

### Backend Configuration (`email-server/.env`)

See environment variables listed above in Backend Server section.

---

## 🎨 UI Components

### AdminEmails Page (`src/pages/adminPages/AdminEmails.tsx`)

**Main Features:**
- Tabbed interface (Compose, Templates, Sent, Drafts, Analytics, Developer)
- Email composition with rich text editor
- Template management
- Draft management
- Sent email history
- Email analytics
- Developer testing tools
- Recipient selection (individual + groups)
- Email validation
- Configuration validation

**State Management:**
- Current draft, templates, drafts, sent emails
- Recipient groups, analytics
- Loading, sending, saving states
- Notification system
- Test status tracking

**Initialization:**
- Initializes EmailService with config on mount
- Validates email configuration
- Loads data from Firebase

**Key Functions:**
- `handleSendEmail()` - Send email via EmailService
- `handleSaveDraft()` - Save draft
- `testEmailServerConnection()` - Test server connection
- `testEmailConfiguration()` - Test configuration
- `testZohoSetup()` - Test Zoho setup
- `handleSendTestEmail()` - Send test email
- `isValidEmail(email)` - Email validation (regex)

### Email Components

All components are in `src/components/admin/emails/`:
- Modular design for maintainability
- Shared styling via CSS files
- Rich text editing support
- Template system integration
- Recipient selection UI
- Email preview functionality

---

## 📊 Data Flow

### Sending an Email

```
1. User composes email in AdminEmails page
   ↓
2. User clicks "Send Email"
   ↓
3. AdminEmails.handleSendEmail()
   ↓
4. EmailService.sendEmail(draft)
   ↓
5. EmailService.getAllRecipients() - Resolves individual + group recipients
   ↓
6. EmailApiService.sendEmail(message)
   ↓
7. HTTP POST to backend: /api/email/send
   ↓
8. Backend validates request (Joi schema)
   ↓
9. Backend sendSMTPEmail(emailData)
   ↓
10. Nodemailer sends via Zoho SMTP
    ↓
11. Response back to frontend
    ↓
12. EmailService.saveSentEmail() - Save record in Firebase
    ↓
13. UI updates with success/error notification
```

### Loading Email Data

```
1. AdminEmails component mounts
   ↓
2. loadData() function called
   ↓
3. Parallel Firebase queries:
   - EmailService.getTemplates()
   - EmailService.getDrafts()
   - EmailService.getSentEmails()
   - EmailService.getRecipientGroups()
   - EmailService.getEmailAnalytics()
   ↓
4. State updated with data
   ↓
5. UI renders with loaded data
```

---

## 🔐 Security Features

1. **API Key Authentication**
   - Backend requires Bearer token
   - Frontend sends API key in Authorization header
   - Shared secret between frontend and backend

2. **Rate Limiting**
   - General API: 100 requests per 15 minutes
   - Email API: 10 requests per minute
   - Prevents abuse and spam

3. **Input Validation**
   - Joi schema validation on backend
   - Email regex validation on frontend and backend
   - Content length limits (subject: 200 chars, content: 1MB)

4. **CORS Protection**
   - Backend only accepts requests from configured frontend URL

5. **Security Headers**
   - Helmet middleware for security headers

6. **Secure Credential Storage**
   - Zoho credentials only in backend environment variables
   - Frontend only has API URL and API key
   - No Zoho secrets exposed to browser

---

## 📝 Key Interfaces & Types

### EmailApiMessage
```typescript
{
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: string;
  contentType: 'text/plain' | 'text/html';
  fromEmail?: string;
  fromName?: string;
  attachments?: {
    fileName: string;
    content: string; // base64
    contentType: string;
  }[];
}
```

### EmailDraft
```typescript
{
  id: string;
  subject: string;
  content: string;
  recipients: string[];
  recipientGroups: string[];
  templateId?: string;
  isScheduled: boolean;
  scheduledDate?: Date;
  priority: 'low' | 'normal' | 'high';
  trackOpens: boolean;
  trackClicks: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
}
```

### EmailTemplate
```typescript
{
  id: string;
  name: string;
  subject: string;
  content: string;
  category: 'announcement' | 'newsletter' | 'notification' | 'invitation' | 'reminder' | 'custom';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isPublic: boolean;
  tags: string[];
  usageCount: number;
}
```

---

## 🚀 Usage Examples

### Initialize Email Service
```typescript
import { EmailService } from './services/emailService';
import { emailConfig } from './config/emailConfig';

EmailService.initializeEmailApi({
  apiBaseUrl: emailConfig.apiBaseUrl,
  apiKey: emailConfig.apiKey
});
```

### Send Email
```typescript
const result = await EmailService.sendEmail({
  subject: 'Test Email',
  content: '<h1>Hello</h1>',
  recipients: ['user@example.com'],
  recipientGroups: [],
  isScheduled: false,
  priority: 'normal',
  trackOpens: true,
  trackClicks: true,
  status: 'draft',
  createdBy: userId
});
```

### Save Template
```typescript
const templateId = await EmailService.saveTemplate({
  name: 'Welcome Email',
  subject: 'Welcome to Bgr8',
  content: '<h1>Welcome!</h1>',
  category: 'notification',
  createdBy: userId,
  isPublic: true,
  tags: ['welcome', 'onboarding']
});
```

---

## 🐛 Common Issues & Solutions

1. **Email not sending**
   - Check backend server is running
   - Verify Zoho SMTP credentials in backend .env
   - Check API key matches between frontend and backend
   - Review backend logs for SMTP errors

2. **Configuration errors**
   - Ensure VITE_EMAIL_API_BASE_URL is set correctly
   - Ensure VITE_EMAIL_API_KEY matches backend API_KEY
   - Check backend environment variables are set

3. **Rate limiting**
   - Email API limits to 10 requests per minute
   - Use bulk email endpoint for multiple emails
   - Implement delays for batch sending

4. **CORS errors**
   - Ensure FRONTEND_URL in backend matches actual frontend URL
   - Check CORS configuration in server.js

---

## 📚 Additional Resources

- Architecture documentation: `docs/email-service-architecture.md`
- Zoho setup guide: `docs/ZOHO_MAIL_SETUP.md`
- Email server README: `email-server/README.md`


# 🏢 Admin Portal Testing Guide

## 🎯 What is the Admin Portal?

The Admin Portal is the control center for managing the BGr8 platform. Only users with admin roles can access it.

### 🔐 Access Requirements
- **Admin Role**: Must have `admin` role in profile
- **Login Required**: Must be authenticated
- **URL**: `/admin-portal`

### 📱 Mobile Access
- Admin portal works on mobile devices
- Touch-optimized interface
- All features accessible on phones/tablets

## 👥 User Management

**What it does**: Manage all platform users, their roles, and permissions.

### Key Features:
- **User List**: View all registered users with search and filters
- **Role Assignment**: Assign roles like admin, developer, mentor, mentee
- **Profile Management**: View and edit user profiles
- **Bulk Operations**: Update multiple users at once

### Test Focus:
- Can you see all users?
- Can you search and filter users?
- Can you assign/change user roles?
- Do role changes take effect immediately?

## 📊 Analytics Dashboard

**What it does**: Shows platform statistics and performance metrics.

### Key Features:
- **Overview Metrics**: Total users, active sessions, feedback tickets
- **Real-time Updates**: Data updates automatically
- **Data Export**: Download analytics in CSV/Excel format
- **Performance Tracking**: System health and user engagement

### Test Focus:
- Are the numbers accurate?
- Do metrics update in real-time?
- Can you export data?
- Are charts and graphs working?

## 📅 Sessions Management

**What it does**: Manage mentor-mentee sessions and track session data.

### Key Features:
- **Session List**: View all scheduled and completed sessions
- **Status Management**: Update session status (scheduled, completed, cancelled)
- **Session Details**: View participant info, booking details, feedback
- **Session Analytics**: Track completion rates, trends, success metrics

### Test Focus:
- Can you see all sessions?
- Can you update session status?
- Are session details accurate?
- Do analytics show correct data?

## 🌟 Ambassador Management

**What it does**: Review ambassador applications and manage active ambassadors.

### Key Features:
- **Application Review**: View and approve/reject ambassador applications
- **Application Details**: See full application with social media links and motivation
- **Approval Process**: Approve applications and assign ambassador role
- **Ambassador List**: Manage active ambassadors and track performance

### Test Focus:
- Can you see all applications?
- Can you approve/reject applications?
- Do approved users get ambassador role?
- Are rejection reasons saved?

## 🐛 Testing Feedback System

**What it does**: Built-in ticketing system for bug reports and feature requests.

### Key Features:
- **Ticket Creation**: Create tickets with title, description, priority
- **File Attachments**: Upload screenshots and documents
- **Status Tracking**: Track ticket progress (new, in progress, resolved)
- **Comments**: Add comments and updates to tickets
- **Analytics**: View feedback statistics and trends

### Test Focus:
- Can you create tickets?
- Do file attachments work?
- Can you update ticket status?
- Are comments saved properly?

## 📧 Email Management

**What it does**: Send emails to users and manage email templates.

### Key Features:
- **Email Templates**: Pre-made templates for common emails
- **Email Composition**: Create and send custom emails
- **Email History**: Track sent emails and delivery status

### Test Focus:
- Can you send emails?
- Do templates work?
- Is email history accurate?

## 📢 Announcement Management

**What it does**: Create and manage site-wide announcements.

### Key Features:
- **Announcement Creation**: Create announcements visible to all users
- **Visibility Controls**: Set who can see announcements
- **Timing**: Schedule when announcements appear

### Test Focus:
- Can you create announcements?
- Do they appear on the site?
- Can you control visibility?

## ⚙️ Settings & Configuration

**What it does**: Configure platform settings and permissions.

### Key Features:
- **Platform Settings**: Configure site-wide settings
- **Permission Management**: Set what each role can do
- **System Configuration**: Technical platform settings

### Test Focus:
- Can you change settings?
- Do permission changes work?
- Are settings saved correctly?

---

## 🧪 Quick Testing Checklist

### Core Admin Functions
- [ ] Can access admin portal with admin account
- [ ] Can view and manage users
- [ ] Can assign/change user roles
- [ ] Can view analytics dashboard
- [ ] Can manage sessions
- [ ] Can review ambassador applications
- [ ] Can use testing feedback system
- [ ] Can send emails
- [ ] Can create announcements
- [ ] Can change settings

### Mobile Testing
- [ ] Admin portal works on mobile
- [ ] All features accessible on phone/tablet
- [ ] Touch interactions work properly
- [ ] Forms are mobile-friendly

---

*Focus on testing the main admin functions. Use the built-in testing feedback system to report any issues you find.*

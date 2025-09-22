# 🧪 BGr8 Platform Testing Guide

## 🎯 Quick Start

**BGr8** is a mentoring platform that connects mentors and mentees. This guide helps you test it effectively.

### 🏗️ What You're Testing
- **Mentor Matching**: Algorithm that pairs mentors with mentees
- **User Management**: Registration, profiles, roles
- **Admin Portal**: Management dashboard for admins
- **Booking System**: Session scheduling with Cal.com
- **Testing Feedback**: Built-in ticketing system for bug reports

### 👥 User Roles
- **Admin**: Full access to everything
- **Developer**: Technical tools and testing features
- **Tester**: Can submit feedback and bug reports
- **Mentor/Mentee**: Regular users
- **Ambassador**: Community representatives

### 🎫 Testing Feedback System
**IMPORTANT**: We have a dedicated testing feedback area with a ticketing system:
- **Location**: Admin Portal → Testing Feedback
- **Features**: Create tickets, attach files, track status, add comments
- **Access**: Available to testers and developers
- **Purpose**: Centralized bug reporting and feature requests

---

## 🎯 What to Test

### Core Features
1. **User Registration/Login** - Can users create accounts and sign in?
2. **Mentor Matching** - Does the algorithm find good matches?
3. **Admin Portal** - Can admins manage users and view analytics?
4. **Mobile Experience** - Does everything work on phones/tablets?
5. **Testing Feedback** - Can you create and manage bug tickets?

### Testing Priority
**High**: Login, matching, admin access, mobile
**Medium**: Booking, ambassador program, search
**Low**: Analytics, advanced features

---

## 📱 Test On
- **Browsers**: Chrome, Firefox, Safari, Edge
- **Devices**: Desktop, tablet, mobile
- **Screen Sizes**: 320px to 1920px

---

## 🚀 Quick Start
1. Get test accounts from admin
2. Test core features first
3. Use the built-in feedback system to report bugs
4. Focus on mobile experience

---

## 📚 Guides Available
- **[User Journeys](USER_JOURNEY_TESTING.md)** - Complete user flows
- **[Feature Testing](FEATURE_TESTING_GUIDE.md)** - Individual features
- **[Admin Portal](ADMIN_PORTAL_TESTING.md)** - Admin features
- **[Bug Reporting](BUG_REPORTING_GUIDE.md)** - How to report issues
- **[Test Data](TEST_DATA_GUIDE.md)** - Sample data and accounts

---

*Keep it simple: Test the main features, report bugs through the built-in system, focus on mobile experience.*

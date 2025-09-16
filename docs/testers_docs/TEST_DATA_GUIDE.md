# 📊 Test Data Guide

## 🎯 Overview

This guide provides comprehensive test data and scenarios for testing the BGr8 platform. It includes sample user profiles, test accounts, and realistic data scenarios to ensure thorough testing coverage.

---

## 👥 Test User Accounts

### Admin Test Accounts

#### Primary Admin Account
- **Email**: `admin@bgr8test.com`
- **Password**: `AdminTest123!@#`
- **Roles**: `admin`, `developer`
- **Profile**: Complete admin profile with all permissions
- **Use Case**: Full admin portal testing

#### Secondary Admin Account
- **Email**: `admin2@bgr8test.com`
- **Password**: `AdminTest456!@#`
- **Roles**: `admin`
- **Profile**: Standard admin profile
- **Use Case**: Admin role testing, permission validation

### Developer Test Accounts

#### Primary Developer Account
- **Email**: `developer@bgr8test.com`
- **Password**: `DevTest123!@#`
- **Roles**: `developer`, `tester`
- **Profile**: Developer profile with testing access
- **Use Case**: Developer tools testing, feedback system

#### Secondary Developer Account
- **Email**: `dev2@bgr8test.com`
- **Password**: `DevTest456!@#`
- **Roles**: `developer`
- **Profile**: Developer profile
- **Use Case**: Developer feature testing

### Regular User Accounts

#### Mentor Test Account
- **Email**: `mentor@bgr8test.com`
- **Password**: `MentorTest123!@#`
- **Roles**: `mentor`
- **Profile**: Complete mentor profile with skills and availability
- **Use Case**: Mentor functionality testing

#### Mentee Test Account
- **Email**: `mentee@bgr8test.com`
- **Password**: `MenteeTest123!@#`
- **Roles**: `mentee`
- **Profile**: Complete mentee profile with learning goals
- **Use Case**: Mentee functionality testing

#### Ambassador Test Account
- **Email**: `ambassador@bgr8test.com`
- **Password**: `AmbassadorTest123!@#`
- **Roles**: `ambassador`
- **Profile**: Ambassador profile with outreach activities
- **Use Case**: Ambassador program testing

### Committee & Special Roles

#### Committee Member Account
- **Email**: `committee@bgr8test.com`
- **Password**: `CommitteeTest123!@#`
- **Roles**: `committee`
- **Profile**: Committee member profile
- **Use Case**: Committee features testing

#### Vetting Officer Account
- **Email**: `vetting@bgr8test.com`
- **Password**: `VettingTest123!@#`
- **Roles**: `vetting-officer`
- **Profile**: Vetting officer profile
- **Use Case**: Mentor verification testing

#### Marketing Account
- **Email**: `marketing@bgr8test.com`
- **Password**: `MarketingTest123!@#`
- **Roles**: `marketing`
- **Profile**: Marketing team profile
- **Use Case**: Marketing features testing

---

## 📋 Sample User Profiles

### Mentor Profile Template

```json
{
  "personalInfo": {
    "firstName": "Sarah",
    "lastName": "Johnson",
    "email": "sarah.johnson@example.com",
    "phoneNumber": "+44 7700 900123",
    "dateOfBirth": "1985-03-15",
    "gender": "Female",
    "location": {
      "address": "123 Tech Street",
      "city": "London",
      "county": "Greater London",
      "postcode": "SW1A 1AA",
      "country": "United Kingdom"
    }
  },
  "professionalInfo": {
    "currentPosition": "Senior Software Engineer",
    "company": "TechCorp Ltd",
    "industry": "Technology",
    "experience": "8 years",
    "skills": [
      "JavaScript", "React", "Node.js", "Python", "AWS",
      "Leadership", "Project Management", "Mentoring"
    ],
    "education": {
      "qualifications": ["Bachelor's Degree in Computer Science"],
      "school": "University of London"
    }
  },
  "mentorProfile": {
    "bio": "Experienced software engineer passionate about helping others grow in their tech careers. I specialize in full-stack development and have mentored over 50 developers.",
    "specialties": ["Web Development", "Career Guidance", "Technical Interviews"],
    "availability": {
      "timezone": "GMT",
      "preferredTimes": ["Evenings", "Weekends"],
      "maxSessionsPerWeek": 3
    },
    "mentoringStyle": "Structured approach with practical exercises and real-world examples"
  }
}
```

### Mentee Profile Template

```json
{
  "personalInfo": {
    "firstName": "Alex",
    "lastName": "Smith",
    "email": "alex.smith@example.com",
    "phoneNumber": "+44 7700 900456",
    "dateOfBirth": "1995-07-22",
    "gender": "Non-binary",
    "location": {
      "address": "456 Learning Lane",
      "city": "Manchester",
      "county": "Greater Manchester",
      "postcode": "M1 1AA",
      "country": "United Kingdom"
    }
  },
  "professionalInfo": {
    "currentPosition": "Junior Developer",
    "company": "StartupXYZ",
    "industry": "Technology",
    "experience": "1 year",
    "skills": ["HTML", "CSS", "JavaScript"],
    "education": {
      "qualifications": ["Bootcamp Certificate"],
      "school": "Code Academy"
    }
  },
  "menteeProfile": {
    "goals": [
      "Improve JavaScript skills",
      "Learn React framework",
      "Prepare for senior developer role",
      "Build confidence in technical interviews"
    ],
    "learningStyle": "Hands-on with regular feedback",
    "availability": {
      "timezone": "GMT",
      "preferredTimes": ["Evenings"],
      "maxSessionsPerWeek": 2
    },
    "currentChallenges": "Struggling with advanced JavaScript concepts and React state management"
  }
}
```

### Ambassador Profile Template

```json
{
  "personalInfo": {
    "firstName": "Maria",
    "lastName": "Garcia",
    "email": "maria.garcia@example.com",
    "phoneNumber": "+44 7700 900789",
    "dateOfBirth": "1990-11-08",
    "gender": "Female",
    "location": {
      "address": "789 Community Road",
      "city": "Birmingham",
      "county": "West Midlands",
      "postcode": "B1 1AA",
      "country": "United Kingdom"
    }
  },
  "professionalInfo": {
    "currentPosition": "Community Manager",
    "company": "Social Impact Ltd",
    "industry": "Non-profit",
    "experience": "5 years",
    "skills": ["Community Building", "Event Organization", "Social Media", "Public Speaking"]
  },
  "ambassadorProfile": {
    "motivation": "Passionate about creating positive change in communities and helping people connect through mentorship",
    "socialMedia": {
      "instagram": "@mariacommunity",
      "linkedin": "maria-garcia-community",
      "twitter": "@mariacommunity",
      "facebook": "MariaGarciaCommunity"
    },
    "communityInvolvement": "Active in local tech meetups, volunteer at coding bootcamps, organizer of women in tech events",
    "availability": "Evenings and weekends for community events and outreach activities"
  }
}
```

---

## 🎯 Test Scenarios

### User Registration Scenarios

#### Valid Registration
- **Email**: `newuser@test.com`
- **Password**: `ValidPassword123!@#`
- **Expected**: Account created, verification email sent
- **Test Data**: Standard user profile information

#### Invalid Registration Scenarios
- **Weak Password**: `weak123`
- **Invalid Email**: `invalid-email`
- **Duplicate Email**: Use existing test account email
- **Missing Required Fields**: Leave required fields empty

### Profile Creation Scenarios

#### Complete Mentor Profile
- **Personal Info**: Full personal information
- **Professional Info**: Complete professional background
- **Skills**: 5-10 relevant skills
- **Availability**: Set up calendar availability
- **Bio**: Detailed mentor bio (200+ words)

#### Complete Mentee Profile
- **Personal Info**: Full personal information
- **Learning Goals**: 3-5 specific goals
- **Current Skills**: Basic skill set
- **Availability**: Learning time preferences
- **Challenges**: Current learning challenges

#### Incomplete Profiles
- **Minimal Info**: Only required fields
- **Partial Info**: Some sections incomplete
- **Invalid Data**: Invalid dates, phone numbers, etc.

### Matching Algorithm Scenarios

#### High Compatibility Match
- **Mentor**: Senior developer with React expertise
- **Mentee**: Junior developer wanting to learn React
- **Expected**: High match percentage (80%+)

#### Medium Compatibility Match
- **Mentor**: Marketing professional
- **Mentee**: Business student interested in marketing
- **Expected**: Medium match percentage (50-70%)

#### Low Compatibility Match
- **Mentor**: Software engineer
- **Mentee**: Art student with no tech background
- **Expected**: Low match percentage (<30%)

### Booking Scenarios

#### Successful Booking
- **Mentor**: Available during requested time
- **Mentee**: Books available slot
- **Expected**: Booking confirmed, calendar updated

#### Booking Conflicts
- **Mentor**: Slot already booked
- **Mentee**: Tries to book same slot
- **Expected**: Error message, alternative times suggested

#### Cancellation Scenarios
- **Early Cancellation**: 24+ hours before session
- **Late Cancellation**: <24 hours before session
- **No Show**: Session time passes without attendance

### Admin Portal Scenarios

#### User Management
- **Role Assignment**: Assign multiple roles to user
- **Bulk Operations**: Update multiple users simultaneously
- **User Search**: Search by various criteria
- **Profile Management**: Edit user profiles

#### Analytics Testing
- **Data Accuracy**: Verify metrics match actual data
- **Real-time Updates**: Test live data updates
- **Export Functionality**: Export data in various formats
- **Date Range Filtering**: Test different time periods

#### Feedback Management
- **Ticket Creation**: Create tickets with various priorities
- **File Attachments**: Upload different file types
- **Status Updates**: Change ticket statuses
- **Comment System**: Add comments and replies

### Ambassador Program Scenarios

#### Application Process
- **Complete Application**: Full application with all details
- **Incomplete Application**: Missing required information
- **Duplicate Application**: Same person applying twice
- **Invalid Social Media**: Invalid social media links

#### Review Process
- **Approval**: Approve qualified application
- **Rejection**: Reject unqualified application
- **Request More Info**: Ask for additional information
- **Bulk Review**: Review multiple applications

### Security Testing Scenarios

#### Authentication Testing
- **Valid Login**: Correct credentials
- **Invalid Login**: Wrong credentials
- **Brute Force**: Multiple failed attempts
- **Session Management**: Test session timeout

#### Authorization Testing
- **Admin Access**: Test admin-only features
- **Role Bypass**: Try to access restricted features
- **Data Access**: Test user data isolation
- **API Security**: Test API endpoint security

#### Input Validation
- **XSS Testing**: Script injection attempts
- **SQL Injection**: Database manipulation attempts
- **File Upload**: Malicious file uploads
- **Input Length**: Oversized input testing

---

## 📊 Test Data Sets

### User Demographics
- **Age Range**: 18-65 years
- **Gender Distribution**: 40% Female, 40% Male, 20% Non-binary
- **Location**: UK counties and major cities
- **Industries**: Technology, Healthcare, Finance, Education, Non-profit

### Skills Categories
- **Technical Skills**: Programming languages, frameworks, tools
- **Soft Skills**: Leadership, communication, project management
- **Industry Skills**: Domain-specific knowledge
- **Language Skills**: English, Spanish, French, German, etc.

### Availability Patterns
- **Weekday Evenings**: 6 PM - 9 PM
- **Weekend Mornings**: 9 AM - 12 PM
- **Weekend Afternoons**: 1 PM - 5 PM
- **Flexible**: Various times throughout week

### Session Types
- **Initial Consultation**: 30 minutes
- **Regular Session**: 60 minutes
- **Deep Dive**: 90 minutes
- **Group Session**: 120 minutes

---

## 🔧 Test Environment Setup

### Database Setup
- **Test Database**: Separate from production
- **Sample Data**: Pre-populated with test users
- **Data Reset**: Ability to reset test data
- **Data Isolation**: Test data doesn't affect production

### Configuration
- **Environment Variables**: Test-specific configuration
- **API Keys**: Test API keys for integrations
- **Email Testing**: Test email addresses
- **File Storage**: Test file storage setup

### Test Accounts Management
- **Account Creation**: Automated test account creation
- **Role Assignment**: Easy role management for testing
- **Data Cleanup**: Automated cleanup after tests
- **Account Reset**: Reset accounts to initial state

---

## 📝 Test Data Maintenance

### Regular Updates
- **Weekly**: Update test data to reflect current state
- **Monthly**: Review and refresh test scenarios
- **Quarterly**: Comprehensive test data review
- **As Needed**: Update for new features

### Data Validation
- **Accuracy**: Ensure test data is realistic
- **Completeness**: Verify all required data present
- **Consistency**: Maintain data consistency across tests
- **Relevance**: Keep data relevant to current features

### Backup & Recovery
- **Data Backup**: Regular backup of test data
- **Recovery Process**: Quick recovery from backup
- **Version Control**: Track test data changes
- **Rollback**: Ability to rollback to previous state

---

## 🧪 Test Data Usage Guidelines

### Best Practices
- **Use Realistic Data**: Make test data as realistic as possible
- **Maintain Consistency**: Use consistent data across tests
- **Document Changes**: Document any test data modifications
- **Clean Up**: Clean up test data after testing

### Data Privacy
- **No Real Data**: Never use real user data in tests
- **Anonymized**: Use anonymized or fictional data
- **Secure Storage**: Store test data securely
- **Access Control**: Limit access to test data

### Performance Testing
- **Large Datasets**: Use large datasets for performance tests
- **Realistic Load**: Simulate realistic user loads
- **Data Volume**: Test with various data volumes
- **Growth Simulation**: Test data growth scenarios

---

*This test data guide provides comprehensive test data and scenarios for thorough testing of the BGr8 platform. Regular updates and maintenance of test data ensure effective testing coverage.*

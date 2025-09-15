# Announcement Banner System

This system provides a comprehensive announcement banner that appears at the top of your website and can be managed through the admin portal.

## Features

- **Firebase Integration**: All announcements are stored and managed through Firebase Firestore
- **Real-time Updates**: Announcements update in real-time across the website
- **Role-based Targeting**: Target announcements to specific user roles (admin, users, mentors, guests)
- **Multiple Types**: Support for info, warning, success, error, and promotion announcements
- **Priority Levels**: Set priority levels (low, normal, high, urgent)
- **Display Settings**: Control where announcements appear (homepage, portal, mobile)
- **Analytics**: Track views, clicks, and dismissals
- **Auto-scrolling**: Text can scroll horizontally across the banner
- **Responsive Design**: Works on desktop and mobile devices

## Components

### 1. AnnouncementBanner
The main banner component that displays announcements at the top of the website.

**Props:**
- `showOnHomepage?: boolean` - Show on homepage (default: true)
- `showOnPortal?: boolean` - Show on admin portal (default: true)
- `showOnMobile?: boolean` - Show on mobile devices (default: true)
- `className?: string` - Additional CSS classes

### 2. AdminAnnouncements
Admin interface for managing announcements in the desktop admin portal.

### 3. MobileAdminAnnouncements
Mobile-optimized admin interface for managing announcements.

### 4. AnnouncementService
Firebase service for managing announcement data.

## Usage

### 1. Integration
The announcement banner is automatically integrated into your website through the `WebsiteLayout` component:

```tsx
import WebsiteLayout from './components/layout/WebsiteLayout';

function App() {
  return (
    <WebsiteLayout>
      {/* Your app content */}
    </WebsiteLayout>
  );
}
```

### 2. Creating Announcements
Use the admin portal to create announcements:

1. Go to Admin Portal → Announcements
2. Click "Create Announcement"
3. Fill in the details:
   - Title and content
   - Type (info, warning, success, error, promotion)
   - Priority (low, normal, high, urgent)
   - Target audience (all, users, mentors, admins, guests)
   - Display settings (where to show the announcement)
   - Click actions (optional)

### 3. Managing Announcements
- **Activate/Deactivate**: Toggle announcements on/off
- **Edit**: Modify existing announcements
- **Duplicate**: Create copies of announcements
- **Delete**: Remove announcements
- **Analytics**: View performance metrics

## Data Structure

### Announcement Interface
```typescript
interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'promotion';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  targetAudience: 'all' | 'users' | 'mentors' | 'admins' | 'guests';
  displaySettings: {
    showOnHomepage: boolean;
    showOnPortal: boolean;
    showOnMobile: boolean;
    autoScroll: boolean;
    scrollSpeed: 'slow' | 'normal' | 'fast';
    backgroundColor?: string;
    textColor?: string;
    fontSize: 'small' | 'medium' | 'large';
  };
  clickAction?: {
    type: 'none' | 'link' | 'modal' | 'page';
    url?: string;
    modalContent?: string;
    pageRoute?: string;
  };
  analytics: {
    views: number;
    clicks: number;
    dismissals: number;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Firebase Collections

The system uses the following Firebase collections:

- `announcements` - Stores all announcement data
- `pagePermissions` - Manages admin portal permissions

## Styling

The announcement banner uses CSS classes with the prefix `announcement-banner-` to avoid conflicts:

- `.announcement-banner-container` - Main container
- `.announcement-banner` - Banner element
- `.announcement-banner-content` - Content area
- `.announcement-banner-controls` - Control buttons
- `.announcement-banner-indicators` - Page indicators

## Customization

### Colors
Announcement types have predefined colors:
- Info: Blue (#3b82f6)
- Warning: Orange (#f59e0b)
- Success: Green (#10b981)
- Error: Red (#ef4444)
- Promotion: Purple (#8b5cf6)

### Scrolling
Text scrolling can be controlled through the `displaySettings.autoScroll` and `displaySettings.scrollSpeed` properties.

### Responsive Design
The banner automatically adapts to different screen sizes:
- Desktop: Full-width banner with controls
- Mobile: Stacked layout with touch-friendly controls

## Analytics

The system tracks:
- **Views**: When an announcement is displayed
- **Clicks**: When users click on announcements
- **Dismissals**: When users close announcements

Analytics are automatically recorded and can be viewed in the admin portal.

## Demo

Use the `AnnouncementBannerDemo` component to test the system:

```tsx
import AnnouncementBannerDemo from './components/announcements/AnnouncementBannerDemo';

// Use in your app for testing
<AnnouncementBannerDemo />
```

## Troubleshooting

### Banner Not Appearing
1. Check if announcements are active
2. Verify display settings match current page type
3. Ensure user role matches target audience
4. Check browser console for errors

### Firebase Connection Issues
1. Verify Firebase configuration
2. Check Firestore security rules
3. Ensure user has proper permissions

### Performance Issues
1. Limit the number of active announcements
2. Use appropriate scroll speeds
3. Consider announcement end dates to auto-expire old content

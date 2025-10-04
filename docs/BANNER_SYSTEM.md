# Banner System Documentation

## Overview

The Banner System provides a comprehensive way to display "In Development" and "Coming Soon" banners across the BGR8 website. This system allows administrators to control banner visibility, messages, and target pages through the admin interface.

## Features

- **Two Banner Types**: In Development and Coming Soon banners with distinct styling
- **Admin Controls**: Full management through Admin Settings > Banner Management
- **Smart Page Targeting**: Expandable categories with toggle switches for easy page selection
- **Pre-configured Admin Pages**: All admin pages listed with descriptions and icons
- **Bulk Actions**: Enable/disable all pages at once
- **Custom Page Support**: Add any custom page paths beyond the pre-configured list
- **Custom Messages**: Customize banner text for each banner type
- **Icon Control**: Toggle icons on/off for each banner
- **Real-time Updates**: Changes are saved to Firebase and update immediately
- **Responsive Design**: Banners work on both desktop and mobile

## Components

### Core Components

1. **InDevelopmentBanner** (`src/components/ui/InDevelopmentBanner.tsx`)
   - Orange gradient banner with tools icon
   - Animated shimmer effect
   - Used for features that are partially working

2. **ComingSoonBanner** (`src/components/ui/ComingSoonBanner.tsx`)
   - Purple gradient banner with rocket icon
   - Animated pulse and bounce effects
   - Used for features that are planned but not yet available

3. **BannerWrapper** (`src/components/ui/BannerWrapper.tsx`)
   - Wraps pages to conditionally show banners
   - Checks banner settings against current page path
   - Handles loading states

4. **BannerManagement** (`src/components/admin/settings/BannerManagement.tsx`)
   - Admin interface for configuring banners
   - Toggle banners on/off
   - Set custom messages
   - Configure target pages
   - Control icon visibility

### Context and Services

1. **BannerContext** (`src/contexts/BannerContext.tsx`)
   - Manages banner state across the application
   - Provides real-time updates from Firebase
   - Handles banner visibility logic

## Usage

### For Developers

#### Wrapping a Page with Banners

```tsx
import BannerWrapper from '../../components/ui/BannerWrapper';

// For admin portal sections
const MyAdminSection: React.FC = () => {
  return (
    <BannerWrapper sectionId="my-section" className="my-section-class">
      {/* Your section content */}
    </BannerWrapper>
  );
};

// For regular pages
const MyRegularPage: React.FC = () => {
  return (
    <BannerWrapper pagePath="/my-page" className="my-page-class">
      {/* Your page content */}
    </BannerWrapper>
  );
};
```

#### Using Individual Banners

```tsx
import InDevelopmentBanner from '../../components/ui/InDevelopmentBanner';
import ComingSoonBanner from '../../components/ui/ComingSoonBanner';

// Basic usage
<InDevelopmentBanner />

// With custom message
<InDevelopmentBanner message="This feature is being worked on." />

// Without icon
<InDevelopmentBanner showIcon={false} />

// Compact variant
<InDevelopmentBanner className="compact" />
```

### For Administrators

1. **Access Banner Management**
   - Go to Admin Portal
   - Navigate to Settings > Banner Management

2. **Configure In Development Banner**
   - Toggle the banner on/off
   - Set custom message
   - Choose whether to show icon
   - Select target pages using the expandable interface

3. **Configure Coming Soon Banner**
   - Same options as In Development banner
   - Use for planned features

4. **Page Targeting with Categories**
   - **Admin Pages Category**: Pre-configured list of all admin portal sections
     - Click to expand/collapse the category
     - Toggle individual sections on/off
     - Use "Enable All" / "Disable All" for bulk actions
     - Each section shows name, description, and section ID
     - Works with the admin portal's `activeSection` state
   - **Custom Pages**: Add any custom page paths
     - Use the "Add Custom Page" button
     - Enter any page path (e.g., `*` for all pages)
     - Remove custom pages with the trash icon

## Page Targeting Examples

### Admin Portal Sections
- `analytics` - Analytics section only
- `emails` - Email management section only
- `instagram` - Instagram feed section only
- `settings` - Settings section only
- `users` - Role management section only

### Custom Page Paths
- `/admin-portal` - Admin portal page only
- `*` - All pages on the site
- `/dashboard` - Mentor dashboard only

## Styling

### CSS Classes

- `.in-development-banner` - Main container
- `.coming-soon-banner` - Main container
- `.banner-content` - Content wrapper
- `.banner-icon` - Icon container
- `.banner-text` - Text container
- `.banner-title` - Title text
- `.banner-message` - Message text

### Variants

- `.compact` - Smaller, more subtle banner
- `.full-page` - Full-width overlay banner
- `.admin-page` - Admin-specific styling

## Firebase Structure

Banner settings are stored in Firebase at:
```
adminSettings/bannerSettings
```

Structure:
```json
{
  "inDevelopment": {
    "enabled": boolean,
    "message": string,
    "pages": string[],
    "showIcon": boolean
  },
  "comingSoon": {
    "enabled": boolean,
    "message": string,
    "pages": string[],
    "showIcon": boolean
  }
}
```

### Initial Setup

When the banner system is first used:
1. The Firebase document doesn't exist yet
2. The system automatically creates it with default settings
3. A "first time setup" notice is shown to guide administrators
4. Default settings are applied locally even if Firebase is unavailable

## Testing

A test page is available at `/admin/banner-test` that demonstrates:
- All banner variants
- Custom messages
- Different styling options
- Usage instructions

## Implementation Status

### Completed
- ✅ Banner components (InDevelopment, ComingSoon)
- ✅ Banner management interface
- ✅ Firebase integration
- ✅ Admin settings integration
- ✅ Banner wrapper component
- ✅ Context and state management
- ✅ Responsive design
- ✅ Test page

### Integrated Pages
- ✅ AdminAnalytics
- ✅ AdminEmails
- ✅ AdminInstagram
- ✅ AdminBannerTest

### Future Enhancements
- [ ] Banner scheduling (show/hide at specific times)
- [ ] User-specific banner targeting
- [ ] Banner analytics
- [ ] More banner types (maintenance, announcement)
- [ ] Banner templates

## Troubleshooting

### Banners Not Showing
1. Check if banner is enabled in Admin Settings
2. Verify page path is added to target pages
3. Check browser console for errors
4. Ensure BannerProvider is wrapping the app

### Styling Issues
1. Check CSS imports are correct
2. Verify no conflicting styles
3. Test responsive breakpoints

### Firebase Issues
1. Check Firebase connection
2. Verify admin permissions
3. Check console for Firebase errors

## Security

- Banner settings require admin role
- All changes are logged to Firebase
- No sensitive data in banner messages
- Page targeting is validated

## Performance

- Banners are lightweight components
- Firebase real-time updates are efficient
- CSS animations are GPU-accelerated
- Minimal impact on page load times

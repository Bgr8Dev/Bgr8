# Visibility Management System

## Overview

The Visibility Management System allows developers to control which sections, features, and pages are visible to non-developer users. This system works alongside the existing banner system to provide comprehensive control over the user experience.

## Key Features

- ✅ Control visibility of admin portal sections
- ✅ Control visibility of home page features
- ✅ Control visibility of mentor area features
- ✅ Developers always see everything (cannot be hidden from developers)
- ✅ Real-time synchronization with Firebase
- ✅ Simple toggle interface in Admin Settings
- ✅ Optional placeholder messages for hidden sections
- ✅ Category-based bulk actions (show/hide all)

## Architecture

### Components

1. **BannerContext** (`src/contexts/BannerContext.tsx`)
   - Extended to include visibility settings
   - Provides `isVisible(sectionId)` function
   - Provides `updateVisibilitySettings()` function
   - Stores settings in Firebase under `adminSettings/visibilitySettings`

2. **VisibilityManagement** (`src/components/admin/settings/VisibilityManagement.tsx`)
   - Admin UI for managing visibility settings
   - Organized by category (Admin Pages, Home Features, Mentor Area)
   - Toggle individual sections or entire categories
   - Visual indicators for hidden/visible status

3. **VisibilityWrapper** (`src/components/ui/VisibilityWrapper.tsx`)
   - Component wrapper to conditionally render based on visibility
   - Can hide completely or show placeholder message
   - No flicker on load

4. **BannerWrapper** (`src/components/ui/BannerWrapper.tsx`)
   - Enhanced to optionally check visibility
   - Combines banner display with visibility control

### Data Structure

```typescript
interface VisibilitySettings {
  hiddenSections: string[];  // Array of section IDs that are hidden
}
```

## Usage

### Admin Interface

1. Navigate to **Admin Portal > Settings**
2. Click the **"Visibility Control"** tab
3. Use the interface to:
   - Expand/collapse categories
   - Toggle individual sections (eye icon button)
   - Hide/Show All sections in a category
   - Save changes

### Development - Wrapping Components

#### Option 1: Use VisibilityWrapper (Recommended for most cases)

```tsx
import VisibilityWrapper from '../components/ui/VisibilityWrapper';

// Hide completely when not visible
<VisibilityWrapper sectionId="analytics">
  <div className="analytics-section">
    <h2>Analytics Dashboard</h2>
    {/* Your content */}
  </div>
</VisibilityWrapper>

// Show placeholder when hidden
<VisibilityWrapper 
  sectionId="instagram-feed" 
  showPlaceholder={true}
  placeholderMessage="Instagram integration is temporarily unavailable."
>
  <div className="instagram-feed">
    {/* Your content */}
  </div>
</VisibilityWrapper>
```

#### Option 2: Use Enhanced BannerWrapper

```tsx
import BannerWrapper from '../components/ui/BannerWrapper';

// Combine banner display with visibility control
<BannerWrapper 
  sectionId="analytics"
  checkVisibility={true}
  showPlaceholder={false}
>
  <div className="analytics-section">
    {/* Your content */}
  </div>
</BannerWrapper>
```

#### Option 3: Use the Hook Directly

```tsx
import { useBanner } from '../contexts/BannerContext';

function MyComponent() {
  const { isVisible } = useBanner();
  
  if (!isVisible('my-section')) {
    return null;
  }
  
  return <div>{/* Your content */}</div>;
}
```

## Section IDs Reference

### Admin Pages
- `analytics` - Analytics Dashboard
- `emails` - Email Management
- `instagram` - Instagram Feed Management
- `announcements` - Announcements Management
- `enquiries` - User Enquiries
- `verification` - Mentor Verification
- `testing-feedback` - Testing & Feedback
- `settings` - System Settings
- `users` - Role Management
- `mentors` - Mentor Management
- `feedback` - Feedback Analytics
- `sessions` - Sessions Management
- `ambassadors` - Ambassador Applications
- `banner-test` - Banner Test Page

### Home Features
- `hero-section` - Main hero section
- `donation-form` - Donation widget
- `instagram-feed` - Instagram feed display
- `testimonials` - User testimonials
- `features-grid` - Features showcase
- `newsletter-signup` - Newsletter subscription
- `cta-buttons` - Call-to-action buttons
- `footer` - Site footer
- `announcements` - Site-wide announcements

### Mentor Area Features
- `mentor-dashboard` - Main dashboard
- `profile-editor` - Profile editing
- `session-scheduler` - Session scheduling
- `mentee-list` - Mentee management
- `resources-library` - Educational resources
- `video-calls` - Video conferencing
- `feedback-forms` - Feedback collection
- `progress-tracking` - Progress tracking
- `messaging` - Messaging system
- `session-booking` - Session booking
- `calcom-integration` - Calendar integration
- `settings` - Mentor settings
- `help-support` - Help & support
- `achievements` - Achievements & badges

## Implementation Examples

### Example 1: Admin Portal Section

```tsx
// In AdminPortal.tsx or similar
import VisibilityWrapper from '../components/ui/VisibilityWrapper';

function AdminPortal() {
  return (
    <div className="admin-portal">
      <VisibilityWrapper sectionId="analytics">
        <AnalyticsSection />
      </VisibilityWrapper>
      
      <VisibilityWrapper sectionId="emails">
        <EmailManagementSection />
      </VisibilityWrapper>
      
      <VisibilityWrapper sectionId="verification">
        <MentorVerificationSection />
      </VisibilityWrapper>
    </div>
  );
}
```

### Example 2: Home Page Features

```tsx
// In LandingPage.tsx
import VisibilityWrapper from '../components/ui/VisibilityWrapper';

function LandingPage() {
  return (
    <>
      <VisibilityWrapper sectionId="hero-section">
        <HeroSection />
      </VisibilityWrapper>
      
      <VisibilityWrapper 
        sectionId="instagram-feed"
        showPlaceholder={true}
        placeholderMessage="Instagram content will be available soon!"
      >
        <InstagramFeed />
      </VisibilityWrapper>
      
      <VisibilityWrapper sectionId="testimonials">
        <TestimonialsSection />
      </VisibilityWrapper>
    </>
  );
}
```

### Example 3: Conditional Navigation Links

```tsx
import { useBanner } from '../contexts/BannerContext';

function NavigationMenu() {
  const { isVisible } = useBanner();
  
  return (
    <nav>
      {isVisible('analytics') && (
        <NavLink to="/admin/analytics">Analytics</NavLink>
      )}
      
      {isVisible('emails') && (
        <NavLink to="/admin/emails">Email Management</NavLink>
      )}
      
      {isVisible('verification') && (
        <NavLink to="/admin/verification">Verification</NavLink>
      )}
    </nav>
  );
}
```

## Important Notes

### Developer Privilege
**Developers always see all sections**, regardless of visibility settings. This ensures developers can:
- Test features
- Configure settings
- Debug issues
- Access all functionality

To check if a user is a developer, the system uses:
```typescript
hasRole(userProfile, 'developer')
```

### Performance Considerations
- Visibility settings are loaded once on mount and synced via Firebase listeners
- No flicker on load - content shows while loading
- Real-time updates propagate to all users automatically

### Firebase Structure
```
adminSettings/
  └── visibilitySettings/
      └── hiddenSections: string[]
```

### Best Practices

1. **Use Descriptive Section IDs**: Match the section IDs defined in VisibilityManagement.tsx
2. **Consider UX**: Use placeholders for temporary hiding, complete hiding for permanent removals
3. **Test as Non-Developer**: Always test visibility changes with a non-developer account
4. **Bulk Operations**: Use category-level "Hide All" / "Show All" for efficiency
5. **Documentation**: Document custom section IDs if you add new ones

## Adding New Sections

To add a new section to the visibility system:

1. **Add to VisibilityManagement.tsx**:
   ```tsx
   const ADMIN_PAGES = [
     // ... existing pages
     { 
       sectionId: 'my-new-section', 
       name: 'My New Section', 
       icon: <FaIcon />, 
       description: 'Description of the section' 
     }
   ];
   ```

2. **Wrap your component**:
   ```tsx
   <VisibilityWrapper sectionId="my-new-section">
     <MyNewComponent />
   </VisibilityWrapper>
   ```

3. **Update this documentation** with the new section ID

## Troubleshooting

### Section not hiding
- Verify the sectionId matches exactly (case-sensitive)
- Check if you're logged in as a developer
- Clear browser cache and reload

### Changes not saving
- Check Firebase console for permissions
- Verify network connectivity
- Check browser console for errors

### Section hidden but still visible
- You're likely logged in as a developer
- Test with a non-developer account

## Related Systems

- **Banner System**: Display development/coming soon banners
- **Page Permissions**: Control page-level access
- **Role Management**: Control user roles and permissions

## Future Enhancements

Potential improvements to the visibility system:
- [ ] Time-based visibility (show/hide on schedule)
- [ ] Role-based visibility (different visibility for different roles)
- [ ] A/B testing integration
- [ ] Visibility history/audit log
- [ ] Bulk import/export of visibility settings

## Support

For questions or issues with the visibility system:
1. Check this documentation
2. Review example implementations in `src/examples/VisibilityWrapperExample.tsx`
3. Contact the development team


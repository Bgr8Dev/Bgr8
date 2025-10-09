# Visibility System - Quick Reference Card

## 🚀 Quick Start

### Admin Access
```
Admin Portal → Settings → Visibility Control tab
```

### Basic Wrapper Usage
```tsx
import VisibilityWrapper from '../components/ui/VisibilityWrapper';

<VisibilityWrapper sectionId="analytics">
  <YourComponent />
</VisibilityWrapper>
```

## 📋 Common Tasks

### Hide a Section
1. Go to Admin Settings > Visibility Control
2. Find the section in the appropriate category
3. Click the eye icon to toggle visibility
4. Click "Save Visibility Settings"

### Show a Placeholder Instead of Hiding
```tsx
<VisibilityWrapper 
  sectionId="feature-name"
  showPlaceholder={true}
  placeholderMessage="Coming soon!"
>
  <YourFeature />
</VisibilityWrapper>
```

### Hide/Show Entire Category
1. Open category in Visibility Control
2. Click "Hide All" or "Show All" button
3. Save changes

### Check Visibility Programmatically
```tsx
import { useBanner } from '../contexts/BannerContext';

function MyComponent() {
  const { isVisible } = useBanner();
  
  if (!isVisible('section-id')) return null;
  return <div>Content</div>;
}
```

## 🎯 Section IDs Cheat Sheet

### Admin Pages
```
analytics | emails | instagram | announcements | enquiries
verification | testing-feedback | settings | users | mentors
feedback | sessions | ambassadors | banner-test
```

### Home Features
```
hero-section | donation-form | instagram-feed | testimonials
features-grid | newsletter-signup | cta-buttons | footer
announcements
```

### Mentor Area
```
mentor-dashboard | profile-editor | session-scheduler | mentee-list
resources-library | video-calls | feedback-forms | progress-tracking
messaging | session-booking | calcom-integration | settings
help-support | achievements
```

## 🔑 Key Concepts

| Concept | Description |
|---------|-------------|
| **Hidden Sections** | Sections in the `hiddenSections` array are not visible |
| **Developer Privilege** | Developers ALWAYS see everything |
| **Real-time Sync** | Changes propagate via Firebase instantly |
| **No Flicker** | Content shows while loading |

## 💡 Common Patterns

### Pattern 1: Simple Hide
```tsx
<VisibilityWrapper sectionId="my-section">
  <MySection />
</VisibilityWrapper>
```

### Pattern 2: Hide with Placeholder
```tsx
<VisibilityWrapper 
  sectionId="my-section"
  showPlaceholder={true}
  placeholderMessage="Available soon"
>
  <MySection />
</VisibilityWrapper>
```

### Pattern 3: Conditional Navigation
```tsx
const { isVisible } = useBanner();

return (
  <nav>
    {isVisible('analytics') && <Link to="/analytics">Analytics</Link>}
    {isVisible('emails') && <Link to="/emails">Emails</Link>}
  </nav>
);
```

### Pattern 4: Combined Banner + Visibility
```tsx
<BannerWrapper 
  sectionId="analytics"
  checkVisibility={true}
>
  <AnalyticsSection />
</BannerWrapper>
```

## ⚠️ Important Notes

- ✅ Developers **always** see all sections
- ✅ Changes save to Firebase immediately
- ✅ Test with non-developer accounts
- ✅ Section IDs are **case-sensitive**
- ✅ Use descriptive placeholder messages

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Section not hiding | Check you're not logged in as developer |
| Changes not saving | Check Firebase permissions & console |
| Section still visible | Verify exact sectionId match (case-sensitive) |
| Flicker on load | This shouldn't happen - check console for errors |

## 📚 Full Documentation

- **Complete Guide**: `docs/VISIBILITY_SYSTEM.md`
- **Implementation Details**: `docs/VISIBILITY_IMPLEMENTATION_SUMMARY.md`
- **Code Examples**: `src/examples/VisibilityWrapperExample.tsx`

## 🔗 Related Systems

- **Banner System**: Show development/coming soon banners
- **Page Permissions**: Control page-level access
- **Role Management**: Manage user roles

## 📞 Need Help?

1. Check `docs/VISIBILITY_SYSTEM.md`
2. Review examples in `src/examples/VisibilityWrapperExample.tsx`
3. Contact development team

---

**Version**: 1.0  
**Last Updated**: October 9, 2025


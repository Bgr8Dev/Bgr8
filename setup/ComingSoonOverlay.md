# Coming Soon Overlay Feature

This document provides instructions on how to use the "Coming Soon" overlay feature that has been added to the B8 application. This feature allows administrators to place a "Coming Soon" banner across business pages to indicate that they are still under development, while still allowing users to access and explore the pages.

## Overview

The "Coming Soon" overlay feature includes:

1. **Administrative Controls**: In the Admin Settings panel, administrators can toggle which business pages should display the "Coming Soon" overlay.
2. **Visual Indication**: Pages marked as "Coming Soon" will display a prominent banner at the top of the page.
3. **Accessibility Preservation**: Unlike the business accessibility settings, this feature does not restrict access to the pages - it simply provides a visual indication that content is still being developed.

## Implementation Status

The ComingSoonOverlay has been successfully implemented on all business pages:

- B8Marketing (`marketing`)
- B8CarClub (`carClub`)
- B8Clothing (`clothing`)
- B8League (`league`)
- B8World (`world`)
- Bgr8r (`bgr8r`)
- B8Careers (`careers`)
- BGr8 (`bgr8`)

Administrators can now control the overlay display for each business page through the Admin Settings panel.

## Implementation Guide for Developers

### Step 1: Import the ComingSoonOverlay Component

Add the following import to your business page component:

```tsx
import { ComingSoonOverlay } from '../components/ComingSoonOverlay';
```

### Step 2: Wrap Your Page Content

Wrap your entire page content with the ComingSoonOverlay component and pass the appropriate businessId:

```tsx
<ComingSoonOverlay businessId="businessName">
  {/* Your existing page content */}
</ComingSoonOverlay>
```

Replace `"businessName"` with the correct identifier for your business page:

- "marketing" for B8 Marketing
- "carClub" for B8 Car Club
- "clothing" for B8 Clothing
- "league" for B8 League
- "world" for B8 World
- "bgr8r" for Bgr8r
- "careers" for B8 Careers
- "bgr8" for BGr8

### Example Implementation

```tsx
import React from 'react';
import { ComingSoonOverlay } from '../components/ComingSoonOverlay';

export function MarketingPage() {
  return (
    <ComingSoonOverlay businessId="marketing">
      <div className="marketing-page">
        <h1>B8 Marketing</h1>
        {/* Rest of your marketing page content */}
      </div>
    </ComingSoonOverlay>
  );
}
```

## How It Works

The implementation utilizes the BusinessAccessContext to determine whether a specific business page should display the "Coming Soon" overlay:

1. The `ComingSoonOverlay` component checks the business ID against the settings in the BusinessAccessContext.
2. If the business is marked as "grayed out" in the admin settings, the overlay is displayed.
3. The overlay is positioned at the top of the page with a slight rotation to make it stand out.
4. The content of the page remains fully accessible and functional beneath the overlay.

## Administrative Settings

Administrators can control the "Coming Soon" overlay through the Admin Settings page:

1. Navigate to the Admin Portal
2. Go to the "Settings" tab
3. Find the "Coming Soon Page Overlay" section
4. Toggle the switches for each business to control the overlay display

## Comparison with Other Features

| Feature | Purpose | Effect on Access |
|---------|---------|-----------------|
| Business Accessibility | Control access to business sections | Prevents users from accessing private pages |
| Coming Soon (Homepage) | Indicate which businesses are launching soon | Adds overlay to homepage cards only |
| Coming Soon Overlay | Indicate pages under development | Adds banner to business pages without restricting access |

## Technical Details

- The overlay is styled using CSS animations for a subtle pulsing effect
- Responsive design ensures the overlay displays correctly on all device sizes
- The implementation uses React's context API for efficient state management
- Settings are stored in Firestore under the "grayedOut" document in the "settings" collection 
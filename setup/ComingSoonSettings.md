# Managing "Coming Soon" Banners on Homepage

This document provides instructions on how to manage which businesses display a "Coming Soon" banner on the homepage.

## Overview

The B8 platform now allows administrators to control which business sections show a "Coming Soon" banner on the homepage. This feature is separate from the business accessibility settings, allowing you to:

1. Make a business accessible via the navigation menu but show it as "Coming Soon" on the homepage
2. Hide the "Coming Soon" banner when a business is ready to be fully announced

## How to Configure "Coming Soon" Status

1. **Access the Admin Settings**
   - Log in with an admin account
   - Navigate to the Admin Portal
   - Click on "Settings" in the sidebar

2. **Manage Coming Soon Status**
   - In the Admin Settings page, find the "Coming Soon Status" section
   - For each business, toggle the switch:
     - **ON (Green)**: Business will appear normally on the homepage without a "Coming Soon" banner
     - **OFF (Red)**: Business will display a "Coming Soon" banner overlay on the homepage

3. **Save Your Changes**
   - After making your selections, click the "Save Settings" button at the bottom of the section
   - The changes will be applied immediately to the homepage

## Important Notes

- The "Coming Soon" banner only affects how businesses appear on the homepage
- Users can still access business pages through the navigation menu if they are set as accessible
- Admins and developers can always access all business sections regardless of accessibility settings
- The default state for most businesses is "Coming Soon" until explicitly marked as ready

## Technical Implementation

The "Coming Soon" status is stored in Firestore:
- Collection: `settings`
- Document: `comingSoon`
- Structure: A map of business IDs to boolean values (true = coming soon, false = ready)

Example structure:
```json
{
  "marketing": false,
  "carClub": true,
  "clothing": true, 
  "league": true,
  "world": true,
  "education": true,
  "careers": true,
  "bgr8": true
}
```

## Troubleshooting

If changes are not appearing:
1. Verify you clicked the "Save Settings" button
2. Try refreshing the homepage
3. Check the browser console for any errors
4. Verify the Firestore document was updated correctly 
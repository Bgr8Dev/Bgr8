# Instagram Feed Management

This document explains how to set up and manage the Instagram feed feature through the admin portal.

## Overview

The Instagram feed system allows administrators to manage Instagram posts and profile information through a dedicated admin interface. Instead of relying on the Instagram API (which has CSP restrictions), the system uses Firestore and Firebase Storage to manage content.

## Features

- **Post Management**: Create, edit, delete, and reorder Instagram posts
- **Image Upload**: Upload images to Firebase Storage with automatic URL generation
- **Profile Management**: Configure Instagram profile information (username, account type, etc.)
- **Active/Inactive Toggle**: Control which posts are displayed on the public feed
- **Role-based Access**: Different admin roles can manage the Instagram feed

## Setup Instructions

### 1. Access the Admin Portal

1. Log in with an admin account
2. Navigate to the Admin Portal
3. Look for the "Instagram" section in the navigation menu

### 2. Configure User Profile

1. Click "Setup Profile" or "Edit Profile" in the Instagram Profile section
2. Fill in the required information:
   - **Username**: Instagram username (without @)
   - **Account Type**: Business or Personal
   - **Media Count**: Total number of posts
   - **Active**: Whether the profile should be displayed
3. Click "Save Profile"

### 3. Add Instagram Posts

1. Click "Add Post" in the Instagram Posts section
2. Fill in the post details:
   - **Media Type**: Image, Video, or Album
   - **Image Upload**: Select an image file (max 5MB)
   - **Caption**: Post caption/description
   - **Instagram URL**: Link to the original Instagram post
   - **Order**: Display order (lower numbers appear first)
   - **Active**: Whether the post should be displayed
3. Click "Create Post"

### 4. Manage Existing Posts

- **Edit**: Click the edit button to modify post details
- **Toggle Status**: Click the eye icon to show/hide posts
- **Delete**: Click the trash icon to remove posts permanently

## File Structure

```
src/
├── services/
│   ├── instagramService.ts          # Public Instagram service (used by components)
│   └── instagramAdminService.ts     # Admin Instagram service (CRUD operations)
├── pages/adminPages/
│   └── AdminInstagram.tsx           # Instagram admin interface
├── components/social/
│   ├── InstagramFeed.tsx            # Public Instagram feed component
│   └── InstagramFeed.css            # Feed styling
└── styles/adminStyles/
    └── AdminInstagram.css           # Admin interface styling
```

## Database Collections

### Firestore Collections

- **instagramPosts**: Stores Instagram post data
  - `id`: Document ID
  - `media_type`: IMAGE, VIDEO, or CAROUSEL_ALBUM
  - `media_url`: URL to the uploaded image
  - `caption`: Post caption
  - `permalink`: Instagram post URL
  - `timestamp`: Post creation date
  - `thumbnail_url`: Thumbnail image URL
  - `isActive`: Whether post is displayed
  - `order`: Display order
  - `createdAt`: Record creation date
  - `updatedAt`: Last update date

- **instagramUsers**: Stores Instagram profile data
  - `id`: Document ID
  - `username`: Instagram username
  - `account_type`: BUSINESS or PERSONAL
  - `media_count`: Total number of posts
  - `isActive`: Whether profile is displayed
  - `createdAt`: Record creation date
  - `updatedAt`: Last update date

### Firebase Storage

- **instagram/**: Contains uploaded Instagram images
  - Files are automatically named with timestamps
  - 5MB size limit per image
  - Supports common image formats (JPEG, PNG, WebP, etc.)

## Security Rules

### Firestore Rules

- **Read Access**: Public can read active posts and profiles
- **Write Access**: Admin, Committee, Marketing, and Social Media roles can manage content

### Storage Rules

- **Upload**: Admin users can upload images (5MB limit)
- **Read**: Public read access to uploaded images

## Permissions

The following roles can access the Instagram admin:

- **admin**: Full access to all features
- **committee**: Full access to all features
- **marketing**: Full access to all features
- **social-media**: Full access to all features

## Troubleshooting

### Common Issues

1. **Images not uploading**: Check file size (must be under 5MB) and format
2. **Posts not displaying**: Ensure posts are marked as "Active"
3. **Permission denied**: Verify user has appropriate role (admin, committee, marketing, or social-media)
4. **Storage errors**: Check Firebase Storage rules and quota limits

### Fallback Behavior

If Firestore is unavailable, the system will display fallback mock data to prevent the feed from breaking.

## Migration from Mock Data

The system automatically migrated from hardcoded mock data to Firestore-based data. Existing Instagram feeds will continue to work while you populate the admin portal with real content.

## Best Practices

1. **Image Optimization**: Compress images before upload for better performance
2. **Consistent Ordering**: Use sequential order numbers for predictable display
3. **Regular Updates**: Keep the feed fresh with new content
4. **Quality Control**: Review posts before making them active
5. **Backup**: Regular exports of Firestore data for content backup
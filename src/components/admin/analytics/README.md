# Analytics Dashboard - Component Documentation

This folder contains the analytics dashboard components for the admin portal.

## Components

### AnalyticsOverview.tsx
Main overview displaying key metrics with time range filtering.

**Available Metrics:**
- Total Users - Count of all registered users
- Active Users - Users who logged in within the selected time range
- Bookings - Bookings created within the selected time range  
- Profile Views - Mentor profile views within the selected time range

**Time Range Controls:**
- Preset buttons: 24h, 7d, 30d, 90d, 1y
- Slider: 1-365 days range
- DateTime inputs: Custom start/end date selection

### QueryTerminal.tsx
Native JavaScript/Firestore query execution terminal.

### DataExplorer.tsx
Visual collection/document browser with tree view.

### ReportsPanel.tsx
Query history, data exports (JSON/CSV), and session statistics.

---

## Metrics Not Yet Implemented

The following metrics require additional data collection infrastructure. See `ANALYTICS_IMPLEMENTATION.md` in the project root for detailed setup instructions.

### 1. Session Duration
- **Required:** Session tracking with login/logout timestamps
- **Collection needed:** `sessions` with `sessionStart`, `sessionEnd` fields

### 2. Page Views / Navigation Analytics
- **Required:** Client-side page view tracking
- **Collection needed:** `pageViews` with `userId`, `pagePath`, `duration`, `timestamp`

### 3. User Locations
- **Required:** Location data collection
- **Options:** 
  - User profile fields (city, country)
  - IP geolocation API integration

### 4. Active Sessions (Real-time)
- **Required:** Firebase Realtime Database presence tracking
- **Implementation:** Use `onDisconnect()` for real-time status

---

## Data Requirements

For metrics to work correctly, ensure your collections have:

### users collection
```typescript
{
  // ... existing fields
  lastLogin: Timestamp  // Required for "Active Users"
}
```

### bookings collection
```typescript
{
  // ... existing fields
  createdAt: Timestamp  // Required for time-filtered bookings
}
```

### profileViews collection (optional)
```typescript
{
  mentorId: string
  viewerId: string
  timestamp: Timestamp
}
```

---

## Styling

CSS file: `src/styles/adminStyles/AnalyticsOverview.css`

The component uses dark mode styling with:
- Transparent/rgba backgrounds
- Light text colors (#fff, rgba(255,255,255,x))
- Gradient accents for active states
- Consistent with admin portal theme

---

## Usage

```tsx
import AnalyticsOverview from '../components/admin/analytics/AnalyticsOverview';

<AnalyticsOverview queryHistory={queryHistory} />
```

The component automatically fetches data when:
- Component mounts
- Time range changes (slider, preset, or datetime inputs)
- Refresh button is clicked

# Analytics Dashboard - Missing Features

## Currently Implemented
- Total Users (cumulative count)
- Active Users (by login timestamp)
- Bookings/Sessions
- Profile Views (per user filtering available)

---

## Missing Features & Required Data

### 1. Navigation Analytics
**What:** Track page visits and user navigation patterns

**Required:**
```typescript
// Collection: pageViews
{
  userId: string
  pagePath: string          // e.g., '/mentor/profile/123'
  previousPage?: string
  timestamp: Timestamp
  sessionId: string
}
```

---

### 2. Time Spent on Each Page
**What:** Measure engagement per page

**Required:**
```typescript
// Collection: pageViews (extended)
{
  // ... existing fields
  duration: number          // Milliseconds
  exitPage: boolean
}
```

---

### 3. Sign-Up Journey Drop-Off Points
**What:** Track where users abandon registration

**Required:**
```typescript
// Collection: signupEvents
{
  userId?: string
  sessionId: string
  step: 'start' | 'email' | 'password' | 'profile' | 'complete'
  timestamp: Timestamp
  metadata?: object
}
```

---

### 4. Time Users Spend Logged In
**What:** Session duration tracking

**Required:**
```typescript
// Collection: userSessions
{
  userId: string
  sessionStart: Timestamp
  sessionEnd: Timestamp
  duration: number          // Milliseconds
  pages: string[]
}
```

**Implementation:** Track login/logout, use Firebase Realtime Database presence for live tracking

---

### 5. Daily Active Users (DAU)
**Status:** Partially implemented via Active Users metric

**Enhancement Needed:**
- Pre-aggregate daily counts for faster queries
- MAU (Monthly Active Users)
- DAU/MAU ratio

---

### 6. General Location of Users
**What:** Geographic distribution

**Options:**

**Option 1 - Profile-based (manual):**
```typescript
// users collection
{
  location?: {
    city?: string
    country: string
  }
}
```

**Option 2 - IP Geolocation (automatic):**
```typescript
// Collection: userLocations
{
  userId: string
  ipAddress: string         // Hashed for privacy
  country: string
  city?: string
  timestamp: Timestamp
}
```

---

### 7. Bounce Rate
**What:** Percentage of single-page sessions

**Required:** Derive from pageViews (sessions with 1 page / total sessions)

---

### 8. Traffic Channels
**What:** How users arrive (organic, direct, referral, social)

**Required:**
```typescript
// Collection: sessionSources
{
  sessionId: string
  source: 'organic' | 'direct' | 'referral' | 'social' | 'email'
  referrer?: string
  campaign?: string         // UTM parameters
  medium?: string
  timestamp: Timestamp
}
```

**Implementation:** Track document.referrer and UTM parameters

---

## Implementation Notes

- All tracking must respect GDPR/privacy laws
- Consider Firebase Analytics SDK or Google Analytics 4 for quick implementation
- Client-side tracking via React hooks/context
- Store raw events, aggregate in queries

# Cal.com Firebase Functions (Option A)

This document defines the Firebase Cloud Functions endpoints and auth model
for a future serverless implementation of the Cal.com proxy.

## Auth Model
- All functions require a valid Firebase ID token (Authorization: Bearer <token>).
- The function resolves the caller UID from the token.
- If a request includes `mentorUid` that differs from the caller UID, the
  function must verify the caller has `roles.admin === true` in `users/{uid}`.

## Functions
### tokensStore
- Method: POST
- Body: `{ apiKey: string, calComUsername: string }`
- Action: Store or update token in `calcomTokensSecure/{uid}`.

### tokensStatus
- Method: GET
- Query: `mentorUid`
- Response: `{ connected: boolean, calComUsername?: string }`

### tokensDelete
- Method: DELETE
- Body: `{ mentorUid?: string }`
- Action: Remove token document from `calcomTokensSecure/{uid}`.

### calcomEventTypes
- Method: POST
- Body: `{ mentorUid?: string }`
- Action: Call Cal.com `GET /event-types` with stored token.

### calcomBookingsList
- Method: POST
- Body: `{ mentorUid?: string, startTime?: string, endTime?: string }`
- Action: Call Cal.com `GET /bookings` with date range.

### calcomBookingsCreate
- Method: POST
- Body: `{ mentorUid?: string, bookingRequest: CalComBookingRequest }`
- Action: Call Cal.com `POST /bookings`.

### calcomBookingsCancel
- Method: POST
- Body: `{ mentorUid?: string, bookingId: string, reason?: string }`
- Action: Call Cal.com `DELETE /bookings/:bookingId`.

### calcomAvailability
- Method: POST
- Body: `{ mentorUid?: string, dateFrom: string, dateTo: string, eventTypeId?: number }`
- Action: Call Cal.com `GET /availability`.

### calcomSchedules
- Method: POST
- Body: `{ mentorUid?: string }`
- Action: Call Cal.com `GET /schedules`.

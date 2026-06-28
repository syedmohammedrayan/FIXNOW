# FixNow — API Reference

## Base URL

```
Production: https://your-backend.onrender.com
Local:      http://localhost:5000
```

## Authentication

All API requests that modify data require a valid Firebase Auth token. The frontend automatically attaches the token via Firebase SDK.

---

## User APIs

### `GET /api/users/:uid`
Get user profile by Firebase UID.

**Response:**
```json
{
  "success": true,
  "user": {
    "uid": "abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "phone": "+91-9876543210",
    "avatar": "https://..."
  }
}
```

### `POST /api/users/signup`
Register a new user (customer or technician).

### `GET /api/users/techs/all`
List all approved technicians. Used by admin dashboard.

### `GET /api/users/techs/pending`
List technicians awaiting approval.

### `POST /api/users/techs/verify-action`
Approve or decline a technician application.

**Body:**
```json
{ "id": "tech-uid", "action": "approve" | "decline", "reason": "optional" }
```

### `DELETE /api/users/:uid`
Delete a user account permanently.

---

## Booking APIs

### `POST /api/bookings/create`
Create a new service booking.

### `GET /api/bookings/transactions/all`
List all payment transactions. Used by admin dashboard.

### `GET /api/bookings/notifications/logs`
List all notification logs.

---

## AI APIs

### `POST /api/ai/diagnose`
Run AI diagnosis on customer issue.

**Body:**
```json
{
  "issueText": "My AC is blowing warm air",
  "imageUrl": "optional-base64-or-url",
  "userId": "customer-uid"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "category": "HVAC / AC Technician",
    "urgency": "High",
    "estimatedCostRange": "500-1500",
    "recommendedMaterials": ["Refrigerant", "Capacitor"],
    "confidence": 0.94,
    "reasoning": "Based on symptom analysis..."
  }
}
```

### `POST /api/ai/technician-match`
Find nearby technicians matching the diagnosis category.

---

## Tools & Materials APIs

### `GET /api/tools/orders`
List all tool/material requisitions.

### `POST /api/tools/orders/:orderId/update`
Update order status (Approved, Shipped, Delivered).

### `POST /api/tools/orders/:orderId/verify-payment`
Verify payment for a tool order.

---

## WebSocket Events (Socket.IO)

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `broadcast_booking` | `{ bookingId, category, location }` | Broadcast booking to nearby technicians |
| `cancel_broadcast` | `{ bookingId }` | Cancel an active broadcast |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `booking_accepted` | `{ bookingId, technicianId, technician }` | Technician accepted the booking |
| `broadcast_expired` | `{ bookingId }` | No technician accepted in time |
| `booking_update` | `{ bookingId, status }` | Real-time booking status change |

# API Reference

## Overview

Project Firefly uses Next.js API routes for server-side operations. All endpoints require authentication unless marked as public. Authentication is handled via Supabase Auth, with JWT tokens passed in the `Authorization` header.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication

All authenticated requests must include:

```
Authorization: Bearer <supabase-jwt-token>
```

Tokens are obtained via Supabase Auth (login, magic link, OAuth).

---

## Public Endpoints

### Vendors

#### List Vendors
```
GET /api/vendors
```

Returns list of active vendors.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search by name |
| lat | number | Latitude for distance sorting |
| lng | number | Longitude for distance sorting |

**Response:**
```json
{
  "vendors": [
    {
      "id": "uuid",
      "name": "Joe's Burgers",
      "description": "Best burgers in town",
      "address": "123 Main St",
      "operating_hours": {...},
      "is_open": true,
      "distance_km": 1.2
    }
  ]
}
```

#### Get Vendor
```
GET /api/vendors/[id]
```

Returns vendor details with full menu.

**Response:**
```json
{
  "vendor": {
    "id": "uuid",
    "name": "Joe's Burgers",
    "description": "Best burgers in town",
    "address": "123 Main St",
    "operating_hours": {...},
    "is_open": true
  },
  "menu": [
    {
      "id": "uuid",
      "name": "Classic Burger",
      "description": "Beef patty with lettuce, tomato, onion",
      "price": 1200,
      "image_url": "https://...",
      "category": "Burgers",
      "is_available": true
    }
  ]
}
```

---

## Customer Endpoints

### Orders

#### Place Order
```
POST /api/orders
```

Creates a new order.

**Request Body:**
```json
{
  "vendor_id": "uuid",
  "items": [
    { "menu_item_id": "uuid", "quantity": 2 },
    { "menu_item_id": "uuid", "quantity": 1 }
  ],
  "delivery_address": "456 Oak Ave, Apt 2B",
  "delivery_location": { "lat": 40.7128, "lng": -74.006 },
  "notes": "Please ring doorbell"
}
```

**Response:**
```json
{
  "order": {
    "id": "uuid",
    "status": "placed",
    "items": [...],
    "subtotal": 2800,
    "delivery_fee": 300,
    "total": 3100,
    "created_at": "2024-01-15T12:00:00Z"
  }
}
```

**Errors:**
- `400` - Invalid items or vendor not accepting orders
- `401` - Not authenticated

#### List Orders
```
GET /api/orders
```

Returns customer's order history.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| limit | number | Results per page (default 20) |
| offset | number | Pagination offset |

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "vendor": { "id": "uuid", "name": "Joe's Burgers" },
      "status": "delivered",
      "total": 3100,
      "created_at": "2024-01-15T12:00:00Z"
    }
  ],
  "total": 42
}
```

#### Get Order
```
GET /api/orders/[id]
```

Returns full order details including status history.

**Response:**
```json
{
  "order": {
    "id": "uuid",
    "vendor": { "id": "uuid", "name": "Joe's Burgers" },
    "status": "preparing",
    "items": [...],
    "subtotal": 2800,
    "delivery_fee": 300,
    "total": 3100,
    "delivery_address": "456 Oak Ave, Apt 2B",
    "notes": "Please ring doorbell",
    "delivery_person": {
      "id": "uuid",
      "name": "Alex",
      "phone": "+1234567890"
    },
    "created_at": "2024-01-15T12:00:00Z",
    "status_history": [
      { "status": "placed", "timestamp": "2024-01-15T12:00:00Z" },
      { "status": "accepted", "timestamp": "2024-01-15T12:02:00Z" },
      { "status": "preparing", "timestamp": "2024-01-15T12:05:00Z" }
    ]
  }
}
```

---

## Vendor Endpoints

### Shop Management

#### Get Vendor Profile
```
GET /api/vendor/profile
```

Returns current user's vendor profile.

#### Update Vendor Profile
```
PATCH /api/vendor/profile
```

**Request Body:**
```json
{
  "name": "Joe's Burgers",
  "description": "Updated description",
  "address": "123 Main St",
  "operating_hours": {...},
  "is_active": true,
  "auto_accept_delivery": false
}
```

### Menu Management

#### List Menu Items
```
GET /api/vendor/menu
```

Returns all menu items for vendor.

#### Create Menu Item
```
POST /api/vendor/menu
```

**Request Body:**
```json
{
  "name": "New Burger",
  "description": "Delicious new creation",
  "price": 1500,
  "image_url": "https://...",
  "category": "Burgers",
  "is_available": true
}
```

#### Update Menu Item
```
PATCH /api/vendor/menu/[id]
```

**Request Body:**
```json
{
  "price": 1600,
  "is_available": false
}
```

#### Delete Menu Item
```
DELETE /api/vendor/menu/[id]
```

### Order Management

#### List Incoming Orders
```
GET /api/vendor/orders
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| from | datetime | Start date |
| to | datetime | End date |

#### Update Order Status
```
PATCH /api/vendor/orders/[id]
```

**Request Body:**
```json
{
  "status": "preparing"
}
```

**Valid transitions:**
- `placed` → `accepted` or `cancelled`
- `accepted` → `preparing` or `cancelled`
- `preparing` → `ready`

### Delivery Management

#### List Delivery Registrations
```
GET /api/vendor/delivery-registrations
```

Returns delivery persons registered with this vendor.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (pending/approved/rejected) |

**Response:**
```json
{
  "registrations": [
    {
      "id": "uuid",
      "delivery_person": {
        "id": "uuid",
        "name": "Alex",
        "phone": "+1234567890",
        "vehicle_type": "bike"
      },
      "status": "pending",
      "timeslots": [
        { "day": "mon", "start": "11:00", "end": "14:00" }
      ],
      "created_at": "2024-01-10T10:00:00Z"
    }
  ]
}
```

#### Update Registration Status
```
PATCH /api/vendor/delivery-registrations/[id]
```

**Request Body:**
```json
{
  "status": "approved"
}
```

---

## Delivery Endpoints

### Profile

#### Register as Delivery Person
```
POST /api/delivery/register
```

Creates delivery person profile for current user.

**Request Body:**
```json
{
  "vehicle_type": "bike"
}
```

#### Update Profile
```
PATCH /api/delivery/profile
```

**Request Body:**
```json
{
  "vehicle_type": "scooter",
  "is_active": true
}
```

#### Update Location
```
POST /api/delivery/location
```

Updates current location (for distance-based assignments).

**Request Body:**
```json
{
  "lat": 40.7128,
  "lng": -74.006
}
```

### Availability

#### Register with Vendor
```
POST /api/delivery/availability
```

Registers availability with a vendor.

**Request Body:**
```json
{
  "vendor_id": "uuid",
  "timeslots": [
    { "day": "mon", "start": "11:00", "end": "14:00" },
    { "day": "mon", "start": "18:00", "end": "21:00" },
    { "day": "tue", "start": "11:00", "end": "14:00" }
  ]
}
```

#### Update Availability
```
PATCH /api/delivery/availability/[registration_id]
```

**Request Body:**
```json
{
  "timeslots": [...]
}
```

#### Remove Registration
```
DELETE /api/delivery/availability/[registration_id]
```

#### List Registrations
```
GET /api/delivery/availability
```

Returns all vendor registrations for current delivery person.

### Assignments

#### List Assignments
```
GET /api/delivery/assignments
```

Returns current and recent assignments.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |

**Response:**
```json
{
  "assignments": [
    {
      "id": "uuid",
      "order": {
        "id": "uuid",
        "vendor": { "name": "Joe's Burgers", "address": "123 Main St" },
        "delivery_address": "456 Oak Ave",
        "items_count": 3,
        "total": 3100
      },
      "status": "offered",
      "offered_at": "2024-01-15T12:30:00Z",
      "expires_at": "2024-01-15T12:32:00Z"
    }
  ]
}
```

#### Respond to Assignment
```
PATCH /api/delivery/assignments/[id]
```

Accept or reject an assignment.

**Request Body:**
```json
{
  "status": "accepted"
}
```

**Valid values:** `accepted`, `rejected`

### Order Status Updates

#### Update Delivery Status
```
PATCH /api/delivery/orders/[id]/status
```

Updates order status during delivery.

**Request Body:**
```json
{
  "status": "picked_up"
}
```

**Valid transitions:**
- `ready` → `picked_up` (delivery person picked up order)
- `picked_up` → `delivered` (order delivered to customer)

---

## Admin Endpoints

### Dashboard

#### Get System Stats
```
GET /api/admin/stats
```

Returns platform-wide statistics.

**Response:**
```json
{
  "users": { "total": 1500, "customers": 1200, "vendors": 50, "delivery": 250 },
  "orders": { "today": 150, "this_week": 890, "total": 15000 },
  "revenue": { "today": 450000, "this_week": 2670000 }
}
```

#### List All Orders
```
GET /api/admin/orders
```

Returns all orders with advanced filtering.

#### List All Users
```
GET /api/admin/users
```

Returns all users with role information.

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {
      "field": "price",
      "issue": "must be a positive integer"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid auth token |
| FORBIDDEN | 403 | User lacks permission |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| CONFLICT | 409 | Resource conflict (e.g., duplicate) |
| SERVER_ERROR | 500 | Internal server error |

---

## Rate Limiting

- Public endpoints: 100 requests/minute
- Authenticated endpoints: 300 requests/minute
- Admin endpoints: 1000 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 295
X-RateLimit-Reset: 1642248000
```

---

## Real-time Subscriptions

For real-time updates, use Supabase Realtime directly:

### Order Status Updates (Customer)
```javascript
supabase
  .channel('order-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders',
    filter: `id=eq.${orderId}`
  }, (payload) => {
    // Handle status change
  })
  .subscribe()
```

### New Orders (Vendor)
```javascript
supabase
  .channel('new-orders')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'orders',
    filter: `vendor_id=eq.${vendorId}`
  }, (payload) => {
    // Handle new order
  })
  .subscribe()
```

### Delivery Assignments
```javascript
supabase
  .channel('assignments')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'delivery_assignments',
    filter: `delivery_person_id=eq.${deliveryPersonId}`
  }, (payload) => {
    // Handle new assignment offer
  })
  .subscribe()
```

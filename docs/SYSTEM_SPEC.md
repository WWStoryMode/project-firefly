# System Specification

## Overview

Project Firefly is an open-source, self-hostable food ordering and delivery platform designed for local co-ops. It eliminates platform middlemen, enabling fair deals between vendors, delivery persons, and customers.

## User Roles

### 1. Customer
- Browse vendors and menus
- Place orders
- Track order status
- View order history

### 2. Vendor (Restaurant/Food Shop)
- Manage menu (items, prices, availability)
- Receive and manage orders
- Accept/reject delivery person registrations
- View sales history

### 3. Delivery Person
- Register availability with vendors (timeslots)
- Accept/reject delivery assignments
- Update order status (picked up, delivered)
- View earnings history

### 4. Co-op Admin (optional super-user)
- Manage system settings
- View all activity
- Handle disputes

---

## Core Features (MVP)

### Customer Flow

1. **Browse vendors** - View list of active vendors
2. **View menu** - See vendor's available items
3. **Add to cart** - Build order from menu items
4. **Checkout** - Provide delivery address and notes
5. **Wait for confirmation** - System finds available delivery person
   - Order is `pending` until delivery person accepts
   - If no delivery available, order is cancelled
6. **Order confirmed** - Delivery person assigned
   - Group chat created with customer, vendor, and delivery person
   - All three parties can see each other and communicate
7. **Track status** - Real-time updates through order lifecycle:
   - `confirmed` → `preparing` → `ready` → `picked_up` → `delivered`
8. **Communicate** - Use group chat to coordinate with vendor and delivery
9. **Complete order** - Chat closes when order is delivered

### Vendor Flow

1. **Register** - Create account and set up shop
   - Shop name, description
   - Address and location
   - Operating hours
2. **Create menu** - Add items with:
   - Name, description
   - Price
   - Image (optional)
   - Category
   - Availability toggle
3. **Manage delivery pool**
   - View delivery person registration requests
   - See their available timeslots
   - Auto-accept or manually approve/reject
4. **Receive confirmed orders** - Real-time notifications
   - Orders arrive only after delivery person is assigned
   - Group chat already active with customer and delivery person
5. **Process orders**
   - Mark as `preparing`
   - Mark as `ready for pickup`
   - Communicate with customer and delivery via group chat
6. **View history** - Order history and basic statistics

### Delivery Person Flow

1. **Register profile**
   - Name, phone
   - Vehicle type (bike, scooter, car, walk)
2. **Register with vendors**
   - Select vendors to work with
   - Set available timeslots per vendor
   - Example: Mon 11am-2pm, 6pm-9pm
3. **Wait for approval** - Vendor reviews and approves
4. **Receive assignments** - Push notification or in-app (immediate when customer orders)
5. **Accept or reject** - If rejected, goes to next in queue
   - Accepting confirms the order for all parties
   - Group chat created with customer and vendor
6. **Coordinate** - Use group chat to communicate with customer and vendor
7. **Pick up order** - Mark `picked_up`
8. **Deliver order** - Mark `delivered`, chat closes
9. **View history** - Delivery history and earnings

---

## Delivery Assignment Algorithm

**Triggered immediately when customer places order** (before order is confirmed):

```
1. Customer submits order (status = "pending")
2. Get list of approved delivery persons for this vendor
3. Filter by: currently available (within registered timeslot)
4. Sort by: distance to vendor (nearest first)
5. Offer to first in list
6. If rejected or timeout (2 min), offer to next
7. Repeat until accepted or list exhausted
8. If accepted:
   - Order status changes to "confirmed"
   - Group chat created for customer, vendor, and delivery person
   - Vendor notified to start preparing
9. If no delivery available:
   - Order is cancelled
   - Customer notified that no delivery is available
```

### Assignment States

- `offered` - Assignment sent to delivery person
- `accepted` - Delivery person accepted, order confirmed
- `rejected` - Delivery person declined
- `expired` - 2-minute timeout reached

---

## Order Status Flow

```
┌─────────┐
│ pending │ ← Customer submits order, searching for delivery
└────┬────┘
     │
     │ Delivery assignment happens immediately
     │
     ├──────────────────────────────┐
     ↓                              ↓
┌───────────┐                 ┌───────────┐
│ confirmed │                 │ cancelled │ ← No delivery available
└─────┬─────┘                 └───────────┘
      │
      │ Group chat created (Customer + Vendor + Delivery)
      │ All parties can see each other
      ↓
┌───────────┐
│ preparing │ ← Vendor starts cooking
└─────┬─────┘
      ↓
┌───────────┐
│   ready   │ ← Order ready for pickup
└─────┬─────┘
      ↓
┌───────────┐
│ picked_up │ ← Delivery person has the order
└─────┬─────┘
      ↓
┌───────────┐
│ delivered │ ← Order delivered, chat closed
└───────────┘
```

### Order Status Definitions

| Status | Description |
|--------|-------------|
| `pending` | Order submitted, system searching for available delivery person |
| `confirmed` | Delivery person assigned, group chat created, vendor notified |
| `preparing` | Vendor is preparing the order |
| `ready` | Order ready for pickup |
| `picked_up` | Delivery person has collected the order |
| `delivered` | Order delivered to customer, chat closed |
| `cancelled` | Order cancelled (no delivery available or user cancelled) |

---

## Real-time Features

### Supabase Realtime Subscriptions

1. **Order status updates**
   - Customer subscribes to their order
   - Receives instant status change notifications

2. **Confirmed order notifications**
   - Vendor subscribes to orders table
   - Receives notification when order is confirmed (delivery assigned)

3. **Delivery assignments**
   - Delivery person subscribes to assignments
   - Receives offer immediately when customer places order

4. **Group chat** (NEW)
   - Created when order is confirmed
   - All three parties (customer, vendor, delivery) join automatically
   - Real-time messaging between all participants
   - Presence indicators show who's online
   - Chat closes automatically when order is delivered

### Group Chat Features

- **Participants**: Customer, Vendor, Delivery Person
- **Visibility**: All parties can see each other's names
  - Delivery person also sees addresses for pickup/delivery
- **Lifecycle**: Created on confirmation, closed on delivery
- **History**: Messages stored for dispute resolution

---

## Page Structure

```
/                           → Landing page / vendor list
/vendors/[id]               → Vendor page with menu
/cart                       → Shopping cart
/checkout                   → Checkout flow
/orders                     → Customer order history
/orders/[id]                → Order tracking page

/vendor/dashboard           → Vendor dashboard
/vendor/menu                → Menu management
/vendor/orders              → Order management
/vendor/delivery            → Delivery person management
/vendor/settings            → Shop settings

/delivery/dashboard         → Delivery person dashboard
/delivery/availability      → Manage availability/registrations
/delivery/history           → Delivery history

/admin                      → Co-op admin panel

/auth/login                 → Login page
/auth/register              → Registration with role selection
```

---

## Security Considerations

### Row Level Security (RLS)

- Customers can only view/modify their own orders
- Vendors can only access their own shop and orders
- Delivery persons can only see their assignments
- Admins have elevated access

### Authentication

- Supabase Auth handles all authentication
- Supports email/password, magic links, OAuth
- JWT tokens for API authentication

### Data Protection

- Sensitive data (addresses, phone) protected by RLS
- No PII exposed in public APIs
- HTTPS enforced for all communications

---

## Deployment Architecture

```
┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│  Supabase   │
│  (Next.js)  │     │ (PostgreSQL)│
│             │     │ (Auth)      │
│  - SSR      │     │ (Realtime)  │
│  - API      │     │ (Storage)   │
│  - Static   │     │             │
└─────────────┘     └─────────────┘
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key (server-side only)
```

---

## Future Enhancements (Post-MVP)

1. **Live GPS tracking** - Real-time delivery location on map
2. **Payment integration** - Stripe, local gateways
3. **Push notifications** - Web push for order updates
4. **Ratings & reviews** - Customer feedback system
5. **Analytics dashboard** - Sales, delivery stats
6. **Multi-language support** - i18n
7. **Scheduled orders** - Pre-order for specific time
8. **Promotions** - Discount codes, vendor specials

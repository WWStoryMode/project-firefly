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
5. **Receive confirmation** - Order placed successfully
6. **Track status** - Real-time updates through order lifecycle:
   - `placed` → `accepted` → `preparing` → `ready` → `picked_up` → `delivered`
7. **Complete order** - Mark delivered or report issue

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
4. **Receive orders** - Real-time notifications
5. **Process orders**
   - Accept or reject incoming orders
   - Mark as `preparing`
   - Mark as `ready for pickup`
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
4. **Receive assignments** - Push notification or in-app
5. **Accept or reject** - If rejected, goes to next in queue
6. **Pick up order** - Mark `picked_up`
7. **Deliver order** - Mark `delivered`
8. **View history** - Delivery history and earnings

---

## Delivery Assignment Algorithm

When an order is ready for pickup:

```
1. Get list of approved delivery persons for this vendor
2. Filter by: currently available (within registered timeslot)
3. Sort by: distance to vendor (nearest first)
4. Offer to first in list
5. If rejected or timeout (2 min), offer to next
6. Repeat until accepted or list exhausted
7. If no delivery available, notify vendor to handle manually
```

### Assignment States

- `offered` - Assignment sent to delivery person
- `accepted` - Delivery person accepted
- `rejected` - Delivery person declined
- `expired` - 2-minute timeout reached

---

## Order Status Flow

```
┌─────────┐
│ placed  │ ← Customer submits order
└────┬────┘
     ↓
┌─────────┐
│accepted │ ← Vendor accepts order
└────┬────┘
     ↓
┌──────────┐
│preparing │ ← Vendor starts cooking
└────┬─────┘
     ↓
┌─────────┐
│  ready  │ ← Order ready, triggers delivery assignment
└────┬────┘
     ↓
┌──────────┐
│picked_up │ ← Delivery person has the order
└────┬─────┘
     ↓
┌──────────┐
│delivered │ ← Order delivered to customer
└──────────┘

Alternative:
┌──────────┐
│cancelled │ ← Order cancelled (by customer, vendor, or system)
└──────────┘
```

---

## Real-time Features

### Supabase Realtime Subscriptions

1. **Order status updates**
   - Customer subscribes to their order
   - Receives instant status change notifications

2. **New order notifications**
   - Vendor subscribes to orders table
   - Receives notification when new order placed

3. **Delivery assignments**
   - Delivery person subscribes to assignments
   - Receives offer when assignment created

4. **Delivery queue updates**
   - Vendor can see assignment progress
   - Knows when delivery is accepted/rejected

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

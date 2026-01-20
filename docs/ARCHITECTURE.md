# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                 │
│   │   Customer   │    │    Vendor    │    │   Delivery   │                 │
│   │     PWA      │    │  Dashboard   │    │     App      │                 │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                 │
│          │                   │                   │                          │
│          └───────────────────┼───────────────────┘                          │
│                              │                                              │
│                    ┌─────────▼─────────┐                                   │
│                    │   Next.js 14      │                                   │
│                    │   (App Router)    │                                   │
│                    │   - SSR/SSG       │                                   │
│                    │   - React Server  │                                   │
│                    │     Components    │                                   │
│                    └─────────┬─────────┘                                   │
│                              │                                              │
└──────────────────────────────┼──────────────────────────────────────────────┘
                               │
                               │ HTTPS
                               │
┌──────────────────────────────┼──────────────────────────────────────────────┐
│                              │         VERCEL EDGE                          │
├──────────────────────────────┼──────────────────────────────────────────────┤
│                              │                                              │
│                    ┌─────────▼─────────┐                                   │
│                    │   API Routes      │                                   │
│                    │   /api/*          │                                   │
│                    ├───────────────────┤                                   │
│                    │ • /api/vendors    │                                   │
│                    │ • /api/orders     │                                   │
│                    │ • /api/delivery   │                                   │
│                    │ • /api/vendor     │                                   │
│                    └─────────┬─────────┘                                   │
│                              │                                              │
└──────────────────────────────┼──────────────────────────────────────────────┘
                               │
                               │ Supabase Client SDK
                               │
┌──────────────────────────────┼──────────────────────────────────────────────┐
│                              │         SUPABASE                             │
├──────────────────────────────┼──────────────────────────────────────────────┤
│                              │                                              │
│    ┌─────────────────────────┼─────────────────────────────────────┐       │
│    │                         │                                      │       │
│    │  ┌──────────────┐  ┌────▼─────┐  ┌──────────────┐            │       │
│    │  │   Supabase   │  │PostgreSQL│  │   Supabase   │            │       │
│    │  │     Auth     │  │    DB    │  │   Realtime   │            │       │
│    │  ├──────────────┤  ├──────────┤  ├──────────────┤            │       │
│    │  │ • Email/Pass │  │ • users  │  │ • Order      │            │       │
│    │  │ • Magic Link │  │ • vendors│  │   status     │            │       │
│    │  │ • OAuth      │  │ • orders │  │ • New order  │            │       │
│    │  │ • JWT        │  │ • menu   │  │   alerts     │            │       │
│    │  └──────────────┘  │ • etc... │  │ • Delivery   │            │       │
│    │                    └──────────┘  │   assigns    │            │       │
│    │                         │        └──────────────┘            │       │
│    │                         │                                      │       │
│    │                    ┌────▼─────┐                               │       │
│    │                    │   RLS    │                               │       │
│    │                    │ Policies │                               │       │
│    │                    └──────────┘                               │       │
│    │                                                                │       │
│    └────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow

```
Customer Places Order
         │
         ▼
┌─────────────────┐
│  Next.js Page   │
│  /checkout      │
└────────┬────────┘
         │ Form Submit
         ▼
┌─────────────────┐
│  API Route      │
│  POST /api/     │
│  orders         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Create Order   │
│  status=pending │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              DELIVERY ASSIGNMENT (IMMEDIATE)             │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Find available delivery persons for vendor      │    │
│  │  Offer assignment to nearest available           │    │
│  └─────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
┌─────────────────┐           ┌─────────────────┐
│ Delivery Found  │           │  No Delivery    │
│ & Accepted      │           │  Available      │
└────────┬────────┘           └────────┬────────┘
         │                             │
         ▼                             ▼
┌─────────────────┐           ┌─────────────────┐
│ Order CONFIRMED │           │ Order CANCELLED │
│ status=confirmed│           │ Notify customer │
└────────┬────────┘           └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                  CREATE GROUP CHAT                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Customer   │  │   Vendor    │  │  Delivery   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│           All parties can see each other                 │
│           Real-time messaging enabled                    │
└────────────────────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Vendor notified│
│  to prepare     │
└─────────────────┘
```

---

## Order Lifecycle

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         ORDER PLACEMENT PHASE                              │
└───────────────────────────────────────────────────────────────────────────┘

┌──────────┐
│ pending  │ ◀── Customer submits order
└────┬─────┘
     │
     │ Immediate delivery assignment
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DELIVERY ASSIGNMENT LOOP                        │
│                                                                  │
│   ┌─────────────────┐                                           │
│   │ Offer to next   │◀─────────────────────────┐                │
│   │ available       │                          │                │
│   └────────┬────────┘                          │                │
│            │                                   │                │
│   ┌────────┼────────┬──────────────┐          │                │
│   │        │        │              │          │                │
│   ▼        ▼        ▼              ▼          │                │
│ ┌────┐  ┌────┐  ┌────────┐  ┌──────────┐     │                │
│ │ ✓  │  │ ✗  │  │timeout │  │ no more  │     │                │
│ └──┬─┘  └──┬─┘  └───┬────┘  │ available│     │                │
│    │       │        │       └────┬─────┘     │                │
│    │       └────────┴────────────┼───────────┘                │
│    │                             │                             │
└────┼─────────────────────────────┼─────────────────────────────┘
     │                             │
     ▼                             ▼
┌───────────┐               ┌───────────┐
│ confirmed │               │ cancelled │
│           │               │ (no       │
│ + Chat    │               │ delivery) │
│   Created │               └───────────┘
└─────┬─────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                         ORDER FULFILLMENT PHASE                            │
│                     (Group Chat Active for All Parties)                    │
└───────────────────────────────────────────────────────────────────────────┘

      │
      ▼
┌───────────┐
│ preparing │ ◀── Vendor starts cooking
└─────┬─────┘
      │
      ▼
┌───────────┐
│   ready   │ ◀── Food ready for pickup
└─────┬─────┘
      │
      ▼
┌───────────┐
│ picked_up │ ◀── Delivery person has the order
└─────┬─────┘
      │
      ▼
┌───────────┐
│ delivered │ ◀── Order delivered, chat closed
└───────────┘
```

### Order Status Definitions

| Status | Description |
|--------|-------------|
| `pending` | Order submitted, searching for delivery person |
| `confirmed` | Delivery assigned, group chat created, vendor notified |
| `preparing` | Vendor is preparing the order |
| `ready` | Order ready for pickup |
| `picked_up` | Delivery person has collected the order |
| `delivered` | Order delivered to customer |
| `cancelled` | Order cancelled (no delivery available or user cancelled) |

---

## Delivery Assignment Algorithm

**Triggered:** Immediately when customer places order (before confirmation)

```
              Customer Submits Order
              (status = "pending")
                        │
                        ▼
          ┌─────────────────────────────┐
          │  Get approved delivery      │
          │  persons for this vendor    │
          └──────────────┬──────────────┘
                         │
                         ▼
          ┌─────────────────────────────┐
          │  Filter by:                 │
          │  • is_active = true         │
          │  • Within timeslot now      │
          └──────────────┬──────────────┘
                         │
                         ▼
          ┌─────────────────────────────┐
          │  Sort by distance           │
          │  (nearest to vendor first)  │
          └──────────────┬──────────────┘
                         │
                         ▼
          ┌─────────────────────────────┐
          │  Offer to #1 in list        │
          └──────────────┬──────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
  ┌──────────┐    ┌──────────┐    ┌──────────────┐
  │ Accepted │    │ Rejected │    │ Timeout 2min │
  └────┬─────┘    └────┬─────┘    └──────┬───────┘
       │               │                 │
       │               └────────┬────────┘
       │                        │
       │                        ▼
       │               ┌───────────────┐
       │               │ More in list? │
       │               └───────┬───────┘
       │                       │
       │              ┌────────┴────────┐
       │              │                 │
       │              ▼                 ▼
       │        ┌──────────┐      ┌───────────┐
       │        │   Yes    │      │    No     │
       │        │ Try next │      │  CANCEL   │
       │        └────┬─────┘      │  ORDER    │
       │             │            └───────────┘
       │             │
       │             └──────▶ (loop back to offer)
       │
       ▼
┌─────────────────────────────────────────┐
│          ORDER CONFIRMED                 │
│  ┌───────────────────────────────────┐  │
│  │     Create Group Chat             │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────┐ │  │
│  │  │Customer │ │ Vendor  │ │Deliv│ │  │
│  │  └─────────┘ └─────────┘ └─────┘ │  │
│  └───────────────────────────────────┘  │
│  • All parties can see each other       │
│  • Real-time messaging enabled          │
│  • Vendor notified to start preparing   │
└─────────────────────────────────────────┘
```

---

## Data Relationships

```
                                    ┌──────────────┐
                                    │    users     │
                                    │──────────────│
                                    │ id (PK)      │
                                    │ email        │
                                    │ role         │
                                    │ name         │
                                    └──────┬───────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
              │ user_id                    │ customer_id                │ user_id
              ▼                            │                            ▼
      ┌──────────────┐                     │                   ┌─────────────────┐
      │   vendors    │                     │                   │delivery_persons │
      │──────────────│                     │                   │─────────────────│
      │ id (PK)      │                     │                   │ id (PK)         │
      │ user_id (FK) │                     │                   │ user_id (FK)    │
      │ name         │                     │                   │ vehicle_type    │
      │ address      │                     │                   │ is_active       │
      └──────┬───────┘                     │                   └────────┬────────┘
             │                             │                            │
             │                             │                            │
    ┌────────┴────────┐                    │               ┌────────────┴───────────┐
    │                 │                    │               │                        │
    │ vendor_id       │ vendor_id          │               │ delivery_person_id     │
    ▼                 ▼                    │               ▼                        │
┌────────────┐   ┌─────────────────────┐   │   ┌──────────────────────┐            │
│menu_items  │   │delivery_            │   │   │delivery_             │            │
│────────────│   │registrations        │   │   │assignments           │            │
│ id (PK)    │   │─────────────────────│   │   │──────────────────────│            │
│ vendor_id  │   │ id (PK)             │   │   │ id (PK)              │            │
│ name       │   │ delivery_person_id  │◀──┼───│ delivery_person_id   │◀───────────┘
│ price      │   │ vendor_id           │   │   │ order_id             │
│ category   │   │ status              │   │   │ status               │
└────────────┘   │ timeslots           │   │   └──────────┬───────────┘
                 └─────────────────────┘   │              │
                                           │              │ order_id
                                           │              │
                                           │              ▼
                                           │   ┌───────────────────────┐
                                           │   │       orders          │
                                           │   │───────────────────────│
                                           └──▶│ id (PK)               │
                                               │ customer_id (FK)      │
                                               │ vendor_id (FK)        │
                                               │ delivery_person_id    │
                                               │ status                │
                                               │ items (jsonb)         │
                                               │ total                 │
                                               └───────────┬───────────┘
                                                           │
                              ┌─────────────────────────────┼─────────────────┐
                              │                             │                 │
                              │ order_id                    │ order_id        │
                              ▼                             ▼                 │
                  ┌───────────────────────┐   ┌────────────────────────┐     │
                  │order_status_history   │   │     order_chats        │     │
                  │───────────────────────│   │────────────────────────│     │
                  │ id (PK)               │   │ id (PK)                │     │
                  │ order_id (FK)         │   │ order_id (FK)          │     │
                  │ status                │   │ is_active              │     │
                  │ changed_by            │   │ created_at             │     │
                  │ timestamp             │   │ closed_at              │     │
                  └───────────────────────┘   └────────────┬───────────┘     │
                                                           │                 │
                                                           │ chat_id         │
                                                           ▼                 │
                                              ┌────────────────────────┐     │
                                              │    chat_messages       │     │
                                              │────────────────────────│     │
                                              │ id (PK)                │     │
                                              │ chat_id (FK)           │     │
                                              │ sender_id (FK→users)   │     │
                                              │ message                │     │
                                              │ created_at             │     │
                                              └────────────────────────┘     │
```

---

## Group Chat Architecture

When an order is confirmed (delivery person accepts), a temporary group chat is created connecting all three parties.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ORDER GROUP CHAT                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐               │
│  │  Customer   │       │   Vendor    │       │  Delivery   │               │
│  │             │       │             │       │   Person    │               │
│  │  Can see:   │       │  Can see:   │       │  Can see:   │               │
│  │  • Vendor   │       │  • Customer │       │  • Customer │               │
│  │    name     │       │    name     │       │    name &   │               │
│  │  • Delivery │       │  • Delivery │       │    address  │               │
│  │    name     │       │    name     │       │  • Vendor   │               │
│  │             │       │             │       │    name &   │               │
│  │             │       │             │       │    address  │               │
│  └──────┬──────┘       └──────┬──────┘       └──────┬──────┘               │
│         │                     │                     │                       │
│         └─────────────────────┼─────────────────────┘                       │
│                               │                                              │
│                               ▼                                              │
│                    ┌─────────────────────┐                                  │
│                    │   Supabase Realtime │                                  │
│                    │   Channel:          │                                  │
│                    │   order:{order_id}  │                                  │
│                    └─────────────────────┘                                  │
│                                                                              │
│  Features:                                                                   │
│  • Real-time messaging between all parties                                  │
│  • Typing indicators                                                        │
│  • Message history stored in chat_messages table                            │
│  • Chat automatically closes when order is delivered                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              CHAT LIFECYCLE

     Order Confirmed              Order In Progress           Order Delivered
     (Delivery Accepts)
           │                            │                           │
           ▼                            ▼                           ▼
    ┌─────────────┐             ┌─────────────┐             ┌─────────────┐
    │ Chat Created│────────────▶│ Chat Active │────────────▶│ Chat Closed │
    │             │             │             │             │             │
    │ • 3 members │             │ • Messages  │             │ • Read-only │
    │ • Channel   │             │ • Updates   │             │ • Archived  │
    │   opened    │             │ • Status    │             │             │
    └─────────────┘             └─────────────┘             └─────────────┘
```

### Chat Visibility Rules

| Party | Can See | Can Message |
|-------|---------|-------------|
| Customer | Vendor name, Delivery name | Yes |
| Vendor | Customer name, Delivery name | Yes |
| Delivery | Customer name + address, Vendor name + address | Yes |

### Real-time Implementation

```javascript
// Subscribe to order chat
const channel = supabase
  .channel(`order:${orderId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: `chat_id=eq.${chatId}`
  }, (payload) => {
    // Display new message
  })
  .on('presence', { event: 'sync' }, () => {
    // Show who's online
  })
  .subscribe()
```

---

## Component Architecture

```
src/
├── app/                           # Next.js App Router
│   │
│   ├── (public)/                  # Public routes (no auth)
│   │   ├── page.tsx               # Landing / vendor list
│   │   └── vendors/[id]/          # Vendor menu page
│   │
│   ├── (customer)/                # Customer routes
│   │   ├── cart/                  # Shopping cart
│   │   ├── checkout/              # Checkout flow
│   │   └── orders/                # Order history & tracking
│   │
│   ├── (vendor)/                  # Vendor dashboard
│   │   ├── dashboard/             # Overview
│   │   ├── menu/                  # Menu CRUD
│   │   ├── orders/                # Order management
│   │   └── delivery/              # Delivery pool mgmt
│   │
│   ├── (delivery)/                # Delivery person dashboard
│   │   ├── dashboard/             # Current assignments
│   │   ├── availability/          # Timeslot management
│   │   └── history/               # Past deliveries
│   │
│   ├── api/                       # API Routes
│   │   ├── vendors/               # Public vendor endpoints
│   │   ├── orders/                # Order endpoints
│   │   ├── vendor/                # Vendor-only endpoints
│   │   └── delivery/              # Delivery endpoints
│   │
│   └── auth/                      # Auth pages
│       ├── login/
│       └── register/
│
├── components/
│   ├── ui/                        # Shared UI (buttons, cards, etc.)
│   ├── customer/                  # Customer-specific components
│   ├── vendor/                    # Vendor-specific components
│   └── delivery/                  # Delivery-specific components
│
├── lib/
│   ├── supabase/                  # Supabase client setup
│   │   ├── client.ts              # Browser client
│   │   ├── server.ts              # Server client
│   │   └── middleware.ts          # Auth middleware
│   ├── hooks/                     # React hooks
│   └── utils/                     # Utility functions
│
└── types/                         # TypeScript definitions
    └── database.ts                # Generated from Supabase
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        REQUEST FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Client Request                                                  │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    HTTPS (TLS 1.3)                       │    │
│  │              All traffic encrypted                       │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                    │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Supabase Auth                           │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │ • JWT validation                                 │    │    │
│  │  │ • Token refresh                                  │    │    │
│  │  │ • Session management                             │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                    │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Row Level Security (RLS)                    │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │ Policy: users                                    │    │    │
│  │  │ • SELECT: own record only                        │    │    │
│  │  │ • UPDATE: own record (except role)               │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │ Policy: orders                                   │    │    │
│  │  │ • Customer: own orders only                      │    │    │
│  │  │ • Vendor: orders to their shop                   │    │    │
│  │  │ • Delivery: assigned orders only                 │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │ Policy: vendors / menu_items                     │    │    │
│  │  │ • Public: read active vendors/items              │    │    │
│  │  │ • Owner: full CRUD on own records                │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
                    ┌─────────────────────────────────────┐
                    │            PRODUCTION               │
                    └─────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                         ┌───────────┐                           │
│                         │  GitHub   │                           │
│                         │   Repo    │                           │
│                         └─────┬─────┘                           │
│                               │                                  │
│                               │ Push to main                     │
│                               │                                  │
│                               ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                        VERCEL                            │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │              Auto-deploy on push                 │    │    │
│  │  │                                                  │    │    │
│  │  │  ┌─────────────┐  ┌─────────────┐              │    │    │
│  │  │  │   Build     │  │   Deploy    │              │    │    │
│  │  │  │  Next.js    │─▶│   to Edge   │              │    │    │
│  │  │  └─────────────┘  └─────────────┘              │    │    │
│  │  │                                                  │    │    │
│  │  │  Environment Variables:                         │    │    │
│  │  │  • NEXT_PUBLIC_SUPABASE_URL                     │    │    │
│  │  │  • NEXT_PUBLIC_SUPABASE_ANON_KEY                │    │    │
│  │  │  • SUPABASE_SERVICE_ROLE_KEY                    │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                    │
│                             │                                    │
│                             ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                       SUPABASE                           │    │
│  │                                                          │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │    │
│  │  │   Auth   │  │ Postgres │  │ Realtime │  │Storage │  │    │
│  │  │          │  │    DB    │  │          │  │        │  │    │
│  │  │ • Users  │  │ • Tables │  │ • Subs   │  │• Images│  │    │
│  │  │ • JWT    │  │ • RLS    │  │ • Events │  │• Files │  │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘  │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


                    ┌─────────────────────────────────────┐
                    │           LOCAL DEV                  │
                    └─────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌──────────────────┐          ┌──────────────────────────┐    │
│  │   npm run dev    │          │    Supabase Project      │    │
│  │   localhost:3000 │◀────────▶│    (cloud or local)      │    │
│  └──────────────────┘          └──────────────────────────┘    │
│                                                                  │
│  .env.local:                                                    │
│  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co              │
│  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Rationale

| Choice | Why | Alternatives Considered |
|--------|-----|------------------------|
| **Next.js 14** | App Router, SSR, API routes in one, easy Vercel deploy | Remix, SvelteKit |
| **Supabase** | All-in-one (DB, Auth, Realtime, Storage), generous free tier | Firebase, custom backend |
| **PostgreSQL** | Mature, PostGIS for geo queries, RLS for security | MySQL, MongoDB |
| **Vercel** | Zero-config Next.js hosting, edge functions, preview deploys | Netlify, Railway |
| **PWA** | No app store approval, works everywhere, instant updates | React Native, Flutter |
| **TypeScript** | Type safety, better DX, catches errors early | JavaScript |

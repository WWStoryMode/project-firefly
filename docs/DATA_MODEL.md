# Data Model

## Overview

Project Firefly uses PostgreSQL (via Supabase) with the PostGIS extension for geographic queries. This document describes all database tables, their relationships, and key constraints.

## Entity Relationship Diagram

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │
│ email           │
│ role            │
│ name            │
│ phone           │
└────────┬────────┘
         │
    ┌────┴────┬─────────────────┐
    │         │                 │
    ▼         ▼                 ▼
┌────────┐ ┌──────────────┐ ┌───────────────────┐
│vendors │ │delivery_     │ │      orders       │
│        │ │persons       │ │                   │
│────────│ │──────────────│ │───────────────────│
│id (PK) │ │id (PK)       │ │id (PK)            │
│user_id │ │user_id       │ │customer_id        │
│name    │ │vehicle_type  │ │vendor_id          │
│...     │ │is_active     │ │delivery_person_id │
└───┬────┘ └──────┬───────┘ │status             │
    │             │         │...                │
    │             │         └─────────┬─────────┘
    │             │                   │
    ▼             │                   ▼
┌────────────┐    │         ┌─────────────────────┐
│menu_items  │    │         │order_status_history │
│────────────│    │         │─────────────────────│
│id (PK)     │    │         │id (PK)              │
│vendor_id   │    │         │order_id             │
│name        │    │         │status               │
│price       │    │         │changed_by           │
│...         │    │         │timestamp            │
└────────────┘    │         └─────────────────────┘
                  │
    ┌─────────────┴──────────────┐
    │                            │
    ▼                            ▼
┌─────────────────────┐  ┌─────────────────────┐
│delivery_            │  │delivery_            │
│registrations        │  │assignments          │
│─────────────────────│  │─────────────────────│
│id (PK)              │  │id (PK)              │
│delivery_person_id   │  │order_id             │
│vendor_id            │  │delivery_person_id   │
│status               │  │status               │
│timeslots            │  │offered_at           │
└─────────────────────┘  │responded_at         │
                         └─────────────────────┘
```

---

## Tables

### users

Core user table for all platform participants.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Unique identifier |
| email | text | NOT NULL, UNIQUE | User's email address |
| role | text | NOT NULL, CHECK (role IN ('customer', 'vendor', 'delivery', 'admin')) | User's primary role |
| name | text | NOT NULL | Display name |
| phone | text | | Contact phone number |
| created_at | timestamptz | NOT NULL, default now() | Account creation timestamp |

**Indexes:**
- `users_email_idx` on `email`

**Notes:**
- Links to Supabase Auth via `id` (matches auth.users.id)
- Role determines dashboard access

---

### vendors

Vendor (restaurant/food shop) profiles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Unique identifier |
| user_id | uuid | FK → users.id, UNIQUE | Owner's user account |
| name | text | NOT NULL | Shop name |
| description | text | | Shop description |
| address | text | NOT NULL | Street address |
| location | geography(POINT) | | Coordinates for distance calculations |
| operating_hours | jsonb | | Operating schedule (see schema below) |
| is_active | boolean | NOT NULL, default true | Whether shop is accepting orders |
| auto_accept_delivery | boolean | NOT NULL, default false | Auto-approve delivery registrations |
| created_at | timestamptz | NOT NULL, default now() | Profile creation timestamp |

**Indexes:**
- `vendors_user_id_idx` on `user_id`
- `vendors_location_idx` using GIST on `location`

**operating_hours schema:**
```json
{
  "mon": { "open": "09:00", "close": "21:00" },
  "tue": { "open": "09:00", "close": "21:00" },
  "wed": null,
  "thu": { "open": "09:00", "close": "21:00" },
  "fri": { "open": "09:00", "close": "22:00" },
  "sat": { "open": "10:00", "close": "22:00" },
  "sun": { "open": "10:00", "close": "20:00" }
}
```

---

### menu_items

Menu items for each vendor.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Unique identifier |
| vendor_id | uuid | FK → vendors.id, NOT NULL | Parent vendor |
| name | text | NOT NULL | Item name |
| description | text | | Item description |
| price | integer | NOT NULL, CHECK (price >= 0) | Price in cents |
| image_url | text | | Item image URL |
| is_available | boolean | NOT NULL, default true | Currently available |
| category | text | | Item category (e.g., "Mains", "Drinks") |
| created_at | timestamptz | NOT NULL, default now() | Creation timestamp |

**Indexes:**
- `menu_items_vendor_id_idx` on `vendor_id`

**Notes:**
- Price stored in cents to avoid floating-point issues
- `is_available` allows temporary hiding without deletion

---

### delivery_persons

Delivery person profiles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Unique identifier |
| user_id | uuid | FK → users.id, UNIQUE | Associated user account |
| vehicle_type | text | NOT NULL, CHECK (vehicle_type IN ('bike', 'scooter', 'car', 'walk')) | Transportation method |
| is_active | boolean | NOT NULL, default true | Currently accepting deliveries |
| current_location | geography(POINT) | | Last known location |
| created_at | timestamptz | NOT NULL, default now() | Profile creation timestamp |

**Indexes:**
- `delivery_persons_user_id_idx` on `user_id`
- `delivery_persons_location_idx` using GIST on `current_location`

---

### delivery_registrations

Delivery person registrations with specific vendors.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Unique identifier |
| delivery_person_id | uuid | FK → delivery_persons.id, NOT NULL | Delivery person |
| vendor_id | uuid | FK → vendors.id, NOT NULL | Target vendor |
| status | text | NOT NULL, default 'pending', CHECK (status IN ('pending', 'approved', 'rejected')) | Registration status |
| timeslots | jsonb | NOT NULL | Available time windows |
| created_at | timestamptz | NOT NULL, default now() | Registration timestamp |
| updated_at | timestamptz | NOT NULL, default now() | Last update timestamp |

**Indexes:**
- `delivery_registrations_delivery_person_id_idx` on `delivery_person_id`
- `delivery_registrations_vendor_id_idx` on `vendor_id`
- `delivery_registrations_unique_idx` UNIQUE on `(delivery_person_id, vendor_id)`

**timeslots schema:**
```json
[
  { "day": "mon", "start": "11:00", "end": "14:00" },
  { "day": "mon", "start": "18:00", "end": "21:00" },
  { "day": "tue", "start": "11:00", "end": "14:00" },
  { "day": "fri", "start": "18:00", "end": "22:00" }
]
```

---

### orders

Customer orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Unique identifier |
| customer_id | uuid | FK → users.id, NOT NULL | Customer who placed order |
| vendor_id | uuid | FK → vendors.id, NOT NULL | Vendor receiving order |
| delivery_person_id | uuid | FK → delivery_persons.id | Assigned delivery person |
| status | text | NOT NULL, default 'placed', CHECK (status IN ('placed', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled')) | Current order status |
| items | jsonb | NOT NULL | Snapshot of ordered items |
| subtotal | integer | NOT NULL, CHECK (subtotal >= 0) | Item total in cents |
| delivery_fee | integer | NOT NULL, default 0, CHECK (delivery_fee >= 0) | Delivery fee in cents |
| total | integer | NOT NULL, CHECK (total >= 0) | Grand total in cents |
| delivery_address | text | NOT NULL | Delivery destination |
| delivery_location | geography(POINT) | | Delivery coordinates |
| notes | text | | Customer notes |
| created_at | timestamptz | NOT NULL, default now() | Order placement time |
| updated_at | timestamptz | NOT NULL, default now() | Last update time |

**Indexes:**
- `orders_customer_id_idx` on `customer_id`
- `orders_vendor_id_idx` on `vendor_id`
- `orders_delivery_person_id_idx` on `delivery_person_id`
- `orders_status_idx` on `status`

**items schema:**
```json
[
  {
    "menu_item_id": "uuid",
    "name": "Burger",
    "price": 1200,
    "quantity": 2
  },
  {
    "menu_item_id": "uuid",
    "name": "Fries",
    "price": 400,
    "quantity": 1
  }
]
```

**Notes:**
- Items stored as snapshot to preserve historical pricing
- All monetary values in cents

---

### order_status_history

Audit trail for order status changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Unique identifier |
| order_id | uuid | FK → orders.id, NOT NULL | Associated order |
| status | text | NOT NULL | Status at this point |
| changed_by | uuid | FK → users.id, NOT NULL | User who made change |
| timestamp | timestamptz | NOT NULL, default now() | When change occurred |

**Indexes:**
- `order_status_history_order_id_idx` on `order_id`

---

### delivery_assignments

Tracks delivery offers and responses.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default uuid_generate_v4() | Unique identifier |
| order_id | uuid | FK → orders.id, NOT NULL | Order to be delivered |
| delivery_person_id | uuid | FK → delivery_persons.id, NOT NULL | Offered delivery person |
| status | text | NOT NULL, default 'offered', CHECK (status IN ('offered', 'accepted', 'rejected', 'expired')) | Assignment status |
| offered_at | timestamptz | NOT NULL, default now() | When offer was made |
| responded_at | timestamptz | | When delivery person responded |

**Indexes:**
- `delivery_assignments_order_id_idx` on `order_id`
- `delivery_assignments_delivery_person_id_idx` on `delivery_person_id`

---

## Row Level Security (RLS) Policies

### users
- Users can read their own record
- Users can update their own record (except role)
- Admins can read all records

### vendors
- Public can read active vendors
- Vendor owner can read/update their vendor
- Admins can read all vendors

### menu_items
- Public can read available items from active vendors
- Vendor owner can CRUD their menu items
- Admins can read all items

### delivery_persons
- Delivery person can read/update their own profile
- Vendors can read approved delivery persons
- Admins can read all profiles

### delivery_registrations
- Delivery person can CRUD their own registrations
- Vendor can read registrations for their shop
- Vendor can update status of registrations for their shop

### orders
- Customer can read their own orders
- Vendor can read orders for their shop
- Delivery person can read their assigned orders
- Admins can read all orders

### order_status_history
- Same policies as orders (linked via order_id)

### delivery_assignments
- Delivery person can read their assignments
- Delivery person can update (accept/reject) their assignments
- Vendor can read assignments for their orders
- Admins can read all assignments

---

## Database Functions

### is_delivery_person_available(delivery_person_id uuid, vendor_id uuid)

Checks if a delivery person is currently within their registered timeslots for a vendor.

```sql
CREATE OR REPLACE FUNCTION is_delivery_person_available(
  p_delivery_person_id uuid,
  p_vendor_id uuid
) RETURNS boolean AS $$
DECLARE
  current_day text;
  current_time time;
  available boolean;
BEGIN
  current_day := lower(to_char(now(), 'Dy'));
  current_time := now()::time;

  SELECT EXISTS (
    SELECT 1 FROM delivery_registrations dr,
    jsonb_array_elements(dr.timeslots) AS ts
    WHERE dr.delivery_person_id = p_delivery_person_id
    AND dr.vendor_id = p_vendor_id
    AND dr.status = 'approved'
    AND ts->>'day' = current_day
    AND (ts->>'start')::time <= current_time
    AND (ts->>'end')::time >= current_time
  ) INTO available;

  RETURN available;
END;
$$ LANGUAGE plpgsql;
```

### get_available_delivery_persons(vendor_id uuid)

Returns available delivery persons for a vendor, sorted by distance.

```sql
CREATE OR REPLACE FUNCTION get_available_delivery_persons(
  p_vendor_id uuid
) RETURNS TABLE (
  delivery_person_id uuid,
  distance_meters float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dp.id,
    ST_Distance(dp.current_location, v.location) as dist
  FROM delivery_persons dp
  JOIN delivery_registrations dr ON dr.delivery_person_id = dp.id
  JOIN vendors v ON v.id = p_vendor_id
  WHERE dr.vendor_id = p_vendor_id
  AND dr.status = 'approved'
  AND dp.is_active = true
  AND is_delivery_person_available(dp.id, p_vendor_id)
  ORDER BY dist ASC;
END;
$$ LANGUAGE plpgsql;
```

---

## Triggers

### update_updated_at

Automatically updates `updated_at` timestamp on record modification.

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER delivery_registrations_updated_at
  BEFORE UPDATE ON delivery_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### log_order_status_change

Automatically logs order status changes to history table.

```sql
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_status_history
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();
```

---

## Extensions Required

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis;
```

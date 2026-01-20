# Project Firefly

An open-source, self-hostable food ordering and delivery platform designed for local co-ops.

## Philosophy

Lightweight, easy to deploy, community-owned. Eliminates platform middlemen, enabling fair deals between vendors, delivery persons, and customers.

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | Next.js 14 (App Router) | SSR, API routes, easy Vercel deploy |
| Database | Supabase (PostgreSQL) | Auth, real-time, row-level security |
| Auth | Supabase Auth | Email/password, magic links, OAuth |
| Real-time | Supabase Realtime | Order status updates, delivery queue |
| Hosting | Vercel + Supabase | Zero-ops serverless |
| Mobile | PWA | No app store, works on all devices |

## User Roles

- **Customer** - Browse vendors, place orders, track deliveries
- **Vendor** - Manage menu, receive orders, coordinate delivery
- **Delivery Person** - Register availability, accept deliveries, update status
- **Co-op Admin** - System management and oversight

## Project Structure

```
project-firefly/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/           # Public pages (landing, vendors)
│   │   ├── (customer)/         # Customer pages
│   │   ├── (vendor)/           # Vendor dashboard
│   │   ├── (delivery)/         # Delivery dashboard
│   │   ├── (admin)/            # Admin panel
│   │   ├── api/                # API routes
│   │   └── auth/               # Auth pages
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components
│   │   ├── customer/           # Customer-specific
│   │   ├── vendor/             # Vendor-specific
│   │   └── delivery/           # Delivery-specific
│   ├── lib/
│   │   ├── supabase/           # Supabase client + helpers
│   │   ├── hooks/              # Custom React hooks
│   │   └── utils/              # Utility functions
│   └── types/                  # TypeScript types
├── supabase/
│   ├── migrations/             # Database migrations
│   └── seed.sql                # Sample data
├── public/                     # Static assets
├── docs/                       # Documentation
│   ├── SYSTEM_SPEC.md          # Full system specification
│   ├── DATA_MODEL.md           # Database schema
│   └── API.md                  # API documentation
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- Vercel account (optional, for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/project-firefly.git
   cd project-firefly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

5. **Run database migrations**
   ```bash
   npx supabase db push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

### Deployment

#### One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/project-firefly)

#### Manual Deployment

1. Create Supabase project
2. Run database migrations
3. Deploy to Vercel (connect GitHub repo)
4. Set environment variables in Vercel dashboard
5. Done - your co-op is live

## Documentation

- [System Specification](docs/SYSTEM_SPEC.md) - Full system specification and user flows
- [Data Model](docs/DATA_MODEL.md) - Database schema and relationships
- [API Reference](docs/API.md) - API routes and endpoints

## Features

### Core Features (MVP)

- **Customer Flow**: Browse vendors, view menus, place orders, track delivery status
- **Vendor Flow**: Manage shop, create menus, handle orders, manage delivery pool
- **Delivery Flow**: Register availability, accept assignments, update delivery status

### Real-time Updates

- Order status changes visible instantly
- New order notifications for vendors
- Delivery assignment offers in real-time
- Live delivery queue status

## Contributing

We welcome contributions! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

Built for local food co-ops everywhere. Power to the people, not the platforms.

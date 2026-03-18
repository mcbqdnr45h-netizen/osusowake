# RescuEat (レスキュイート)

## Overview

Japanese food rescue app similar to "Too Good To Go". Users can find nearby restaurants offering surprise bags of leftover food at a discount. Stores can manage their listings and reservations.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/rescueat)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Map**: react-leaflet + OpenStreetMap (no API key required)
- **Payments**: Stripe (with mock fallback)
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── rescueat/           # React frontend app (at /)
│   └── api-server/         # Express API server (at /api)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
└── scripts/                # Utility scripts
```

## Features

1. **Map View** - Interactive Leaflet map showing nearby stores with emoji category pins
2. **Surprise Bag Listing** - Cards with discount percentage, pickup times, stock remaining
3. **Bag Detail + Reservation** - Full bag details, quantity selector, "Reserve" button
4. **Checkout/Payment** - Mock payment flow (Stripe when STRIPE_SECRET_KEY set)
5. **My Reservations** - User's reservations with pickup codes and status
6. **Store Dashboard** - Store owners can manage bags and mark pickups complete

## Database Tables

- `stores` - Store info with lat/lng for map display
- `surprise_bags` - Bag listings per store with stock count
- `reservations` - User reservations with status and pickup codes

## API Routes

- `GET /api/stores` - List all active stores
- `GET /api/bags` - List all available bags with store info
- `GET /api/bags/:id` - Get bag details
- `GET/POST /api/stores/:id/bags` - Store bag management
- `PUT /api/bags/:id` - Update bag (stock, active status)
- `GET/POST /api/reservations` - Reservations CRUD
- `PUT /api/reservations/:id` - Update reservation status
- `POST /api/reservations/:id/cancel` - Cancel reservation
- `POST /api/payment/create-intent` - Create Stripe payment intent
- `POST /api/payment/confirm` - Confirm payment

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (auto-provisioned)
- `STRIPE_SECRET_KEY` - Optional Stripe key (falls back to mock payment)
- `VITE_STRIPE_PUBLIC_KEY` - Optional Stripe public key for frontend

## Seed Data

6 sample stores in Tokyo (Shibuya, Shinjuku, Omotesando, Ueno, Ikebukuro, Aoyama) with 1 surprise bag each.

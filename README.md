# GearUp Backend

<p align="center">
  <strong>TypeScript API for a role-based gear rental platform with rentals, provider workflows, Stripe payments, reviews, and admin operations.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white" alt="Zod" />
</p>

<p align="center">
  <a href="https://gearup-backend-tan.vercel.app/">Live API</a>
</p>

---

## Overview

GearUp Backend powers a rental marketplace where customers can browse gear and create rental orders, providers can manage inventory and order workflows, and administrators can oversee users, gear, rentals, and dashboard data.

The project is organized around domain modules and uses Prisma with PostgreSQL for relational persistence. Authentication and role checks protect customer, provider, and admin workflows, while Stripe Checkout and verified webhooks handle rental payment processing.

## Core Engineering Areas

- **Authentication** — registration, login, authenticated user lookup, JWT-based access control
- **Authorization** — role-aware routes for `CUSTOMER`, `PROVIDER`, and `ADMIN`
- **Gear catalog** — public gear and category access with provider-managed inventory
- **Rental workflow** — customer rental creation and retrieval with persisted order status
- **Payments** — Stripe Checkout session creation, payment status checks, and webhook-driven updates
- **Provider operations** — gear CRUD, order status management, and provider dashboard
- **Reviews** — customer reviews linked to rental orders and gear items
- **Admin operations** — user, gear, rental, and dashboard management
- **Validation & errors** — request validation plus centralized not-found and global error handling

## Architecture

```text
Client
  │
  ▼
Express API
  │
  ├── Auth
  ├── Users
  ├── Gear
  ├── Categories
  ├── Rentals
  ├── Providers
  ├── Payments
  ├── Reviews
  └── Admin
  │
  ▼
Prisma ORM
  │
  ▼
PostgreSQL

Stripe Checkout ──► Payment service ──► Prisma/PostgreSQL
      │
      └────────────► Verified webhook endpoint
```

## Project Structure

```text
gearup-backend/
├── api/
├── prisma/
│   ├── migrations/
│   ├── schema/
│   │   ├── category.prisma
│   │   ├── gear.prisma
│   │   ├── payment.prisma
│   │   ├── profile.prisma
│   │   ├── rental.prisma
│   │   ├── review.prisma
│   │   ├── schema.prisma
│   │   └── user.prisma
│   └── seed.ts
├── src/
│   ├── auth/
│   ├── config/
│   ├── lib/
│   ├── middleware/
│   ├── modules/
│   │   ├── admin/
│   │   ├── category/
│   │   ├── gear/
│   │   ├── payments/
│   │   ├── provider/
│   │   ├── rental/
│   │   ├── reviews/
│   │   └── user/
│   ├── utils/
│   ├── app.ts
│   └── server.ts
├── prisma.config.ts
├── tsconfig.json
├── tsup.config.ts
└── vercel.json
```

## Data Model

The Prisma schema models the main marketplace relationships:

- A **User** can be a customer, provider, or admin.
- A **Provider** owns multiple gear items.
- A **Category** contains multiple gear items.
- A **Customer** can create multiple rental orders.
- A **RentalOrder** contains one or more rental order items.
- A **RentalOrder** can have one payment.
- **Reviews** connect customers, rental orders, and gear items.
- Gear, rental, payment, and review fields include indexes and relational constraints where appropriate.

### Rental Lifecycle

```text
PLACED
  ↓
CONFIRMED
  ↓
PAID
  ↓
PICKED_UP
  ↓
RETURNED

Alternative state: CANCELLED
```

## API Surface

### Public

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/` | API health response |
| `POST` | `/api/auth/register` | Register a user |
| `POST` | `/api/auth/login` | Log in |
| `GET` | `/api/gear` | List gear |
| `GET` | `/api/gear/:id` | Get a gear item |
| `GET` | `/api/categories` | List categories |

### Authenticated Customer

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/auth/me` | Get authenticated user |
| `POST` | `/api/rentals` | Create a rental order |
| `GET` | `/api/rentals` | List customer rentals |
| `GET` | `/api/rentals/:id` | Get a rental |
| `POST` | `/api/payments/create` | Create Stripe Checkout session |
| `POST` | `/api/payments/confirm` | Check payment confirmation |
| `GET` | `/api/payments/status/:sessionId` | Get checkout payment status |
| `GET` | `/api/payments` | List customer payments |
| `GET` | `/api/payments/:id` | Get a payment |
| `POST` | `/api/reviews` | Create a review |

### Provider

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/provider/gear` | Create gear |
| `PUT` | `/api/provider/gear/:id` | Update gear |
| `DELETE` | `/api/provider/gear/:id` | Delete gear |
| `GET` | `/api/provider/orders` | List provider orders |
| `PATCH` | `/api/provider/orders/:id` | Update provider order status |
| `GET` | `/api/provider/dashboard` | Provider dashboard |

### Admin

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/dashboard` | Admin dashboard |
| `GET` | `/api/admin/users` | List users |
| `PATCH` | `/api/admin/users/:id` | Update user |
| `GET` | `/api/admin/gear` | List all gear |
| `GET` | `/api/admin/rentals` | List all rentals |

### Stripe Webhook

```text
POST /api/payments/webhook
```

The webhook is registered before JSON parsing so Stripe can verify the raw request body. The handler processes Checkout completion, asynchronous payment success/failure, and session expiry events.

## Payment Flow

```text
Customer rental
      │
      ▼
Provider confirms rental
      │
      ▼
Create Stripe Checkout session
      │
      ▼
Customer completes payment
      │
      ├──► Client checks payment status
      │
      └──► Stripe sends verified webhook
                    │
                    ▼
          Payment marked PAID
                    │
                    ▼
          Rental status updated
```

A rental must be confirmed before a Checkout session can be created. The payment service also uses a Stripe idempotency key based on the rental order ID when creating the Checkout session.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Language | TypeScript |
| Runtime | Node.js |
| API | Express.js 5 |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Authentication | JWT + bcrypt |
| Validation | Zod + request validation middleware |
| Payments | Stripe Checkout + webhooks |
| Build | tsup |
| Deployment config | Vercel |

## Local Development

### 1. Clone

```bash
git clone https://github.com/harunhira69/gearup-backend.git
cd gearup-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` file in the project root.

```env
PORT=5000

DATABASE_URL=
DIRECT_URL=

APP_URL=http://localhost:5173
BCRYPT_SALT_ROUNDS=10

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRY=
JWT_REFRESH_EXPIRY=

STRIPE_CURRENCY=usd
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

ADMIN_EMAIL=
ADMIN_PASSWORD=
PROVIDER_EMAIL=
PROVIDER_PASSWORD=
```

Use your own secure credentials and secrets. Do not commit real environment values.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Apply migrations

For development:

```bash
npx prisma migrate dev
```

For an existing deployed migration history:

```bash
npx prisma migrate deploy
```

### 6. Seed development data

```bash
npm run seed
```

Set explicit admin/provider credentials in your environment before seeding.

### 7. Start development server

```bash
npm run dev
```

Default local port:

```text
http://localhost:5000
```

## Stripe Webhook Development

With the Stripe CLI authenticated:

```bash
npm run stripe:webhook
```

The script forwards Stripe events to:

```text
http://localhost:5000/api/payments/webhook
```

Copy the webhook signing secret from Stripe CLI output into `STRIPE_WEBHOOK_SECRET`.

## Build & Start

```bash
npm run build
npm start
```

## Repository Notes

- The codebase uses split Prisma schema files under `prisma/schema/`.
- Vercel routing forwards requests to `api/index.ts`.
- Customer, provider, and admin authorization is enforced at route level where required.
- Payment state is persisted separately from rental state and linked one-to-one with a rental order.

---

## Author

**Harun Hira**  
Backend-Focused Full Stack Developer

- GitHub: https://github.com/harunhira69
- LinkedIn: https://www.linkedin.com/in/harunmern/
- Portfolio: https://portfolio-harun-liard.vercel.app/

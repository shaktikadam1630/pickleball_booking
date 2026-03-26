# Pickleball Booking System - Backend

Node.js Express server with Prisma ORM and MySQL database for the Pickleball Booking System.

## Features

- **User Authentication**: JWT-based auth with bcrypt password hashing
- **Role-based Access Control**: OWNER and BOOKER roles with role-specific routes
- **Venue Management**: Create, read, update, delete venues with photo uploads
- **Availability System**: Dynamic court availability with real-time slot management
- **Shopping Cart**: Redis-backed cart with booking management
- **Password Management**: Secure password change with current password verification

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with Prisma ORM
- **Cache**: Redis (for cart management)


## Database Schema

- **User**: Authentication & profile (OWNER/BOOKER)
- **Venue**: Sports facilities with court count and photos
- **Booking**: User bookings with date/time/court selection
- **CartItem**: Shopping cart with conflict detection

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get profile (auth-required)
- `PUT /api/auth/me` - Update profile (auth-required)
- `PUT /api/auth/change-password` - Change password (auth-required)

### Venues
- `GET /api/venues` - List all venues
- `POST /api/venues` - Create venue (owner-required)
- `PUT /api/venues/:id` - Update venue (owner-required)
- `DELETE /api/venues/:id` - Delete venue (owner-required)

### Availability
- `GET /api/availability/venues/:id` - Get court availability for date

### Cart & Booking
- `GET /api/cart` - View cart (auth-required)
- `POST /api/cart` - Add to cart (auth-required)
- `DELETE /api/cart/:id` - Remove from cart (auth-required)
- `POST /api/bookings` - Create booking (auth-required)
- `GET /api/bookings` - Get user bookings (auth-required)

## Installation

```bash
cd backend
npm install
```

## Environment Setup

Create a `.env` file:

```
DATABASE_URL="mysql://user:password@localhost:3306/pickleball_booking"
JWT_SECRET="your-secret-key"
REDIS_URL="redis://localhost:6379"
PORT=5000
NODE_ENV=development
```

## Running the Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## Database Migrations

```bash
# Run pending migrations
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset
```

## File Uploads

Venue photos are uploaded to `/uploads/venues/` and served as static files via `/uploads/` route.

## License

MIT

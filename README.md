# Pickleball Booking System

A full-stack web application for booking pickleball courts. Users can browse available courts, manage bookings, and venue owners can manage their facilities.

## Project Overview

This is a complete booking platform built with:
- **Backend**: Node.js + Express + Prisma + MySQL
- **Frontend**: React + Vite + Tailwind CSS

## Key Features

✅ **User Management**
- Register & login with JWT authentication
- Profile management with password change
- Role-based access (Owner/Booker)

✅ **Venue Management**
- Create and manage venues with photos
- Dynamic court availability
- Real-time slot management

✅ **Booking System**
- Browse filtered venue availability
- Add bookings to cart
- Conflict detection

✅ **Client Features**
- Responsive mobile-friendly design
- Real-time availability updates
- Shopping cart functionality
- Professional UI/UX

## Project Structure

```
pickleball-booking/
├── backend/                 # Node.js Express API
│   ├── src/
│   ├── prisma/             # Database schema & migrations
│   ├── uploads/            # Photo storage
│   └── README.md           # Backend setup guide
├── frontend/               # React + Vite app
│   ├── pickleball booking system/
│   └── README.md           # Frontend setup guide
└── .gitignore
```

## Quick Start

### Backend Setup

```bash
cd backend
npm install

# Configure .env with database and JWT settings
# Run migrations
npx prisma migrate deploy

# Start server
npm run dev
```

Server runs on `http://localhost:5000`

### Frontend Setup

```bash
cd "frontend/pickleball booking system"
npm install

# Configure .env.local with API URL
# Start dev server
npm run dev
```

App runs on `http://localhost:5173`

## API Documentation

See [backend/README.md](backend/README.md) for complete API documentation.

### Quick API Reference

- **Auth**: `/api/auth/` (register, login, profile, change-password)
- **Venues**: `/api/venues/` (CRUD operations)
- **Availability**: `/api/availability/venues/:id` (get slots)
- **Cart**: `/api/cart/` (manage bookings)
- **Bookings**: `/api/bookings/` (checkout)

## Frontend Routes

| Route | Description | Auth |
|-------|-------------|------|
| `/` | Venue marketplace | Public |
| `/venues/:id` | Venue availability | Public |
| `/cart` | Shopping cart | Required |
| `/bookings` | My bookings | Required |
| `/owner/bookings` | Owner bookings | Owner |
| `/create-venue` | Create new venue | Owner |
| `/profile` | User profile | Required |
| `/auth` | Login/Register | Public |

## Database Schema

### Core Models
- **User** - Authentication & profile (name, email, password, role)
- **Venue** - Sports facilities (name, location, courts, photos, owner)
- **Booking** - User reservations (date, time, court, venue, user)
- **CartItem** - Shopping cart items

## Environment Variables

### Backend (.env)
```
DATABASE_URL=mysql://user:pass@localhost:3306/pickleball_booking
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
PORT=5000
NODE_ENV=development
```

### Frontend (.env.local)
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Technology Stack

### Backend
- Node.js & Express
- Prisma ORM
- MySQL Database
- Redis (caching)
- JWT Authentication
- Bcrypt (password hashing)
- Multer (file uploads)

### Frontend
- React 18
- Vite (build tool)
- Tailwind CSS
- React Router v6
- Axios (HTTP client)
- Context API (state)

## Features in Detail

### Real-time Availability
- Dynamic slot generation (6 AM - 10 PM hourly)
- Court state tracking (AVAILABLE, BOOKED, IN_CART)
- Past-date blocking

### Photo Management
- Multi-photo upload per venue
- First photo as default thumbnail
- Owner ability to reorder/change thumbnail

### Cart & Checkout
- Add bookings to cart
- Conflict detection (overlapping bookings)
- Checkout to create bookings

### Time Display
- 12-hour format display (10:00 PM)
- Timezone-aware calculations

## Error Handling

- Try-catch blocks for async operations
- Graceful degradation (e.g., optional CartItem table)
- User-friendly error messages
- Form validation on frontend & backend

## Performance Optimizations

- Redis caching for cart operations
- Optimized Prisma queries with relations
- Static file serving with Express
- Vite code splitting for frontend

## Security Features

- JWT token-based authentication
- Bcrypt password hashing
- SQL injection prevention (Prisma)
- Role-based access control
- XSS protection via React
- CORS configuration (if needed)

## License

MIT

## Author

Shakti Kadam

---

For detailed setup instructions, see:
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)

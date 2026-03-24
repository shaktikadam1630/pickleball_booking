# Pickleball Booking System - Frontend

React + Vite + Tailwind CSS frontend for the Pickleball Booking System booking platform.

## Features

- **Marketplace Browse**: Filter venues by date, time, and availability
- **Real-time Availability**: View court availability with dynamic slot management
- **Shopping Cart**: Add bookings to cart with conflict detection
- **User Authentication**: Secure login/register with JWT tokens
- **Profile Management**: Edit profile and change password
- **Owner Dashboard**: Create, manage, and monitor venues
- **Responsive Design**: Mobile-friendly booking interface

## Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Routing**: React Router v6
- **Icons**: Inline SVG

## Project Structure

```
frontend/pickleball-booking-system/
├── src/
│   ├── App.jsx                # Root app component & routes
│   ├── main.jsx               # Entry point
│   ├── index.css              # Global styles
│   ├── api/                   # API client wrappers
│   │   ├── client.js          # Axios client with auth
│   │   ├── authApi.js
│   │   ├── venueApi.js
│   │   ├── availabilityApi.js
│   │   ├── cartApi.js
│   │   └── bookingApi.js
│   ├── context/
│   │   └── AuthContext.jsx    # Auth state & JWT management
│   ├── hooks/
│   │   └── useAuth.js         # Auth context hook
│   ├── components/
│   │   ├── auth/
│   │   ├── common/
│   │   └── layout/
│   ├── pages/
│   │   ├── VenuesPage.jsx
│   │   ├── VenueAvailabilityPage.jsx
│   │   ├── CartPage.jsx
│   │   ├── CreateVenuePage.jsx
│   │   ├── BookingsPage.jsx
│   │   ├── OwnerBookingsPage.jsx
│   │   ├── ProfilePage.jsx
│   │   ├── AuthPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── utils/
│   │   └── date.js
│   └── assets/
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind configuration
├── postcss.config.js          # PostCSS configuration
└── package.json
```

## Key Components

### Pages

- **VenuesPage**: Browse and filter venue availability
- **VenueAvailabilityPage**: View detailed court availability with booking options
- **CartPage**: Review and manage bookings before checkout
- **CreateVenuePage**: Venue creation & photo upload (owner-only)
- **BookingsPage**: View user bookings
- **OwnerBookingsPage**: View bookings for owner's venues
- **ProfilePage**: Edit user profile and change password
- **AuthPage**: Login and registration

### Context

**AuthContext**: Manages JWT token, user data, and authentication status
- Stores token in localStorage
- Auto-decodes JWT to get user info
- Provides login/logout/register functions

## Installation

```bash
cd frontend/pickleball\ booking\ system
npm install
```

## Environment Setup

Create a `.env.local` file:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## Time Display

All times are displayed in 12-hour format (e.g., "10:00 PM") for better UX.

## API Integration

Frontend communicates with backend via `/api` endpoints:
- All requests include JWT token in Authorization header
- Token is persisted in localStorage for session recovery
- Automatic token refresh on context load

## Styling

Tailwind CSS with custom configuration for:
- Professional booking platform aesthetic
- Gradient backgrounds and rounded cards
- Responsive mobile/tablet/desktop layouts
- Icon badges and visual hierarchy

## Features in Detail

### Venue Filtering
- Date picker (blocks past dates)
- Time slot selector (6 AM - 10 PM)
- Strict "AVAILABLE" state filtering
- Real-time availability checking

### Photo Management
- Multi-photo upload for venues
- First photo set as thumbnail
- Owner can reorder/change thumbnail

### Cart Management
- Add bookings with conflict detection
- Remove items before checkout
- View booking details and pricing

### Authentication
- JWT token management
- Automatic token persistence
- Auto-logout on token expiry
- Role-based UI (OWNER vs BOOKER)

## License

MIT

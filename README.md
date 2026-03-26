## 🏗️ System Design

![Pickleball System Design](https://github.com/shaktikadam1630/pickleball_booking/blob/main/Pickleball%20court%20booking%20system%20diagram.png)

### 🔹 Overview
The Pickleball Court Booking System is designed to handle real-time slot booking with high concurrency and consistency.

### 🔹 Architecture
- **Frontend**: Web & Mobile apps for user interaction
- **Backend**: Node.js (Express) handles APIs and business logic
- **Redis**: Used for temporary cart storage and slot locking to prevent double booking
- **Database (MySQL + Prisma)**: Stores confirmed bookings and ensures data consistency

### 🔹 Booking Flow
1. User selects a slot → stored in Redis with expiry (lock)
2. During checkout → system validates slot availability
3. Uses DB transaction to avoid race conditions
4. Booking is confirmed → data stored in DB and Redis lock removed

### 🔹 Key Features
- Prevents double booking using Redis locking
- Ensures atomic booking using database transactions
- Handles concurrent users efficiently

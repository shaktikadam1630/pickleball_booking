const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes/authRoutes');
const venueRoutes = require('./routes/venueRoutes/venueRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes/availabilityRoutes');
const cartRoutes = require('./routes/cartRoutes/cartRoutes');
const bookingRoutes = require('./routes/bookingRoutes/bookingRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/auth', authRoutes);
app.use('/venues', venueRoutes);
app.use('/availability', availabilityRoutes);
app.use('/cart', cartRoutes);
app.use('/booking', bookingRoutes);


// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

module.exports = app;
require('dotenv').config();
const app = require('./src/app');
const { PrismaClient } = require('@prisma/client');
const redis = require('./src/config/redis');

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test DB connection
    await prisma.$connect();
    console.log('Database connected successfully');

    if (!redis.isOpen) {
      await redis.connect();
    }
    console.log('Redis connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  try {
    await prisma.$disconnect();
    if (redis.isOpen) await redis.quit();
  } finally {
    process.exit(0);
  }
});

startServer();
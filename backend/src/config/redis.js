const { createClient } = require("redis");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redis = createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: false,
  },
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

module.exports = redis;

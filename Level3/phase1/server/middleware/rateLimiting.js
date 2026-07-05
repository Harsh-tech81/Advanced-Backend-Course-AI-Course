import { redis } from "../index.js";

const rateLimiter = async (req, res, next) => {
  const ip = req.ip;
  const key = `rate-limit:${ip}`;
  const requests = await redis.incr(key);
  if (requests === 1) {
    await redis.expire(key, 60); // Set expiration time of 60 seconds
  }
  if (requests > 5) {
    return res
      .status(429)
      .json({ message: "Too many requests, please try again later." });
  }
  next();
};

export default rateLimiter;



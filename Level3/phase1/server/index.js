import express from "express";
import dotenv from "dotenv";
import connectDB from "./lib/db.js";
import User from "./model/user.model.js";
import Redis from "ioredis";
import rateLimiter from './middleware/rateLimiting.js'
import sendEmail from "./lib/sendEmail.js";
import emailQueue from "./queue.js";
const app = express();
dotenv.config();
// In this Phase of  Redis tutorial we will learn how to use Redis as a cache for our MongoDB database. We will create a simple API that allows us to create and retrieve users from the database, and we will use Redis to cache the results of our queries to improve performance.(API Caching with Redis and MongoDB)
app.use(express.json());
export const redis = new Redis(process.env.REDIS_URL);

const PORT = process.env.PORT || 5000;
const SERVER_NAME = process.env.SERVER_NAME || "Server";
app.get("/", (req, res) => {
  return res.status(200).json({ message: `Hello from Nginx Server ${SERVER_NAME}` });
});
// wihtout Queue(BullMQ) SignUp API 
app.post("/create", async (req, res) => {
  const { name, email, password } = req.body;
  await redis.del("user:all");
  const user = await User.create({ name, email, password });
 await emailQueue.add('send-email', { email });
  return res.status(200).json({ message: "Created New User", user });
});

// In this we have learned about the rate limiting in Redis 
app.get("/get",rateLimiter, async (req, res) => {
  const users = await User.find({});
  return res.status(200).json({ message: "All Users", users });
});

app.get("/get-with-redis", async (req, res) => {
  const cached = await redis.get("user:all");
  if (cached) {
    return res
      .status(200)
      .json({ message: "All Users from Redis", users: JSON.parse(cached) });
  }
  const user = await User.find({});
  await redis.set("user:all", JSON.stringify(user));
  return res
    .status(200)
    .json({ message: "All Users from mongoDB", users: user });
});

// In this phase we've learned the second use case of the Redis which is OTP verification. We will create an API that allows us to send an OTP to a user's email address and verify the OTP entered by the user. We will use Redis to store the OTPs and set an expiration time for them.
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.set(`otp:${email}`, otp, "EX", 30); // OTP expires in 30 seconds
  return res.status(200).json({ message: "OTP sent successfully", otp });
});

app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const cachedOtp = await redis.get(`otp:${email}`);
  if (!cachedOtp) {
    return res.status(400).json({ message: "OTP expired or not found" });
  }
  if (cachedOtp === otp) {
    await redis.del(`otp:${email}`);
    return res.status(200).json({ message: "OTP verified successfully" });
  }
  return res.status(400).json({ message: "Invalid OTP" });
});



app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);
});

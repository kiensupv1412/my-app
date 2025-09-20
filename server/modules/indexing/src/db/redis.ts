import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

let redis: Redis;

export function connectRedis() {
    redis = new Redis(process.env.REDIS_URI!);
    redis.on("connect", () => console.log("✅ Connected to Redis"));
    redis.on("error", (err) => console.error("Redis Error:", err));
    return redis;
}

export function getRedis(): Redis {
    if (!redis) throw new Error("Redis not connected yet!");
    return redis;
}
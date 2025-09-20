import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let db: Db;

export async function connectMongo() {
    const client = new MongoClient(process.env.MONGO_URI!);
    await client.connect();
    db = client.db(process.env.MONGO_DB);
    console.log("✅ Connected to MongoDB:", process.env.MONGO_DB);
    return db;
}

export function getDb(): Db {
    if (!db) throw new Error("MongoDB not connected yet!");
    return db;
}
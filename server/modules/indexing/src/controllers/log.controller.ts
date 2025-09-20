// server/modules/indexing/src/controllers/log.controller.ts
import type { Request, Response } from "express";
import { getDb } from "../db/mongo";

export async function listLogs(req: Request, res: Response) {
    const db = getDb();
    const logs = await db
        .collection("api_logs")
        .find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

    return res.json({ logs });
}
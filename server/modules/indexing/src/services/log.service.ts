import { getDb } from "../db/mongo";

export async function logApiCall(entry: {
    endpoint: string;
    url?: string;
    reqBody?: any;
    status?: number | string;
    resBody?: any;
}) {
    const db = getDb();
    const doc = {
        ...entry,
        createdAt: new Date(),
    };
    await db.collection("api_logs").insertOne(doc);
}
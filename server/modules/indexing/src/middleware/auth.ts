// src/middlewares/auth.ts
import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.user) { // req.user sẽ được gán ở middleware decode JWT / session
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}
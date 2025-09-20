import express from "express";
import dotenv from "dotenv";
import { connectMongo } from "./db/mongo";
import { connectRedis } from "./services/redis";
import authRoutes from "./routes/auth.routes";
import sitesRoutes from "./routes/sites.routes";
import indexingRoutes from "./routes/indexing.routes";
import analyticsRoutes from "./routes/analytics.routes";
import sitemapRoutes from "./routes/sitemap.routes";
import inspectRoutes from "./routes/inspect.routes";
import logRoutes from "./routes/log.routes";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/", authRoutes);
app.use("/", logRoutes);
app.use("/api/sites", analyticsRoutes);
app.use("/api/sites", sitemapRoutes);
app.use("/api/indexing", indexingRoutes);
app.use("/api/sites", sitesRoutes);
app.use("/api/inspect", inspectRoutes);


(async () => {
    await connectMongo();
    connectRedis();

    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log(`🚀 http://localhost:${port}`));
})();
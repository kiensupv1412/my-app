/*
 * path: server/app.js
 */
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const sequelize = require("./models/db");

const authRoutes = require("./routes/auth.routes.js");
const articleRoutes = require("./routes/article.routes");
const mediaRoutes = require("./routes/media.routes");
const folderRoutes = require("./routes/folder.routes");
// const gscRoutes = require('./routes/gsc.routes');

const { errorHandler, multerErrorHandler } = require("./middleware/errors");
const { uploadDynamic } = require("./middleware/multer");

dotenv.config();
const app = express();
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// static: phục vụ /public (bao gồm /public/uploads/...)
app.use(
  express.static(path.join(process.cwd(), "public"), {
    maxAge: "7d",
    immutable: true,
  })
);

// (tuỳ chọn) đảm bảo /uploads trỏ đúng khi bạn đặt Reverse proxy
// app.use('/uploads', express.static(path.join(PUBLIC_DIR, 'uploads'), { maxAge: '7d', immutable: true }));

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Kết nối DB thành công!");
    // đồng bộ model nếu cần
    // await sequelize.sync({ alter: true });
  } catch (e) {
    console.error("❌ Kết nối DB thất bại:", e.message);
  }
})();

app.post("/upload_media", uploadDynamic.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const f = req.file;
  const folder = req.body.folder_id ? `${req.body.folder_id}/` : "";
  const publicUrl = `/uploads/${folder}${f.filename}`;
  res.json({
    data: {
      key: f.filename,
      name: f.originalname,
      size: f.size,
      type: f.mimetype,
      url: publicUrl,
    },
  });
});

// routes
app.use("/article", articleRoutes);
app.use("/media", mediaRoutes);
app.use("/folders", folderRoutes);
// app.use('/gsc', gscRoutes);
app.get("/health", (req, res) => res.json({ ok: true }));

// error handlers
app.use(multerErrorHandler);
app.use(errorHandler);

module.exports = app;

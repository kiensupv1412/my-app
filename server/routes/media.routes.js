/*
 * path: server/routes/media.routes.js
 */
const router = require("express").Router();
const ctrl = require("../controllers/media.controller");
const { uploadDynamic } = require("../middleware/multer");
const { resolveFolderById } = require("../middleware/resolve-folder");

// GET /media?page=&pageSize=&q=&folder_id=(null|id)
router.get("/", resolveFolderById, ctrl.list);

// POST /media/upload?folder_id=... | body.folder_slug=...
router.post(
  "/upload",
  resolveFolderById, // gán req._folderSlug nếu nhận folder_id
  uploadDynamic.single("file"), // lưu đúng thư mục
  ctrl.uploads
);

// POST /media/uploads?folder_id=...
router.post(
  "/uploads",
  resolveFolderById,
  uploadDynamic.array("files", 20),
  ctrl.uploads
);

// DELETE /media/:id
router.delete("/:id", ctrl.remove);

module.exports = router;

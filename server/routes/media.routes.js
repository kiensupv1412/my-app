/*
 * path: server/routes/media.routes.js
 */
const router = require("express").Router();
const ctrl = require("../controllers/media.controller");
const { auth } = require("../middleware/auth");
const { uploadDynamic } = require("../middleware/multer");
const { resolveFolderById } = require("../middleware/resolve-folder");

// GET /media?page=&pageSize=&q=&folder_id=(null|id)
router.get("/", auth, resolveFolderById, ctrl.list);

// POST /media/upload
router.post("/upload", auth, uploadDynamic.single("file"), ctrl.uploads);

// POST /media/uploads
// router.post("/uploads", auth, uploadDynamic.array("files", 20), ctrl.uploads);

// UPDATE /media/update/:id
router.post("/update/:id", auth, ctrl.update);

// DELETE /media/:id
router.delete("/:id", auth, ctrl.remove);

module.exports = router;

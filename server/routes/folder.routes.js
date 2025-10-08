/*
 * path: server/routes/folder.routes.js
 */
const router = require("express").Router();
const folderCtl = require("../controllers/folder.controller");
const { auth } = require("../middleware/auth");

// GET /folders?
router.get("/", auth, folderCtl.list);

// POST /folders
router.post("/", auth, folderCtl.create);

// DELETE /folders/:id
router.delete("/:id", auth, folderCtl.remove);

module.exports = router;

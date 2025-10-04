/*
 * path: server/routes/folder.routes.js
 */
const router = require("express").Router();
const folderCtl = require("../controllers/folder.controller");

// GET /folders?
router.get("/", folderCtl.list);

// POST /folders
router.post("/", folderCtl.create);

// DELETE /folders/:id
router.delete("/:id", folderCtl.remove);

module.exports = router;

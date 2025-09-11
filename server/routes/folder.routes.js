/*
 * path: server/routes/folder.routes.js
 */
const router = require('express').Router();
const folderCtl = require('../controllers/folder.controller');

// GET /folders?site=0
router.get('/', folderCtl.list);

// POST /folders  { name, site }
router.post('/', folderCtl.create);

// DELETE /folders/:id
router.delete('/:id', folderCtl.remove);

module.exports = router;
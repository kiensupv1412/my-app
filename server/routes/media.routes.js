/*
 * path: server/routes/media.routes.js
 */
const router = require('express').Router();
const { uploadDynamic } = require('../helpers/upload');
const ctrl = require('../controllers/media.controller');
const { resolveFolderById } = require('../middleware/resolve-folder');

// GET /media?page=&pageSize=&q=&folder_id=(null|id)
router.get('/', ctrl.list);

// POST /media/upload?folder_id=... | body.folder_slug=...
router.post(
    '/upload',
    resolveFolderById, // gán req._folderSlug nếu nhận folder_id
    uploadDynamic.single('file'), // lưu đúng thư mục
    ctrl.uploadOne
);

// POST /media/uploads?folder_id=...
router.post(
    '/uploads',
    resolveFolderById,
    uploadDynamic.array('files', 20),
    ctrl.uploadMany
);

// DELETE /media/:id
router.delete('/:id', ctrl.remove);

module.exports = router;
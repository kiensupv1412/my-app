const router = require('express').Router()
const ctrl = require('../controllers/article.controller')

router.get('/', ctrl.getArticles) // GET /article
router.post('/', ctrl.postArticle) // GET /article
router.get('/categories', ctrl.getCategories) // GET /article/categories
router.get('/:id', ctrl.getArticle) // GET /article/:id
router.put('/update/:id', ctrl.updateArticleOne) // POST /article/update
router.post('/update_all', ctrl.updateArticleBulk) // POST /article/update_all
router.patch('/:id/thumb', ctrl.setThumb) // PATCH /article/:id/thumb

module.exports = router
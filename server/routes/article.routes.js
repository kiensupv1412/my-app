const router = require("express").Router();
const ctrl = require("../controllers/article.controller");

router.get("/", ctrl.getArticles); // GET /article
router.get("/categories", ctrl.getCategories); // GET /article/categories
router.get("/tags/search", ctrl.searchTags); // GET /article/tags
router.get("/:id", ctrl.getArticle); // GET /article/:id
router.post("/slug/:slug", ctrl.checkSlugAvailability); // GET /article/slug/:slug
router.post("/", ctrl.postArticle); // POST /article
router.put("/update/:id", ctrl.updateArticleOne); // PUT /article/update/:id

module.exports = router;

const router = require("express").Router();
const ctrl = require("../controllers/article.controller");
const { auth } = require("../middleware/auth");

router.get("/", auth, ctrl.getArticles); // GET /article
router.get("/categories", auth, ctrl.getCategories); // GET /article/categories
router.get("/tags/search", auth, ctrl.searchTags); // GET /article/tags
router.get("/:id", auth, ctrl.getArticle); // GET /article/:id
router.post("/slug/:slug", auth, ctrl.checkSlugAvailability); // GET /article/slug/:slug
router.post("/", auth, ctrl.postArticle); // POST /article
router.put("/update/:id", auth, ctrl.updateArticleOne); // PUT /article/update/:id

module.exports = router;

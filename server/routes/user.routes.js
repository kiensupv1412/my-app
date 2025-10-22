const { Router } = require("express");
const { asyncWrap } = require("../utils/http");
const { getSession } = require("../controllers/user.controller");

const router = Router();

// Trả session hiện tại (giống /api/_auth/session bên Nitro)
router.get("/session", asyncWrap(getSession));

module.exports = router;

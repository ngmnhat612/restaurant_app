// account-service/src/routes/accountRoutes.js

const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");

// Định nghĩa route đăng nhập
// Khi client gửi POST /accounts/login → gọi accountController.login
router.post("/login", accountController.login);

module.exports = router;

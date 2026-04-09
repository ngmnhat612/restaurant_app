// order-service/src/routes/tableRoutes.js

const express = require("express");
const router = express.Router();
const tableController = require("../controllers/tableController");

// ✅ Middleware để inject io vào req
router.use((req, res, next) => {
  req.io = req.app.get('io');
  next();
});

// Mở bàn
router.put("/:number/open", tableController.openTable);

// Đóng bàn
router.put("/:number/close", tableController.closeTable);

// Lấy danh sách bàn
router.get("/", tableController.getTables);

module.exports = router;
// order-service/src/routes/billRoutes.js

const express = require("express");
const router = express.Router();
const billController = require("../controllers/billController");

// Tạo hóa đơn mới
router.post("/", billController.createBill);

// Lấy danh sách hóa đơn
router.get("/", billController.getAllBills);

// ✅ Kiểm tra bàn có Bill chưa thanh toán không
router.get("/check/:tableNumber", billController.checkTableBill);

// Cập nhật trạng thái hóa đơn
router.put("/:id/status", billController.updateBillStatus);

module.exports = router;
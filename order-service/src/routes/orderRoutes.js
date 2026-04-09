// order-service/src/routes/orderRoutes.js

const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Khách hàng gọi món (tạo đơn hàng mới)
router.post("/", orderController.createOrder);

// Lấy danh sách đơn hàng
router.get("/", orderController.getOrders);

// ✅ Cập nhật trạng thái từng món trong đơn hàng
router.put("/:orderId/dishes/:dishId", orderController.updateDishStatus);

// ✅ Hoàn thành đơn hàng - KHÔNG có middleware
router.put("/:orderId/complete", orderController.completeOrder);

module.exports = router;
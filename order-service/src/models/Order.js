// order-service/src/models/Order.js

const mongoose = require("mongoose");

const OrderDetailSchema = new mongoose.Schema({
  DishName: { type: String, required: true },
  Quantity: { type: Number, required: true },
  Total: { type: Number, required: true },
  Status: { type: String, default: "Chờ" },
  Note: { type: String }
});

const OrderSchema = new mongoose.Schema({
  OrderID: { type: String, required: true, unique: true },
  BillID: { type: String, required: true },
  BranchID: { type: String, required: true, ref: "Branch" },
  TableNumber: { type: Number, required: true },
  OrderCreatedTime: { type: Date, default: Date.now },
  OrderStatus: { type: String, default: "Chưa hoàn thành" },
  OrderTotalAmount: { type: Number, required: true },
  OrderDetails: [OrderDetailSchema]
});

module.exports = mongoose.model("Order", OrderSchema);
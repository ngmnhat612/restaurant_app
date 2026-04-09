// order-service/src/models/Bill.js

const mongoose = require("mongoose");

// Schema cho hóa đơn
const BillSchema = new mongoose.Schema({
  BillID: { type: String, required: true, unique: true },        // Mã hóa đơn (B00001, B00002...)
  TableNumber: { type: Number, required: true },                 // Số bàn
  AccountCode: { type: String, default: null },                 // Người quản lý tạo hóa đơn
  BillCreatedTime: { type: Date, default: Date.now },            // Thời gian tạo hóa đơn
  Orders: [{ type: String }],                                    // Danh sách mã Order liên quan
  BillStatus: { type: String, enum: ["Đã thanh toán", "Chưa thanh toán"], default: "Chưa thanh toán" }, // Trạng thái hóa đơn
  BillTotalAmount: { type: Number, required: true }              // Tổng tiền hóa đơn
});

module.exports = mongoose.model("Bill", BillSchema);

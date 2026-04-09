// order-service/src/models/Table.js

const mongoose = require("mongoose");

// Schema cho bàn
const TableSchema = new mongoose.Schema({
  AccountCode: { type: String, required: true, unique: true },   // Mã bàn (ban01, ban02...)
  TableNumber: { type: Number, required: true },                 // Số bàn
  TableStatus: { type: String, enum: ["Trống", "Đang sử dụng"], default: "Trống" } // Trạng thái bàn
});

module.exports = mongoose.model("Table", TableSchema);

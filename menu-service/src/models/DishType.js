// menu-service/src/model/DishType.js

const mongoose = require("mongoose");

// Schema cho loại món ăn
const DishTypeSchema = new mongoose.Schema({
  DishTypeCode: { type: String, required: true, unique: true }, // LAU, KHAIVI, GOITHEM, THUCUONG
  DishTypeName: { type: String, required: true }                // Lẩu, Món khai vị, Món gọi thêm, Thức uống
});

module.exports = mongoose.model("DishType", DishTypeSchema);

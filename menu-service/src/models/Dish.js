// menu-service/src/model/Dish.js

const mongoose = require("mongoose");

// Schema cho món ăn
const DishSchema = new mongoose.Schema({
  DishID: { type: String, required: true, unique: true },          // Mã món ăn (L01, L02...)
  DishTypeCode: { type: String, required: true, ref: "DishType" }, // Loại món ăn
  DishName: { type: String, required: true },                      // Tên món ăn
  DishPrice: { type: Number, required: true },                     // Giá tiền
  DishStatus: { type: String, enum: ["Còn", "Hết"], default: "Còn" }, // Trạng thái món ăn
  DishImage: { type: String },                                     // Đường dẫn ảnh (/images/...)
  DishDescription: { type: String }                                // Mô tả món ăn
});

module.exports = mongoose.model("Dish", DishSchema);

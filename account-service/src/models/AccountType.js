// account-service/src/models/AccountType.js

const mongoose = require("mongoose");

// Định nghĩa schema cho loại tài khoản (AccountType)
// Ví dụ: MANAGER (Quản lý), KITCHEN (Bếp), TABLE (Bàn)
const AccountTypeSchema = new mongoose.Schema({
  AccountTypeCode: { type: String, required: true, unique: true }, // Mã loại tài khoản (MANAGER, KITCHEN, TABLE)
  AccountTypeName: { type: String, required: true }                // Tên hiển thị (Quản lý, Bếp, Bàn)
});

// Xuất model để sử dụng trong các file khác
module.exports = mongoose.model("AccountType", AccountTypeSchema);

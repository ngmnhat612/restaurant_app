// account-service/src/models/Account.js

const mongoose = require("mongoose");

// Định nghĩa schema cho tài khoản người dùng
const AccountSchema = new mongoose.Schema({
  AccountCode: { type: String, required: true, unique: true },
  AccountName: { type: String, required: true },
  AccountPassword: { type: String },
  AccountTypeCode: { type: String, required: true, ref: "AccountType" },
  BranchID: { type: String, ref: "Branch" }  // ✅ THÊM: Liên kết với chi nhánh
});

module.exports = mongoose.model("Account", AccountSchema);
// menu-service/src/model/BranchMenu.js

const mongoose = require("mongoose");

// Schema cho thực đơn theo từng chi nhánh
// Cho phép mỗi chi nhánh tùy chỉnh giá và trạng thái món ăn
const BranchMenuSchema = new mongoose.Schema({
  BranchID: { 
    type: String, 
    required: true,
    ref: "Branch"
  },
  DishID: { 
    type: String, 
    required: true,
    ref: "Dish"
  },
  IsAvailable: { 
    type: Boolean, 
    default: true 
  },
  BranchPrice: { 
    type: Number  // Giá riêng cho chi nhánh (nếu null thì dùng giá gốc)
  }
});

// Index compound để tránh trùng lặp
BranchMenuSchema.index({ BranchID: 1, DishID: 1 }, { unique: true });

module.exports = mongoose.model("BranchMenu", BranchMenuSchema);
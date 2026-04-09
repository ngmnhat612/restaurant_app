// branch-service/src/data/Branch.js

const mongoose = require("mongoose");

// Schema cho chi nhánh nhà hàng
const BranchSchema = new mongoose.Schema({
  BranchID: { 
    type: String, 
    required: true, 
    unique: true 
  },
  BranchCode: { 
    type: String, 
    required: true, 
    unique: true 
  },
  BranchName: { 
    type: String, 
    required: true 
  },
  BranchAddress: { 
    type: String, 
    required: true 
  },
  BranchPhone: { 
    type: String, 
    required: true 
  },
  BranchStatus: { 
    type: String, 
    enum: ["Hoạt động", "Tạm đóng", "Ngừng hoạt động"], 
    default: "Hoạt động" 
  },
  BranchCreatedTime: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Branch", BranchSchema);
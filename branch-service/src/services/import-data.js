// branch-service/src/services/import-data.js

const mongoose = require("mongoose");
const Branch = require("../models/Branch");
const branches = require("../data/branch.json");

// Kết nối MongoDB
mongoose.connect("mongodb://localhost:27017/restaurant", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function importData() {
  try {
    // Xóa dữ liệu cũ
    await Branch.deleteMany();

    // Import dữ liệu chi nhánh
    await Branch.insertMany(branches);

    console.log("✅ Branch data imported successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Import error:", err);
    process.exit(1);
  }
}

importData();
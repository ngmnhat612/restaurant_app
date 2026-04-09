const mongoose = require("mongoose");
const Ingredient = require("../models/Ingredient");
const BranchInventory = require("../models/BranchInventory");
const ingredients = require("../data/ingredient.json");
const branchInventory = require("../data/branch_inventory.json");

// Kết nối MongoDB
mongoose.connect("mongodb://localhost:27017/restaurant", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function importData() {
  try {
    // Xóa dữ liệu cũ
    await Ingredient.deleteMany();
    await BranchInventory.deleteMany();

    // Import dữ liệu nguyên liệu
    await Ingredient.insertMany(ingredients);
    console.log("✅ Ingredients imported");

    // Import dữ liệu tồn kho theo chi nhánh
    await BranchInventory.insertMany(branchInventory);
    console.log("✅ Branch inventory imported");

    console.log("✅ Ingredient-service data imported successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Import error:", err);
    process.exit(1);
  }
}

importData();
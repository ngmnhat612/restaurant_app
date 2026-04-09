// menu-service/src/services/import-data.js

const mongoose = require("mongoose");
const DishType = require("../models/DishType");
const Dish = require("../models/Dish");
const BranchMenu = require("../models/BranchMenu");

const dishTypes = require("../data/dish_type.json");
const dishes = require("../data/dish.json");
const branchMenu = require("../data/branch_menu.json");

// Kết nối MongoDB
mongoose.connect("mongodb://localhost:27017/restaurant", { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

async function importData() {
  try {
    // Xóa dữ liệu cũ
    await DishType.deleteMany();
    await Dish.deleteMany();
    await BranchMenu.deleteMany();

    // Import loại món ăn
    await DishType.insertMany(dishTypes);
    console.log("✅ DishTypes imported");

    // Import món ăn
    await Dish.insertMany(dishes);
    console.log("✅ Dishes imported");

    // Import thực đơn theo chi nhánh
    await BranchMenu.insertMany(branchMenu);
    console.log("✅ Branch menu imported");

    console.log("✅ Menu-service data imported successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Import error:", err);
    process.exit(1);
  }
}

importData();

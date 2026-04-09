// menu-service/src/controllers/dishController.js

const Dish = require("../models/Dish");

// Lấy tất cả món ăn
exports.getAll = async (req, res) => {
  const dishes = await Dish.find();
  res.json(dishes);
};

// ✅ Thêm món ăn mới - Emit socket
exports.create = async (req, res) => {
  try {
    const dish = new Dish(req.body);
    await dish.save();
    
    // ✅ Emit realtime: Món mới được thêm
    console.log("📡 Emit dishAdded:", dish.DishName);
    req.io.emit("dishAdded", dish);
    
    res.status(201).json(dish);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Cập nhật món ăn - Emit socket
exports.update = async (req, res) => {
  try {
    const dish = await Dish.findOneAndUpdate(
      { DishID: req.params.id },
      req.body,
      { new: true }
    );

    if (!dish) {
      return res.status(404).json({ error: "Không tìm thấy món ăn" });
    }

    // ✅ Emit realtime: Món được cập nhật
    console.log("📡 Emit dishUpdated:", dish.DishName);
    req.io.emit("dishUpdated", dish);
    
    // ✅ Nếu cập nhật trạng thái Còn/Hết, cũng emit dishStatusChanged
    if (req.body.DishStatus) {
      console.log("📡 Emit dishStatusChanged:", dish.DishName, "→", dish.DishStatus);
      req.io.emit("dishStatusChanged", dish);
    }

    res.json(dish);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Xóa món ăn - Emit socket
exports.delete = async (req, res) => {
  try {
    const dish = await Dish.findOneAndDelete({ DishID: req.params.id });
    
    if (!dish) {
      return res.status(404).json({ error: "Không tìm thấy món ăn" });
    }
    
    // ✅ Emit realtime: Món bị xóa
    console.log("📡 Emit dishDeleted:", req.params.id);
    req.io.emit("dishDeleted", req.params.id);
    
    res.json({ message: "Dish deleted", deletedDishID: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Bật/tắt trạng thái (giữ lại để tương thích với KitchenPage)
exports.toggleStatus = async (req, res) => {
  try {
    const dish = await Dish.findOne({ DishID: req.params.id });
    if (!dish) {
      return res.status(404).json({ error: "Không tìm thấy món ăn" });
    }

    dish.DishStatus = dish.DishStatus === "Còn" ? "Hết" : "Còn";
    await dish.save();

    console.log("📡 Emit dishStatusChanged:", dish.DishName, "→", dish.DishStatus);
    req.io.emit("dishStatusChanged", dish);

    res.json(dish);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
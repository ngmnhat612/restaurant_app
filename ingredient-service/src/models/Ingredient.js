// ingredient-service/src/models/Ingredient.js

const mongoose = require("mongoose");

// Schema cho nguyên liệu tổng (master list)
const IngredientSchema = new mongoose.Schema({
  IngredientID: { 
    type: String, 
    required: true, 
    unique: true 
  },
  IngredientName: { 
    type: String, 
    required: true 
  },
  Unit: { 
    type: String, 
    required: true 
  },
  Category: { 
    type: String, 
    enum: ["Thịt", "Rau", "Rau củ", "Hải sản", "Gia vị", "Thức uống", "Tinh bột"],
    required: true
  }
});

module.exports = mongoose.model("Ingredient", IngredientSchema);
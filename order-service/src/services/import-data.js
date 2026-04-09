// order-service/src/services/import-data.js

const mongoose = require("mongoose");
const Bill = require("../models/Bill");
const Table = require("../models/Table");
const Order = require("../models/Order");

const bills = require("../data/bill.json");
const tables = require("../data/table.json");
const orders = require("../data/order.json");

// Kết nối MongoDB
mongoose.connect("mongodb://localhost:27017/restaurant", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function importData() {
  try {
    // Xóa dữ liệu cũ để tránh trùng lặp
    await Bill.deleteMany();
    await Table.deleteMany();
    await Order.deleteMany();

    // Import dữ liệu mới từ JSON
    await Bill.insertMany(bills);
    await Table.insertMany(tables);
    await Order.insertMany(orders);

    console.log("Order-service data imported successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Thực thi hàm import
importData();

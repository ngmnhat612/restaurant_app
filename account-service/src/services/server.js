// account-service/src/services/server.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const accountRoutes = require("../routes/accountRoutes");

const app = express();
app.use(cors());            // Cho phép gọi API từ frontend khác domain
app.use(express.json());    // Parse JSON body từ request

// Kết nối MongoDB
mongoose.connect("mongodb://localhost:27017/restaurant", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Mount routes với prefix chuẩn
app.use("/api/accounts", accountRoutes);

// Chạy server tại port 3001
app.listen(3001, () => {
  console.log("Account service running on port 3001");
});

// order-service/src/services/server.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const orderRoutes = require("../routes/orderRoutes");
const tableRoutes = require("../routes/tableRoutes");
const billRoutes = require("../routes/billRoutes");

const app = express();
const server = http.createServer(app);

// ✅ Setup Socket.IO với cấu hình đầy đủ
const io = new Server(server, { 
  cors: { 
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  } 
});

app.use(cors());
app.use(express.json());

// ✅ Lưu io vào app để dùng trong controllers
app.set('io', io);

// ✅ Cache control
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Kết nối MongoDB
mongoose.connect("mongodb://localhost:27017/restaurant", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Order-service MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Mount routes với prefix chuẩn
app.use("/api/orders", orderRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/bills", billRoutes);

// ✅ Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("🔌 Client connected to order-service:", socket.id);
  
  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected from order-service:", socket.id);
  });
});

// Chạy server
server.listen(3003, () => {
  console.log("🚀 Order service running on port 3003");
  console.log("🔌 Socket.IO ready on ws://localhost:3003");
});
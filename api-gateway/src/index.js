// api-gateway/src/index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const { io: SocketIOClient } = require("socket.io-client");
const forwardRequest = require("./utils/forward");
const authMiddleware = require("./middleware/auth");

dotenv.config();
const app = express();

// ✅ Tạo HTTP server để gắn Socket.IO
const server = http.createServer(app);

// ✅ Khởi tạo Socket.IO server trên Gateway
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

app.use(cors());

// ✅ CHỈ THAY ĐỔI PHẦN NÀY - thay vì app.use(express.json())
app.use((req, res, next) => {
  // Bỏ qua JSON parser nếu là upload file
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    console.log("🔓 Skipping JSON parser for file upload");
    return next();
  }
  express.json()(req, res, next);
});

// ✅ Middleware để inject io vào req (cho order-service)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ===== SOCKET.IO PROXY =====

// 1. Kết nối tới menu-service socket
const menuSocket = SocketIOClient("http://localhost:3002");

menuSocket.on("connect", () => {
  console.log("✅ Gateway connected to menu-service socket");
});

// Event: Thay đổi trạng thái Còn/Hết
menuSocket.on("dishStatusChanged", (dish) => {
  console.log("📡 Gateway nhận từ menu-service:", dish.DishName, "→", dish.DishStatus);
  io.emit("dishStatusChanged", dish);
});

// ✅ Event: Thêm món
menuSocket.on("dishAdded", (dish) => {
  console.log("📡 Gateway nhận dishAdded:", dish.DishName);
  io.emit("dishAdded", dish);
});

// ✅ Event: Cập nhật món
menuSocket.on("dishUpdated", (dish) => {
  console.log("📡 Gateway nhận dishUpdated:", dish.DishName);
  io.emit("dishUpdated", dish);
});

// ✅ Event: Xóa món
menuSocket.on("dishDeleted", (dishID) => {
  console.log("📡 Gateway nhận dishDeleted:", dishID);
  io.emit("dishDeleted", dishID);
});

menuSocket.on("disconnect", () => {
  console.log("❌ Gateway disconnected from menu-service");
});

// 2. Kết nối tới order-service socket
const orderSocket = SocketIOClient("http://localhost:3003");

orderSocket.on("connect", () => {
  console.log("✅ Gateway connected to order-service socket");
});

// Lắng nghe đơn hàng mới từ order-service
orderSocket.on("newOrder", (order) => {
  console.log("📡 Gateway nhận newOrder từ order-service:", order.OrderID);
  io.emit("newOrder", order);
});

// Lắng nghe cập nhật trạng thái món
orderSocket.on("dishStatusUpdated", (data) => {
  console.log("📡 Gateway nhận dishStatusUpdated:", data.OrderID);
  io.emit("dishStatusUpdated", data);
});

// Lắng nghe hoàn thành đơn
orderSocket.on("orderCompleted", (data) => {
  console.log("📡 Gateway nhận orderCompleted:", data.OrderID);
  io.emit("orderCompleted", data);
});

// Lắng nghe bàn được mở
orderSocket.on("tableOpened", (table) => {
  console.log("📡 Gateway nhận tableOpened từ order-service:", table.TableNumber);
  io.emit("tableOpened", table);
});

// Lắng nghe bàn được đóng
orderSocket.on("tableClosed", (table) => {
  console.log("📡 Gateway nhận tableClosed từ order-service:", table.TableNumber);
  io.emit("tableClosed", table);
});

// Lắng nghe cập nhật Bill
orderSocket.on("billStatusChanged", (bill) => {
  console.log("📡 Gateway nhận billStatusChanged:", bill.BillID, "→", bill.BillStatus);
  io.emit("billStatusChanged", bill);
});

orderSocket.on("disconnect", () => {
  console.log("❌ Gateway disconnected from order-service");
});

// ===== REST API ROUTES =====

// Forward tới account-service
app.use("/accounts", (req, res) => {
  forwardRequest(process.env.ACCOUNT_SERVICE_URL + "/api/accounts", req, res);
});

// Forward tới menu-service
app.use("/menu", authMiddleware, (req, res) => {
  forwardRequest(process.env.MENU_SERVICE_URL + "/api", req, res);
});

// Route xử lý hình ảnh
app.use('/images', (req, res) => {
  forwardRequest(process.env.MENU_SERVICE_URL, req, res);
});

// Forward tới order-service cho tables (không cần auth)
app.use("/tables", (req, res) => {
  forwardRequest(process.env.ORDER_SERVICE_URL + "/api", req, res);
});

// Forward tới order-service (cần xác thực)
app.use("/orders", (req, res) => {
  console.log("📍 Orders route hit:", req.method, req.url);
  forwardRequest(process.env.ORDER_SERVICE_URL + "/api/orders", req, res);
});

app.use("/bills", authMiddleware, (req, res) => {
  forwardRequest(process.env.ORDER_SERVICE_URL + "/api/bills", req, res);
});

// ✅ THÊM: Forward tới branch-service
app.use("/branches", authMiddleware, (req, res) => {
  forwardRequest(process.env.BRANCH_SERVICE_URL + "/api/branches", req, res);
});

// ✅ THÊM: Forward tới ingredient-service
app.use("/ingredients", authMiddleware, (req, res) => {
  forwardRequest(process.env.INGREDIENT_SERVICE_URL + "/api/ingredients", req, res);
});

// ✅ Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("🔌 Client connected to Gateway:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected from Gateway:", socket.id);
  });
});

// ✅ Chạy server với Socket.IO
server.listen(3000, () => {
  console.log("🚀 API Gateway running on port 3000");
  console.log("🔌 Socket.IO ready on ws://localhost:3000");
});
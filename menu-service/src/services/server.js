// menu-service/src/services/server.js

const express = require("express");
const path = require('path');
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const dishRoutes = require("../routes/dishRoutes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Cho phép controller sử dụng io để emit sự kiện realtime
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cors());
app.use(express.json());

// __dirname = .../menu-service/src/services
app.use('/images', express.static(path.join(__dirname, '../../public/images')));

// Kết nối MongoDB
mongoose.connect("mongodb://localhost:27017/restaurant", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Mount routes với prefix chuẩn
app.use("/api/dishes", dishRoutes);

// Import socket handler
require("../sockets/menuSocket")(io);

// Chạy server
server.listen(3002, () => {
  console.log("Menu service running on port 3002");
});

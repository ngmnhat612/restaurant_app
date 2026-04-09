// menu-service/src/sockets/menuSocket.js

// ✅ Chỉ cần log connection, KHÔNG cần xử lý logic
// Vì Gateway sẽ kết nối vào đây như 1 client bình thường

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("✅ Client connected to menu-service:", socket.id);

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });

    // ⚠️ KHÔNG CẦN xử lý "dishStatusChanged" ở đây nữa
    // Vì Controller sẽ emit trực tiếp qua req.io.emit()
  });
};
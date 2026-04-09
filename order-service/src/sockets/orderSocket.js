// order-service/src/sockets/orderSocket.js

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Client connected to order-service:", socket.id);

    // Khi có đơn hàng mới
    socket.on("newOrder", (order) => {
      console.log("New order received:", order.OrderID);
    });

    // Khi bàn được mở
    socket.on("tableOpened", (table) => {
      console.log("Table opened:", table.TableNumber);
    });

    // Khi bàn được đóng
    socket.on("tableClosed", (table) => {
      console.log("Table closed:", table.TableNumber);
    });

    // Khi trạng thái hóa đơn thay đổi
    socket.on("billStatusChanged", (bill) => {
      console.log("Bill status changed:", bill.BillID, bill.BillStatus);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};

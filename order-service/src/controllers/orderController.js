// order-service/src/controllers/orderController.js

const Order = require("../models/Order");
const Bill = require("../models/Bill");

// ✅ Hàm tạo OrderID tự động
const generateOrderID = async () => {
  const lastOrder = await Order.findOne().sort({ OrderID: -1 }).limit(1);
  
  if (!lastOrder) return "O00001";
  
  const lastNumber = parseInt(lastOrder.OrderID.substring(1));
  const newNumber = lastNumber + 1;
  return "O" + newNumber.toString().padStart(5, "0");
};

// ✅ Hàm tạo BillID tự động
const generateBillID = async () => {
  const lastBill = await Bill.findOne().sort({ BillID: -1 }).limit(1);
  
  if (!lastBill) return "B00001";
  
  const lastNumber = parseInt(lastBill.BillID.substring(1));
  const newNumber = lastNumber + 1;
  return "B" + newNumber.toString().padStart(5, "0");
};

// ✅ Khách hàng gọi món (tạo đơn hàng mới)
exports.createOrder = async (req, res) => {
  try {
    const { TableNumber, OrderDetails } = req.body;

    // 1. Kiểm tra xem bàn đã có Bill chưa thanh toán chưa?
    let bill = await Bill.findOne({ 
      TableNumber, 
      BillStatus: "Chưa thanh toán" 
    });

    let billID;

    // 2. Nếu chưa có Bill → Tạo Bill mới
    if (!bill) {
      billID = await generateBillID();
      
      bill = new Bill({
        BillID: billID,
        TableNumber,
        AccountCode: null,
        BillCreatedTime: new Date(),
        Orders: [],
        BillStatus: "Chưa thanh toán",
        BillTotalAmount: 0
      });

      await bill.save();
      console.log(`✅ Tạo Bill mới: ${billID} cho bàn ${TableNumber}`);
    } else {
      billID = bill.BillID;
      console.log(`📋 Sử dụng Bill hiện tại: ${billID} cho bàn ${TableNumber}`);
    }

    // 3. Tạo OrderID mới
    const orderID = await generateOrderID();

    // 4. Tính tổng tiền order
    const orderTotalAmount = OrderDetails.reduce((sum, item) => {
      return sum + (item.DishPrice * item.Quantity);
    }, 0);

    // 5. Chuyển đổi OrderDetails sang format MongoDB
    const formattedDetails = OrderDetails.map(item => ({
      DishName: item.DishName,
      Quantity: item.Quantity,
      Total: item.DishPrice * item.Quantity,
      Status: "Chờ",
      Note: item.Note || ""
    }));

    // 6. Tạo Order mới
    const order = new Order({
      OrderID: orderID,
      BillID: billID,
      TableNumber,
      OrderCreatedTime: new Date(),
      OrderStatus: "Chưa hoàn thành",
      OrderTotalAmount: orderTotalAmount,
      OrderDetails: formattedDetails
    });

    await order.save();

    // 7. Cập nhật Bill: thêm OrderID và cộng tổng tiền
    bill.Orders.push(orderID);
    bill.BillTotalAmount += orderTotalAmount;
    await bill.save();

    console.log(`✅ Tạo Order mới: ${orderID} với ${OrderDetails.length} món`);

    // ✅ Emit realtime qua order-service socket để Gateway forward
    const io = req.app.get('io');
    if (io) {
      io.emit("newOrder", order);
      console.log("📡 Order-service emit newOrder:", orderID);
    }

    res.status(201).json({ 
      success: true,
      order,
      billID 
    });

  } catch (err) {
    console.error("❌ Lỗi createOrder:", err);
    res.status(400).json({ error: err.message });
  }
};

// ✅ Lấy đơn hàng (có thể filter theo tableNumber)
exports.getOrders = async (req, res) => {
  try {
    const { tableNumber } = req.query;
    
    const filter = tableNumber ? { TableNumber: parseInt(tableNumber) } : {};
    const orders = await Order.find(filter).sort({ OrderCreatedTime: -1 });
    
    console.log(`📦 Lấy ${orders.length} đơn hàng${tableNumber ? ` cho bàn ${tableNumber}` : ''}`);
    
    res.json(orders);
  } catch (err) {
    console.error("❌ Lỗi getOrders:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ MỚI: Cập nhật trạng thái từng món trong đơn hàng
// orderController.js
exports.updateDishStatus = async (req, res) => {
  try {
    const { orderId, dishId } = req.params;
    const { Status } = req.body;

    console.log(`🔄 Cập nhật món ${dishId} trong đơn ${orderId}`);

    const order = await Order.findOne({ OrderID: orderId });
    
    if (!order) {
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }

    // ✅ Tìm món theo _id
    const dishIndex = order.OrderDetails.findIndex(
      d => d._id.toString() === dishId
    );

    if (dishIndex === -1) {
      console.error(`❌ Không tìm thấy món ${dishId}`);
      return res.status(404).json({ error: "Không tìm thấy món trong đơn hàng" });
    }

    // Cập nhật
    order.OrderDetails[dishIndex].Status = Status;
    console.log(`  ↳ Cập nhật "${order.OrderDetails[dishIndex].DishName}": → ${Status}`);

    await order.save();

    // Emit socket
    const io = req.app.get('io');
    if (io) {
      io.emit("dishStatusUpdated", {
        OrderID: orderId,
        TableNumber: order.TableNumber,
        UpdatedOrder: order
      });
    }

    res.json({ success: true, order });

  } catch (err) {
    console.error("❌ Lỗi updateDishStatus:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ MỚI: Hoàn thành đơn hàng
// order-service/src/controllers/orderController.js

// order-service/src/controllers/orderController.js

exports.completeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(`✅ Hoàn thành đơn ${orderId}`);

    const order = await Order.findOne({ OrderID: orderId });
    
    if (!order) {
      console.error(`❌ Không tìm thấy order ${orderId}`);
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }

    console.log(`📦 Tìm thấy order:`, order.OrderID, `- Trạng thái hiện tại:`, order.OrderStatus);

    // Cập nhật tất cả món thành "Đã phục vụ" (trừ món bị hủy)
    order.OrderDetails = order.OrderDetails.map(dish => {
      const isCancelled = dish.Status?.toLowerCase().includes('hủy');
      if (!isCancelled) {
        console.log(`  ↳ Cập nhật món "${dish.DishName}": ${dish.Status} → Đã phục vụ`);
        return { ...dish.toObject(), Status: "Đã phục vụ" };
      }
      console.log(`  ↳ Giữ nguyên món bị hủy: ${dish.DishName}`);
      return dish;
    });

    order.OrderStatus = "Đã hoàn thành";
    
    await order.save();

    console.log(`✅ Đã hoàn thành đơn ${orderId}`);

    // ✅ Emit socket event TRƯỚC KHI response
    const io = req.app.get('io');
    if (io) {
      io.emit("orderCompleted", {
        OrderID: orderId,
        TableNumber: order.TableNumber,
        CompletedOrder: order
      });
      console.log("📡 Order-service emit orderCompleted cho bàn", order.TableNumber);
    }

    // ✅ QUAN TRỌNG: Chỉ gọi res.json() MỘT LẦN duy nhất
    console.log("📤 Trả về response status 200");
    res.status(200).json({ 
      success: true, 
      order: order
    });

  } catch (err) {
    console.error("❌ Lỗi completeOrder:", err);
    console.error("❌ Chi tiết lỗi:", err.message);
    
    // ✅ Kiểm tra xem response đã được gửi chưa
    if (!res.headersSent) {
      res.status(500).json({ 
        error: err.message || "Internal server error"
      });
    }
  }
};
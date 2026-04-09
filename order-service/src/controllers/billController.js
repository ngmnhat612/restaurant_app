// order-service/src/controllers/billController.js

const Bill = require("../models/Bill");

// Tạo hóa đơn mới
exports.createBill = async (req, res) => {
  try {
    const bill = new Bill(req.body);
    await bill.save();
    res.status(201).json(bill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Lấy danh sách tất cả hóa đơn
exports.getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find().sort({ BillCreatedTime: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Cập nhật trạng thái hóa đơn
exports.updateBillStatus = async (req, res) => {
  try {
    const { BillStatus, AccountCode, BillTotalAmount } = req.body;

    console.log("📋 [updateBillStatus] Nhận request:");
    console.log("  - BillID:", req.params.id);
    console.log("  - BillStatus:", BillStatus);
    console.log("  - AccountCode:", AccountCode);
    console.log("  - BillTotalAmount:", BillTotalAmount);

    // ✅ Tìm Bill trước
    const bill = await Bill.findOne({ BillID: req.params.id });

    if (!bill) {
      console.error("❌ [updateBillStatus] Không tìm thấy Bill:", req.params.id);
      return res.status(404).json({ error: "Không tìm thấy Bill" });
    }

    console.log("📋 [updateBillStatus] Bill hiện tại:");
    console.log("  - AccountCode cũ:", bill.AccountCode);
    console.log("  - BillStatus cũ:", bill.BillStatus);
    console.log("  - BillTotalAmount cũ:", bill.BillTotalAmount);

    // ✅ Cập nhật Bill
    bill.BillStatus = BillStatus;
    
    // ✅ QUAN TRỌNG: Cập nhật AccountCode khi thanh toán
// ✅ Luôn cập nhật AccountCode khi thanh toán, bất kể giá trị cũ
if (BillStatus === "Đã thanh toán") {
  if (!AccountCode) {
    return res.status(400).json({ error: "Thiếu thông tin người thanh toán" });
  }
  
  console.log("✅ [updateBillStatus] GHI ĐÈ AccountCode cũ:", bill.AccountCode, "→", AccountCode);
  bill.AccountCode = AccountCode;  // ← Dòng này đã có rồi, nhưng cần đảm bảo nó chạy
  
  if (BillTotalAmount !== undefined) {
    bill.BillTotalAmount = BillTotalAmount;
  }
}

    await bill.save();

    console.log("✅ [updateBillStatus] Đã cập nhật Bill:", bill.BillID);
    console.log("  - BillStatus mới:", bill.BillStatus);
    console.log("  - AccountCode mới:", bill.AccountCode);
    console.log("  - BillTotalAmount mới:", bill.BillTotalAmount);

    // ✅ Emit realtime
    const io = req.app.get('io');
    if (io) {
      io.emit("billStatusChanged", bill);
      console.log("📡 [updateBillStatus] Emit billStatusChanged:", {
        BillID: bill.BillID,
        AccountCode: bill.AccountCode,
        BillTotalAmount: bill.BillTotalAmount
      });
    }

    res.json(bill);
  } catch (err) {
    console.error("❌ [updateBillStatus] Lỗi:", err);
    res.status(400).json({ error: err.message });
  }
};

// Kiểm tra bàn có Bill chưa thanh toán không
exports.checkTableBill = async (req, res) => {
  try {
    const { tableNumber } = req.params;
    
    console.log("🔍 [checkTableBill] Kiểm tra bàn:", tableNumber);
    
    const bill = await Bill.findOne({ 
      TableNumber: parseInt(tableNumber), 
      BillStatus: "Chưa thanh toán" 
    });
    
    if (bill) {
      console.log(`✅ [checkTableBill] Bàn ${tableNumber} có Bill:`, {
        BillID: bill.BillID,
        TotalAmount: bill.BillTotalAmount,
        OrderCount: bill.Orders.length,
        AccountCode: bill.AccountCode  // ← Trả về AccountCode
      });
      
      res.json({ 
        hasUnpaidBill: true, 
        billID: bill.BillID,
        totalAmount: bill.BillTotalAmount,
        orderCount: bill.Orders.length,
        accountCode: bill.AccountCode  // ✅ THÊM FIELD NÀY
      });
    } else {
      console.log(`📋 [checkTableBill] Bàn ${tableNumber} không có Bill chưa thanh toán`);
      res.json({ 
        hasUnpaidBill: false,
        accountCode: null  // ✅ THÊM FIELD NÀY
      });
    }
  } catch (err) {
    console.error("❌ [checkTableBill] Lỗi:", err);
    res.status(500).json({ error: err.message });
  }
};
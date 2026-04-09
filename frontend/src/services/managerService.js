// frontend/src/services/managerService.js

const API_GATEWAY = "http://localhost:3000";

const managerService = {
  fetchOrders: async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_GATEWAY}/orders`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Không thể lấy danh sách đơn hàng");
      return await res.json();
    } catch (error) {
      console.error("❌ Lỗi lấy Orders:", error);
      return [];
    }
  },

  fetchBills: async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_GATEWAY}/bills`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Không thể lấy danh sách hóa đơn");
      return await res.json();
    } catch (error) {
      console.error("❌ Lỗi lấy Bills:", error);
      return [];
    }
  },

  // frontend/src/services/managerService.js
// Thay thế hàm fetchManagerData:

fetchManagerData: async () => {
  try {
    const [orders, bills] = await Promise.all([
      managerService.fetchOrders(),
      managerService.fetchBills(),
    ]);

    console.log("📊 Raw data received:");
    console.log("  - Total Orders:", orders.length);
    console.log("  - Total Bills:", bills.length);

    // ✅ Chỉ lấy Bills đã thanh toán cho lịch sử
    const paidBills = bills.filter(b => b.BillStatus === "Đã thanh toán");

    // ✅ Lấy danh sách BillIDs đã thanh toán
    const paidBillIDs = new Set(paidBills.map(bill => bill.BillID));
    
    console.log("💳 Paid Bill IDs:", Array.from(paidBillIDs));

    // ✅ Active Orders = Orders KHÔNG thuộc Bills đã thanh toán
    // Lọc theo BillID thay vì OrderID để chính xác hơn
    const activeOrders = orders.filter(order => {
      // Nếu order không có BillID → coi như active (trường hợp đặc biệt)
      if (!order.BillID) {
        console.warn("⚠️ Order không có BillID:", order.OrderID);
        return true;
      }
      
      // Nếu BillID của order KHÔNG nằm trong danh sách Bills đã thanh toán → active
      const isActive = !paidBillIDs.has(order.BillID);
      
      if (!isActive) {
        console.log(`  ↳ Loại bỏ Order ${order.OrderID} (Bill ${order.BillID} đã thanh toán)`);
      }
      
      return isActive;
    });

    // ✅ Format Bills cho hiển thị
    const processedBills = paidBills.map((b) => ({
      ...b,
      BillCreatedTime: b.BillCreatedTime?.$date || b.BillCreatedTime,
    }));

    console.log("📊 Manager Data Summary:");
    console.log("  - Total Orders:", orders.length);
    console.log("  - Active Orders:", activeOrders.length);
    console.log("  - Paid Bills:", paidBills.length);
    console.log("  - Unpaid Bills:", bills.filter(b => b.BillStatus === "Chưa thanh toán").length);
    
    // Debug: Hiển thị Orders theo bàn
    const ordersByTable = {};
    activeOrders.forEach(order => {
      if (!ordersByTable[order.TableNumber]) {
        ordersByTable[order.TableNumber] = [];
      }
      ordersByTable[order.TableNumber].push(order.OrderID);
    });
    console.log("📋 Active Orders by Table:", ordersByTable);

    return { activeOrders, historyBills: processedBills };
  } catch (error) {
    console.error("❌ Lỗi Manager Data:", error);
    return { activeOrders: [], historyBills: [] };
  }
},

  calculateTempBill: (tableNumber, orders) => {
    const tableOrders = orders.filter(o => o.TableNumber === parseInt(tableNumber));
    let total = 0;
    let details = [];

    tableOrders.forEach(order => {
      const items = order.OrderDetails || [];
      items.forEach(item => {
        total += item.Total;
        const existingItem = details.find(d => d.DishName === item.DishName);
        if (existingItem) {
          existingItem.Quantity += item.Quantity;
          existingItem.Total += item.Total;
        } else {
          details.push({ ...item });
        }
      });
    });

    return { total, details, orderIds: tableOrders.map(o => o.OrderID) };
  },

  // ✅ Thêm hàm đóng bàn trống
  closeEmptyTable: async (tableNumber) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_GATEWAY}/tables/${tableNumber}/close`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Không thể đóng bàn");
      }
      
      console.log("✅ Đã đóng bàn:", tableNumber);
      return await res.json();
    } catch (error) {
      console.error("❌ Lỗi đóng bàn:", error);
      throw error;
    }
  },

  // ✅ Thêm hàm thanh toán và đóng bàn
  payAndCloseTable: async (tableNumber, billID, accountCode, totalAmount) => {  // ← THÊM totalAmount
    try {
      const token = localStorage.getItem("token");
      
      console.log("💳 [payAndCloseTable] Bắt đầu thanh toán:");
      console.log("  - TableNumber:", tableNumber);
      console.log("  - BillID:", billID);
      console.log("  - AccountCode:", accountCode);
      console.log("  - TotalAmount:", totalAmount);  // ← Debug
      
      if (!accountCode) {
        console.error("❌ [payAndCloseTable] Thiếu AccountCode!");
        throw new Error("Không tìm thấy thông tin người thanh toán");
      }

      if (!totalAmount || totalAmount <= 0) {
        console.error("❌ [payAndCloseTable] TotalAmount không hợp lệ:", totalAmount);
        throw new Error("Tổng tiền không hợp lệ");
      }

      // 1. Cập nhật trạng thái Bill thành "Đã thanh toán"
      console.log("📤 [payAndCloseTable] Gửi request cập nhật Bill...");
      
      const billRes = await fetch(`${API_GATEWAY}/bills/${billID}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          BillStatus: "Đã thanh toán",
          AccountCode: accountCode,
          BillTotalAmount: totalAmount  // ✅ Giờ đã có biến này
        })
      });

      if (!billRes.ok) {
        const error = await billRes.json();
        console.error("❌ [payAndCloseTable] Lỗi cập nhật Bill:", error);
        throw new Error(error.error || "Không thể cập nhật Bill");
      }

      const updatedBill = await billRes.json();
      console.log("✅ [payAndCloseTable] Bill đã cập nhật:", {
        BillID: updatedBill.BillID,
        AccountCode: updatedBill.AccountCode,
        BillTotalAmount: updatedBill.BillTotalAmount
      });

      // ✅ Kiểm tra kết quả
      if (updatedBill.AccountCode !== accountCode) {
        console.error("⚠️ [payAndCloseTable] AccountCode không khớp!");
        console.error("  - Gửi:", accountCode);
        console.error("  - Nhận:", updatedBill.AccountCode);
      }

      if (Math.abs(updatedBill.BillTotalAmount - totalAmount) > 1) {
        console.error("⚠️ [payAndCloseTable] TotalAmount không khớp!");
        console.error("  - Gửi:", totalAmount);
        console.error("  - Nhận:", updatedBill.BillTotalAmount);
      }

      // 2. Đóng bàn
      console.log("📤 [payAndCloseTable] Gửi request đóng bàn...");
      
      const tableRes = await fetch(`${API_GATEWAY}/tables/${tableNumber}/close`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!tableRes.ok) {
        const error = await tableRes.json();
        console.error("❌ [payAndCloseTable] Lỗi đóng bàn:", error);
        throw new Error(error.error || "Không thể đóng bàn");
      }

      console.log("✅ [payAndCloseTable] Thành công!");
      
      return { 
        success: true, 
        billID, 
        tableNumber,
        accountCode: updatedBill.AccountCode,
        totalAmount: updatedBill.BillTotalAmount
      };
    } catch (error) {
      console.error("❌ [payAndCloseTable] Lỗi:", error);
      throw error;
    }
  },

  // ✅ Thêm hàm kiểm tra bàn có Bill không
checkTableBill: async (tableNumber) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_GATEWAY}/bills/check/${tableNumber}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      throw new Error("Không thể kiểm tra Bill");
    }
    
    const data = await res.json();
    
    console.log("📋 [checkTableBill] Response:", data);
    
    return data;
  } catch (error) {
    console.error("❌ Lỗi kiểm tra Bill:", error);
    return { hasUnpaidBill: false };
  }
},

  // --- CRUD THỰC ĐƠN ---
  fetchMenu: async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_GATEWAY}/menu/dishes`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error("Không thể lấy thực đơn");
      
      const dishes = await res.json();
      console.log('🍽️ Menu loaded:', dishes);
      return dishes;
    } catch (error) {
      console.error("❌ Lỗi tải thực đơn:", error);
      return [];
    }
  },

  addDish: async (currentMenu, newDish) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_GATEWAY}/menu/dishes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newDish)
      });
      
      if (!res.ok) throw new Error("Không thể thêm món");
      
      const addedDish = await res.json();
      console.log('✅ Món đã thêm:', addedDish);
      return [addedDish, ...currentMenu];
    } catch (error) {
      console.error("❌ Lỗi thêm món:", error);
      return currentMenu;
    }
  },

  updateDish: async (currentMenu, updatedDish) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_GATEWAY}/menu/dishes/${updatedDish.DishID}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedDish)
      });
      
      if (!res.ok) throw new Error("Không thể cập nhật món");
      
      console.log('✅ Món đã cập nhật:', updatedDish);
      return currentMenu.map(d => d.DishID === updatedDish.DishID ? updatedDish : d);
    } catch (error) {
      console.error("❌ Lỗi cập nhật món:", error);
      return currentMenu;
    }
  },

  deleteDish: async (currentMenu, dishId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_GATEWAY}/menu/dishes/${dishId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error("Không thể xóa món");
      
      console.log('✅ Món đã xóa:', dishId);
      return currentMenu.filter(d => d.DishID !== dishId);
    } catch (error) {
      console.error("❌ Lỗi xóa món:", error);
      return currentMenu;
    }
  }
};

export default managerService;
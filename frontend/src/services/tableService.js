// frontend/src/services/tableService.js

const API_GATEWAY = "http://localhost:3000";

export const tableService = {
  fetchTables: async () => {
    try {
      const response = await fetch(`${API_GATEWAY}/tables`);
      if (!response.ok) throw new Error("Không thể lấy danh sách bàn");
      return await response.json();
    } catch (error) {
      console.error("Lỗi fetchTables:", error);
      return [];
    }
  },

  fetchMenu: async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_GATEWAY}/menu/dishes`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Không thể lấy thực đơn");
      return await response.json();
    } catch (error) {
      console.error("Lỗi fetchMenu:", error);
      return [];
    }
  },

  // ✅ Kiểm tra bàn có Bill chưa thanh toán không
  checkTableBill: async (tableNumber) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_GATEWAY}/bills/check/${tableNumber}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Không thể kiểm tra Bill");
      }
      
      return await response.json();
    } catch (error) {
      console.error("❌ Lỗi checkTableBill:", error);
      return { hasUnpaidBill: false }; // Mặc định coi như bàn mới
    }
  },

  // ✅ MỚI: Lấy đơn hàng theo số bàn
  fetchOrders: async (tableNumber) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_GATEWAY}/orders?tableNumber=${tableNumber}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) return []; // Bàn chưa có đơn nào
        throw new Error("Không thể tải đơn hàng");
      }
      
      return await response.json();
    } catch (error) {
      console.error("❌ Lỗi tải đơn hàng:", error);
      return [];
    }
  },

// frontend/src/services/tableService.js
sendOrderToKitchen: async (tableNumber, cartItems) => {
  try {
    console.log("🔍 Đang gửi order:");
    console.log("  - TableNumber:", tableNumber);
    console.log("  - CartItems:", cartItems);
    
    const response = await fetch(`${API_GATEWAY}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        TableNumber: tableNumber,
        OrderDetails: cartItems
      })
    });
    
    console.log("📥 Response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json(); // ✅ Đọc error message từ backend
      console.error("❌ Error response:", errorData);
      throw new Error(errorData.error || "Không thể gửi đơn hàng");
    }
    
    return await response.json();
  } catch (error) {
    console.error("❌ Lỗi sendOrderToKitchen:", error);
    throw error;
  }
}
};

// frontend/src/services/kitchenService.js

const API_GATEWAY = "http://localhost:3000";

export const fetchKitchenData = async () => {
  try {
    const token = localStorage.getItem("token");
    
    const [resOrders, resDishes] = await Promise.all([
      fetch(`${API_GATEWAY}/orders`, {
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        }
      }),
      fetch(`${API_GATEWAY}/menu/dishes`, {
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        }
      })
    ]);

    // ✅ Kiểm tra response
    if (!resOrders.ok) throw new Error("Không thể lấy danh sách đơn hàng");
    if (!resDishes.ok) throw new Error("Không thể lấy danh sách món ăn");

    const orders = await resOrders.json();
    const dishes = await resDishes.json();

    const processedOrders = orders.map(order => {
      const rawTime = order.OrderCreatedTime?.$date || order.OrderCreatedTime;
      return {
        ...order,
        Dishes: order.OrderDetails || [],
        OrderCreatedTime: rawTime,
      };
    });

    // Sắp xếp theo thời gian tạo đơn (cũ nhất lên đầu)
    processedOrders.sort((a, b) => new Date(a.OrderCreatedTime) - new Date(b.OrderCreatedTime));

    return { orders: processedOrders, dishes };
  } catch (error) {
    console.error("❌ Lỗi tải dữ liệu bếp:", error);
    return { orders: [], dishes: [] };
  }
};

// ✅ Cập nhật trạng thái món ăn (Còn/Hết) lên MongoDB
export const updateDishStatus = async (dishId, newStatus) => {
  try {
    const token = localStorage.getItem("token");
    
    const response = await fetch(`${API_GATEWAY}/menu/dishes/${dishId}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        DishStatus: newStatus 
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Không thể cập nhật trạng thái món ăn");
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Lỗi cập nhật trạng thái:", error);
    throw error;
  }
};

// ✅ Cập nhật trạng thái từng món trong đơn hàng
export const updateOrderDishStatus = async (orderId, dishId, newStatus) => {
  try {
    const token = localStorage.getItem("token");
    
    const response = await fetch(`${API_GATEWAY}/orders/${orderId}/dishes/${dishId}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        Status: newStatus 
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Không thể cập nhật trạng thái món");
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Lỗi cập nhật trạng thái món trong đơn:", error);
    throw error;
  }
};

// ✅ Hoàn thành đơn hàng (cập nhật tất cả món + trạng thái order)
// frontend/src/services/kitchenService.js

export const completeOrder = async (orderId) => {
  try {
    const token = localStorage.getItem("token");
    
    console.log(`🔄 Gửi request hoàn thành đơn ${orderId}`);
    
    const response = await fetch(`${API_GATEWAY}/orders/${orderId}/complete`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      }
    });

    console.log(`📡 Response status:`, response.status);
    console.log(`📡 Response ok:`, response.ok);

    // ✅ Đọc response text trước
    const responseText = await response.text();
    console.log(`📡 Response text:`, responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { error: responseText };
      }
      console.error(`❌ Server trả về lỗi:`, errorData);
      throw new Error(errorData.error || "Không thể hoàn thành đơn hàng");
    }

    // ✅ Parse JSON từ text
    const data = JSON.parse(responseText);
    console.log(`✅ Response data:`, data);
    
    return data;
  } catch (error) {
    console.error("❌ Lỗi hoàn thành đơn:", error);
    throw error;
  }
};

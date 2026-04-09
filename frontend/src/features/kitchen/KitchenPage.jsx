// frontend/src/features/kitchen/KitchenPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { fetchKitchenData, updateDishStatus, updateOrderDishStatus, completeOrder } from '../../services/kitchenService';
import { tableService } from "../../services/tableService";
import DishManager from './components/DishManager'; 
import OrderList from './components/OrderList'; 
import KitchenFilters from './components/KitchenFilters';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import socket from '../../config/socket';

const KitchenPage = () => {
  const [orders, setOrders] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [filterTable, setFilterTable] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [viewMode, setViewMode] = useState('orders');
  const [tables, setTables] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem('kitchen_user')) || { FullName: 'Đầu bếp' };

  // --- HÀM TẢI DỮ LIỆU ---
  const loadData = async () => {
    const data = await fetchKitchenData();
    setOrders(data.orders);
    setDishes(data.dishes);

    const tableData = await tableService.fetchTables();
    setTables(tableData);

    console.log("✅ Dữ liệu đã được tải lại từ MongoDB:", new Date().toLocaleTimeString());
  };

  useEffect(() => {
    loadData(); 
  }, []);

  // ✅ Lắng nghe realtime trạng thái món
  useEffect(() => {
    socket.on("dishStatusChanged", (updatedDish) => {
      console.log("📡 KitchenPage nhận realtime:", updatedDish.DishName, "→", updatedDish.DishStatus);
      
      setDishes(prev =>
        prev.map(d =>
          d.DishID === updatedDish.DishID
            ? { ...d, DishStatus: updatedDish.DishStatus }
            : d
        )
      );
    });

    return () => {
      socket.off("dishStatusChanged");
    };
  }, []);

  // ✅ Lắng nghe đơn hàng mới realtime
  useEffect(() => {
    const handleNewOrder = (newOrder) => {
      console.log("📡 KitchenPage nhận order mới:", newOrder.OrderID);
      setOrders(prev => [newOrder, ...prev]);
    };

    socket.on("newOrder", handleNewOrder);

    return () => {
      socket.off("newOrder", handleNewOrder);
    };
  }, []);

  // ✅ Lắng nghe món được THÊM
useEffect(() => {
  const handleDishAdded = (newDish) => {
    console.log("📡 [KitchenPage] Món mới được thêm:", newDish.DishName);
    
    setDishes(prev => {
      // Kiểm tra món đã tồn tại chưa
      if (prev.some(d => d.DishID === newDish.DishID)) {
        return prev;
      }
      return [newDish, ...prev];
    });
  };

  socket.on("dishAdded", handleDishAdded);
  return () => socket.off("dishAdded", handleDishAdded);
}, []);

// ✅ Lắng nghe món được CẬP NHẬT
useEffect(() => {
  const handleDishUpdated = (updatedDish) => {
    console.log("📡 [KitchenPage] Món được cập nhật:", updatedDish.DishName);
    
    setDishes(prev =>
      prev.map(d => d.DishID === updatedDish.DishID ? updatedDish : d)
    );
  };

  socket.on("dishUpdated", handleDishUpdated);
  return () => socket.off("dishUpdated", handleDishUpdated);
}, []);

// ✅ Lắng nghe món bị XÓA
useEffect(() => {
  const handleDishDeleted = (deletedDishID) => {
    console.log("📡 [KitchenPage] Món bị xóa:", deletedDishID);
    
    setDishes(prev => prev.filter(d => d.DishID !== deletedDishID));
  };

  socket.on("dishDeleted", handleDishDeleted);
  return () => socket.off("dishDeleted", handleDishDeleted);
}, []);

  // --- BỘ LỌC ---
  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        // Lọc theo bàn
        const matchTable = filterTable === 'all' || order.TableNumber.toString() === filterTable.toString();
        
        // Lọc theo trạng thái
        let matchStatus = true;
        if (filterStatus === 'pending') {
          matchStatus = order.OrderStatus === 'Chưa hoàn thành';
        } else if (filterStatus === 'done') {
          matchStatus = order.OrderStatus === 'Đã hoàn thành';
        }

        return matchTable && matchStatus;
      })
      // ✅ Sắp xếp theo thời gian: mới nhất lên đầu (áp dụng cho cả 2 tab)
      .sort((a, b) => {
        const dateA = new Date(a.OrderCreatedTime?.$date || a.OrderCreatedTime);
        const dateB = new Date(b.OrderCreatedTime?.$date || b.OrderCreatedTime);
        return dateB - dateA;
      });
  }, [orders, filterTable, filterStatus]);

  // --- HÀM XỬ LÝ ---
  
  // ✅ Cập nhật trạng thái từng món trong đơn hàng
  const handleUpdateDishStatus = async (orderId, dish, currentIsServed) => {
    const newStatus = currentIsServed ? 'Chờ' : 'Đã phục vụ';
    
    console.log(`🔄 Đang cập nhật món "${dish.DishName}" → ${newStatus}`);
    
    setOrders(prev => prev.map(order => {
      if (order.OrderID === orderId) {
        return {
          ...order,
          OrderDetails: order.OrderDetails.map(d => 
            d._id === dish._id
              ? { ...d, Status: newStatus }
              : d
          )
        };
      }
      return order;
    }));

    try {
      await updateOrderDishStatus(orderId, dish._id, newStatus);
      console.log(`✅ Đã cập nhật "${dish.DishName}" thành "${newStatus}"`);
    } catch (error) {
      console.error("❌ Lỗi cập nhật:", error);
      alert(`❌ Không thể cập nhật trạng thái món "${dish.DishName}"`);
      loadData();
    }
  };

  // ✅ Cập nhật trạng thái đơn hàng (Hoàn thành đơn)
  const handleUpdateStatus = async (orderId, newStatus) => {
    console.log(`✅ Hoàn thành đơn ${orderId}`);
    
    // Cập nhật UI ngay lập tức
    setOrders(prev => prev.map(order => {
      if (order.OrderID === orderId) {
        // Cập nhật tất cả món chưa bị hủy thành "Đã phục vụ"
        const updatedDetails = order.OrderDetails.map(dish => {
          const isCancelled = dish.Status?.toLowerCase().includes('hủy');
          if (!isCancelled) {
            return { ...dish, Status: 'Đã phục vụ' };
          }
          return dish;
        });

        return {
          ...order,
          OrderStatus: newStatus,
          OrderDetails: updatedDetails
        };
      }
      return order;
    }));

    // Gọi API để cập nhật vào database
    try {
      await completeOrder(orderId);
      console.log(`✅ Đã hoàn thành đơn ${orderId} trong MongoDB`);
    } catch (error) {
      console.error("❌ Lỗi hoàn thành đơn:", error);
      alert(`❌ Không thể hoàn thành đơn hàng. Vui lòng thử lại!`);
      loadData();
    }
  };

  // ✅ Cập nhật trạng thái món ăn (Còn/Hết) trong DishManager
  const handleToggleDish = async (dishId, dishName, action) => {
    const newStatus = action === 'on' ? 'Còn' : 'Hết';

    try {
      setDishes(prev =>
        prev.map(d => d.DishID === dishId ? { ...d, DishStatus: newStatus } : d)
      );

      await updateDishStatus(dishId, newStatus);
      
      console.log(`✅ Đã cập nhật "${dishName}" thành "${newStatus}" trong MongoDB`);

    } catch (error) {
      console.error("❌ Lỗi cập nhật trạng thái món:", error);
      alert(`❌ Không thể cập nhật trạng thái món "${dishName}". Vui lòng thử lại!`);
      loadData();
    }
  };

const handleLogout = () => {
  console.log('🚪 [Kitchen] Đăng xuất');
  localStorage.removeItem("kitchen_user");  // ← CHỈ XÓA KITCHEN
  localStorage.removeItem("token");
  window.location.href = '/login/kitchen';
};

  // --- RENDER ---
  return (
    <div className="bg-light position-fixed top-0 start-0 w-100 h-100 d-flex flex-column overflow-hidden">
      
      <nav className="navbar navbar-dark bg-dark px-4 shadow-sm flex-shrink-0">
        <div className="d-flex align-items-center">
          <span className="navbar-brand mb-0 h1 me-3">👨‍🍳 Bếp {currentUser.FullName}</span>
          
          <button 
            className="btn btn-sm btn-secondary d-flex align-items-center gap-1" 
            onClick={loadData} 
            title="Tải lại đơn hàng mới từ hệ thống"
          >
            <span>🔄</span> Làm mới
          </button>
        </div>
        <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>Đăng xuất</button>
      </nav>

      <div className="container-fluid d-flex flex-column h-100 py-3" style={{ minHeight: 0 }}>
        
        <div className="flex-shrink-0 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-body py-2">
              <KitchenFilters 
                currentFilter={filterTable}
                currentView={viewMode}
                onSetFilter={setFilterTable}
                onSetView={setViewMode}
                tables={tables}
              />

              {viewMode === 'orders' && (
                <div className="mt-2 d-flex align-items-center border-top pt-2">
                  <span className="fw-bold me-3 small text-uppercase text-muted">Trạng thái:</span>
                  <div className="btn-group btn-group-sm" role="group">
                    <button 
                      type="button" 
                      className={`btn ${filterStatus === 'pending' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setFilterStatus('pending')}
                    >⏳ Đang phục vụ</button>
                    <button 
                      type="button" 
                      className={`btn ${filterStatus === 'done' ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => setFilterStatus('done')}
                    >✅ Đã hoàn thành</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-grow-1 overflow-y-auto px-1 pb-5" style={{ touchAction: 'pan-y' }}>
          {viewMode === 'dishes' ? (
            <DishManager dishes={dishes} onToggleStatus={handleToggleDish} />
          ) : (
            <OrderList 
              orders={filteredOrders} 
              onUpdateStatus={handleUpdateStatus}
              onUpdateDishStatus={handleUpdateDishStatus}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default KitchenPage;
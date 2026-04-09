// frontend/src/features/table/TablePage.jsx

import React, { useState, useEffect } from 'react';
import { tableService } from '../../services/tableService';
import socket from '../../config/socket';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../assets/css/kitchen.css'; 

const TablePage = () => {
  const [currentTable, setCurrentTable] = useState(null);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [orderedItems, setOrderedItems] = useState([]);
  const [view, setView] = useState('login');
  
  const [loginInput, setLoginInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ✅ Hàm tải menu và đơn hàng
  const loadData = async (tableNumber = null) => {
    try {
      // 1. Tải menu
      const dishes = await tableService.fetchMenu();
      setMenu(dishes);

      // 2. Nếu có số bàn, tải đơn hàng của bàn đó
      if (tableNumber) {
        const orders = await tableService.fetchOrders(tableNumber);
        console.log("📦 Đơn hàng đã tải:", orders);

      // 3. Chuyển đổi orders thành orderedItems
      const items = orders.flatMap(order => 
        (order.OrderDetails || []).map(detail => ({
          DishName: detail.DishName,
          DishPrice: detail.Total / detail.Quantity,
          Quantity: detail.Quantity,
          Note: detail.Note || "",
          Status: detail.Status === "Đã phục vụ" ? "Đã hoàn thành" : "Chờ chế biến",
          OrderTime: order.OrderCreatedTime?.$date || order.OrderCreatedTime,
          OrderID: order.OrderID
        }))
      );

        setOrderedItems(items);
        console.log("✅ Đã load", items.length, "món đã gọi");
      }
    } catch (error) {
      console.error("❌ Lỗi tải dữ liệu:", error);
    }
  };

  // --- Lấy dữ liệu ban đầu (chỉ menu) ---
  useEffect(() => {
    loadData();
  }, []);

// Thêm các useEffect này vào TablePage.jsx

// ✅ 1. Lắng nghe đơn hàng mới realtime
useEffect(() => {
  const handleNewOrder = (newOrder) => {
    // Chỉ cập nhật nếu order thuộc về bàn hiện tại
    if (currentTable && newOrder.TableNumber === currentTable.TableNumber) {
      console.log("📡 [TablePage] Nhận order mới realtime:", newOrder.OrderID);
      
      const newItems = (newOrder.OrderDetails || []).map(detail => ({
        DishName: detail.DishName,
        DishPrice: detail.Total / detail.Quantity,
        Quantity: detail.Quantity,
        Note: detail.Note || "",
        Status: detail.Status === "Đã phục vụ" ? "Đã hoàn thành" : "Chờ chế biến",
        OrderTime: newOrder.OrderCreatedTime,
        OrderID: newOrder.OrderID
      }));

      setOrderedItems(prev => [...prev, ...newItems]);
    }
  };

  socket.on("newOrder", handleNewOrder);

  return () => {
    socket.off("newOrder", handleNewOrder);
  };
}, [currentTable]);

// ✅ 2. Lắng nghe cập nhật trạng thái món realtime
useEffect(() => {
  const handleDishStatusUpdate = (data) => {
    // Chỉ cập nhật nếu thuộc bàn hiện tại
    if (currentTable && data.TableNumber === currentTable.TableNumber) {
      console.log("📡 [TablePage] Nhận cập nhật trạng thái món:", data.OrderID);
      
      setOrderedItems(prev => prev.map(item => {
        // Tìm món trong order được cập nhật
        if (item.OrderID === data.OrderID) {
          const updatedDish = data.UpdatedOrder.OrderDetails.find(
            d => d.DishName === item.DishName
          );
          
          if (updatedDish) {
            return {
              ...item,
              Status: updatedDish.Status === "Đã phục vụ" ? "Đã hoàn thành" : "Chờ chế biến"
            };
          }
        }
        return item;
      }));
    }
  };

  socket.on("dishStatusUpdated", handleDishStatusUpdate);

  return () => {
    socket.off("dishStatusUpdated", handleDishStatusUpdate);
  };
}, [currentTable]);

// ✅ 3. Lắng nghe hoàn thành đơn realtime
useEffect(() => {
  const handleOrderComplete = (data) => {
    // Chỉ cập nhật nếu thuộc bàn hiện tại
    if (currentTable && data.TableNumber === currentTable.TableNumber) {
      console.log("📡 [TablePage] Đơn hoàn thành:", data.OrderID);
      
      setOrderedItems(prev => prev.map(item => {
        if (item.OrderID === data.OrderID) {
          return {
            ...item,
            Status: "Đã hoàn thành"
          };
        }
        return item;
      }));
    }
  };

  socket.on("orderCompleted", handleOrderComplete);

  return () => {
    socket.off("orderCompleted", handleOrderComplete);
  };
}, [currentTable]);

// ✅ 4. Lắng nghe cập nhật trạng thái món ăn (Còn/Hết) realtime
useEffect(() => {
  const handleDishStatusChange = (updatedDish) => {
    console.log("📡 [TablePage] Nhận từ Gateway:", updatedDish.DishName, "→", updatedDish.DishStatus);
    
    setMenu(prev =>
      prev.map(d =>
        d.DishID === updatedDish.DishID
          ? { ...d, DishStatus: updatedDish.DishStatus }
          : d
      )
    );
  };

  socket.on("dishStatusChanged", handleDishStatusChange);

  return () => {
    socket.off("dishStatusChanged", handleDishStatusChange);
  };
}, []);

// ✅ 5. Lắng nghe món được THÊM
useEffect(() => {
  const handleDishAdded = (newDish) => {
    console.log("📡 [TablePage] Món mới được thêm:", newDish.DishName);
    
    setMenu(prev => {
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

// ✅ 6. Lắng nghe món được CẬP NHẬT
useEffect(() => {
  const handleDishUpdated = (updatedDish) => {
    console.log("📡 [TablePage] Món được cập nhật:", updatedDish.DishName);
    
    setMenu(prev =>
      prev.map(d => d.DishID === updatedDish.DishID ? updatedDish : d)
    );
  };

  socket.on("dishUpdated", handleDishUpdated);
  return () => socket.off("dishUpdated", handleDishUpdated);
}, []);

// ✅ 7. Lắng nghe món bị XÓA
useEffect(() => {
  const handleDishDeleted = (deletedDishID) => {
    console.log("📡 [TablePage] Món bị xóa:", deletedDishID);
    
    setMenu(prev => prev.filter(d => d.DishID !== deletedDishID));
    
    // ✅ QUAN TRỌNG: Xóa món khỏi giỏ hàng nếu có
    setCart(prev => prev.filter(item => item.DishID !== deletedDishID));
  };

  socket.on("dishDeleted", handleDishDeleted);
  return () => socket.off("dishDeleted", handleDishDeleted);
}, []);

  // --- XỬ LÝ ĐĂNG NHẬP ---
  const handleLogin = async (e) => {
    e.preventDefault();

    const savedTable = JSON.parse(localStorage.getItem("currentTable"));
    if (!savedTable) {
      setErrorMsg("❌ Chưa chọn bàn!");
      return;
    }

    if (loginInput.toLowerCase() === "moban") {
      const tableInfo = { ...savedTable, SessionStart: new Date() };
      setCurrentTable(tableInfo);
      localStorage.setItem("currentTable", JSON.stringify(tableInfo));

      // ✅ Kiểm tra bàn có Bill chưa thanh toán không
      const billStatus = await tableService.checkTableBill(savedTable.TableNumber);
      
      console.log("📋 Trạng thái Bill:", billStatus);

      if (billStatus.hasUnpaidBill) {
        // ✅ Bàn đang có khách (có Bill chưa thanh toán)
        console.log(`✅ Bàn ${savedTable.TableNumber} đang sử dụng, load orders...`);
        
        // Tải menu và đơn hàng của bàn này
        await loadData(savedTable.TableNumber);
        
        // Chuyển thẳng sang màn "Đã gọi"
        setView("tracking");
        
      } else {
        // ✅ Bàn mới (không có Bill chưa thanh toán)
        console.log(`📋 Bàn ${savedTable.TableNumber} là bàn mới, không load orders`);
        
        // Chỉ tải menu, KHÔNG tải orders
        await loadData();
        
        // Chuyển sang màn thực đơn
        setView("menu");
      }
      
    } else {
      setErrorMsg("❌ Mã mở bàn không hợp lệ!");
    }
  };

  // frontend/src/features/table/TablePage.jsx
// Thêm useEffect này vào TablePage (sau useEffect số 4 - dishStatusChanged):

// ✅ 5. Lắng nghe khi bàn bị đóng từ Manager
useEffect(() => {
  const handleTableClosed = (table) => {
    console.log("📡 [TablePage] Nhận event tableClosed:", table.TableNumber);
    console.log("📡 [TablePage] Bàn hiện tại:", currentTable?.TableNumber);
    
    // Kiểm tra xem có phải bàn hiện tại không
    if (currentTable && currentTable.TableNumber === table.TableNumber) {
      console.log("⚠️ Bàn của bạn đã được đóng. Đang đăng xuất...");
      
      // Xóa thông tin bàn
      localStorage.removeItem('currentTable');
      
      // Hiển thị thông báo
      alert("⚠️ Bàn đã được đóng bởi nhân viên. Cảm ơn quý khách!");
      
      // Chuyển về trang đăng nhập
      window.location.href = '/login/table';
    }
  };

  console.log("🎧 [TablePage] Đăng ký lắng nghe tableClosed");
  socket.on("tableClosed", handleTableClosed);

  return () => {
    console.log("🔇 [TablePage] Hủy đăng ký tableClosed");
    socket.off("tableClosed", handleTableClosed);
  };
}, [currentTable]);

// ✅ 6. Lắng nghe cập nhật Bill (cho trường hợp thanh toán)
useEffect(() => {
  const handleBillStatusChanged = (bill) => {
    console.log("📡 [TablePage] Bill được cập nhật:", bill.BillID, "→", bill.BillStatus);
    
    // Nếu Bill của bàn hiện tại được thanh toán → đăng xuất
    if (currentTable && bill.TableNumber === currentTable.TableNumber && bill.BillStatus === "Đã thanh toán") {
      console.log("✅ Bill đã được thanh toán, đóng bàn...");
      
      setTimeout(() => {
        localStorage.removeItem('currentTable');
        alert("✅ Đã thanh toán thành công. Cảm ơn quý khách!");
        window.location.href = '/login/table';
      }, 1000);
    }
  };

  socket.on("billStatusChanged", handleBillStatusChanged);

  return () => {
    socket.off("billStatusChanged", handleBillStatusChanged);
  };
}, [currentTable]);

  // --- LOGIC GIỎ HÀNG ---
  const getCartQuantity = (dishName) => {
    const item = cart.find(i => i.DishName === dishName);
    return item ? item.Quantity : 0;
  };
  
  const addToCart = (dish) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.DishName === dish.DishName);
      if (existingItem) {
        return prev.map(item => item.DishName === dish.DishName ? { ...item, Quantity: item.Quantity + 1 } : item);
      }
      return [...prev, { ...dish, Quantity: 1, Note: '' }];
    });
  };

  const decreaseQuantity = (dishName) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.DishName === dishName);
      if (existingItem.Quantity === 1) {
        return prev.filter(item => item.DishName !== dishName);
      }
      return prev.map(item => item.DishName === dishName ? { ...item, Quantity: item.Quantity - 1 } : item);
    });
  };

  const removeFromCart = (dishName) => {
    setCart(prev => prev.filter(item => item.DishName !== dishName));
  };

  const updateCartNote = (dishName, note) => {
    setCart(prev => prev.map(item => item.DishName === dishName ? { ...item, Note: note } : item));
  };

  // ✅ GỬI ĐƠN - CHỈ GỬI LÊN SERVER, ĐỢI SOCKET TRẢ VỀ
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    
    if (window.confirm(`Xác nhận gọi ${cart.length} món?`)) {
      try {
        // 1. Gửi order lên backend
        await tableService.sendOrderToKitchen(currentTable.TableNumber, cart);
        
        // 2. ✅ KHÔNG thêm vào orderedItems ở đây
        //    Socket sẽ tự động cập nhật qua sự kiện "newOrder"
        
        // 3. Xóa giỏ hàng và chuyển sang màn theo dõi
        setCart([]); 
        setView('tracking');
        
        console.log("✅ Đã gửi đơn hàng, đợi socket cập nhật...");
      } catch (error) {
        console.error("❌ Lỗi gửi đơn:", error);
        alert("❌ Lỗi gửi đơn hàng. Vui lòng thử lại!");
      }
    }
  };

  const totalPriceOrdered = orderedItems.reduce((sum, item) => sum + (item.DishPrice * item.Quantity), 0);
  
  const handleRequestPayment = () => {
    if (window.confirm("Bạn muốn yêu cầu thanh toán? Nhân viên sẽ đến ngay.")) {
      alert("✅ Đã gửi yêu cầu thanh toán đến Quản lý!");
    }
  };

const handleLogout = () => {
  console.log('🚪 [Table] Đăng xuất');
  localStorage.clear();  // ← Xóa toàn bộ
  window.location.href = '/login/table';
};

  // --- RENDER: ĐĂNG NHẬP ---
  if (!currentTable || view === 'login') {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-dark">
        <div className="card p-4 shadow-lg text-center" style={{ width: '350px' }}>
          <h2 className="mb-4">🍽️ Đăng nhập Bàn</h2>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              className="form-control form-control-lg mb-3 text-center"
              placeholder="Nhập mã mở bàn"
              value={loginInput}
              onChange={e => setLoginInput(e.target.value)}
            />
            {errorMsg && <p className="text-danger">{errorMsg}</p>}
            <button type="submit" className="btn btn-primary btn-lg w-100">Mở Bàn</button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: GIAO DIỆN CHÍNH ---
  return (
    <div className="d-flex flex-column vh-100 bg-light overflow-hidden">
      
      {/* HEADER */}
      <div className="bg-white shadow-sm p-3 d-flex justify-content-between align-items-center flex-shrink-0" style={{ zIndex: 1020 }}>
        <div>
          <h4 className="m-0 fw-bold text-primary">Bàn số {currentTable.TableNumber}</h4>
          <small className="text-muted">Khách hàng</small>
        </div>
        <div className="d-flex gap-2">
          <span className="badge bg-success p-2">{orderedItems.length} món đang gọi</span>
          <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>Thoát</button>
        </div>
      </div>

      {/* NỘI DUNG */}
      <div className="flex-grow-1 overflow-auto p-3 bg-light">
        
        {/* THỰC ĐƠN */}
        {view === 'menu' && (
          <div className="row g-3">
            {menu.map((dish, idx) => {
              const currentQty = getCartQuantity(dish.DishName);
              const isOutOfStock = dish.DishStatus === 'Hết';

              return (
                <div key={idx} className="col-6 col-md-4 col-lg-3">
                  <div className="card h-100 border-0 shadow-sm dish-card-touch">
                    <div style={{ height: '150px', overflow: 'hidden', position: 'relative' }}>
                      <img 
                        src={`http://localhost:3000/images/${dish.DishImage}`}
                        className={`w-100 h-100 object-fit-cover ${isOutOfStock ? 'opacity-50' : ''}`} 
                        alt={dish.DishName} 
                      />
                      {currentQty > 0 && (
                        <span className="position-absolute top-0 end-0 badge bg-danger m-2 rounded-circle fs-6">
                          {currentQty}
                        </span>
                      )}
                    </div>
                    
                    <div className="card-body p-2 d-flex flex-column">
                      <h6 className="card-title fw-bold text-truncate">{dish.DishName}</h6>
                      <p className="text-danger fw-bold mb-2">{dish.DishPrice.toLocaleString()}đ</p>
                      
                      <div className="mt-auto">
                        {isOutOfStock ? (
                          <button className="btn btn-secondary w-100 btn-sm" disabled>Hết hàng</button>
                        ) : (
                          currentQty === 0 ? (
                            <button 
                              className="btn btn-primary w-100 btn-sm"
                              onClick={() => addToCart(dish)}
                            >
                              + Thêm món
                            </button>
                          ) : (
                            <div className="d-flex justify-content-between align-items-center bg-light rounded p-1 border">
                              <button className="btn btn-sm btn-outline-danger fw-bold px-2" onClick={() => decreaseQuantity(dish.DishName)}>-</button>
                              <span className="fw-bold">{currentQty}</span>
                              <button className="btn btn-sm btn-outline-success fw-bold px-2" onClick={() => addToCart(dish)}>+</button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* GIỎ HÀNG */}
        {view === 'cart' && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white fw-bold">🛒 Giỏ hàng của bạn</div>
            <div className="card-body p-0">
              {cart.length === 0 ? (
                <p className="text-center p-4 text-muted">Chưa chọn món nào.</p>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="p-3 border-bottom d-flex justify-content-between align-items-center">
                    <div style={{ flex: 1 }}>
                      <h6 className="mb-0 fw-bold">{item.DishName}</h6>
                      <small className="text-primary">{item.DishPrice.toLocaleString()}đ x {item.Quantity}</small>
                      <input 
                        type="text" 
                        className="form-control form-control-sm mt-1" 
                        placeholder="Ghi chú (vd: ít cay)..."
                        value={item.Note}
                        onChange={(e) => updateCartNote(item.DishName, e.target.value)}
                      />
                    </div>
                    <div className="d-flex flex-column align-items-end ms-3">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => decreaseQuantity(item.DishName)}>-</button>
                        <span className="fw-bold">{item.Quantity}</span>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => addToCart(item)}>+</button>
                      </div>
                      <button className="btn btn-link text-danger p-0 text-decoration-none small" onClick={() => removeFromCart(item.DishName)}>Xóa</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-3 bg-light">
                <button className="btn btn-success w-100 py-3 fw-bold fs-5" onClick={handlePlaceOrder}>
                  GỬI BẾP ({cart.length} món)
                </button>
              </div>
            )}
          </div>
        )}

        {/* THEO DÕI ĐƠN */}
        {(view === 'tracking' || view === 'bill') && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-warning text-dark fw-bold">📋 Các món đã gọi</div>
            <div className="card-body p-0">
              {orderedItems.length === 0 ? (
                <p className="text-center p-4 text-muted">Chưa có món nào được gọi.</p>
              ) : (
                orderedItems.map((item, idx) => (
                  <div key={idx} className="p-3 border-bottom d-flex justify-content-between">
                    <div>
                      <h6 className="mb-1">{item.DishName} <span className="badge bg-secondary">x{item.Quantity}</span></h6>
                      <small className="text-muted">{(item.DishPrice * item.Quantity).toLocaleString()}đ</small>
                      {item.Note && <div><small className="text-info">📝 {item.Note}</small></div>}
                    </div>
                    <div>
                      {item.Status === 'Chờ chế biến' ? (
                        <span className="badge bg-warning text-dark">Đang chờ</span>
                      ) : item.Status === 'Đã hoàn thành' ? (
                        <span className="badge bg-success">Hoàn thành</span>
                      ) : (
                        <span className="badge bg-info">Đang nấu</span>
                      )}
                    </div>
                  </div>
                ))
              )}
              {orderedItems.length > 0 && (
                <div className="p-3 bg-light d-flex justify-content-between align-items-center">
                  <span className="fw-bold fs-5">TỔNG TẠM TÍNH:</span>
                  <span className="fw-bold fs-4 text-danger">{totalPriceOrdered.toLocaleString()}đ</span>
                </div>
              )}
            </div>
            
            {orderedItems.length > 0 && (
              <div className="p-3">
                <button className="btn btn-danger w-100 py-3 fw-bold" onClick={handleRequestPayment}>
                  💳 YÊU CẦU THANH TOÁN
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* FOOTER */}
      <div className="bg-white border-top d-flex justify-content-around py-2 shadow-lg flex-shrink-0">
        <button 
          className={`btn d-flex flex-column align-items-center border-0 ${view === 'menu' ? 'text-primary' : 'text-secondary'}`}
          onClick={() => setView('menu')}
        >
          <span style={{ fontSize: '1.2rem' }}>📖</span>
          <span style={{ fontSize: '0.8rem' }}>Thực đơn</span>
        </button>

        <button 
          className={`btn d-flex flex-column align-items-center border-0 ${view === 'cart' ? 'text-primary' : 'text-secondary'}`}
          onClick={() => setView('cart')}
          style={{ position: 'relative' }}
        >
          <span style={{ fontSize: '1.2rem' }}>🛒</span>
          <span style={{ fontSize: '0.8rem' }}>Giỏ hàng</span>
          {cart.length > 0 && (
            <span className="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-danger">
              {cart.length}
            </span>
          )}
        </button>

        <button 
          className={`btn d-flex flex-column align-items-center border-0 ${(view === 'tracking' || view === 'bill') ? 'text-primary' : 'text-secondary'}`}
          onClick={() => setView('tracking')}
        >
          <span style={{ fontSize: '1.2rem' }}>🕒</span>
          <span style={{ fontSize: '0.8rem' }}>Đã gọi</span>
        </button>
      </div>
    </div>
  );
};

export default TablePage;

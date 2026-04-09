// frontend/src/features/manager/ManagerPage.jsx

import React, { useState, useEffect } from 'react';
import managerService from "../../services/managerService";
import { tableService } from "../../services/tableService";
import socket from "../../config/socket";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import MenuManager from './components/MenuManager'; 

const ManagerPage = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [tables, setTables] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [bills, setBills] = useState([]); 
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [selectedTable, setSelectedTable] = useState(null);
  const [tempBill, setTempBill] = useState({ total: 0, details: [], orderIds: [] });

  // --- LOAD DATA ---
  useEffect(() => {
    const init = async () => {
      const tableData = await tableService.fetchTables();
      setTables(tableData);

      const data = await managerService.fetchManagerData();
      console.log("📋 Manager data:", data);
      setActiveOrders(data.activeOrders);
      setBills(data.historyBills);
    };
    init();

    // ✅ Debug socket connection
    console.log("🔌 [ManagerPage] Socket connected:", socket.connected);
    console.log("🔌 [ManagerPage] Socket ID:", socket.id);

    // Lắng nghe khi socket connect
    socket.on("connect", () => {
      console.log("✅ [ManagerPage] Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ [ManagerPage] Socket disconnected");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  // ✅ 1. Lắng nghe bàn được mở (có khách đăng nhập)
  useEffect(() => {
    const handleTableOpened = (table) => {
      console.log("📡 [ManagerPage] Nhận event tableOpened:", JSON.stringify(table));
      
      setTables(prev => {
        const updated = prev.map(t => 
          t.TableNumber === table.TableNumber 
            ? { ...t, TableStatus: "Đang sử dụng" }
            : t
        );
        console.log("📡 [ManagerPage] Đã cập nhật tables state");
        return updated;
      });
    };

    console.log("🎧 [ManagerPage] Đăng ký lắng nghe tableOpened");
    socket.on("tableOpened", handleTableOpened);

    return () => {
      console.log("🔇 [ManagerPage] Hủy đăng ký tableOpened");
      socket.off("tableOpened", handleTableOpened);
    };
  }, []);

  // ✅ 2. Lắng nghe đơn hàng mới từ bàn
  useEffect(() => {
    const handleNewOrder = (newOrder) => {
      console.log("📡 [ManagerPage] Nhận order mới:", newOrder.OrderID, "Bàn", newOrder.TableNumber);
      
      setActiveOrders(prev => [newOrder, ...prev]);

      setTables(prev => prev.map(t => 
        t.TableNumber === newOrder.TableNumber 
          ? { ...t, TableStatus: "Đang sử dụng" }
          : t
      ));
    };

    socket.on("newOrder", handleNewOrder);

    return () => {
      socket.off("newOrder", handleNewOrder);
    };
  }, []);

  // ✅ 3. Lắng nghe cập nhật trạng thái món ăn
  useEffect(() => {
    const handleDishStatusUpdate = (data) => {
      console.log("📡 [ManagerPage] Cập nhật trạng thái món:", data.OrderID);
      
      setActiveOrders(prev => prev.map(order => {
        if (order.OrderID === data.OrderID) {
          return data.UpdatedOrder;
        }
        return order;
      }));
    };

    socket.on("dishStatusUpdated", handleDishStatusUpdate);

    return () => {
      socket.off("dishStatusUpdated", handleDishStatusUpdate);
    };
  }, []);

  // ✅ 4. Lắng nghe hoàn thành đơn hàng
  useEffect(() => {
    const handleOrderComplete = (data) => {
      console.log("📡 [ManagerPage] Đơn hoàn thành:", data.OrderID);
      
      setActiveOrders(prev => prev.map(order => {
        if (order.OrderID === data.OrderID) {
          return data.CompletedOrder;
        }
        return order;
      }));
    };

    socket.on("orderCompleted", handleOrderComplete);

    return () => {
      socket.off("orderCompleted", handleOrderComplete);
    };
  }, []);

  // ✅ 5. Lắng nghe cập nhật Bill realtime
  useEffect(() => {
    const handleBillStatusChanged = (bill) => {
      console.log("📡 [ManagerPage] Bill được cập nhật:", bill.BillID, "→", bill.BillStatus);
      
      // ✅ Kiểm tra xem Bill đã có trong danh sách chưa
      setBills(prev => {
        const existingIndex = prev.findIndex(b => b.BillID === bill.BillID);
        
        if (existingIndex >= 0) {
          // ✅ Bill đã có → Cập nhật
          return prev.map(b => b.BillID === bill.BillID ? bill : b);
        } else {
          // ✅ Bill mới → Thêm vào đầu danh sách
          console.log("📡 [ManagerPage] Thêm Bill mới vào lịch sử:", bill.BillID);
          return [bill, ...prev];
        }
      });

      // ✅ Nếu đã thanh toán → Cập nhật trạng thái bàn
      if (bill.BillStatus === "Đã thanh toán") {
        setTables(prev => prev.map(t => 
          t.TableNumber === bill.TableNumber 
            ? { ...t, TableStatus: "Trống" }
            : t
        ));
      }
    };

    socket.on("billStatusChanged", handleBillStatusChanged);

    return () => {
      socket.off("billStatusChanged", handleBillStatusChanged);
    };
  }, []);

  // ✅ 6. Lắng nghe đóng bàn
  useEffect(() => {
    const handleTableClosed = (table) => {
      console.log("📡 [ManagerPage] Bàn đã đóng:", table.TableNumber);
      
      setTables(prev => prev.map(t => 
        t.TableNumber === table.TableNumber 
          ? { ...t, TableStatus: "Trống" }
          : t
      ));
    };

    socket.on("tableClosed", handleTableClosed);

    return () => {
      socket.off("tableClosed", handleTableClosed);
    };
  }, []);

  // --- LOGIC XỬ LÝ ---
  const handleSelectTable = async (table) => {
    if (table.TableStatus === 'Trống') return;
    
    console.log("🔍 Kiểm tra bàn", table.TableNumber);
    console.log("  - Active Orders cho bàn này:", activeOrders.filter(o => o.TableNumber === table.TableNumber).length);
    
    // ✅ Kiểm tra bàn có Bill chưa thanh toán không
    const billCheck = await managerService.checkTableBill(table.TableNumber);
    
    console.log("📋 Kết quả kiểm tra Bill:", billCheck);
    
    // ✅ Nếu bàn chưa có Bill (chưa gọi món)
    if (!billCheck.hasUnpaidBill) {
      console.log("⚠️ Bàn chưa có Bill chưa thanh toán");
      if (window.confirm(`Bàn ${table.TableNumber} chưa có đơn hàng. Đóng bàn?`)) {
        try {
          await managerService.closeEmptyTable(table.TableNumber);
          alert("✅ Đã đóng bàn thành công!");
        } catch (error) {
          alert(`❌ ${error.message || "Không thể đóng bàn"}`);
        }
      }
      return; // ✅ KHÔNG hiển thị modal
    }
    
    // ✅ Bàn có Bill → Tính toán dựa trên activeOrders
    const billData = managerService.calculateTempBill(table.TableNumber, activeOrders);
    
    console.log("💰 Dữ liệu tính toán:", {
      total: billData.total,
      itemCount: billData.details.length,
      orderIds: billData.orderIds
    });
    
    // ✅ Kiểm tra xem có orders thực sự không
    if (billData.total === 0 || billData.details.length === 0) {
      console.warn("⚠️ Bàn có Bill nhưng không có orders trong activeOrders");
      if (window.confirm(`Bàn ${table.TableNumber} có Bill nhưng không có đơn hàng active. Đóng bàn?`)) {
        try {
          await managerService.closeEmptyTable(table.TableNumber);
          alert("✅ Đã đóng bàn thành công!");
        } catch (error) {
          alert(`❌ ${error.message || "Không thể đóng bàn"}`);
        }
      }
      return;
    }
    
    setTempBill(billData);
    setSelectedTable(table);
  };

  // ✅ Đóng bàn trống (chưa có orders)
  const handleCloseEmptyTable = async (table) => {
    if (!window.confirm(`Đóng bàn ${table.TableNumber}? (Bàn này chưa có đơn hàng)`)) return;

    try {
      await managerService.closeEmptyTable(table.TableNumber);
      alert("✅ Đã đóng bàn thành công!");
      setSelectedTable(null);
    } catch (error) {
      alert(`❌ ${error.message || "Không thể đóng bàn"}`);
    }
  };

  // ✅ Xử lý thanh toán
const handleConfirmPayment = async () => {
  try {
    // ✅ ĐỌC TỪ "manager_user" THAY VÌ "user"
    const user = JSON.parse(localStorage.getItem("manager_user"));
    
    console.log("👤 [Payment] Manager user từ localStorage:", user);

    if (!user || !user.AccountCode) {
      alert("❌ Không tìm thấy thông tin người thanh toán! Vui lòng đăng nhập lại.");
      return;
    }

    // ✅ Kiểm tra Bill từ database
    const billCheck = await managerService.checkTableBill(selectedTable.TableNumber);
    
    console.log("📋 [Payment] Bill check:", billCheck);

    if (!billCheck.hasUnpaidBill) {
      alert("❌ Không tìm thấy Bill chưa thanh toán!");
      setSelectedTable(null);
      return;
    }

    // ✅ Lấy AccountCode từ Bill
    const accountCodeFromBill = billCheck.accountCode;
    
    console.log("💳 [Payment] AccountCode từ Bill DB:", accountCodeFromBill);
    console.log("💳 [Payment] AccountCode từ manager_user:", user.AccountCode);

    // ✅ Dùng AccountCode hiện tại
    const payerAccountCode = user.AccountCode;

    console.log("✅ [Payment] Người thanh toán:", payerAccountCode);

    // ✅ Tính tổng tiền
    const correctTotalAmount = tempBill.total;

    if (billCheck.totalAmount !== correctTotalAmount) {
      console.warn("⚠️ [Payment] SAI LỆCH TỔNG TIỀN:");
      console.warn("  - Bill DB:", billCheck.totalAmount);
      console.warn("  - Orders:", correctTotalAmount);
    }

    // ✅ Kiểm tra món đã phục vụ chưa
    const tableOrders = activeOrders.filter(o => o.TableNumber === selectedTable.TableNumber);
    const unservedDishes = [];
    
    tableOrders.forEach(order => {
      const items = order.OrderDetails || [];
      items.forEach(dish => {
        if (dish.Status !== "Đã phục vụ") {
          unservedDishes.push({
            dishName: dish.DishName,
            quantity: dish.Quantity,
            status: dish.Status
          });
        }
      });
    });

    if (unservedDishes.length > 0) {
      const dishList = unservedDishes
        .map(d => `• ${d.dishName} (x${d.quantity}) - ${d.status}`)
        .join('\n');
      
      alert(
        `⚠️ KHÔNG THỂ THANH TOÁN!\n\n` +
        `Còn ${unservedDishes.length} món chưa được phục vụ:\n\n` +
        `${dishList}\n\n` +
        `Vui lòng đợi bếp hoàn thành tất cả món trước khi thanh toán.`
      );
      return;
    }

    // ✅ Xác nhận thanh toán
    if (!window.confirm(
      `Xác nhận thanh toán bàn ${selectedTable.TableNumber}?\n\n` +
      `💰 Tổng tiền: ${correctTotalAmount.toLocaleString()}đ\n` +
      `👤 Người thanh toán: ${payerAccountCode}\n` +
      (billCheck.totalAmount !== correctTotalAmount 
        ? `⚠️ Đã điều chỉnh tổng tiền từ ${billCheck.totalAmount.toLocaleString()}đ`
        : '')
    )) return;

    console.log("📤 [Payment] Gửi thanh toán:");
    console.log("  - BillID:", billCheck.billID);
    console.log("  - AccountCode:", payerAccountCode);
    console.log("  - TotalAmount:", correctTotalAmount);

    // ✅ Gửi request thanh toán
    await managerService.payAndCloseTable(
      selectedTable.TableNumber, 
      billCheck.billID, 
      payerAccountCode,
      correctTotalAmount
    );

    console.log("✅ [Payment] Thành công!");
    alert(`✅ Thanh toán thành công!\n💰 Tổng: ${correctTotalAmount.toLocaleString()}đ\n🖨️ Đang in hóa đơn...`);
    
    setSelectedTable(null);
  } catch (error) {
    console.error("❌ [Payment] Lỗi:", error);
    alert(`❌ ${error.message || "Lỗi thanh toán. Vui lòng thử lại!"}`);
  }
};

const handleLogout = () => {
  console.log('🚪 [Manager] Đăng xuất');
  localStorage.removeItem("manager_user");  // ← CHỈ XÓA MANAGER
  localStorage.removeItem("token");
  navigate('/login/manager');
};

  // --- COMPONENT CON ---
  const renderDashboard = () => (
    <div className="row g-4">
      {tables.map(table => {
        const tableOrders = activeOrders.filter(o => o.TableNumber === table.TableNumber);
        const hasOrders = tableOrders.length > 0;

        return (
          <div key={table.TableNumber} className="col-6 col-md-4 col-lg-3">
            <div 
              className={`card h-100 text-center shadow-sm ${table.TableStatus === 'Trống' ? 'border-success' : 'border-danger bg-danger-subtle'}`}
              style={{ cursor: table.TableStatus !== 'Trống' ? 'pointer' : 'default' }}
            >
              <div 
                className="card-body d-flex flex-column justify-content-center align-items-center py-4"
                onClick={() => table.TableStatus !== 'Trống' && handleSelectTable(table)}
              >
                <h3 className="card-title fw-bold">Bàn {table.TableNumber}</h3>
                <span className={`badge ${table.TableStatus === 'Trống' ? 'bg-success' : 'bg-danger'}`}>
                  {table.TableStatus}
                </span>
                
                {table.TableStatus !== 'Trống' && (
                  <>
                    {hasOrders ? (
                      <small className="mt-2 text-muted">(Nhấn để thanh toán)</small>
                    ) : (
                      <small className="mt-2 text-muted">(Nhấn để đóng bàn)</small>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderHistory = () => {
    // ✅ Sắp xếp Bills theo thời gian mới nhất trước
    const sortedBills = [...bills].sort((a, b) => {
      const dateA = new Date(a.BillCreatedTime);
      const dateB = new Date(b.BillCreatedTime);
      return dateB - dateA; // Mới nhất trước
    });

    return (
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
          <span>📜 Lịch sử hóa đơn</span>
          <span className="badge bg-light text-primary">{bills.length} hóa đơn</span>
        </div>
        <div className="card-body p-0">
          {bills.length === 0 ? (
            <div className="text-center p-5 text-muted">
              <h5>Chưa có hóa đơn nào</h5>
              <small>Các hóa đơn đã thanh toán sẽ xuất hiện ở đây</small>
            </div>
          ) : (
            <div className="table-responsive" style={{ maxHeight: '70vh' }}>
              <table className="table table-striped table-hover mb-0">
                <thead className="table-light sticky-top">
                  <tr>
                    <th>Mã hóa đơn</th>
                    <th>Bàn</th>
                    <th>Ngày giờ</th>
                    <th>Người thanh toán</th>
                    <th className="text-end">Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBills.map((bill, idx) => {
                    // ✅ Highlight hóa đơn mới trong 5 giây
                    const billTime = new Date(bill.BillCreatedTime).getTime();
                    const now = Date.now();
                    const isNew = (now - billTime) < 5000; // Trong vòng 5 giây

                    return (
                      <tr 
                        key={bill.BillID} 
                        className={isNew ? 'table-success' : ''}
                        style={isNew ? { animation: 'fadeIn 0.5s' } : {}}
                      >
                        <td>
                          {bill.BillID}
                          {isNew && <span className="badge bg-success ms-2">Mới</span>}
                        </td>
                        <td>{bill.TableNumber}</td>
                        <td>{new Date(bill.BillCreatedTime).toLocaleString('vi-VN')}</td>
                        <td>{bill.AccountCode || 'N/A'}</td>
                        <td className="text-end fw-bold text-success">
                          {new Intl.NumberFormat('vi-VN', { 
                            style: 'currency', 
                            currency: 'VND' 
                          }).format(bill.BillTotalAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderShiftReport = () => {
    const currentHour = new Date().getHours();
    const currentShift = currentHour < 12 ? 1 : 2;
    const today = new Date().toDateString();
    const shiftBills = bills.filter(bill => {
      const billDate = new Date(bill.BillCreatedTime);
      return billDate.toDateString() === today && (billDate.getHours() < 12 ? 1 : 2) === currentShift;
    });
    const totalShiftRevenue = shiftBills.reduce((sum, b) => sum + b.BillTotalAmount, 0);

    return (
      <div className="row">
        <div className="col-md-6 mx-auto">
          <div className="card shadow text-center border-primary">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">💰 Báo cáo Ca {currentShift}</h4>
              <small>{new Date().toLocaleDateString('vi-VN')}</small>
            </div>
            <div className="card-body py-5">
              <h5 className="text-muted">Tổng doanh thu tạm tính</h5>
              <h1 className="display-4 fw-bold text-success">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalShiftRevenue)}
              </h1>
              <p className="card-text">Tổng số hóa đơn: <strong>{shiftBills.length}</strong></p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- MAIN RENDER ---
  return (
    <div className="d-flex vh-100 bg-light overflow-hidden">
      {/* SIDEBAR */}
      <div className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark" style={{ width: '280px' }}>
        <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
          <span className="fs-4 fw-bold">👔 Quản Lý</span>
        </a>
        <hr />
        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item">
            <button 
              className={`nav-link text-white w-100 text-start ${activeTab === 'dashboard' ? 'active bg-primary' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              🪑 Sơ đồ bàn
            </button>
          </li>
          <li>
            <button 
              className={`nav-link text-white w-100 text-start ${activeTab === 'menu' ? 'active bg-primary' : ''}`}
              onClick={() => setActiveTab('menu')}
            >
              🥗 Quản lý Thực đơn
            </button>
          </li>
          <li>
            <button 
              className={`nav-link text-white w-100 text-start ${activeTab === 'history' ? 'active bg-primary' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              📜 Lịch sử hóa đơn
            </button>
          </li>
          <li>
            <button 
              className={`nav-link text-white w-100 text-start ${activeTab === 'shift' ? 'active bg-primary' : ''}`}
              onClick={() => setActiveTab('shift')}
            >
              📊 Báo cáo ca trực
            </button>
          </li>
        </ul>
        <hr />
        <button className="btn btn-outline-light w-100" onClick={handleLogout}>Đăng xuất</button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow-1 overflow-auto p-4">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'menu' && <MenuManager />}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'shift' && renderShiftReport()}
      </div>

      {/* MODAL THANH TOÁN */}
      {selectedTable && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">💳 Thanh toán - Bàn {selectedTable.TableNumber}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedTable(null)}></button>
              </div>
              <div className="modal-body">
                <table className="table table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Món ăn</th>
                      <th className="text-center">SL</th>
                      <th className="text-center">Trạng thái</th>
                      <th className="text-end">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Tính toán chi tiết món kèm trạng thái
                      const tableOrders = activeOrders.filter(o => o.TableNumber === selectedTable.TableNumber);
                      const dishesWithStatus = [];
                      
                      tableOrders.forEach(order => {
                        const items = order.OrderDetails || [];
                        items.forEach(item => {
                          dishesWithStatus.push({
                            DishName: item.DishName,
                            Quantity: item.Quantity,
                            Total: item.Total,
                            Status: item.Status
                          });
                        });
                      });

                      return dishesWithStatus.map((item, idx) => (
                        <tr key={idx} className={item.Status !== "Đã phục vụ" ? "table-warning" : ""}>
                          <td>{item.DishName}</td>
                          <td className="text-center">{item.Quantity}</td>
                          <td className="text-center">
                            {item.Status === "Đã phục vụ" ? (
                              <span className="badge bg-success">Đã phục vụ</span>
                            ) : item.Status === "Đang nấu" ? (
                              <span className="badge bg-info">🔥 Đang nấu</span>
                            ) : (
                              <span className="badge bg-warning text-dark">Chờ chế biến</span>
                            )}
                          </td>
                          <td className="text-end">{item.Total.toLocaleString()}đ</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                  <tfoot>
                    <tr className="table-active">
                      <td colSpan="3" className="fw-bold text-end">TỔNG CỘNG:</td>
                      <td className="fw-bold text-end text-danger fs-5">
                        {tempBill.total.toLocaleString()}đ
                      </td>
                    </tr>
                  </tfoot>
                </table>
                
                {/* Cảnh báo nếu có món chưa phục vụ */}
                {(() => {
                  const tableOrders = activeOrders.filter(o => o.TableNumber === selectedTable.TableNumber);
                  const unservedCount = tableOrders.reduce((count, order) => {
                    return count + (order.OrderDetails || []).filter(d => d.Status !== "Đã phục vụ").length;
                  }, 0);
                  
                  if (unservedCount > 0) {
                    return (
                      <div className="alert alert-warning mb-0" role="alert">
                        <strong>⚠️ Lưu ý:</strong> Còn {unservedCount} món chưa được phục vụ. 
                        Vui lòng đợi bếp hoàn thành trước khi thanh toán.
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => alert("🖨️ Đã gửi lệnh in!")}>
                  🖨️ In phiếu tạm
                </button>
                <button className="btn btn-success fw-bold" onClick={handleConfirmPayment}>
                  ✅ Xác nhận & Đóng bàn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerPage;

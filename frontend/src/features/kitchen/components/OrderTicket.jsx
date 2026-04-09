// src/features/kitchen/components/OrderTicket.jsx

import React from 'react';

const OrderTicket = ({ order, onUpdateStatus, onUpdateDishStatus }) => {
  const isOrderDone = order.OrderStatus === 'Đã hoàn thành';

  // Chọn màu viền: Xanh lá nếu xong, Vàng cam nếu đang làm
  const borderClass = isOrderDone ? 'border-success' : 'border-warning';
  const headerClass = isOrderDone ? 'bg-success text-white' : 'bg-warning text-dark';

  // Hàm xử lý khi bấm nút trạng thái món
  const handleDishStatusClick = (dish, currentStatus) => {
    // Không cho phép thay đổi nếu đơn đã hoàn thành
    if (isOrderDone) return;
    
    if (onUpdateDishStatus) {
      onUpdateDishStatus(order.OrderID, dish, currentStatus);
    }
  };

  return (
    <div className={`card h-100 shadow-sm ${borderClass}`} style={{ borderWidth: '2px' }}>
      {/* HEADER: Số bàn và giờ */}
      <div className={`card-header d-flex justify-content-between align-items-center ${headerClass}`}>
        <h5 className="mb-0 fw-bold">Bàn {order.TableNumber}</h5>
        <span className="badge bg-light text-dark">
          {new Date(order.OrderCreatedTime?.$date || order.OrderCreatedTime).toLocaleTimeString(
            'vi-VN',
            { hour: '2-digit', minute: '2-digit' }
          )}
        </span>
      </div>

      {/* BODY: Danh sách món */}
      <ul className="list-group list-group-flush flex-grow-1">
        {order.OrderDetails.map((d, index) => {
          const isCancelled = d.Status?.toLowerCase().includes('hủy');
          const isServed = d.Status?.toLowerCase() === 'đã phục vụ';

          // Màu nền cho từng dòng món ăn
          let rowClass = 'list-group-item d-flex justify-content-between align-items-start';
          if (isCancelled) rowClass += ' list-group-item-secondary text-decoration-line-through';
          else if (isServed) rowClass += ' list-group-item-success';

          return (
            <li key={index} className={rowClass}>
              <div className="ms-2 me-auto">
                <div className="fw-bold">
                  <span className="badge bg-secondary me-2">{d.Quantity}</span>
                  {d.DishName}
                </div>
                {d.Note && <small className="text-danger fst-italic">Note: {d.Note}</small>}
              </div>
              
              {/* Nút trạng thái món - Khóa khi đơn đã hoàn thành */}
              {!isCancelled && (
                <button
                  className={`btn btn-sm ${isServed ? 'btn-success' : 'btn-secondary'}`}
                  onClick={() => handleDishStatusClick(d, isServed)}
                  disabled={isOrderDone}
                  style={{ 
                    opacity: isOrderDone ? 1 : 1,
                    cursor: isOrderDone ? 'not-allowed' : 'pointer'
                  }}
                  title={isOrderDone ? 'Đơn đã hoàn thành, không thể chỉnh sửa' : 'Click để thay đổi trạng thái'}
                >
                  {isServed ? 'Đã ra' : 'Chờ'}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* FOOTER: Nút bấm */}
      {!isOrderDone && (
        <div className="card-footer bg-transparent border-top-0 pb-3 pt-2 text-center">
          <button
            className="btn btn-outline-success w-100 fw-bold"
            onClick={() => onUpdateStatus(order.OrderID, 'Đã hoàn thành')}
          >
            Hoàn thành đơn
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderTicket;
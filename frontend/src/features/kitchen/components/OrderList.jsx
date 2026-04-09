// src/features/kitchen/components/OrderList.jsx

import React from 'react';
import OrderTicket from './OrderTicket';

const OrderList = ({ orders, onUpdateStatus, onUpdateDishStatus }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="alert alert-info text-center">
        Hiện tại không có đơn hàng nào.
      </div>
    );
  }

  return (
    <div className="order-list-container" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
      <div className="row g-4">
        {orders.map(order => (
          <div key={order.OrderID} className="col-12 col-md-6 col-lg-4 col-xl-3">
            <OrderTicket 
              order={order} 
              onUpdateStatus={onUpdateStatus}
              onUpdateDishStatus={onUpdateDishStatus}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderList;

// src/features/kitchen/components/KitchenFilters.jsx

import React from 'react';

const KitchenFilters = ({ currentFilter, currentView, onSetFilter, onSetView, tables = [] }) => {
  return (
    <div className="filters d-flex flex-wrap gap-2">
      {/* Nhóm 1: Chọn Bàn */}
      <div className="filter-group d-flex flex-wrap gap-2">
        <button 
          className={`btn btn-sm ${currentFilter === 'all' && currentView === 'orders' ? 'btn-primary' : 'btn-outline-primary'}`} 
          onClick={() => { onSetFilter('all'); onSetView('orders'); }}
        >
          Tất cả Order
        </button>
        
        {/* Render động danh sách bàn từ props */}
        {tables.map(table => (
          <button 
            key={table.TableNumber}
            className={`btn btn-sm ${currentFilter === table.TableNumber.toString() && currentView === 'orders' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => { onSetFilter(table.TableNumber.toString()); onSetView('orders'); }}
          >
            Bàn {table.TableNumber}
          </button>
        ))}
      </div>

      {/* Nhóm 2: Chuyển sang quản lý món */}
      <div className="view-group ms-auto">
        <button 
          className={`btn btn-sm ${currentView === 'dishes' ? 'btn-secondary' : 'btn-outline-secondary'}`} 
          onClick={() => onSetView('dishes')}
        >
          ⚙️ Quản lý Thực đơn
        </button>
      </div>
    </div>
  );
};

export default KitchenFilters;

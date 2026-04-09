// frontend/src/App.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import các trang chính sau khi đăng nhập
import KitchenPage from './features/kitchen/KitchenPage';
import TablePage from './features/table/TablePage';
import ManagerPage from './features/manager/ManagerPage';

// Import các trang Login riêng biệt cho từng loại user
import LoginKitchen from './features/auth/LoginKitchen';
import LoginManager from './features/auth/LoginManager';
import LoginTable from './features/auth/LoginTable';

function App() {
  return (
    <Routes>
      {/* Khi vào "/" thì tự động chuyển hướng sang trang login của bàn */}
      <Route path="/" element={<Navigate to="/login/table" />} />

      {/* --- CÁC TRANG CHỨC NĂNG --- */}
      <Route path="/kitchen" element={<KitchenPage />} />   {/* Trang dành cho bếp */}
      <Route path="/manager" element={<ManagerPage />} />   {/* Trang dành cho quản lý */}
      <Route path="/table" element={<TablePage />} />       {/* Trang dành cho bàn */}

      {/* --- CÁC TRANG ĐĂNG NHẬP RIÊNG BIỆT --- */}
      <Route path="/login/kitchen" element={<LoginKitchen />} />   {/* Login bếp */}
      <Route path="/login/manager" element={<LoginManager />} />   {/* Login quản lý */}
      <Route path="/login/table" element={<LoginTable />} />       {/* Login bàn */}
    </Routes>
  );
}

export default App;

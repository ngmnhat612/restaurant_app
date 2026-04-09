// frontedn/src/features/auth/LoginKitchen.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const LoginKitchen = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    const loginRes = await fetch("http://localhost:3000/accounts/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        AccountCode: username, 
        AccountPassword: password 
      })
    });

    // ... các kiểm tra lỗi ...

    const loginData = await loginRes.json();
    console.log('📦 [Kitchen] Response từ server:', loginData);

    if (!loginData.token || !loginData.account) {
      setError("❌ Không lấy được token đăng nhập!");
      setIsLoading(false);
      return;
    }

    const accountType = loginData.account.AccountTypeCode.toUpperCase();
    if (accountType !== 'KITCHEN') {
      setError("⚠️ Tài khoản không có quyền truy cập trang bếp!");
      setIsLoading(false);
      return;
    }

    // ✅ CHỈ XÓA DỮ LIỆU KITCHEN CŨ
    console.log('🧹 [Kitchen Login] Xóa dữ liệu Kitchen cũ');
    localStorage.removeItem("kitchen_user");
    localStorage.removeItem("token");

    // ✅ LƯU VỚI KEY MỚI: "kitchen_user"
    localStorage.setItem("token", loginData.token);
    const kitchenInfo = { 
      ...loginData.account, 
      SessionStart: new Date() 
    };
    localStorage.setItem("kitchen_user", JSON.stringify(kitchenInfo));  // ← THAY ĐỔI KEY

    console.log('✅ [Kitchen Login] Đăng nhập thành công:', kitchenInfo.AccountCode);
    
    navigate("/kitchen");

  } catch (err) {
    console.error('💥 [Kitchen Login] Lỗi:', err);
    setError("❌ Lỗi kết nối server!");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-dark text-white">
      <div className="card p-4 shadow-lg bg-secondary text-white" style={{ width: '400px' }}>
        <div className="text-center mb-4">
          <h1>👨‍🍳</h1>
          <h3>Đăng Nhập Bếp</h3>
        </div>

        {/* Form login */}
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label fw-bold">Tài khoản</label>
            <input 
              type="text" 
              className="form-control" 
              value={username} 
              onChange={e => {
                setUsername(e.target.value);
                setError('');
              }} 
              placeholder="Nhập tài khoản"
              autoFocus 
              required
              disabled={isLoading}
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-bold">Mật khẩu</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={e => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Nhập mật khẩu"
              required
              disabled={isLoading}
            />
          </div>

        {/* Hiển thị thông báo lỗi */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
          </div>
        )}

          <button 
            type="submit" 
            className="btn btn-warning w-100 fw-bold text-dark"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Đang xử lý...
              </>
            ) : (
              '🔥 Vào Bếp'
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default LoginKitchen;
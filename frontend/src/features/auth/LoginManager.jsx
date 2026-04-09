// frontend/src/features/auth/LoginManager.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const LoginManager = () => {
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
    console.log('📦 [Manager] Response từ server:', loginData);

    if (!loginData.token || !loginData.account) {
      setError("❌ Không lấy được token đăng nhập!");
      setIsLoading(false);
      return;
    }

    const accountType = loginData.account.AccountTypeCode.toUpperCase();
    if (accountType !== 'MANAGER') {
      setError("⚠️ Tài khoản không có quyền truy cập trang quản lý!");
      setIsLoading(false);
      return;
    }

    // ✅ CHỈ XÓA DỮ LIỆU MANAGER CŨ (không xóa kitchen_user hoặc currentTable)
    console.log('🧹 [Manager Login] Xóa dữ liệu Manager cũ');
    localStorage.removeItem("manager_user");
    localStorage.removeItem("token");

    // ✅ LƯU VỚI KEY MỚI: "manager_user"
    localStorage.setItem("token", loginData.token);
    const managerInfo = { 
      ...loginData.account, 
      SessionStart: new Date() 
    };
    localStorage.setItem("manager_user", JSON.stringify(managerInfo));  // ← THAY ĐỔI KEY

    console.log('✅ [Manager Login] Đăng nhập thành công:', managerInfo.AccountCode);
    
    navigate("/manager");

  } catch (err) {
    console.error('💥 [Manager Login] Lỗi:', err);
    setError("❌ Lỗi kết nối server!");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-4 shadow-lg border-primary" style={{ width: '400px' }}>
        <div className="text-center mb-4 text-primary">
          <h1>👔</h1>
          <h3>Quản Lý Nhà Hàng</h3>
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
            className="btn btn-primary w-100 fw-bold"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Đang xử lý...
              </>
            ) : (
              'Đăng Nhập'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginManager;
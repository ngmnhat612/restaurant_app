// frontend/src/features/auth/LoginTable.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const LoginTable = () => {
  const navigate = useNavigate();
  const [tableCode, setTableCode] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 1. Lấy danh sách bàn
      const res = await fetch("http://localhost:3000/tables");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const tables = await res.json();
      const foundTable = tables.find(
        t => t.AccountCode.toLowerCase() === tableCode.toLowerCase()
      );

      if (foundTable) {
        const tableInfo = { ...foundTable, SessionStart: new Date() };
        localStorage.setItem("currentTable", JSON.stringify(tableInfo));

        // 2. Login để lấy token
        const loginRes = await fetch("http://localhost:3000/accounts/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ AccountCode: tableCode, AccountPassword: "" })
        });
        const loginData = await loginRes.json();
        
        if (loginRes.ok && loginData.token) {
          localStorage.setItem("token", loginData.token);

          // ✅ 3. Gọi API mở bàn để cập nhật trạng thái
          await fetch(`http://localhost:3000/tables/${foundTable.TableNumber}/open`, {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${loginData.token}`
            }
          });

          console.log("✅ Đã mở bàn:", foundTable.TableNumber);

          // 4. Chuyển sang trang Table
          navigate("/table");
        } else {
          setError("❌ Không lấy được token đăng nhập!");
        }
      } else {
        setError("⚠️ Mã bàn không tồn tại (Thử: ban01, ban02...)");
      }
    } catch (err) {
      console.error("❌ Lỗi:", err);
      setError("❌ Lỗi kết nối server!");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" 
         style={{ background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)' }}>
      <div className="card p-5 shadow border-0 text-center" style={{ width: '400px', borderRadius: '15px' }}>
        <div className="mb-4">
            <div className="display-1">🍽️</div>
            <h3 className="mt-3 fw-bold text-secondary">Xin Chào Quý Khách</h3>
            <p className="text-muted">Vui lòng nhập mã bàn để bắt đầu</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <input 
                type="text" 
                className="form-control form-control-lg text-center fw-bold text-uppercase letter-spacing-2" 
                placeholder="NHẬP MÃ BÀN" 
                value={tableCode} 
                onChange={e => { setTableCode(e.target.value); setError(''); }}
                style={{ letterSpacing: '2px' }}
                autoFocus
            />
            {error && <div className="text-danger mt-2 small fw-bold">{error}</div>}
          </div>
          <button type="submit" className="btn btn-success btn-lg w-100 rounded-pill shadow-sm">
             Mở Bàn & Gọi Món
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginTable;
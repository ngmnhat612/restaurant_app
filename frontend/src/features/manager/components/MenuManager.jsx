// frontend/src/features/manager/components/MenuManager.jsx

import React, { useState, useEffect, useRef } from 'react';
import managerService from "../../../services/managerService";
import { tableService } from "../../../services/tableService";
import socket from '../../../config/socket';

const MenuManager = () => {
  const [menu, setMenu] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // State form
  const [formData, setFormData] = useState({
    DishID: '',
    DishName: '',
    DishPrice: '',
    DishTypeCode: 'LAU',
    DishImage: '',
    DishStatus: 'Còn'
  });

  // --- Lấy menu ban đầu ---
  useEffect(() => {
    const loadMenu = async () => {
      const dishes = await tableService.fetchMenu();
      setMenu(dishes);
    };
    loadMenu();
  }, []);

  // ✅ Lắng nghe realtime: Món được thêm
  useEffect(() => {
    const handleDishAdded = (newDish) => {
      console.log("📡 [MenuManager] Nhận dishAdded:", newDish.DishName);
      
      setMenu(prev => {
        // Kiểm tra món đã tồn tại chưa (tránh trùng)
        if (prev.some(d => d.DishID === newDish.DishID)) {
          return prev;
        }
        return [newDish, ...prev];
      });
    };

    socket.on("dishAdded", handleDishAdded);
    return () => socket.off("dishAdded", handleDishAdded);
  }, []);

  // ✅ Lắng nghe realtime: Món được cập nhật
  useEffect(() => {
    const handleDishUpdated = (updatedDish) => {
      console.log("📡 [MenuManager] Nhận dishUpdated:", updatedDish.DishName);
      
      setMenu(prev =>
        prev.map(d => d.DishID === updatedDish.DishID ? updatedDish : d)
      );
    };

    socket.on("dishUpdated", handleDishUpdated);
    return () => socket.off("dishUpdated", handleDishUpdated);
  }, []);

  // ✅ Lắng nghe realtime: Món bị xóa
  useEffect(() => {
    const handleDishDeleted = (deletedDishID) => {
      console.log("📡 [MenuManager] Nhận dishDeleted:", deletedDishID);
      
      setMenu(prev => prev.filter(d => d.DishID !== deletedDishID));
    };

    socket.on("dishDeleted", handleDishDeleted);
    return () => socket.off("dishDeleted", handleDishDeleted);
  }, []);

  // ✅ Lắng nghe realtime: Trạng thái Còn/Hết thay đổi (từ KitchenPage)
  useEffect(() => {
    const handleDishStatusChange = (updatedDish) => {
      console.log("📡 [MenuManager] Nhận dishStatusChanged:", updatedDish.DishName, "→", updatedDish.DishStatus);
      
      setMenu(prev =>
        prev.map(d => d.DishID === updatedDish.DishID ? { ...d, DishStatus: updatedDish.DishStatus } : d)
      );
    };

    socket.on("dishStatusChanged", handleDishStatusChange);
    return () => socket.off("dishStatusChanged", handleDishStatusChange);
  }, []);

  // Xử lý nhập liệu form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Xử lý chọn file ảnh
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra định dạng file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert("❌ Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)");
      return;
    }

    // Kiểm tra kích thước (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("❌ File ảnh quá lớn! Vui lòng chọn file dưới 5MB");
      return;
    }

    try {
      setIsUploading(true);
      
      // Tạo FormData để upload
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      // Gửi request upload
      const response = await fetch('http://localhost:3000/menu/dishes/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          // ✅ QUAN TRỌNG: KHÔNG set Content-Type cho FormData
          // Browser sẽ tự động set kèm boundary
        },
        body: formDataUpload
      });

      if (!response.ok) {
        throw new Error('Upload thất bại');
      }

      const result = await response.json();
      console.log("✅ Upload thành công:", result.filename);

      // Cập nhật form với tên file
      setFormData(prev => ({ ...prev, DishImage: result.filename }));
      
      alert(`✅ Upload thành công: ${result.filename}`);
    } catch (error) {
      console.error("❌ Lỗi upload:", error);
      alert("❌ Không thể upload ảnh. Vui lòng thử lại!");
    } finally {
      setIsUploading(false);
    }
  };

  // Nút Sửa
  const handleEditClick = (dish) => {
    setIsEditing(true);
    setFormData(dish);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Nút Hủy
  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      DishID: '',
      DishName: '',
      DishPrice: '',
      DishTypeCode: 'LAU',
      DishImage: '',
      DishStatus: 'Còn'
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Nút Lưu (Thêm mới hoặc Cập nhật)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.DishName || !formData.DishPrice) {
      alert("Vui lòng nhập tên và giá món!");
      return;
    }

    if (!formData.DishImage) {
      alert("Vui lòng chọn ảnh món ăn!");
      return;
    }

    try {
      if (isEditing) {
        // Cập nhật món - API sẽ emit socket
        await managerService.updateDish(menu, {
          ...formData,
          DishPrice: Number(formData.DishPrice)
        });
        alert("✅ Đã cập nhật món ăn!");
      } else {
        // Thêm món mới - API sẽ emit socket
        const newDish = {
          ...formData,
          DishID: formData.DishID || `D${Date.now()}`,
          DishPrice: Number(formData.DishPrice)
        };
        await managerService.addDish(menu, newDish);
        alert("✅ Đã thêm món mới!");
      }
      handleCancel();
    } catch (error) {
      console.error("❌ Lỗi lưu món:", error);
      alert("❌ Không thể lưu món. Vui lòng thử lại!");
    }
  };

  // Nút Xóa
  const handleDelete = async (id) => {
    if (window.confirm("Bạn chắc chắn muốn xóa món này?")) {
      try {
        await managerService.deleteDish(menu, id);
      } catch (error) {
        console.error("❌ Lỗi xóa món:", error);
        alert("❌ Không thể xóa món. Vui lòng thử lại!");
      }
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        {/* CỘT TRÁI: Form Nhập Liệu */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm border-primary">
            <div className="card-header bg-primary text-white fw-bold">
              {isEditing ? '✏️ Cập nhật món' : '➕ Thêm món mới'}
            </div>
            <div className="card-body">
              <form onSubmit={handleSave}>
                {/* Tên món */}
                <div className="mb-3">
                  <label className="form-label">Tên món *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="DishName"
                    value={formData.DishName}
                    onChange={handleInputChange}
                    placeholder="VD: Lẩu Thái"
                    required
                  />
                </div>

                {/* Giá tiền */}
                <div className="mb-3">
                  <label className="form-label">Giá tiền (VNĐ) *</label>
                  <input
                    type="number"
                    className="form-control"
                    name="DishPrice"
                    value={formData.DishPrice}
                    onChange={handleInputChange}
                    placeholder="VD: 250000"
                    required
                  />
                </div>

                {/* Loại món */}
                <div className="mb-3">
                  <label className="form-label">Loại món</label>
                  <select
                    className="form-select"
                    name="DishTypeCode"
                    value={formData.DishTypeCode}
                    onChange={handleInputChange}
                  >
                    <option value="LAU">Lẩu</option>
                    <option value="NUONG">Nướng</option>
                    <option value="KHAIVI">Khai vị</option>
                    <option value="NUOC">Đồ uống</option>
                  </select>
                </div>

                {/* ✅ Upload ảnh */}
                <div className="mb-3">
                  <label className="form-label">Ảnh món ăn *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageSelect}
                    disabled={isUploading}
                  />
                  <small className="text-muted d-block mt-1">
                    Chấp nhận: JPG, PNG, GIF, WEBP (Max 5MB)
                  </small>
                  
                  {/* Hiển thị tên file đã chọn */}
                  {formData.DishImage && (
                    <div className="mt-2 p-2 bg-light rounded">
                      <small className="text-success fw-bold">
                        ✅ {formData.DishImage}
                      </small>
                    </div>
                  )}

                  {/* Preview ảnh */}
                  {formData.DishImage && (
                    <div className="mt-2">
                      <img 
                        src={`http://localhost:3000/images/${formData.DishImage}`}
                        alt="Preview"
                        className="img-thumbnail"
                        style={{ maxHeight: '150px' }}
                      />
                    </div>
                  )}
                </div>

                {/* Trạng thái */}
                <div className="mb-3">
                  <label className="form-label">Trạng thái</label>
                  <select
                    className="form-select"
                    name="DishStatus"
                    value={formData.DishStatus}
                    onChange={handleInputChange}
                  >
                    <option value="Còn">Còn hàng</option>
                    <option value="Hết">Hết hàng</option>
                  </select>
                </div>

                {/* Nút hành động */}
                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className={`btn ${isEditing ? 'btn-warning' : 'btn-success'} fw-bold`}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Đang upload...
                      </>
                    ) : (
                      isEditing ? 'Lưu Thay Đổi' : 'Thêm Món Mới'
                    )}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancel}
                    >
                      Hủy bỏ
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Danh sách món ăn */}
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white fw-bold d-flex justify-content-between align-items-center">
              <span>📋 Danh sách thực đơn ({menu.length} món)</span>
            </div>
            <div className="table-responsive" style={{ maxHeight: '75vh' }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light sticky-top">
                  <tr>
                    <th>Ảnh</th>
                    <th>Tên món</th>
                    <th>Giá</th>
                    <th>Trạng thái</th>
                    <th className="text-end">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {menu.map(dish => (
                    <tr key={dish.DishID}>
                      <td>
                        <img
                          src={`http://localhost:3000/images/${dish.DishImage}`}
                          alt=""
                          className="rounded"
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/50';
                          }}
                        />
                      </td>
                      <td className="fw-bold">{dish.DishName}</td>
                      <td className="text-danger">
                        {Number(dish.DishPrice).toLocaleString()}đ
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            dish.DishStatus === 'Còn' ? 'bg-success' : 'bg-secondary'
                          }`}
                        >
                          {dish.DishStatus}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEditClick(dish)}
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(dish.DishID)}
                        >
                          🗑️ Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuManager;
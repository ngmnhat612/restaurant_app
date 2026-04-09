// front/src/features/kitchen/components/DishManager.jsx

const DishManager = ({ dishes, onToggleStatus }) => {
  
  // Hàm format tiền tệ cho gọn code
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    // Sử dụng Grid của Bootstrap: row và khoảng cách g-4
    <div className="row g-4">
      {dishes.map((dish) => {
        const isOutOfStock = dish.DishStatus === 'Hết';

        return (
          // Responsive: Mobile 1 cột, Tablet 2-3 cột, Desktop 4 cột
          <div key={dish.DishID} className="col-12 col-sm-6 col-md-4 col-xl-3">
            
            {/* Card Bootstrap với class h-100 để các thẻ cao bằng nhau */}
            <div className={`card h-100 shadow-sm ${isOutOfStock ? 'border-danger opacity-75' : ''}`}>
              
              {/* KHUNG ẢNH: position-relative để đặt badge trạng thái */}
              <div className="position-relative">
                <img 
                  src={`http://localhost:3000/images/${dish.DishImage}`} 
                  className="card-img-top" 
                  alt={dish.DishName}
                  // ⭐ QUAN TRỌNG: Ép chiều cao cố định và cắt ảnh thừa
                  style={{ height: '200px', objectFit: 'cover' }} 
                />
                
                {/* Badge trạng thái nằm trên góc ảnh */}
                <span className={`position-absolute top-0 end-0 badge m-2 ${isOutOfStock ? 'bg-danger' : 'bg-success'}`}>
                  {dish.DishStatus}
                </span>
              </div>

              {/* PHẦN THÂN CARD */}
              <div className="card-body d-flex flex-column">
                <h5 className="card-title text-truncate" title={dish.DishName}>
                  {dish.DishName}
                </h5>
                
                <p className="card-text fw-bold text-primary fs-5">
                  {formatMoney(dish.DishPrice)}
                </p>

                {/* Các nút bấm (đẩy xuống đáy nhờ mt-auto) */}
                <div className="mt-auto d-flex gap-2">
                  <button 
                    className={`btn flex-fill ${!isOutOfStock ? 'btn-success' : 'btn-outline-success'}`}
                    disabled={!isOutOfStock}
                    onClick={() => onToggleStatus(dish.DishID, dish.DishName, 'on')}
                  >
                    Còn
                  </button>
                  <button 
                    className={`btn flex-fill ${isOutOfStock ? 'btn-danger' : 'btn-outline-danger'}`}
                    disabled={isOutOfStock}
                    onClick={() => onToggleStatus(dish.DishID, dish.DishName, 'off')}
                  >
                    Hết
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DishManager;
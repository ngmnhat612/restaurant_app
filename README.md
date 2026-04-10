# 🍽️ Restaurant Management System

Hệ thống quản lý nhà hàng theo kiến trúc **microservices**, hỗ trợ quản lý thực đơn, đặt món, xử lý đơn hàng và thanh toán theo thời gian thực qua **Socket.IO**.

> 🚧 **Trạng thái:** Hoàn thiện ~80% — đang phát triển tích cực.

---

## 📐 Kiến trúc hệ thống

```
                        ┌─────────────────┐
                        │   Frontend      │
                        │  (React/Vite)   │
                        │  :5173 / :5174  │
                        └────────┬────────┘
                                 │ HTTP + WebSocket
                        ┌────────▼────────┐
                        │   API Gateway   │  ← Cổng trung tâm
                        │    Port 3000    │  ← Socket.IO proxy
                        └──┬──┬──┬──┬──┬─┘
                           │  │  │  │  │
          ┌────────────────┘  │  │  │  └──────────────────┐
          │              ┌────┘  └────┐                    │
          ▼              ▼            ▼                    ▼
  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────────┐
  │  Account  │  │   Menu    │  │  Order   │  │ Branch/Ingredient │
  │  Service  │  │  Service  │  │ Service  │  │    Services       │
  │  :3001    │  │  :3002    │  │  :3003   │  │  :3004 / :3005    │
  └───────────┘  └───────────┘  └──────────┘  └──────────────────┘
```

---

## 🧩 Các Microservice

| Service | Port | Mô tả |
|---|---|---|
| `api-gateway` | 3000 | Cổng API trung tâm, định tuyến và proxy Socket.IO |
| `account-service` | 3001 | Đăng ký, đăng nhập, xác thực JWT |
| `menu-service` | 3002 | Quản lý thực đơn, món ăn, hình ảnh |
| `order-service` | 3003 | Quản lý bàn, đơn hàng, hóa đơn |
| `branch-service` | 3004 | Quản lý chi nhánh nhà hàng |
| `ingredient-service` | 3005 | Quản lý nguyên liệu |
| `frontend` | 5173 | Giao diện người dùng |

---

## ⚡ Tính năng chính

### Đã hoàn thiện
- ✅ Xác thực người dùng (JWT)
- ✅ Quản lý thực đơn (thêm, sửa, xóa món, upload ảnh)
- ✅ Quản lý bàn ăn (mở/đóng bàn theo thời gian thực)
- ✅ Đặt món và quản lý đơn hàng
- ✅ Quản lý hóa đơn (bill)
- ✅ Cập nhật trạng thái món ăn (Còn/Hết) realtime
- ✅ Quản lý chi nhánh
- ✅ Quản lý nguyên liệu
- ✅ Real-time updates qua Socket.IO (đơn mới, trạng thái món, bàn mở/đóng)

### Đang phát triển (~20% còn lại)
- 🔄 Báo cáo doanh thu & thống kê
- 🔄 Quản lý nhân viên
- 🔄 Tích hợp thanh toán online
- 🔄 Tối ưu hiệu suất & kiểm thử

---

## 🛠️ Tech Stack

| Thành phần | Công nghệ |
|---|---|
| Backend | Node.js, Express.js |
| Frontend | React, Vite |
| Realtime | Socket.IO |
| Authentication | JWT (JSON Web Token) |
| Process Manager | concurrently, npm-run-all |

---

## 🚀 Cài đặt & Chạy dự án

### Yêu cầu
- Node.js >= 18
- npm >= 9

### 1. Clone repo

```bash
git clone https://github.com/ngmnhat612/restaurant_app.git
cd restaurant_app
```

### 2. Cài đặt dependencies (tất cả service)

```bash
# Cài dependencies gốc
npm install

# Cài cho từng service
cd account-service && npm install && cd ..
cd api-gateway && npm install && cd ..
cd branch-service/src && npm install && cd ../..
cd ingredient-service/src && npm install && cd ../..
cd menu-service && npm install && cd ..
cd order-service && npm install && cd ..
cd frontend && npm install && cd ..
```

### 3. Cấu hình biến môi trường

Tạo file `.env` cho từng service dựa theo `.env.example`:

**`api-gateway/.env`**
```env
ACCOUNT_SERVICE_URL=http://localhost:3001
MENU_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
BRANCH_SERVICE_URL=http://localhost:3004
INGREDIENT_SERVICE_URL=http://localhost:3005
JWT_SECRET=your_strong_random_secret_here
```

> ⚠️ **Lưu ý:** Tạo JWT_SECRET mạnh bằng lệnh:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4. Chạy dự án

**Chạy tất cả service cùng lúc (Development):**
```bash
npm run dev
```

**Hoặc chạy từng service riêng lẻ:**
```bash
npm run dev:menu       # Menu service
npm run dev:order      # Order service
npm run dev:account    # Account service
npm run dev:frontend   # Frontend
npm run dev:gateway    # API Gateway
```

**Production:**
```bash
npm start
```

---

## 🔌 API Endpoints (qua Gateway :3000)

| Endpoint | Auth | Mô tả |
|---|---|---|
| `POST /accounts/...` | ❌ | Đăng ký / Đăng nhập |
| `GET /menu/...` | ✅ JWT | Xem & quản lý thực đơn |
| `GET /images/...` | ❌ | Hình ảnh món ăn |
| `GET/POST /tables/...` | ❌ | Quản lý bàn ăn |
| `GET/POST /orders/...` | ❌ | Quản lý đơn hàng |
| `GET/POST /bills/...` | ✅ JWT | Quản lý hóa đơn |
| `GET/POST /branches/...` | ✅ JWT | Quản lý chi nhánh |
| `GET/POST /ingredients/...` | ✅ JWT | Quản lý nguyên liệu |

---

## 📡 Socket.IO Events

| Event | Chiều | Mô tả |
|---|---|---|
| `dishStatusChanged` | Server → Client | Món ăn thay đổi trạng thái Còn/Hết |
| `dishAdded` | Server → Client | Thêm món mới vào thực đơn |
| `dishUpdated` | Server → Client | Cập nhật thông tin món |
| `dishDeleted` | Server → Client | Xóa món khỏi thực đơn |
| `newOrder` | Server → Client | Có đơn hàng mới |
| `dishStatusUpdated` | Server → Client | Cập nhật trạng thái món trong đơn |
| `orderCompleted` | Server → Client | Đơn hàng hoàn thành |
| `tableOpened` | Server → Client | Bàn được mở |
| `tableClosed` | Server → Client | Bàn được đóng |
| `billStatusChanged` | Server → Client | Trạng thái hóa đơn thay đổi |

---

## 🔒 Bảo mật

- Xác thực bằng **JWT** trên các route nhạy cảm
- Biến môi trường được quản lý qua file `.env.example` (không commit lên Git)
- **Không** lưu credential trực tiếp trong source code

> ⚠️ Đảm bảo file `.env` đã có trong `.gitignore` trước khi push lên remote.

---

## 📁 Cấu trúc thư mục

```
restaurant_app/
├── api-gateway/          # Cổng API trung tâm + Socket.IO proxy
├── account-service/      # Xác thực & tài khoản người dùng
├── menu-service/         # Quản lý thực đơn & hình ảnh
├── order-service/        # Bàn ăn, đơn hàng, hóa đơn
├── branch-service/       # Chi nhánh nhà hàng
├── ingredient-service/   # Nguyên liệu
├── frontend/             # Giao diện React
├── package.json          # Root scripts (chạy tất cả service)
└── README.md
```

---

## 👨‍💻 Tác giả

**ngmnhat612** — [GitHub](https://github.com/ngmnhat612)

---

> 📌 Dự án đang trong quá trình phát triển. Mọi đóng góp và phản hồi đều được hoan nghênh!

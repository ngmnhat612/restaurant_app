// frontend/src/config/socket.js

import { io } from 'socket.io-client';

// ✅ Kết nối đến API Gateway thay vì trực tiếp menu-service
const socket = io("http://localhost:3000", {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Debug logs
socket.on("connect", () => {
  console.log("✅ Socket connected to Gateway:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Socket disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket connection error:", error.message);
});

export default socket;
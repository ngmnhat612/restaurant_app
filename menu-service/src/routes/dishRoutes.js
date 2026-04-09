// menu-service/src/routes/dishRoutes.js

const express = require("express");
const router = express.Router();
const dishController = require("../controllers/dishController");
const multer = require("multer");
const path = require("path");

// ✅ Cấu hình Multer để lưu file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Lưu vào thư mục public/images
    cb(null, path.join(__dirname, "../../public/images"));
  },
  filename: (req, file, cb) => {
    // ✅ Giữ nguyên tên file gốc (VD: TU_coca_cola.jpg)
    cb(null, file.originalname);
  }
});

// ✅ Filter chỉ chấp nhận file ảnh
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: fileFilter
});

// ✅ Route upload ảnh
router.post("/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Không có file được upload" });
    }

    console.log("✅ File uploaded:", req.file.originalname);
    
    res.json({
      message: "Upload thành công",
      filename: req.file.originalname,
      path: `/images/${req.file.originalname}`
    });
  } catch (error) {
    console.error("❌ Lỗi upload:", error);
    res.status(500).json({ error: error.message });
  }
});

// CRUD món ăn
router.get("/", dishController.getAll);
router.post("/", dishController.create);
router.put("/:id", dishController.update);
router.delete("/:id", dishController.delete);

// Bật/tắt trạng thái món ăn
router.put("/:id/toggle", dishController.toggleStatus);

module.exports = router;
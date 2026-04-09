// order-service/src/controllers/tableController.js

const Table = require("../models/Table");

// Mở bàn
exports.openTable = async (req, res) => {
  try {
    console.log("🔓 [openTable] Bắt đầu mở bàn:", req.params.number);

    // Cập nhật trạng thái bàn thành "Đang sử dụng"
    const table = await Table.findOneAndUpdate(
      { TableNumber: parseInt(req.params.number) },
      { TableStatus: "Đang sử dụng" },
      { new: true }
    );

    if (!table) {
      console.error("❌ [openTable] Không tìm thấy bàn:", req.params.number);
      return res.status(404).json({ error: "Không tìm thấy bàn" });
    }

    console.log("✅ [openTable] Đã cập nhật DB:", table.TableNumber, "→", table.TableStatus);

    // ✅ Emit realtime cho Manager Page
    const io = req.io;
    if (io) {
      io.emit("tableOpened", table);
      console.log("📡 [openTable] Đã emit tableOpened:", JSON.stringify(table));
    } else {
      console.error("❌ [openTable] Không tìm thấy io object!");
    }

    res.json(table);
  } catch (err) {
    console.error("❌ [openTable] Lỗi:", err);
    res.status(500).json({ error: err.message });
  }
};

// Đóng bàn
exports.closeTable = async (req, res) => {
  try {
    console.log("🔒 [closeTable] Bắt đầu đóng bàn:", req.params.number);

    // Cập nhật trạng thái bàn thành "Trống"
    const table = await Table.findOneAndUpdate(
      { TableNumber: parseInt(req.params.number) },
      { TableStatus: "Trống" },
      { new: true }
    );

    if (!table) {
      console.error("❌ [closeTable] Không tìm thấy bàn:", req.params.number);
      return res.status(404).json({ error: "Không tìm thấy bàn" });
    }

    console.log("✅ [closeTable] Đã cập nhật DB:", table.TableNumber, "→", table.TableStatus);

    // ✅ Emit realtime
    const io = req.io;
    if (io) {
      io.emit("tableClosed", table);
      console.log("📡 [closeTable] Đã emit tableClosed:", JSON.stringify(table));
    } else {
      console.error("❌ [closeTable] Không tìm thấy io object!");
    }

    res.json(table);
  } catch (err) {
    console.error("❌ [closeTable] Lỗi:", err);
    res.status(500).json({ error: err.message });
  }
};

// Lấy tất cả bàn
exports.getTables = async (req, res) => {
  try {
    const tables = await Table.find();
    res.json(tables);
  } catch (err) {
    console.error("❌ [getTables] Lỗi:", err);
    res.status(500).json({ error: err.message });
  }
};
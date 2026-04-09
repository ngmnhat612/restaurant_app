// account-service/src/controllers/accountController.js

const Account = require("../models/Account");
const bcrypt = require("bcryptjs");       // Dùng để mã hóa và so sánh mật khẩu
const jwt = require("jsonwebtoken");      // Dùng để tạo token đăng nhập

// Hàm xử lý đăng nhập
exports.login = async (req, res) => {
  try {
    const { AccountCode, AccountPassword } = req.body;

    const account = await Account.findOne({ AccountCode });
    if (!account) return res.status(404).json({ error: "Account not found" });

    // Nếu là TABLE thì không cần mật khẩu nhưng vẫn cấp token
    if (account.AccountTypeCode === "TABLE") {
      const token = jwt.sign(
        { id: account._id, role: account.AccountTypeCode },
        "secret",
        { expiresIn: "1h" }
      );
      return res.json({ token, account });
    }

    // Với các loại account khác (quản lý, bếp) thì kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(AccountPassword, account.AccountPassword);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: account._id, role: account.AccountTypeCode },
      "secret",
      { expiresIn: "1h" }
    );

    res.json({ token, account });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


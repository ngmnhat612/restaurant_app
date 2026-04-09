// account-service/src/services/import-data.js

const mongoose = require("mongoose");
const AccountType = require("../models/AccountType");
const Account = require("../models/Account");
const accountTypes = require("../data/account_type.json"); // Dữ liệu loại tài khoản
const accounts = require("../data/account.json");          // Dữ liệu tài khoản
const bcrypt = require("bcryptjs");

// Kết nối MongoDB
mongoose.connect("mongodb://localhost:27017/restaurant", { useNewUrlParser: true, useUnifiedTopology: true });

async function importData() {
  try {
    // Xóa dữ liệu cũ để tránh trùng lặp
    await AccountType.deleteMany();
    await Account.deleteMany();

    // Import loại tài khoản
    await AccountType.insertMany(accountTypes);

    // Import tài khoản, nếu có mật khẩu thì mã hóa trước khi lưu
    const accountsWithHashedPassword = await Promise.all(
      accounts.map(async (acc) => {
        if (acc.AccountPassword) {
          acc.AccountPassword = await bcrypt.hash(acc.AccountPassword, 10);
        }
        return acc;
      })
    );

    await Account.insertMany(accountsWithHashedPassword);

    console.log("Data imported successfully");
    process.exit(); // Thoát sau khi import xong
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

importData();

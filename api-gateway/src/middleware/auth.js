// api-gateway/src/middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    console.log("🔐 Auth middleware check for:", req.method, req.originalUrl);
    
    // Lấy token từ header Authorization
    const authHeader = req.headers["authorization"];
    console.log("🔐 Authorization header:", authHeader);
    
    if (!authHeader) {
      console.error("❌ No authorization header");
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
      console.error("❌ No token in authorization header");
      return res.status(401).json({ error: "No token provided" });
    }

    console.log("🔐 Token:", token.substring(0, 20) + "...");

    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified for user:", decoded.AccountCode);
    
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err.message);
    res.status(401).json({ error: "Invalid token" });
  }
};

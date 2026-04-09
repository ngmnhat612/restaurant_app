// api-gateway/src/utils/forward.js

const axios = require("axios");

// Danh sách prefix cần xoá
const API_PREFIXES = ["/menu", "/accounts", "/orders", "/bills"];

// Danh sách static prefix KHÔNG xoá
const STATIC_PREFIXES = ["/images", "/public"];

function removePrefix(originalUrl, prefix) {
  const [path, queryString] = originalUrl.split('?');
  let newPath = path.startsWith(prefix) ? path.replace(prefix, '') : path;
  return queryString ? `${newPath}?${queryString}` : newPath;
}

async function forwardRequest(serviceUrl, req, res) {
  try {
    const originalUrl = req.originalUrl;
    let newPath = originalUrl;

    const prefix = "/" + originalUrl.split("/")[1].split("?")[0];

    if (!STATIC_PREFIXES.includes(prefix)) {
      if (API_PREFIXES.includes(prefix)) {
        newPath = removePrefix(originalUrl, prefix);
      }
    }

    const targetUrl = `${serviceUrl}${newPath}`;
    
    console.log("🔄 FORWARD:", req.method, originalUrl, "→", targetUrl);

    const isImageRequest = STATIC_PREFIXES.some(p => originalUrl.startsWith(p));
    
    // ✅ Kiểm tra xem có phải upload file không
    const isMultipartUpload = req.headers['content-type']?.includes('multipart/form-data');

    // ✅ Chuẩn bị request config
    const requestConfig = {
      method: req.method,
      url: targetUrl,
      headers: {
        ...req.headers,
        host: undefined,
        'content-length': undefined // ✅ Xóa content-length để axios tự tính
      },
      responseType: isImageRequest ? 'stream' : 'json',
      validateStatus: () => true, // Chấp nhận mọi status code
      timeout: 30000 // ✅ Timeout 30s
    };

    // ✅ XỬ LÝ UPLOAD FILE - PHẦN MỚI THÊM
    if (isMultipartUpload) {
      console.log("📤 Forwarding multipart/form-data (file upload)");
      
      // Stream request body trực tiếp thay vì parse
      requestConfig.data = req;
      requestConfig.maxBodyLength = Infinity;
      requestConfig.maxContentLength = Infinity;
      
      // KHÔNG log data vì là binary
      // KHÔNG parse JSON
    } 
    // ✅ XỬ LÝ REQUEST THÔNG THƯỜNG - GIỮ NGUYÊN
    else if (req.method !== 'GET' && req.method !== 'DELETE') {
      // Nếu body rỗng, gửi object rỗng thay vì undefined
      requestConfig.data = req.body && Object.keys(req.body).length > 0 
        ? req.body 
        : {};
      
      console.log("📤 Request data:", JSON.stringify(requestConfig.data));
    }

    const response = await axios(requestConfig);

    console.log("✅ Service response status:", response.status);
    
    if (!isImageRequest && response.status >= 400) {
      console.error("❌ Service error response:", JSON.stringify(response.data, null, 2));
    }

    if (isImageRequest) {
      res.set('Content-Type', response.headers['content-type']);
      response.data.pipe(res);
    } else {
      console.log("✅ Forwarding response:", response.status);
      res.status(response.status).json(response.data);
    }

  } catch (err) {
    console.error("❌ FORWARD ERROR:", err.message);
    console.error("❌ Error code:", err.code);
    
    if (err.response) {
      console.error("❌ Response status:", err.response.status);
      console.error("❌ Response data:", err.response.data);
      res.status(err.response.status).json(err.response.data);
    } else if (err.code === 'ECONNABORTED') {
      console.error("❌ Request timeout");
      res.status(504).json({ 
        error: "Gateway timeout",
        details: "Service took too long to respond"
      });
    } else {
      console.error("❌ Network error:", err.message);
      res.status(503).json({ 
        error: "Service unavailable",
        details: err.message 
      });
    }
  }
}

module.exports = forwardRequest;
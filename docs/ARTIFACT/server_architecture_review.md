---
title: Server Architecture Review
review_date: 2026-05-06
status: Reviewed
reviewer: Dazk Dev
---

# Đánh giá cấu trúc Server (Rental Home Project)

Cấu trúc server của Rento được thiết kế rất chuyên nghiệp, tuân thủ chặt chẽ theo mô hình **MVC kết hợp với Service Repository Pattern**. Điều này giúp tách biệt rõ ràng giữa tầng giao tiếp mạng (Routes/Controllers), tầng xử lý logic kinh doanh (Services) và tầng dữ liệu (Models).

Dưới đây là một bản phân tích chi tiết về kiến trúc hiện tại của dự án:

## 1. Tổ chức thư mục (Directory Structure)

Server có một cấu trúc thư mục rất module hóa và chuẩn mực:

- **`index.js` & `app.js`**: Tách biệt rõ ràng. `app.js` chịu trách nhiệm cấu hình Express (Middleware, Routes, Error Handlers), trong khi `index.js` quản lý vòng đời server (chạy HTTP server, kết nối Database, cấu hình Socket.io, khởi chạy Cron jobs).
- **`routes/`**: Nơi định nghĩa các endpoint. Việc phân chia thành public (auth, search), protected (booking, profile) và admin routes giúp dễ dàng quản lý quyền truy cập.
- **`controllers/`**: Tiếp nhận request từ routes, gọi qua Service để xử lý và trả về response.
- **`services/`**: Nơi chứa Core Business Logic (ví dụ: `bookingService.js`, `paymentService.js`, `fcmService.js`). Đây là một điểm sáng lớn, giúp Controller không bị "phình to" và logic dễ dàng được tái sử dụng hoặc test độc lập.
- **`models/`**: Nơi chứa Mongoose schemas. Được định nghĩa rất chi tiết với các validation, methods, và static functions.
- **`middleware/`**: Tập trung các logic chặn/kiểm tra trước khi vào route (VD: `auth.js`, `rateLimiter.js`, `errorHandler.js`).
- **`validators/`**: Sử dụng `zod` để validate input payload (body, params) rất an toàn và hiện đại.
- **`scripts/`**: Chứa các script migration và test (ví dụ test concurrent booking), thể hiện dự án được chuẩn bị kỹ lưỡng cho việc bảo trì.

## 2. Ưu điểm nổi bật (Strengths)

- **Xử lý đồng thời (Concurrency Control):** Dự án có các cơ chế phức tạp nhưng được xử lý tốt, như chức năng khóa tạm thời (lock) với `BookingIntent` khi có nhiều người cùng đặt phòng, kết hợp với các script dọn dẹp lock cũ (`lockCleanupService`).
- **Bảo mật & Tính ổn định:**
  - Quản lý rate limit cực kỳ chi tiết (`authLimiter`, `paymentLimiter`, `apiLimiter`).
  - Có centralized Error Handler (`errorHandler.js`).
  - CORS được whitelist cẩn thận.
- **Tích hợp Background Jobs:** Tích hợp `node-cron` một cách gọn gàng để xử lý các task chạy ngầm (Payment reminders, Monthly rent).
- **Xác thực dữ liệu chặt chẽ:** Tích hợp thư viện `zod` để validate schema độc lập ở folder `validators/`. Đây là một best practice giúp chặn lỗi định dạng dữ liệu từ cửa ngõ trước khi đưa vào Database.
- **Real-time & Push Notifications:** Tích hợp cả Socket.io (cho chat/presence) và FCM Firebase (cho Push notification) hỗ trợ nền tảng đa kênh rất tốt.

## 3. Một số điểm có thể cải thiện (Areas for Improvement)

Mặc dù tổng thể dự án rất tuyệt vời, vẫn có một số ít vị trí có thể được tối ưu hóa thêm:

1. **Tách biệt Socket.io logic:** Hiện tại toàn bộ logic của WebSockets (kết nối, tracking user, gửi message, typing) đều nằm trong `index.js`. Về lâu dài, khi tính năng realtime mở rộng (vd: group chat, gọi video), file `index.js` sẽ bị phình to. **Đề xuất:** Tạo một folder `sockets/` hoặc file `socketManager.js` để đóng gói logic này.
2. **Quản lý Error Classes:** Có thể định nghĩa thêm các Custom Error Classes (ví dụ: `AppError`, `NotFoundError`, `ValidationError`) trong một file riêng ở mục `utils/errors.js` để ném lỗi có định dạng chuẩn (HTTP code + message) xuyên suốt từ Services ra Controllers.
3. **Phân trang & Lọc dữ liệu (Pagination/Filtering):** Nếu chưa có, nên cân nhắc tạo một Utility class hoặc Middleware chuyên xử lý các query strings (sort, page, limit, filter) để dùng chung cho các route GET danh sách.

---

**Kết luận:** Nhìn chung, cấu trúc server của bạn cực kỳ **chuyên nghiệp, dễ mở rộng (scalable) và tuân thủ các best practice** hiện đại của Node.js. Sự tách bạch giữa Controller và Service là điểm cộng lớn nhất giúp dự án có thể dễ dàng bảo trì và thêm mới tính năng.

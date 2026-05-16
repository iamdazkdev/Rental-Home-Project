# 🚀 Kế hoạch Nâng cấp bộ `.agents` chuẩn Enterprise (Rental Home Project)

Kế hoạch này vạch ra lộ trình từng bước để "nâng cấp" bộ `.agents` hiện tại từ mức cơ bản (starter-pack) lên tiêu chuẩn doanh nghiệp, mượn các pattern xuất sắc từ `everything-claude-code` nhưng **không làm quá tải ngữ cảnh (Context Overload)** của AI.

---

## 🎯 Giai đoạn 1: Tái Cấu Trúc Nền Tảng (Foundation Restructure)

*Mục tiêu: Quy hoạch lại thư mục `.agents` để có sự phân tách rõ ràng giữa quy trình (workflows), kỹ năng cụ thể (skills), và luật cốt lõi (rules).*

- [x] **Bước 1.1: Tạo cấu trúc thư mục chuẩn**
  - Xây dựng lại cấu trúc:
    - `.agents/workflows/` (Quy trình làm việc: Plan, TDD, Review...)
    - `.agents/skills/` (Kỹ năng cụ thể: React, Express, Flutter...)
    - `.agents/rules/` (Luật bắt buộc theo từng framework)
- [x] **Bước 1.2: Phân tách Rules ra khỏi Skills**
  - Chuyển các quy tắc "cứng" (như *Luôn dùng TypeScript/PropTypes*, *Luôn xử lý catch error*) vào `.agents/rules/react.md`, `.agents/rules/express.md` để AI luôn tự động load khi làm việc với file tương ứng.
- [ ] **Bước 1.3: Nâng cấp luồng Workflows cơ bản**
  - Áp dụng pattern **Introspection & Debugging** từ `everything-claude-code` vào `/build-fix-*` để AI tự biết đường lặp lại (loop) tìm lỗi build thay vì bỏ cuộc giữa chừng.

---

## 🌐 Giai đoạn 2: Bơm "Đồ Chơi" cho Frontend (ReactJS)

*Mục tiêu: Cung cấp cho AI đủ kiến thức để xử lý các UI/UX phức tạp, form động và tối ưu hiệu năng.*

- [x] **Bước 2.1: Bổ sung Skill Quản lý Form & Validation**
  - Viết file `react-hook-form-zod.md`: Hướng dẫn AI cách setup form, handle errors, form context (đặc biệt áp dụng cho luồng Create Listing mà bạn đang làm).
- [x] **Bước 2.2: Bổ sung Skill Tối ưu Hiệu năng (Performance)**
  - Viết file `react-performance.md`: Chuẩn hóa lại việc dùng `React.memo`, `useMemo`, `useCallback`, `Suspense` lazy loading (bám sát theo *Phase 6: Performance Optimization* bạn vừa hoàn thành).
- [x] **Bước 2.3: Bổ sung Skill Caching & Server State**
  - Viết file `react-query-patterns.md` (hoặc RTK Query) thay vì chỉ dùng Custom Hooks + useState truyền thống để quản lý data fetching từ API.
- [x] **Bước 2.4: Bổ sung Skill Xử lý Lỗi (Error Handling)**
  - Viết file `react-error-boundaries.md` hướng dẫn AI wrap các module lớn vào ErrorBoundary.

---

## ⚙️ Giai đoạn 3: Bơm "Đồ Chơi" cho Backend (ExpressJS)

*Mục tiêu: Đảm bảo Backend không bị nghẽn, xử lý được background jobs và bảo mật tốt hơn.*

- [x] **Bước 3.1: Bổ sung Skill Background Jobs & Message Queues**
  - Viết file `express-redis-queue.md`: Hướng dẫn sử dụng BullMQ/Redis cho luồng RPA và Notion Sync (chống block event loop).
- [x] **Bước 3.2: Bổ sung Skill Database Migration**
  - Lấy cảm hứng từ `database-migrations` của repo kia, tạo workflow `/db-migrate` để AI sinh ra script di chuyển dữ liệu an toàn khi thay đổi Schema Mongoose.
- [x] **Bước 3.3: Bổ sung Skill Quản lý File Upload**
  - Viết file `express-file-upload.md`: Quy chuẩn dùng Multer, nén ảnh/video trước khi lưu hoặc đẩy lên S3.
- [x] **Bước 3.4: Bổ sung Skill Bảo mật API Nâng cao**
  - Nâng cấp `express-security.md`: Định nghĩa Helmet, Rate Limiter (bảo vệ các endpoint đăng nhập, thanh toán).

---

## 📱 Giai đoạn 4: Bơm "Đồ Chơi" cho Mobile (Flutter)

*Mục tiêu: Ứng dụng mượt mà, hỗ trợ offline-first và tương tác phần cứng tốt.*

- [x] **Bước 4.1: Bổ sung Skill Offline-First / Caching**
  - Viết file `flutter-local-storage.md`: Hướng dẫn dùng Hive/Isar hoặc SharedPreferences để lưu cache dữ liệu phòng/booking khi rớt mạng.
- [x] **Bước 4.2: Bổ sung Skill Deep Linking & Push Notifications**
  - Viết file `flutter-firebase-messaging.md`: Xử lý click thông báo -> mở đúng trang chi tiết booking.
- [x] **Bước 4.3: Bổ sung Skill UI Performance**
  - Viết file `flutter-ui-performance.md`: Hướng dẫn AI cách hạn chế `setState` toàn cục, dùng `const` constructor triệt để, xử lý list views khổng lồ.

---

## 🛠 Giai đoạn 5: Chuẩn hóa DevOps & Agentic Loops

*Mục tiêu: Tự động hóa CI/CD và nâng tầm AI thành một "Kỹ sư thực thụ" biết tự kiểm tra chéo.*

- [x] **Bước 5.1: Xây dựng luồng `/security-review` chuyên sâu**
  - Xóa luồng `/security-scan` cũ. Tham khảo từ `everything-claude-code`, tạo một workflow ép AI phải đóng vai "Hacker" quét hardcoded keys, SQL/NoSQL Injection, XSS trước mỗi lần PR.
- [x] **Bước 5.2: Bổ sung Skill CI/CD (GitHub Actions / Fastlane)**
  - Viết file `devops-ci-cd.md`: Hướng dẫn AI cách setup hoặc fix lỗi pipeline build FE/BE tự động.
- [x] **Bước 5.3: Bổ sung Skill E2E Testing**
  - Viết file `e2e-playwright.md` (cho FE) và `flutter-integration-test.md` (cho Mobile).

---

## 🏁 Đề xuất Thực Thi (Action Plan)

Để không làm gián đoạn dự án, tôi khuyên bạn nên thực hiện theo thứ tự:

1. **Tuần 1:** Hoàn thiện Giai đoạn 1 (Tái cấu trúc) và Giai đoạn 2 (Frontend) - Đặc biệt là form/validation vì bạn đang làm `CreateListingDescriptionForm`.
2. **Tuần 2:** Triển khai Giai đoạn 3 (Backend) để củng cố hệ thống API.
3. **Tuần 3:** Cập nhật Giai đoạn 4 (Flutter Mobile) và Giai đoạn 5 (DevOps).

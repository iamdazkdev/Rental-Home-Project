# UC-03 — TÀI LIỆU ĐẶC TẢ TÍNH NĂNG THÔNG BÁO (NOTIFICATION)

**Dự án:** Rental Home — Hệ thống đặt phòng thông minh
**Mã Use Case:** UC-03
**Phiên bản:** 1.1
**Ngày cập nhật:** 2026-05-08
**Nguồn yêu cầu:** Dazk Dev
**Người soạn:** Business Analyst Team

## Lịch sử thay đổi

| Version | Ngày        | Người sửa | Nội dung                                            |
| ------- | ----------- | --------- | --------------------------------------------------- |
| 1.0     | 2026-05-06  | Dazk Dev  | Khởi tạo đặc tả Notification cho Booking/Pre-booking |
| 1.1     | 2026-05-08  | BA Team   | Bổ sung Actors, NFR, channel matrix, KPI            |

---

## 1. MỤC TIÊU (OBJECTIVES)

Xây dựng hệ thống thông báo realtime + đa kênh để người dùng:

- Luôn được cập nhật kịp thời các thay đổi quan trọng (booking, payment, request mới…) **không cần F5**.
- Nhận đúng kênh phù hợp ngữ cảnh: **In-app** cho thông tin tức thời, **Email** cho thông tin cần lưu trữ, **Push (mobile)** cho thông báo cấp bách.
- Không bị spam (anti-flood) và không bỏ sót sự kiện quan trọng.

---

## 2. PHẠM VI (SCOPE)

### 2.1 In-scope

- Notification realtime in-app qua Socket.io.
- Lưu trữ + dropdown danh sách + đánh dấu read/unread.
- Phân loại theo nhóm: Booking, Pre-booking, Room Rental, Admin.
- Anti-spam và rate limit.

### 2.2 Out-of-scope

- Email transactional (handover sang module Email).
- SMS (giai đoạn 2).
- Push notification mobile (giai đoạn 2 — sẽ dùng FCM).

---

## 3. CÁC BÊN LIÊN QUAN (ACTORS & STAKEHOLDERS)

| Vai trò             | Mô tả                                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| **Recipient**       | User nhận thông báo (Guest, Host, Tenant, Admin).                       |
| **Trigger Source**  | Các module sinh sự kiện (Booking, Pre-booking, Payment, Verification). |
| **Notification Service** | Xử lý fanout, dedup, persist, và push qua Socket.io.              |
| **Product Owner**   | Dazk Dev — duyệt nội dung và channel của từng loại notification.        |

---

## 4. PHÂN LOẠI THÔNG BÁO (NOTIFICATION TYPES)

### 4.1 Nhóm Booking (Thuê nguyên căn)

| Trigger                              | Người nhận | Nội dung                                       | Kênh             |
| ------------------------------------ | ---------- | ---------------------------------------------- | ---------------- |
| Guest gửi yêu cầu đặt phòng          | Host       | "Bạn có yêu cầu đặt phòng mới từ [Guest]"      | In-app + Email   |
| Host duyệt booking                   | Guest      | "Yêu cầu của bạn đã được chấp nhận"            | In-app + Email   |
| Host từ chối booking                 | Guest      | "Yêu cầu của bạn đã bị từ chối: [lý do]"      | In-app + Email   |
| Booking sắp đến ngày check-in (24h)  | Guest      | "Nhắc nhở: Bạn check-in vào ngày mai"          | In-app           |
| Còn tiền cọc chưa thanh toán         | Guest      | "Nhắc thanh toán phần còn lại trước check-in"  | In-app + Email   |
| Guest check-in                       | Host       | "Guest [tên] đã check-in"                      | In-app           |
| Guest check-out                      | Host       | "Guest [tên] đã check-out"                     | In-app           |

### 4.2 Nhóm Pre-booking (Đặt trước)

| Trigger                          | Người nhận | Nội dung                                              | Kênh           |
| -------------------------------- | ---------- | ----------------------------------------------------- | -------------- |
| Guest tạo pre-booking            | Host       | "Có yêu cầu đặt trước cho ngày [ngày]"                | In-app + Email |
| Host duyệt pre-booking           | Guest      | "Pre-booking của bạn đã được chấp nhận"               | In-app + Email |
| Pre-booking đến hạn thanh toán   | Guest      | "Ngày bạn đặt trước sắp đến — thanh toán trong 24h"   | In-app + Email |
| Pre-booking sắp hết hạn (2h)     | Guest      | "Cảnh báo: Còn 2 giờ để thanh toán giữ chỗ"           | In-app + Email |

### 4.3 Nhóm Room Rental (Thuê phòng dài hạn)

| Trigger                         | Người nhận | Nội dung                                  | Kênh           |
| ------------------------------- | ---------- | ----------------------------------------- | -------------- |
| Tenant gửi rental request       | Host       | "Bạn có yêu cầu thuê phòng mới"           | In-app + Email |
| Host duyệt rental request       | Tenant     | "Yêu cầu thuê phòng đã được chấp nhận"    | In-app + Email |
| Hợp đồng tạo xong               | Tenant     | "Hợp đồng sẵn sàng, mời bạn ký"           | In-app + Email |
| Cả 2 bên đã ký hợp đồng         | Cả 2       | "Hợp đồng có hiệu lực từ hôm nay"         | In-app + Email |
| Đến hạn thanh toán hàng tháng   | Tenant     | "Nhắc nhở: Tiền thuê tháng [T] đến hạn"   | In-app + Email |

### 4.4 Nhóm Admin

| Trigger                            | Người nhận | Nội dung                                      | Kênh   |
| ---------------------------------- | ---------- | --------------------------------------------- | ------ |
| User nộp identity verification     | Admin      | "Có hồ sơ xác minh danh tính mới chờ duyệt"   | In-app |
| Admin duyệt/từ chối verification   | User       | "Hồ sơ xác minh của bạn đã được [kết quả]"    | In-app + Email |

---

## 5. QUY TRÌNH NGƯỜI DÙNG (USER FLOWS)

### [UC-03.1] Nhận thông báo realtime

**Main Flow:**

1. User online → Hệ thống emit qua Socket.io → UI hiện toast + tăng badge.
2. User offline → Notification lưu DB; khi online lại sẽ pull batch chưa đọc.
3. User click vào notification icon → Mở dropdown danh sách.
4. User click vào 1 thông báo → Navigate qua `actionUrl` và đánh dấu `isRead = true`.

**Exception Flow:**

- E1. Mất kết nối Socket → fallback polling 30s/lần đến khi reconnect.

### [UC-03.2] Quản lý thông báo

**Main Flow:**

1. User có thể "Đánh dấu tất cả đã đọc" trong 1 click.
2. User có thể xoá thông báo đã đọc.
3. Pagination 20 items/trang.

### [UC-03.3] Cài đặt notification (Settings)

**Main Flow:**

1. User vào Settings → Notification.
2. Bật/tắt từng nhóm: Booking, Pre-booking, Marketing.
3. Chọn kênh ưu tiên: In-app / Email.
4. Lưu preference. Notification Service sẽ tôn trọng preference khi fanout.

---

## 6. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

| **ID**    | **Quy tắc**             | **Chi tiết**                                                                                              |
| --------- | ----------------------- | --------------------------------------------------------------------------------------------------------- |
| **BR-01** | **Lưu trữ**             | Notification lưu DB tối đa **90 ngày**, sau đó tự xoá.                                                      |
| **BR-02** | **Realtime**            | Notification quan trọng (booking, payment) phải gửi qua Socket.io trong < **3s**.                          |
| **BR-03** | **Chống spam**          | Không gửi quá **5 notification cùng loại** trong 1 giờ cho 1 user (gộp lại hoặc bỏ qua).                   |
| **BR-04** | **Unread badge**        | Icon hiển thị số chưa đọc (max display "99+").                                                             |
| **BR-05** | **Deep link**           | Mỗi notification phải có `actionUrl` để navigate đến đúng màn hình.                                        |
| **BR-06** | **User preference**     | Tôn trọng cài đặt user. User tắt nhóm nào → không gửi nhóm đó (trừ system-critical như payment).           |
| **BR-07** | **Idempotency**         | Mỗi sự kiện có `eventId` duy nhất; retry không tạo notification trùng.                                     |
| **BR-08** | **Audit**               | Log: notification id, recipient, channel, sent_at, status (`sent`/`failed`).                                |

---

## 7. DATA MODEL

```javascript
{
  userId: ObjectId,           // Người nhận
  eventId: String,            // Idempotency key
  type: String,               // "booking_approved" | "pre_booking_reminder" | ...
  group: String,              // "booking" | "pre_booking" | "rental" | "admin"
  title: String,
  body: String,
  actionUrl: String,
  isRead: Boolean,            // default: false
  relatedId: ObjectId,
  relatedModel: String,       // "Booking" | "PreBooking" | "RentalAgreement" | ...
  channels: [String],         // ["inapp", "email"]
  createdAt: Date,
  expiresAt: Date             // = createdAt + 90 ngày (TTL index)
}
```

---

## 8. YÊU CẦU PHI CHỨC NĂNG (NFR)

| **ID**     | **Yêu cầu**            | **Mức cam kết**                                        |
| ---------- | ---------------------- | ------------------------------------------------------ |
| **NFR-01** | Realtime latency       | P95 < **3s** từ trigger event đến hiển thị in-app.      |
| **NFR-02** | Throughput             | Hỗ trợ ≥ **1000 notification/giây**.                    |
| **NFR-03** | Delivery guarantee     | At-least-once cho in-app; idempotent qua `eventId`.     |
| **NFR-04** | Storage efficiency     | TTL index tự động xoá sau 90 ngày.                      |
| **NFR-05** | Client memory          | Dropdown chỉ giữ 50 notification gần nhất trong RAM.    |

---

## 9. PHỤ THUỘC (DEPENDENCIES)

| Phụ thuộc                          | Loại        | Ghi chú                                              |
| ---------------------------------- | ----------- | ---------------------------------------------------- |
| **UC-02** (Calendar & Pre-booking) | Bắt buộc    | Là source quan trọng nhất sinh notification.          |
| **UC-04** (Host Dashboard)         | Bắt buộc    | Hiển thị "Hoạt động gần đây" lấy từ feed này.         |
| **UC-05** (Săn nhà)                | Bắt buộc    | Match listing mới gửi notification.                   |
| **UC-06** (Bảo mật vị trí)         | Bắt buộc    | Notification chứa địa chỉ đầy đủ sau khi approved.    |
| Socket.io / Redis pub-sub          | Hạ tầng     | Pub-sub channel cho fanout.                          |

---

## 10. RỦI RO & GIẢ ĐỊNH

| Loại        | Mô tả                                                                  | Mức độ | Hành động giảm thiểu                                |
| ----------- | ---------------------------------------------------------------------- | ------ | --------------------------------------------------- |
| Risk        | Spam notification gây churn user.                                       | Cao    | BR-03 (rate limit) + cho user tắt từng nhóm.        |
| Risk        | Mất event do Socket.io disconnect.                                      | Cao    | Lưu DB trước, push qua socket sau (đảm bảo delivery). |
| Risk        | Notification chứa thông tin nhạy cảm (địa chỉ) bị leak.                | Cao    | Chỉ inject địa chỉ sau khi đã verify recipient.     |
| Assumption  | User bật notification mặc định cho cả Email và In-app.                 | Trung  | Hỏi opt-in trong onboarding.                         |

---

## 11. KPI & METRIC THÀNH CÔNG

| Metric                                      | Mục tiêu sau 30 ngày |
| ------------------------------------------- | -------------------- |
| Tỷ lệ notification được đọc                  | ≥ **60%**            |
| P95 realtime latency                         | < 3s                 |
| Tỷ lệ user tắt nhóm Booking                  | < **5%**             |
| Số khiếu nại spam/tuần                       | < 3                  |

---

## 12. ACCEPTANCE CRITERIA

- **AC-01:** Notification realtime xuất hiện ngay không cần F5.
- **AC-02:** Số unread badge cập nhật ngay khi có notification mới.
- **AC-03:** Click vào notification navigate đúng đến trang liên quan.
- **AC-04:** "Đánh dấu tất cả đã đọc" hoạt động trong 1 click.
- **AC-05:** Notification offline được lưu và hiển thị khi user đăng nhập lại.
- **AC-06:** User tắt nhóm nào → không nhận notification nhóm đó (trừ system-critical).
- **AC-07:** Retry trigger event không sinh notification trùng (idempotency).

---

## 13. THUẬT NGỮ (GLOSSARY)

| Thuật ngữ           | Định nghĩa                                                       |
| ------------------- | ---------------------------------------------------------------- |
| **Fanout**          | Phân phối 1 sự kiện đến nhiều recipient.                         |
| **Idempotency key** | Khóa duy nhất đảm bảo retry không tạo bản ghi trùng.             |
| **TTL index**       | Index của MongoDB tự động xoá document sau khoảng thời gian.     |
| **Deep link**       | URL navigate chính xác đến màn hình liên quan của notification.  |

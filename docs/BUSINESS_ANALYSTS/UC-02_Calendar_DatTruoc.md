# UC-02 — TÀI LIỆU ĐẶC TẢ TÍNH NĂNG CALENDAR & ĐẶT TRƯỚC

**Dự án:** Rental Home — Hệ thống đặt phòng thông minh
**Mã Use Case:** UC-02
**Phiên bản:** 1.1
**Ngày cập nhật:** 2026-05-08
**Nguồn yêu cầu:** Dazk Dev
**Người soạn:** Business Analyst Team

## Lịch sử thay đổi (Version History)

| Version | Ngày        | Người sửa | Nội dung                                            |
| ------- | ----------- | --------- | --------------------------------------------------- |
| 1.0     | 2026-05-06  | Dazk Dev  | Khởi tạo đặc tả Calendar và Pre-booking flow        |
| 1.1     | 2026-05-08  | BA Team   | Bổ sung Actors / NFR / Edge cases / KPI / Glossary  |

---

## 1. MỤC TIÊU (OBJECTIVES)

Xây dựng Calendar tương tác cho phép:

- Guest **đặt trước (pre-book)** vào các ngày trống trong tương lai, kể cả khi hiện tại listing đang có người thuê.
- Host nhìn vào **một màn hình duy nhất** biết ngay: phòng nào đang trống / đang thuê / đặt trước, và kéo dài đến khi nào.
- Giảm tỷ lệ "no-show" và "khách trùng lịch" do tự động hoá luồng chuyển trạng thái.

---

## 2. PHẠM VI (SCOPE)

### 2.1 In-scope

- Calendar UI ở trang Listing Detail (Guest view) và Host Dashboard (Host view).
- CRUD Pre-booking: tạo, duyệt, từ chối, huỷ, hết hạn.
- Job tự động chuyển trạng thái `approved → awaiting_payment → confirmed/expired`.
- Auto-approve setting cho Host.

### 2.2 Out-of-scope

- Thanh toán (Stripe / VNPay) — gọi sang module Payment.
- Hợp đồng dài hạn — thuộc UC khác (Rental Agreement).
- Đặt phòng tức thời (instant booking) — không thuộc luồng pre-book.

---

## 3. CÁC BÊN LIÊN QUAN (ACTORS & STAKEHOLDERS)

| Vai trò              | Mô tả                                                        |
| -------------------- | ------------------------------------------------------------ |
| **Guest (Primary)**  | Người dùng tạo và thanh toán pre-booking.                    |
| **Host (Primary)**   | Chủ listing duyệt / từ chối pre-booking.                     |
| **System Scheduler** | Cron job xử lý chuyển trạng thái và hết hạn.                  |
| **Payment Service**  | Bên thứ ba xử lý giao dịch khi pre-booking đến hạn thanh toán. |
| **Product Owner**    | Dazk Dev — duyệt rule và ngưỡng thời gian.                    |

---

## 4. ĐIỀU KIỆN (PRECONDITIONS / POSTCONDITIONS)

### 4.1 Preconditions

- Guest đã đăng nhập và xác minh email.
- Listing có `isActive = true` và Property đã được verified (xem UC-08).
- Khoảng ngày Guest chọn không trùng với Booking hoặc Pre-booking khác.

### 4.2 Postconditions

- Pre-booking được tạo và lưu DB với trạng thái khởi tạo `pending`.
- Host nhận thông báo realtime (xem UC-03).
- Calendar cập nhật trạng thái màu cho khoảng ngày tương ứng.

---

## 5. QUY TRÌNH NGƯỜI DÙNG (USER FLOWS)

### [UC-02.1] Guest xem và đặt trước lịch trống

**Main Flow:**

1. Guest vào trang chi tiết listing.
2. Hệ thống hiển thị Calendar với 3 trạng thái màu:
   - **Trống** — có thể đặt.
   - **Đã thuê** — không thể đặt.
   - **Đặt trước** — đã có người giữ chỗ, không thể đặt thêm.
3. Guest chọn khoảng ngày trống (`start_date` → `end_date`).
4. Hệ thống kiểm tra non-overlap với Booking & Pre-booking khác (BR-01).
5. Guest xác nhận → Hệ thống tạo `PreBooking` với `status = pending`.
6. Hệ thống bắn notification cho Host (UC-03).

**Alternative Flow:**

- A1. Listing có `auto_approve = true` → Pre-booking nhảy thẳng `status = approved`, không cần Host duyệt.

**Exception Flow:**

- E1. Khoảng ngày overlap → Hiển thị inline error "Ngày này đã có người đặt", không cho submit.
- E2. Guest đã có **3 pre-booking active** → Chặn tạo, gợi ý huỷ bớt yêu cầu cũ (BR-05).
- E3. Khoảng ngày bắt đầu < 3 ngày tính từ hôm nay → Báo lỗi (BR-02).

### [UC-02.2] Host quản lý lịch từ Dashboard

**Main Flow:**

1. Host vào **Host Dashboard → Calendar View**.
2. Hệ thống render calendar tổng hợp tất cả listing của Host (mỗi listing 1 màu).
3. Host click vào 1 ngày → Xem danh sách Booking/Pre-booking trong ngày đó.
4. Host duyệt hoặc từ chối Pre-booking trực tiếp từ Calendar.

**Alternative Flow:**

- A1. Host bật **Auto-approve** trong Settings → Pre-booking mới được duyệt tự động.

### [UC-02.3] Chuyển đổi Pre-booking → Booking

**Main Flow:**

1. Khi `start_date` của Pre-booking chỉ còn ≤ 24h, scheduler chuyển `status = awaiting_payment`.
2. Hệ thống gửi thông báo nhắc Guest thanh toán (UC-03).
3. Guest thanh toán thành công → Pre-booking chuyển `confirmed` và sinh `Booking` chính thức.

**Exception Flow:**

- E1. Guest không thanh toán trong 24h → `status = expired`, các ngày liên quan trở về `available` (BR-03).
- E2. Payment service trả lỗi → giữ `awaiting_payment`, retry tối đa 3 lần, sau đó báo Guest qua email.

---

## 6. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

| **ID**    | **Quy tắc**                   | **Chi tiết**                                                                                       |
| --------- | ----------------------------- | -------------------------------------------------------------------------------------------------- |
| **BR-01** | **Không overlap**             | Không cho phép 2 Booking/Pre-booking overlap trên cùng 1 listing.                                  |
| **BR-02** | **Đặt trước tối thiểu**       | Pre-booking chỉ tạo được cho `start_date` cách hôm nay **≥ 3 ngày**.                               |
| **BR-03** | **Hết hạn thanh toán**        | Pre-booking `awaiting_payment` hết hạn sau **24 giờ** nếu không thanh toán.                         |
| **BR-04** | **Duyệt của Host**            | Mặc định Pre-booking cần Host duyệt. Host có thể bật **Auto-approve** trong settings.              |
| **BR-05** | **Giới hạn pre-booking/user** | Mỗi Guest tối đa **3 Pre-booking active** cùng lúc để chống spam.                                  |
| **BR-06** | **Không pre-book quá xa**     | Không nhận Pre-booking quá **6 tháng** kể từ ngày hiện tại.                                         |
| **BR-07** | **Huỷ bởi Guest**             | Guest được huỷ Pre-booking miễn phí khi đang ở `pending` hoặc `approved` (chưa tới `awaiting_payment`). |
| **BR-08** | **Audit log**                 | Mọi thay đổi trạng thái đều ghi log: actor, timestamp, lý do.                                       |

---

## 7. STATE MACHINE — PRE-BOOKING

| Trạng thái         | Mô tả                                          | Chuyển sang                     |
| ------------------ | ---------------------------------------------- | ------------------------------- |
| `pending`          | Vừa tạo, chờ Host duyệt                        | `approved`, `rejected`, `cancelled` |
| `approved`         | Host đã duyệt, ngày được giữ chỗ               | `awaiting_payment`, `cancelled` |
| `awaiting_payment` | Đến thời điểm, chờ Guest thanh toán trong 24h | `confirmed`, `expired`          |
| `confirmed`        | Đã thanh toán, sinh Booking chính thức         | Terminal (tạo `Booking`)        |
| `expired`          | Hết hạn, ngày trở về `available`               | Terminal                        |
| `rejected`         | Host từ chối                                   | Terminal                        |
| `cancelled`        | Guest huỷ                                      | Terminal                        |

---

## 8. YÊU CẦU PHI CHỨC NĂNG (NFR)

| **ID**     | **Yêu cầu**             | **Mức cam kết**                                                       |
| ---------- | ----------------------- | --------------------------------------------------------------------- |
| **NFR-01** | Calendar render         | < **1.5s** với 12 tháng dữ liệu cho 1 listing.                         |
| **NFR-02** | Realtime notification   | Host nhận push trong < **3s** sau khi Guest tạo pre-booking.           |
| **NFR-03** | Concurrency safety      | Dùng MongoDB transaction hoặc unique index để chống race condition.    |
| **NFR-04** | Scheduler reliability   | Job chuyển trạng thái phải chạy đúng ± 5 phút so với mốc thời gian.    |
| **NFR-05** | Audit retention         | Lưu audit log tối thiểu **180 ngày**.                                   |

---

## 9. PHỤ THUỘC (DEPENDENCIES)

| Phụ thuộc                          | Loại        | Ghi chú                                                |
| ---------------------------------- | ----------- | ------------------------------------------------------ |
| **UC-03** (Notification)           | Bắt buộc    | Bắn notify mọi sự kiện thay đổi trạng thái.            |
| **UC-04** (Host Dashboard)         | Bắt buộc    | Calendar view tổng hợp ở Host Dashboard.               |
| **UC-08** (Property Source)        | Bắt buộc    | Listing phải gắn Property đã verified.                 |
| Payment Service (Stripe/VNPay)     | Bắt buộc    | Xử lý giao dịch ở `awaiting_payment`.                   |
| Cron / BullMQ                      | Hạ tầng     | Chạy job scheduler chuyển trạng thái.                   |

---

## 10. RỦI RO & GIẢ ĐỊNH (RISKS & ASSUMPTIONS)

| Loại        | Mô tả                                                                                | Mức độ | Hành động giảm thiểu                            |
| ----------- | ------------------------------------------------------------------------------------ | ------ | ----------------------------------------------- |
| Risk        | 2 Guest tạo pre-booking đồng thời cho cùng 1 khoảng ngày → race condition.            | Cao    | MongoDB transaction + unique compound index.    |
| Risk        | Scheduler downtime → Pre-booking không tự chuyển sang `awaiting_payment`.            | Cao    | Health check + retry queue + alert oncall.      |
| Risk        | Host không duyệt kịp dẫn đến mất khách.                                              | Trung  | Khuyến khích bật Auto-approve, gửi nhắc Host.   |
| Assumption  | Guest sẽ thanh toán trong 24h khi đến hạn.                                           | Trung  | Push reminder ở mốc 12h và 2h trước hết hạn.    |

---

## 11. KPI & METRIC THÀNH CÔNG

| Metric                                              | Mục tiêu sau 30 ngày |
| --------------------------------------------------- | -------------------- |
| Tỷ lệ Pre-booking → `confirmed`                     | ≥ **70%**            |
| Tỷ lệ Pre-booking `expired` do quên thanh toán      | < **15%**            |
| Thời gian trung bình Host duyệt                     | < **6 giờ**          |
| Số sự cố overlap (incident)                          | **0**                |

---

## 12. ACCEPTANCE CRITERIA

- **AC-01:** Calendar phân biệt rõ 3 màu: trống / đang thuê / đặt trước.
- **AC-02:** Không thể chọn ngày overlap với Booking/Pre-booking đã tồn tại.
- **AC-03:** Pre-booking hết hạn sau 24h nếu Guest không thanh toán khi đến hạn.
- **AC-04:** Host nhận thông báo realtime (< 3s) khi có Pre-booking mới.
- **AC-05:** Host Dashboard hiển thị tất cả listing trên 1 calendar tổng hợp.
- **AC-06:** Guest có > 3 pre-booking active không thể tạo thêm.
- **AC-07:** Mọi chuyển trạng thái đều có audit log đầy đủ actor + timestamp.

---

## 13. THUẬT NGỮ (GLOSSARY)

| Thuật ngữ          | Định nghĩa                                                                            |
| ------------------ | ------------------------------------------------------------------------------------- |
| **Pre-booking**    | Yêu cầu giữ chỗ cho 1 khoảng ngày trong tương lai, chưa thanh toán.                   |
| **Auto-approve**   | Cài đặt cho phép Pre-booking được duyệt tự động, không cần Host xác nhận.             |
| **Awaiting payment** | Trạng thái chuyển tiếp khi sắp tới ngày check-in, Guest có 24h để thanh toán.        |
| **Booking**        | Đặt phòng chính thức đã thanh toán và xác nhận.                                       |

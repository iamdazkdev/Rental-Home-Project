# UC-05 — TÀI LIỆU ĐẶC TẢ TÍNH NĂNG SĂN NHÀ (HOUSE HUNTING)

**Dự án:** Rental Home — Hệ thống đặt phòng thông minh
**Mã Use Case:** UC-05
**Phiên bản:** 1.1
**Ngày cập nhật:** 2026-05-08
**Nguồn yêu cầu:** Dazk Dev
**Người soạn:** Business Analyst Team

## Lịch sử thay đổi

| Version | Ngày        | Người sửa | Nội dung                                          |
| ------- | ----------- | --------- | ------------------------------------------------- |
| 1.0     | 2026-05-06  | Dazk Dev  | Khởi tạo đặc tả Săn nhà & matching engine         |
| 1.1     | 2026-05-08  | BA Team   | Bổ sung Actors, NFR, KPI, edge cases, glossary    |

---

## 1. MỤC TIÊU (OBJECTIVES)

Cho phép người dùng **đặt trước nhu cầu tìm nhà** khi chưa tìm được listing phù hợp. Hệ thống chủ động:

- Gợi ý listing hiện có gần khớp.
- Thông báo khi có listing mới phù hợp với yêu cầu.

→ Người dùng không cần quay lại search thủ công mỗi ngày, đồng thời Host có cơ hội tiếp cận khách thực sự cần.

---

## 2. PHẠM VI (SCOPE)

### 2.1 In-scope

- Form tạo `HouseHuntingRequest`.
- Matching engine giữa Request và Listing (mới hoặc đã có).
- Quản lý request: chỉnh sửa, tạm dừng, xoá.
- Notification khi có match (qua UC-03).

### 2.2 Out-of-scope

- Chat trực tiếp giữa User và Host về request — module Chat riêng.
- Đấu giá (auction) listing giữa nhiều User — không nằm trong giai đoạn này.

---

## 3. CÁC BÊN LIÊN QUAN (ACTORS)

| Vai trò               | Mô tả                                                      |
| --------------------- | ---------------------------------------------------------- |
| **User (Primary)**    | Người tạo yêu cầu săn nhà.                                  |
| **Host (Indirect)**   | Đăng listing mới, hệ thống tự match (Host không thấy User). |
| **Matching Engine**   | Service tính score và quyết định gửi notification.          |
| **Product Owner**     | Dazk Dev — duyệt trọng số scoring và ngưỡng notification.   |

---

## 4. ĐIỀU KIỆN

### 4.1 Preconditions

- User đã đăng nhập (yêu cầu cá nhân hoá).
- User chưa có quá 3 request `active` (BR-01).

### 4.2 Postconditions

- Request được lưu DB với status `active`.
- Hệ thống chạy match ngay lập tức và trả danh sách listing gần khớp.

---

## 5. QUY TRÌNH NGƯỜI DÙNG (USER FLOWS)

### [UC-05.1] Tạo yêu cầu săn nhà

**Main Flow:**

1. User không tìm được nhà phù hợp → Click **"Tạo yêu cầu săn nhà"**.
2. Hệ thống hiển thị form:
   - Khu vực / Quận / Phường (bắt buộc).
   - Loại thuê: Ngắn hạn / Dài hạn.
   - Khoảng giá mong muốn (min – max).
   - Diện tích tối thiểu (m²).
   - Ngày muốn vào ở (bắt buộc với dài hạn).
   - Tiện ích cần có (multi-select: điều hoà, máy giặt, wifi…).
   - Ghi chú thêm (tuỳ chọn, ≤ 300 ký tự).
3. User submit → Hệ thống lưu `HouseHuntingRequest`.
4. Hệ thống chạy matching ngay và trả về danh sách listing hiện có gần khớp.

**Exception Flow:**

- E1. User đã có 3 request active → Chặn submit, gợi ý xoá hoặc tạm dừng request cũ.
- E2. Khoảng giá không hợp lệ (min ≥ max) → Báo lỗi inline.

### [UC-05.2] Nhận gợi ý khi có listing mới

**Main Flow:**

1. Host đăng listing mới hoặc cập nhật giá/diện tích.
2. Matching Engine so khớp listing với mọi `HouseHuntingRequest` đang active.
3. Nếu match (score ≥ ngưỡng — xem §7) → Gửi notification (UC-03) kèm link listing.
4. User click → Xem listing → Đặt phòng nếu phù hợp.

### [UC-05.3] Quản lý yêu cầu săn nhà

**Main Flow:**

1. User vào trang **"Yêu cầu săn nhà của tôi"**.
2. Xem danh sách: `active` / `paused` / `matched` / `expired`.
3. User có thể chỉnh sửa tiêu chí, tạm dừng, xoá.
4. Khi User đặt được phòng → Hệ thống pop-up: "Bạn đã tìm được nhà?" → User confirm → Request chuyển `matched`.

---

## 6. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

| **ID**    | **Quy tắc**                       | **Chi tiết**                                                                            |
| --------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| **BR-01** | **Giới hạn request active**       | Mỗi User tối đa **3 request active** cùng lúc.                                          |
| **BR-02** | **Tự động hết hạn**               | Request tự `expired` sau **60 ngày** không có hoạt động (không edit, không click match). |
| **BR-03** | **Không spam notification**       | Mỗi request tối đa gửi **3 notification/ngày** về listing mới match.                     |
| **BR-04** | **Chỉ match listing active**      | Chỉ so khớp với listing có `isActive = true` và còn ngày trống cho khoảng User cần.     |
| **BR-05** | **Ẩn danh với Host**              | Host không thấy thông tin cá nhân của User trong yêu cầu.                                |
| **BR-06** | **Gửi nhắc trước hết hạn**        | Trước hết hạn 7 ngày → gửi notification "Bạn còn muốn nhận gợi ý không?" cho User.      |
| **BR-07** | **GDPR-style soft delete**        | Khi User xoá request, dữ liệu được anonymize sau 30 ngày.                                |

---

## 7. LOGIC MATCHING (SCORING)

### 7.1 Trọng số

| Tiêu chí       | Trọng số | Cách tính                                                                  |
| -------------- | -------- | -------------------------------------------------------------------------- |
| **Khu vực**    | 40%      | Khớp ward = **1.0** / cùng quận = **0.6** / cùng tỉnh = **0.2** / khác = 0 |
| **Giá**        | 30%      | Trong khoảng = **1.0** / vượt max ≤ 20% = **0.5** / vượt > 20% = **0**     |
| **Diện tích**  | 20%      | ≥ yêu cầu = **1.0** / nhỏ hơn ≤ 10% = **0.5** / nhỏ hơn > 10% = **0**     |
| **Tiện ích**   | 10%      | (số tiện ích khớp / tổng tiện ích yêu cầu)                                  |

> **Final Score = (Khu vực × 0.4) + (Giá × 0.3) + (Diện tích × 0.2) + (Tiện ích × 0.1)**

### 7.2 Ngưỡng gửi notification

- Score ≥ **0.7**: Gửi notification ngay.
- 0.5 ≤ Score < 0.7: Đưa vào danh sách "Gợi ý gần khớp" trong trang quản lý request, **không** push notification.
- Score < **0.5**: Không hiển thị.

---

## 8. TRẠNG THÁI HouseHuntingRequest

| Trạng thái  | Mô tả                                          | Chuyển sang                            |
| ----------- | ---------------------------------------------- | -------------------------------------- |
| `active`    | Đang chạy, hệ thống đang match listing mới     | `paused`, `matched`, `expired`         |
| `paused`    | User tạm dừng, không nhận notification         | `active`, `cancelled`                  |
| `matched`   | User đã tìm được nhà                           | Terminal                               |
| `expired`   | Hết hạn sau 60 ngày                             | Terminal                               |
| `cancelled` | User xoá request                               | Terminal                               |

---

## 9. YÊU CẦU PHI CHỨC NĂNG (NFR)

| **ID**     | **Yêu cầu**             | **Mức cam kết**                                              |
| ---------- | ----------------------- | ------------------------------------------------------------ |
| **NFR-01** | Match latency           | Khi listing mới đăng → match xong và push notify trong < **5 phút**. |
| **NFR-02** | Throughput              | Match engine xử lý ≥ 200 listing mới/giờ.                    |
| **NFR-03** | Privacy                 | Không lộ identity của User cho Host trong dữ liệu match.     |
| **NFR-04** | Auditability            | Log lý do match cho mỗi notification (debug & UX trace).      |

---

## 10. PHỤ THUỘC

| Phụ thuộc                       | Loại     | Ghi chú                                                |
| ------------------------------- | -------- | ------------------------------------------------------ |
| **UC-03** (Notification)        | Bắt buộc | Kênh gửi gợi ý.                                         |
| **UC-07** (AI Gợi ý tìm kiếm)   | Bắt buộc | Cùng dùng scoring engine — chia sẻ logic.              |
| **UC-08** (Property)            | Bắt buộc | Match dựa vào dữ liệu Property.                         |

---

## 11. RỦI RO & GIẢ ĐỊNH

| Loại        | Mô tả                                                                | Mức độ | Hành động giảm thiểu                                |
| ----------- | -------------------------------------------------------------------- | ------ | --------------------------------------------------- |
| Risk        | Spam notification → User tắt notify → mất giá trị tính năng.         | Cao    | BR-03 + cho user điều chỉnh tần suất.               |
| Risk        | Match nhiều User cùng 1 listing → User cảm thấy bị "tranh" vô nghĩa. | Trung  | UI hiển thị "Listing này phổ biến — đặt nhanh".     |
| Assumption  | User chấp nhận match có sai số (score 0.7 không phải khớp 100%).      | Trung  | Hiển thị rõ % match và breakdown lý do.             |

---

## 12. KPI & METRIC THÀNH CÔNG

| Metric                                          | Mục tiêu sau 30 ngày |
| ----------------------------------------------- | -------------------- |
| Tỷ lệ User tạo request → click ≥ 1 match        | ≥ **40%**            |
| Tỷ lệ request → status `matched`                | ≥ **15%**            |
| Tỷ lệ User tắt notification của UC-05            | < **10%**            |
| Trung bình số ngày từ create → matched          | < **14 ngày**        |

---

## 13. ACCEPTANCE CRITERIA

- **AC-01:** User có thể tạo yêu cầu săn nhà trong < 2 phút.
- **AC-02:** Khi Host đăng listing mới → matching xong và push notify trong < 5 phút.
- **AC-03:** Danh sách kết quả hiển thị score và breakdown lý do match (✅ Khu vực, ✅ Giá, ⚠️ Diện tích nhỏ hơn 5m²).
- **AC-04:** User nhận tối đa 3 notification/ngày từ 1 request (BR-03).
- **AC-05:** User có thể tạm dừng / xoá request bất cứ lúc nào.
- **AC-06:** Host không thấy danh tính User trong dữ liệu match.
- **AC-07:** Request `expired` không tiếp tục gửi notification.

---

## 14. THUẬT NGỮ

| Thuật ngữ                | Định nghĩa                                                       |
| ------------------------ | ---------------------------------------------------------------- |
| **HouseHuntingRequest**  | Yêu cầu săn nhà do User tạo, chứa tiêu chí mong muốn.            |
| **Matching Engine**      | Service tính score giữa Request và Listing.                      |
| **Match score**          | Giá trị 0.0–1.0 thể hiện độ khớp.                                 |

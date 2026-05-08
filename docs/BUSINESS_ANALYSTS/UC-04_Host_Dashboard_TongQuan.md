# UC-04 — TÀI LIỆU ĐẶC TẢ TÍNH NĂNG HOST DASHBOARD — TỔNG QUAN NHÀ

**Dự án:** Rental Home — Hệ thống đặt phòng thông minh
**Mã Use Case:** UC-04
**Phiên bản:** 1.1
**Ngày cập nhật:** 2026-05-08
**Nguồn yêu cầu:** Dazk Dev
**Người soạn:** Business Analyst Team

## Lịch sử thay đổi

| Version | Ngày        | Người sửa | Nội dung                                          |
| ------- | ----------- | --------- | ------------------------------------------------- |
| 1.0     | 2026-05-06  | Dazk Dev  | Khởi tạo đặc tả Dashboard Tổng quan cho Host      |
| 1.1     | 2026-05-08  | BA Team   | Bổ sung Actors, NFR, KPI, edge cases, glossary    |

---

## 1. MỤC TIÊU (OBJECTIVES)

Thiết kế màn hình Host Dashboard có giá trị thực sự — Host **chỉ cần nhìn vào app là biết ngay**:

- Phòng nào đang trống.
- Phòng nào đang được thuê và thuê đến khi nào.
- Phòng nào đang có người đặt trước (pre-book) vào khoảng thời gian nào.

Triết lý: Dashboard không được làm cho có. Mỗi widget phải trả lời **một câu hỏi thực tế** của Host.

---

## 2. PHẠM VI (SCOPE)

### 2.1 In-scope

- 4 Summary Cards: Tổng nhà / Đang trống / Đang thuê / Đặt trước.
- Listing list view với badge trạng thái nhanh.
- Calendar tổng hợp toàn bộ listing.
- Feed "Hoạt động gần đây" realtime.

### 2.2 Out-of-scope

- Báo cáo doanh thu (Revenue Analytics) — UC riêng.
- Quản lý hợp đồng dài hạn (Rental Agreement) — UC riêng.
- Cài đặt tài khoản Host — UC riêng.

---

## 3. CÁC BÊN LIÊN QUAN (ACTORS)

| Vai trò             | Mô tả                                                          |
| ------------------- | -------------------------------------------------------------- |
| **Host (Primary)**  | Người quản lý 1 hoặc nhiều listing, cần nhìn nhanh tình trạng.  |
| **System**          | Aggregation pipeline + Socket.io feed.                          |
| **Product Owner**   | Dazk Dev — duyệt trải nghiệm và tiêu chí đo "có giá trị".       |

---

## 4. ĐIỀU KIỆN (PRECONDITIONS / POSTCONDITIONS)

### 4.1 Preconditions

- Host đã đăng nhập với role `host`.
- Tài khoản đã verified.

### 4.2 Postconditions

- Dashboard hiển thị state đúng tại thời điểm load + cập nhật realtime khi có sự kiện mới.

---

## 5. BỐ CỤC DASHBOARD (LAYOUT)

```text
┌─────────────────────────────────────────────────────────────┐
│  TỔNG QUAN NHANH (Summary Cards — 4 thẻ)                    │
│  [Tổng nhà]  [Đang trống]  [Đang thuê]  [Đặt trước]        │
├─────────────────────────────────────────────────────────────┤
│  DANH SÁCH LISTING — TRẠNG THÁI NHANH                       │
│  (Grid hoặc List view, filter theo trạng thái)              │
├──────────────────────────┬──────────────────────────────────┤
│  CALENDAR TỔNG HỢP       │  HOẠT ĐỘNG GẦN ĐÂY               │
│  (Tất cả listings        │  (5 sự kiện mới nhất:            │
│   trên 1 calendar)       │   booking, pre-book, payment...) │
└──────────────────────────┴──────────────────────────────────┘
```

---

## 6. QUY TRÌNH NGƯỜI DÙNG (USER FLOWS)

### [UC-04.1] Xem tổng quan nhanh

**Main Flow:**

1. Host đăng nhập → Mặc định landing page là Host Dashboard.
2. Hệ thống render **4 Summary Cards** trong < 1s:
   - **Tổng nhà**: tổng số listing của Host.
   - **Đang trống**: listing không có booking/pre-booking active.
   - **Đang thuê**: listing đang có guest checked-in hoặc booking approved bao gồm hôm nay.
   - **Đặt trước**: listing có ≥ 1 pre-booking `approved` trong tương lai.
3. Host click vào card → Filter listing list theo trạng thái đó.

**Exception Flow:**

- E1. Host chưa có listing nào → Hiển thị empty state với CTA "Đăng tin ngay" (BR-05).

### [UC-04.2] Danh sách listing với trạng thái nhanh

**Main Flow:**

1. Mỗi listing card hiển thị:
   - Ảnh đại diện + tên listing.
   - Badge trạng thái: `Đang trống` / `Đang thuê` / `Đặt trước` / `Tạm ngừng`.
   - Nếu **Đang thuê**: show "Thuê đến [ngày checkout]".
   - Nếu **Đặt trước**: show "Đặt trước: [start_date] — [end_date]".
2. Host click vào listing card → Xem chi tiết calendar của listing đó.

### [UC-04.3] Calendar tổng hợp

**Main Flow:**

1. Host xem calendar với toàn bộ listing trên cùng 1 view.
2. Mỗi listing được gán 1 màu riêng (consistent qua các phiên).
3. Block thời gian trên calendar hiển thị: tên listing + trạng thái.
4. Host click vào 1 block → Xem chi tiết booking/pre-booking.

**Edge Case:**

- Host có > **20 listing** → Calendar mặc định nhóm theo cluster, có toggle "Show all".

### [UC-04.4] Hoạt động gần đây

**Main Flow:**

1. Hiển thị 5 sự kiện mới nhất (realtime qua Socket.io).
2. Mỗi sự kiện gồm: icon loại, nội dung tóm tắt, thời gian relative ("3 phút trước").
3. Click vào sự kiện → Navigate đến trang tương ứng.

---

## 7. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

| **ID**    | **Quy tắc**                  | **Chi tiết**                                                                       |
| --------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| **BR-01** | **Dữ liệu có giá trị**       | Mỗi widget phải trả lời 1 câu hỏi thực tế. Không hiển thị số chỉ để điền chỗ.       |
| **BR-02** | **Tốc độ load**              | Summary Cards phải render trong < **1 giây** (dùng aggregation pipeline MongoDB).   |
| **BR-03** | **Trạng thái listing**       | Trạng thái tính theo booking/pre-booking active, **không** dùng trường `status` tĩnh. |
| **BR-04** | **Realtime**                 | Khi có booking mới hoặc thay đổi trạng thái → Dashboard cập nhật không cần F5.      |
| **BR-05** | **Empty state**              | Nếu Host chưa có listing → Hiển thị CTA "Đăng tin ngay" thay vì màn hình trống.    |
| **BR-06** | **Caching**                  | Aggregation cache 30s; invalidate ngay khi có sự kiện thay đổi state.              |
| **BR-07** | **Phân quyền**               | Chỉ Host của listing mới thấy dữ liệu listing đó. Admin có view riêng (UC-08).    |

---

## 8. ĐỊNH NGHĨA TRẠNG THÁI LISTING (DASHBOARD)

| Trạng thái      | Điều kiện xác định                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Đang trống**  | Không có booking nào status `approved`/`checked_in` trong ngày hôm nay **và** không có pre-booking `approved` trong 7 ngày tới.    |
| **Đang thuê**   | Có booking với status `checked_in` bao gồm ngày hôm nay.                                                                          |
| **Đặt trước**   | Có ≥ 1 `PreBooking` với status `approved` trong tương lai.                                                                         |
| **Tạm ngừng**   | Listing có `isActive = false` (Host tự ẩn hoặc Admin khoá).                                                                       |

---

## 9. YÊU CẦU PHI CHỨC NĂNG (NFR)

| **ID**     | **Yêu cầu**             | **Mức cam kết**                                              |
| ---------- | ----------------------- | ------------------------------------------------------------ |
| **NFR-01** | Time to first widget    | < **1s** cho Summary Cards với Host có ≤ 50 listing.          |
| **NFR-02** | Calendar render         | < **2s** cho 30 listing trong tháng hiện tại.                 |
| **NFR-03** | Realtime update         | Socket.io push trong < **3s** sau sự kiện trigger.            |
| **NFR-04** | Mobile responsive       | Dashboard phải xài tốt trên màn hình ≥ 360px (Host dùng mobile để check nhanh). |
| **NFR-05** | Error tolerance         | Nếu 1 widget lỗi → các widget khác vẫn hiển thị (không crash full page). |

---

## 10. PHỤ THUỘC (DEPENDENCIES)

| Phụ thuộc                          | Loại        | Ghi chú                                                |
| ---------------------------------- | ----------- | ------------------------------------------------------ |
| **UC-02** (Calendar & Pre-booking) | Bắt buộc    | Source dữ liệu cho calendar tổng hợp.                  |
| **UC-03** (Notification)           | Bắt buộc    | Feed "Hoạt động gần đây" lấy từ notification stream.   |
| **UC-08** (Property)               | Bắt buộc    | Listing trong dashboard phải gắn Property.             |
| MongoDB Aggregation Pipeline       | Hạ tầng     | Tính state realtime của listing.                       |

---

## 11. RỦI RO & GIẢ ĐỊNH

| Loại        | Mô tả                                                                  | Mức độ | Hành động giảm thiểu                                |
| ----------- | ---------------------------------------------------------------------- | ------ | --------------------------------------------------- |
| Risk        | Aggregation chậm khi Host có > 100 listing.                            | Trung  | Pagination + materialized view + denormalize counter. |
| Risk        | Socket disconnect → feed "Hoạt động gần đây" stale.                   | Trung  | Polling fallback + indicator "đã đồng bộ X giây trước". |
| Assumption  | Host vào Dashboard ít nhất 1 lần/ngày.                                  | Trung  | Push email digest hàng tuần để giữ engagement.       |

---

## 12. KPI & METRIC THÀNH CÔNG

| Metric                                              | Mục tiêu sau 30 ngày |
| --------------------------------------------------- | -------------------- |
| Daily Active Host (DAU)                             | ≥ **60%** Host       |
| Time to first meaningful content                    | < 1.5s               |
| Tỷ lệ Host click vào listing card                   | ≥ **50%**            |
| Tỷ lệ Host duyệt pre-booking từ Dashboard (vs email)| ≥ **40%**            |

---

## 13. ACCEPTANCE CRITERIA

- **AC-01:** Summary Cards hiển thị đúng số liệu realtime (không stale data).
- **AC-02:** Listing card hiển thị rõ "Thuê đến [ngày]" khi có người ở.
- **AC-03:** Listing card hiển thị rõ khoảng thời gian đặt trước.
- **AC-04:** Calendar phân biệt màu theo từng listing và giữ màu nhất quán.
- **AC-05:** Dashboard không hiển thị widget nào chỉ có số 0 mà không giải thích ý nghĩa.
- **AC-06:** Empty state có CTA dẫn đến trang đăng listing mới.
- **AC-07:** Khi 1 widget lỗi, các widget khác vẫn hoạt động bình thường.

---

## 14. THUẬT NGỮ (GLOSSARY)

| Thuật ngữ          | Định nghĩa                                                       |
| ------------------ | ---------------------------------------------------------------- |
| **Summary Card**   | Thẻ tóm tắt 1 chỉ số ở đầu Dashboard.                             |
| **Aggregation pipeline** | Cơ chế gộp dữ liệu MongoDB để tính state listing.            |
| **Materialized view** | Bảng denormalize lưu sẵn kết quả aggregation, refresh định kỳ. |
| **DAU**            | Daily Active User — số user có hoạt động trong ngày.              |

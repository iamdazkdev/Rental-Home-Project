# UC-06 — TÀI LIỆU ĐẶC TẢ TÍNH NĂNG BẢO MẬT VỊ TRÍ (LOCATION PRIVACY)

**Dự án:** Rental Home — Hệ thống đặt phòng thông minh
**Mã Use Case:** UC-06
**Phiên bản:** 1.1
**Ngày cập nhật:** 2026-05-08
**Nguồn yêu cầu:** Dazk Dev
**Người soạn:** Business Analyst Team

## Lịch sử thay đổi

| Version | Ngày        | Người sửa | Nội dung                                          |
| ------- | ----------- | --------- | ------------------------------------------------- |
| 1.0     | 2026-05-06  | Dazk Dev  | Khởi tạo đặc tả Location Privacy                   |
| 1.1     | 2026-05-08  | BA Team   | Bổ sung Actors, NFR, audit log, KPI, glossary     |

---

## 1. MỤC TIÊU (OBJECTIVES)

Bảo vệ địa chỉ thật của Host bằng cách **chỉ tiết lộ địa chỉ chính xác sau khi booking được duyệt**:

- Trước booking: chỉ public quận/phường + map blur 500m.
- Sau booking duyệt: gửi địa chỉ đầy đủ qua notification + chat thread.

→ Ngăn người dùng bypass platform (liên hệ trực tiếp Host) và bảo vệ Host khỏi visit không mong muốn.

---

## 2. PHẠM VI (SCOPE)

### 2.1 In-scope

- API contract phân tầng location dựa vào trạng thái booking.
- Map blur (random offset trong vùng 300m).
- Audit log mỗi lần địa chỉ đầy đủ được trả về.

### 2.2 Out-of-scope

- Verify danh tính Host (KYC) — UC khác.
- Anti-fraud / phát hiện liên hệ ngoài platform — UC khác.

---

## 3. CÁC BÊN LIÊN QUAN (ACTORS)

| Vai trò               | Mô tả                                                         |
| --------------------- | ------------------------------------------------------------- |
| **Guest**             | Xem listing, chỉ thấy địa chỉ đầy đủ sau khi booking approved. |
| **Host (Primary)**    | Sở hữu địa chỉ, luôn thấy đầy đủ trong dashboard của mình.    |
| **Admin**             | Có quyền xem địa chỉ đầy đủ phục vụ verify Property.          |
| **Compliance Officer** | Audit log truy cập địa chỉ — Dazk Dev chịu trách nhiệm.       |

---

## 4. ĐIỀU KIỆN

### 4.1 Preconditions

- Listing có dữ liệu location đầy đủ (province / district / ward / street / houseNumber / coordinates).
- API authentication đã hoạt động với JWT.

### 4.2 Postconditions

- Public APIs không bao giờ trả `street` hay `houseNumber`.
- Mọi truy cập `street` được audit log.

---

## 5. MỨC ĐỘ HIỂN THỊ VỊ TRÍ (LOCATION TIERS)

| Giai đoạn                   | Thông tin hiển thị                                  | Độ chính xác          |
| --------------------------- | --------------------------------------------------- | --------------------- |
| **Tìm kiếm (Search)**       | Tên quận + phường/xã                                | ~500m – 2km           |
| **Xem chi tiết listing**    | Tên quận + phường + Map mờ (radius 300m)            | ~300m – 500m          |
| **Booking được approved**   | Địa chỉ đầy đủ qua notification + chat              | Chính xác 100%        |
| **Host xem chính listing**  | Đầy đủ + map pin chính xác                          | Chính xác 100%        |

---

## 6. QUY TRÌNH NGƯỜI DÙNG (USER FLOWS)

### [UC-06.1] Hiển thị vị trí trên trang tìm kiếm

**Main Flow:**

1. Guest search → Kết quả hiển thị nhãn: *"Quận Bình Thạnh, TP.HCM"*.
2. Trên bản đồ: pin **mờ** (cluster theo phường), không pin chính xác.
3. Không hiển thị tên đường, số nhà.

### [UC-06.2] Hiển thị vị trí trên trang chi tiết listing

**Main Flow:**

1. Guest click listing → Trang chi tiết hiển thị:
   - Text: *"Phường 12, Quận Bình Thạnh, TP.HCM"*.
   - Bản đồ: Circle overlay bán kính 300m, không có pin chính xác.
2. Tooltip giải thích: *"Địa chỉ chính xác sẽ được chia sẻ sau khi booking được xác nhận."*

### [UC-06.3] Tiết lộ địa chỉ sau khi booking approved

**Main Flow:**

1. Host duyệt booking → Hệ thống tự động:
   - Gửi địa chỉ đầy đủ qua **in-app notification** (UC-03).
   - Inject địa chỉ đầy đủ vào **chat thread** của booking.
   - Trang "Booking của tôi" cũng hiển thị đầy đủ.
2. Hệ thống ghi audit log: `userId`, `bookingId`, `timestamp`, `ip`.

**Exception Flow:**

- E1. Booking bị `cancelled` sau khi đã reveal → Địa chỉ không được thu hồi (đã chia sẻ rồi), nhưng đánh dấu cancelled trong chat.

### [UC-06.4] Audit log access

**Main Flow:**

1. Mỗi request đọc địa chỉ đầy đủ (`street` + `houseNumber`) → Service ghi log.
2. Admin có thể truy vấn log để điều tra rò rỉ.

---

## 7. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

| **ID**    | **Quy tắc**                          | **Chi tiết**                                                                                       |
| --------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| **BR-01** | **Không lộ địa chỉ trước booking**   | API `GET /listings/:id` chỉ trả `district` + `ward`, **không** `street` hay `houseNumber`.        |
| **BR-02** | **Map blur bắt buộc**                | Frontend phải render circle overlay 300m. Backend trả `mapCenter` đã offset ngẫu nhiên ±300m.      |
| **BR-03** | **Tiết lộ sau approve**              | `street` + `houseNumber` chỉ trả về trong API `GET /bookings/:id` khi `status = approved` và caller là Guest của booking đó. |
| **BR-04** | **Host luôn thấy đầy đủ**            | Host xem listing của mình (qua API host-only) trả về đầy đủ.                                       |
| **BR-05** | **Audit log**                        | Mỗi lần địa chỉ đầy đủ được trả về → Log `userId`, `bookingId`, `timestamp`, `ip`, `userAgent`.    |
| **BR-06** | **Random offset stable**             | `mapCenter` offset random nhưng **stable** với cùng listing (seeded by listingId) — tránh user F5 nhiều lần để tam giác toạ độ. |
| **BR-07** | **Không lộ qua share link**          | Share link listing trên social không nhúng metadata địa chỉ chi tiết (Open Graph chỉ lấy ward).    |

---

## 8. DATA MODEL — LISTING LOCATION

```javascript
location: {
  // Luôn public — search và map blur
  country: String,          // "Việt Nam"
  province: String,         // "TP. Hồ Chí Minh"
  district: String,         // "Quận Bình Thạnh"
  ward: String,             // "Phường 12"

  // Chỉ tiết lộ sau khi booking approved
  street: String,           // "Đường Xô Viết Nghệ Tĩnh"
  houseNumber: String,      // "123/4A"

  // Coordinates — internal only
  coordinates: {
    type: "Point",
    coordinates: [longitude, latitude]   // KHÔNG trả ra API public
  }
}
```

---

## 9. API CONTRACT

### GET `/listings/:id` (Public)

```json
{
  "location": {
    "province": "TP. Hồ Chí Minh",
    "district": "Quận Bình Thạnh",
    "ward": "Phường 12",
    "mapCenter": { "lat": 10.812, "lng": 106.714 }
  }
}
```

> `mapCenter` là toạ độ **đã offset stable random ±300m** (seed = listingId).

### GET `/bookings/:id` (Authenticated — chỉ Guest của booking)

```json
{
  "listing": {
    "location": {
      "fullAddress": "123/4A Đường Xô Viết Nghệ Tĩnh, Phường 12, Quận Bình Thạnh, TP.HCM",
      "coordinates": { "lat": 10.8125, "lng": 106.7145 }
    }
  }
}
```

---

## 10. YÊU CẦU PHI CHỨC NĂNG (NFR)

| **ID**     | **Yêu cầu**             | **Mức cam kết**                                              |
| ---------- | ----------------------- | ------------------------------------------------------------ |
| **NFR-01** | API security            | Tất cả request truy cập địa chỉ đầy đủ phải có valid JWT.     |
| **NFR-02** | Audit log retention     | Lưu tối thiểu **365 ngày**.                                   |
| **NFR-03** | Performance             | Random offset deterministic, không thêm latency > 5ms.        |
| **NFR-04** | Frontend defense        | Frontend không cache `coordinates` thật vào localStorage.     |
| **NFR-05** | Compliance              | Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.   |

---

## 11. PHỤ THUỘC

| Phụ thuộc                       | Loại     | Ghi chú                                                |
| ------------------------------- | -------- | ------------------------------------------------------ |
| **UC-02** (Booking flow)        | Bắt buộc | Trigger reveal địa chỉ khi booking approved.           |
| **UC-03** (Notification)        | Bắt buộc | Kênh gửi địa chỉ sau approve.                          |
| **UC-08** (Property)            | Bắt buộc | Location nằm ở Property model (single source).         |
| MongoDB 2dsphere index          | Hạ tầng  | Tính khoảng cách + map blur stable.                     |

---

## 12. RỦI RO & GIẢ ĐỊNH

| Loại        | Mô tả                                                                  | Mức độ | Hành động giảm thiểu                                |
| ----------- | ---------------------------------------------------------------------- | ------ | --------------------------------------------------- |
| Risk        | User dùng nhiều account để search và tam giác toạ độ thật.             | Cao    | Random offset stable theo listingId (BR-06).         |
| Risk        | Frontend dev quên triển khai blur → leak coordinates.                  | Cao    | Backend không trả `coordinates` thật trong API public. |
| Risk        | Host vô tình ghi địa chỉ vào field `description`.                      | Trung  | Regex detect & cảnh báo Host khi nhập description.   |
| Assumption  | Host chấp nhận tradeoff "Guest không biết chính xác trước khi đặt".    | Cao    | Hiển thị tooltip giải thích lý do.                   |

---

## 13. KPI & METRIC THÀNH CÔNG

| Metric                                              | Mục tiêu                |
| --------------------------------------------------- | ----------------------- |
| Số sự cố leak địa chỉ trước approve                 | **0**                   |
| Tỷ lệ booking approved → Guest dùng đúng địa chỉ    | ≥ **95%**               |
| Số khiếu nại Host về visit không mong muốn          | Giảm ≥ 50% so với baseline |
| Tỷ lệ Guest hỏi địa chỉ qua chat (trước approve)    | < 5% của tổng booking   |

---

## 14. ACCEPTANCE CRITERIA

- **AC-01:** Trang listing không hiển thị tên đường hoặc số nhà.
- **AC-02:** Bản đồ trang listing dùng circle blur, không pin chính xác.
- **AC-03:** Địa chỉ đầy đủ được gửi tự động trong notification khi booking approved.
- **AC-04:** API `/listings/:id` không bao giờ trả `street` hay `houseNumber`.
- **AC-05:** Guest của booking approved có thể xem địa chỉ đầy đủ trong "Booking của tôi".
- **AC-06:** Mọi lần đọc địa chỉ đầy đủ được audit log.
- **AC-07:** F5 nhiều lần trên trang listing trả về `mapCenter` ổn định (không thay đổi).

---

## 15. THUẬT NGỮ

| Thuật ngữ           | Định nghĩa                                                             |
| ------------------- | ---------------------------------------------------------------------- |
| **Map blur**        | Hiển thị vùng tròn thay vì pin chính xác để giấu toạ độ thật.          |
| **Stable random**   | Random nhưng deterministic, cùng input → cùng output.                  |
| **2dsphere index**  | Index MongoDB cho dữ liệu địa lý.                                       |
| **PII**             | Personally Identifiable Information — thông tin định danh cá nhân.      |

# UC-08 — TÀI LIỆU ĐẶC TẢ TÍNH NĂNG ADMIN — QUẢN LÝ NGUỒN NHÀ (PROPERTY SOURCE)

**Dự án:** Rental Home — Hệ thống đặt phòng thông minh
**Mã Use Case:** UC-08
**Phiên bản:** 1.1
**Ngày cập nhật:** 2026-05-08
**Nguồn yêu cầu:** Dazk Dev
**Người soạn:** Business Analyst Team

## Lịch sử thay đổi

| Version | Ngày        | Người sửa | Nội dung                                          |
| ------- | ----------- | --------- | ------------------------------------------------- |
| 1.0     | 2026-05-06  | Dazk Dev  | Khởi tạo đặc tả Property vs Listing               |
| 1.1     | 2026-05-08  | BA Team   | Bổ sung Actors, NFR, KPI, migration plan, glossary |

---

## 1. MỤC TIÊU (OBJECTIVES)

Tách biệt khái niệm **"Nhà" (Property)** và **"Bài đăng" (Listing)**:

- **Property**: Thực thể vật lý — địa chỉ, diện tích, tiện ích cố định. Chỉ tồn tại 1 bản ghi/căn nhà.
- **Listing**: Nội dung quảng cáo — tiêu đề, ảnh, mô tả, giá. Có thể có nhiều Listing cho 1 Property.

Khi 1 Property đã có booking active → Tất cả Listing liên kết tự động cập nhật trạng thái "Đã thuê", ngăn người khác đặt trùng và ngăn Host đăng trùng listing cùng địa chỉ.

---

## 2. PHẠM VI (SCOPE)

### 2.1 In-scope

- CRUD Property (host & admin).
- CRUD Listing (gắn `propertyId`).
- Cascade status update từ Property → Listing.
- Admin verify Property trước khi listing được publish.

### 2.2 Out-of-scope

- KYC Host — UC riêng.
- Hợp đồng dài hạn — UC riêng.
- Migration dữ liệu cũ → có Migration Plan riêng (xem §13).

---

## 3. CÁC BÊN LIÊN QUAN (ACTORS)

| Vai trò             | Mô tả                                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| **Host (Primary)**  | Tạo Property, sau đó tạo nhiều Listing liên kết.                        |
| **Admin (Primary)** | Verify Property và quản lý toàn bộ pool Property.                       |
| **System**          | Cascade update trạng thái khi booking change.                           |
| **Product Owner**   | Dazk Dev — duyệt rule verify và migration plan.                         |

---

## 4. ĐIỀU KIỆN

### 4.1 Preconditions

- Host đã xác minh email và (đối với Property cần verify) đã KYC.

### 4.2 Postconditions

- Property tồn tại với `verifiedByAdmin` mặc định `false`.
- Listing chỉ `publishable = true` khi Property đã verify.

---

## 5. SỰ KHÁC BIỆT: PROPERTY vs LISTING

```text
Property (Nguồn nhà)          Listing (Bài đăng)
┌──────────────────────┐      ┌──────────────────────┐
│ - Địa chỉ thật        │      │ - Tiêu đề bài đăng    │
│ - Diện tích (m²)      │ 1──N │ - Ảnh minh hoạ        │
│ - Số phòng ngủ        │      │ - Mô tả nội dung      │
│ - Tiện ích cố định    │      │ - Giá niêm yết        │
│ - Trạng thái thật     │      │ - Kênh đăng (web/mob) │
└──────────────────────┘      └──────────────────────┘
        ↑ Single source of truth    ↑ Marketing content
```

---

## 6. QUY TRÌNH NGƯỜI DÙNG (USER FLOWS)

### [UC-08.1] Host nhập thông tin nguồn nhà (Property)

**Main Flow:**

1. Host vào **"Quản lý nhà của tôi" → "Thêm nguồn nhà mới"**.
2. Điền form Property:
   - Địa chỉ đầy đủ (quận / phường / đường / số nhà).
   - Diện tích (m²).
   - Số phòng ngủ, số WC.
   - Danh sách tiện ích cố định (điều hoà, máy giặt…).
   - Loại nhà: Nguyên căn / Phòng / Chung cư.
3. Submit → Hệ thống tạo `Property` với `verifiedByAdmin = false`.
4. Hệ thống prompt: *"Bạn muốn tạo bài đăng ngay bây giờ không?"*

**Exception Flow:**

- E1. Địa chỉ trùng với Property đã có của Host khác → Cảnh báo, yêu cầu Host upload chứng từ chứng minh quyền sở hữu.

### [UC-08.2] Tạo nhiều Listing từ 1 Property

**Main Flow:**

1. Host vào chi tiết Property → Click **"Tạo bài đăng mới"**.
2. Điền form Listing (chỉ nội dung marketing, không nhập lại địa chỉ):
   - Tiêu đề, mô tả, ảnh, giá thuê.
   - Thời gian áp dụng (khuyến mãi mùa vụ).
3. Submit → `Listing` được tạo, gắn `propertyId`.
4. Listing chỉ `published` khi Property đã `verifiedByAdmin = true` (BR-05).

### [UC-08.3] Tự động cập nhật trạng thái khi nhà được thuê

**Main Flow:**

1. Booking nào đó được `approved` cho 1 Listing.
2. Hệ thống tìm tất cả Listing cùng `propertyId`.
3. Set `availabilityStatus = "rented"` cho toàn bộ Listing đó.
4. Listing rented không xuất hiện trong search.
5. Khi booking kết thúc (`completed`/`cancelled`) → Tất cả Listing tự động trở về `available`.

**Exception Flow:**

- E1. Race condition: 2 booking approved cùng lúc cho 2 Listing khác nhau cùng Property → Transaction bảo đảm chỉ 1 thành công, cái còn lại bị reject với lý do "Property đã có booking active".

### [UC-08.4] Admin quản lý tất cả Property

**Main Flow:**

1. Admin vào **Admin Dashboard → "Quản lý nguồn nhà"**.
2. Xem danh sách tất cả Property của tất cả Host.
3. Filter theo: Trạng thái / Khu vực / Loại nhà / Verified.
4. Admin có thể: Xem chi tiết, Verify, Tạm khoá Property (ẩn tất cả Listing liên kết).

---

## 7. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

| **ID**    | **Quy tắc**                          | **Chi tiết**                                                                                       |
| --------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| **BR-01** | **1 Property — nhiều Listing**       | Không giới hạn số Listing/Property. Mỗi Listing thuộc đúng 1 Property.                              |
| **BR-02** | **Cascade status update**            | Khi Property có booking active → TẤT CẢ Listing liên kết phải bị ẩn search trong < **5 giây**.    |
| **BR-03** | **Property là source of truth**      | Địa chỉ thay đổi → Chỉ update ở Property; Listing tự reflect, không cần sửa từng cái.              |
| **BR-04** | **Xoá Property**                     | Chỉ xoá được khi không còn Listing active và không có booking đang chạy.                            |
| **BR-05** | **Verify trước publish**             | Listing chỉ `published` khi Property `verifiedByAdmin = true` HOẶC Host đã upload đủ giấy tờ self-verify. |
| **BR-06** | **Concurrency safety**               | Cascade update phải dùng transaction để chống race condition (UC-08.3 E1).                          |
| **BR-07** | **Audit log**                        | Mọi thay đổi `verifiedByAdmin` hoặc khoá Property đều ghi log: admin, timestamp, lý do.            |
| **BR-08** | **Không Listing trùng Property**     | Hệ thống detect trùng địa chỉ và đề xuất Host gắn Listing vào Property đã có thay vì tạo mới.       |

---

## 8. DATA MODEL

### Property Model

```javascript
{
  hostId: ObjectId,
  propertyType: "entire_place" | "room" | "apartment",
  address: {
    province: String,
    district: String,
    ward: String,
    street: String,
    houseNumber: String,
    coordinates: { type: "Point", coordinates: [lng, lat] }
  },
  area: Number,             // m²
  bedrooms: Number,
  bathrooms: Number,
  amenities: [String],      // ["ac", "washing_machine", "wifi", ...]
  status: "available" | "rented" | "under_maintenance" | "inactive",
  verifiedByAdmin: Boolean,
  verifiedAt: Date,
  verifiedBy: ObjectId,     // Admin user
  createdAt: Date
}
```

### Listing Model (cập nhật)

```javascript
{
  propertyId: ObjectId,     // FK đến Property
  hostId: ObjectId,
  title: String,
  description: String,
  images: [String],
  price: Number,
  priceUnit: "night" | "month",
  availabilityStatus: "available" | "rented" | "inactive",
  isActive: Boolean,
  publishStatus: "draft" | "pending_verify" | "published"
}
```

---

## 9. YÊU CẦU PHI CHỨC NĂNG (NFR)

| **ID**     | **Yêu cầu**             | **Mức cam kết**                                              |
| ---------- | ----------------------- | ------------------------------------------------------------ |
| **NFR-01** | Cascade speed           | Listing ẩn search trong < **5s** sau khi Property có booking active. |
| **NFR-02** | Admin pagination        | Admin Property list hỗ trợ pagination (mặc định 50/page).      |
| **NFR-03** | Concurrency             | Dùng MongoDB transaction để chống race condition.              |
| **NFR-04** | Verify SLA              | Admin verify Property trong < **48 giờ** kể từ khi Host submit. |
| **NFR-05** | Search index sync       | Search index update trong < **30s** sau cascade.               |

---

## 10. PHỤ THUỘC

| Phụ thuộc                       | Loại     | Ghi chú                                                |
| ------------------------------- | -------- | ------------------------------------------------------ |
| **UC-02** (Booking)             | Bắt buộc | Trigger cascade status.                                 |
| **UC-04** (Host Dashboard)      | Bắt buộc | Hiển thị Property của Host.                             |
| **UC-06** (Location Privacy)    | Bắt buộc | Property chứa location đầy đủ; chỉ trả public field.    |
| **UC-09** (Banner)              | Liên quan | Featured Listing chỉ chọn từ Listing có Property verified. |

---

## 11. RỦI RO & GIẢ ĐỊNH

| Loại        | Mô tả                                                                  | Mức độ | Hành động giảm thiểu                                |
| ----------- | ---------------------------------------------------------------------- | ------ | --------------------------------------------------- |
| Risk        | Host claim trùng địa chỉ giả mạo Property của người khác.              | Cao    | BR-05 verify giấy tờ + BR-08 detect trùng + audit log. |
| Risk        | Cascade chậm → 2 Guest book cùng Property qua 2 Listing khác nhau.     | Cao    | NFR-01 + Transaction trong BR-06.                    |
| Risk        | Migration dữ liệu cũ (chỉ có Listing, chưa có Property) gặp lỗi.       | Cao    | Migration plan §13 + dry-run trên staging.           |
| Assumption  | Host hiểu sự khác biệt Property và Listing.                            | Trung  | UI tooltip + onboarding tutorial.                    |

---

## 12. KPI & METRIC THÀNH CÔNG

| Metric                                              | Mục tiêu sau 30 ngày |
| --------------------------------------------------- | -------------------- |
| Tỷ lệ Property `verifiedByAdmin = true`             | ≥ **80%**            |
| Số sự cố booking trùng Property                     | **0**                |
| Trung bình thời gian Admin verify                   | < 24h                |
| Tỷ lệ Listing có Property gắn đúng                   | **100%**             |

---

## 13. MIGRATION PLAN (DỮ LIỆU CŨ)

| Bước | Hoạt động                                                                                | Người thực hiện |
| ---- | ----------------------------------------------------------------------------------------- | --------------- |
| 1    | Snapshot Listing collection hiện tại.                                                     | DevOps          |
| 2    | Script gom Listing theo `address` đầy đủ → tạo Property tương ứng.                        | Backend Dev     |
| 3    | Backfill `propertyId` cho từng Listing.                                                  | Backend Dev     |
| 4    | Đặt tất cả Property cũ `verifiedByAdmin = false` → Admin verify lại theo batch ưu tiên.   | Admin Team      |
| 5    | Dry-run trên staging, đối chiếu count Listing trước/sau.                                  | QA              |
| 6    | Deploy lên prod ngoài giờ cao điểm.                                                       | DevOps          |

---

## 14. ACCEPTANCE CRITERIA

- **AC-01:** Host tạo Property → Có thể tạo nhiều Listing mà không cần nhập lại địa chỉ.
- **AC-02:** Khi booking approved → Tất cả Listing cùng Property biến mất khỏi search trong < 5 giây.
- **AC-03:** Khi booking kết thúc → Tất cả Listing tự động trở về `available`.
- **AC-04:** Admin xem được danh sách Property của tất cả Host và có thể khoá.
- **AC-05:** Host không thể xoá Property khi đang có Listing active.
- **AC-06:** Race condition booking trên 2 Listing cùng Property: chỉ 1 thành công, cái còn lại reject.
- **AC-07:** Listing chỉ `published` khi Property `verifiedByAdmin = true`.

---

## 15. THUẬT NGỮ

| Thuật ngữ                | Định nghĩa                                                       |
| ------------------------ | ---------------------------------------------------------------- |
| **Property**             | Thực thể vật lý đại diện 1 căn nhà thật.                          |
| **Listing**              | Bài đăng quảng cáo gắn với 1 Property.                            |
| **Cascade update**       | Cơ chế tự động lan truyền thay đổi từ Property xuống Listing.     |
| **Source of truth**      | Nguồn dữ liệu chính thống, các nơi khác phải đồng bộ theo.        |
| **Backfill**             | Cập nhật dữ liệu cũ theo schema mới.                               |

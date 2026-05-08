# UC-09 — TÀI LIỆU ĐẶC TẢ TÍNH NĂNG ADMIN — QUẢN LÝ BANNER & QUẢNG CÁO

**Dự án:** Rental Home — Hệ thống đặt phòng thông minh
**Mã Use Case:** UC-09
**Phiên bản:** 1.1
**Ngày cập nhật:** 2026-05-08
**Nguồn yêu cầu:** Dazk Dev
**Người soạn:** Business Analyst Team

## Lịch sử thay đổi

| Version | Ngày        | Người sửa | Nội dung                                          |
| ------- | ----------- | --------- | ------------------------------------------------- |
| 1.0     | 2026-05-06  | Dazk Dev  | Khởi tạo đặc tả Banner Manager                     |
| 1.1     | 2026-05-08  | BA Team   | Bổ sung Actors, NFR, KPI, fairness, A/B test plan |

---

## 1. MỤC TIÊU (OBJECTIVES)

Cho phép Admin tự quản lý nội dung Banner và vị trí quảng cáo trên web/app **không cần developer can thiệp** — thay đổi ảnh, link, thời gian hiển thị trực tiếp từ Admin Dashboard.

→ Rút ngắn time-to-market cho campaign marketing và giảm phụ thuộc vào dev cycle.

---

## 2. PHẠM VI (SCOPE)

### 2.1 In-scope

- CRUD Banner: ảnh, link, thời gian, ưu tiên, trạng thái.
- Featured Listing: thêm Listing vào danh sách "Nổi bật".
- Tracking impressions / clicks / CTR.
- Auto-expire theo `endDate`.

### 2.2 Out-of-scope

- A/B testing nâng cao (chỉ giai đoạn 2).
- Targeting theo user segment (giai đoạn 2).
- Self-service quảng cáo cho Host (giai đoạn 3).

---

## 3. CÁC BÊN LIÊN QUAN (ACTORS)

| Vai trò             | Mô tả                                                              |
| ------------------- | ------------------------------------------------------------------ |
| **Admin (Primary)** | Tạo, sửa, bật/tắt banner.                                          |
| **End User**        | Người xem banner trên web/app.                                      |
| **Marketing Team**  | Cung cấp creative + định ra campaign.                               |
| **Product Owner**   | Dazk Dev — duyệt slot mới, rule fairness và cap boost cho UC-07.    |

---

## 4. ĐIỀU KIỆN

### 4.1 Preconditions

- Admin đã đăng nhập với role `admin`.
- Đã cấu hình CDN (Cloudinary) cho upload ảnh.

### 4.2 Postconditions

- Banner được lưu DB và hiển thị đúng slot khi `status = active` và trong khoảng `startDate – endDate`.
- Stats `impressions` / `clicks` cập nhật realtime.

---

## 5. CÁC VỊ TRÍ QUẢNG CÁO (AD SLOTS)

| Slot ID            | Vị trí                          | Kích thước gợi ý  | Loại         |
| ------------------ | ------------------------------- | ----------------- | ------------ |
| `hero_banner`      | Banner lớn đầu trang chủ        | 1920 × 500px      | Image + Link |
| `search_top`       | Trên kết quả tìm kiếm           | 970 × 90px        | Image + Link |
| `listing_sidebar`  | Sidebar trang chi tiết listing  | 300 × 250px       | Image + Link |
| `home_featured`    | Section "Nổi bật" trang chủ     | Listing cards     | Listing IDs  |
| `popup_promo`      | Popup khuyến mãi (login)        | 600 × 400px       | Image + Link |

---

## 6. QUY TRÌNH NGƯỜI DÙNG (USER FLOWS)

### [UC-09.1] Admin tạo banner mới

**Main Flow:**

1. Admin vào **Admin Dashboard → "Quản lý Banner"**.
2. Click "Tạo banner mới".
3. Điền form:
   - **Tên nội bộ**: Phân biệt trong dashboard (không hiển thị ngoài).
   - **Vị trí (Slot)**: Chọn từ danh sách Ad Slots.
   - **Ảnh**: Upload (auto-resize theo slot).
   - **Link đích**: URL khi user click.
   - **Thời gian hiển thị**: `startDate` – `endDate`.
   - **Ưu tiên**: số nguyên (cao = hiện trước).
   - **Trạng thái**: Draft / Active / Paused.
4. Submit → Banner được lưu.
5. Nếu `status = active` và trong khoảng thời gian → hiển thị ngay trên web.

**Exception Flow:**

- E1. Link 404 → Validator chặn submit, yêu cầu Admin sửa link.
- E2. Slot đã đạt **3 banner active** → Cảnh báo, yêu cầu pause bớt hoặc hạ priority (BR-02).

### [UC-09.2] Admin quản lý danh sách banner

**Main Flow:**

1. Xem danh sách với filter: Slot / Trạng thái / Ngày.
2. **Preview** banner trước khi publish.
3. Drag-drop sắp xếp ưu tiên trong cùng slot.
4. Toggle bật/tắt nhanh không cần edit form.
5. Xem **Stats**: impressions, clicks, CTR (%).

### [UC-09.3] Quản lý Featured Listings

**Main Flow:**

1. Admin vào tab **"Nổi bật"**.
2. Search và thêm Listing ID vào danh sách featured.
3. Drag-drop sắp xếp thứ tự.
4. Set thời gian featured (VD: 7 ngày).
5. Listing featured được gắn badge "Nổi bật" và hiển thị ưu tiên trang chủ.

**Exception Flow:**

- E1. Listing có Property chưa verified → Không cho featured (BR-07).

---

## 7. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

| **ID**    | **Quy tắc**                       | **Chi tiết**                                                                                            |
| --------- | --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **BR-01** | **Tự động hết hạn**               | Banner tự `expired` khi qua `endDate`. Không cần Admin tắt thủ công.                                     |
| **BR-02** | **Giới hạn active/slot**          | Mỗi slot tối đa **3 banner active** cùng lúc (xoay vòng theo priority hoặc ngẫu nhiên).                  |
| **BR-03** | **Kích thước ảnh**                | Hệ thống auto resize/crop ảnh upload theo kích thước chuẩn của slot.                                     |
| **BR-04** | **No dead links**                 | Khi tạo/edit, validate `linkUrl` (HEAD request) phải không 404.                                          |
| **BR-05** | **Tracking click**                | Click vào banner đi qua redirect URL của hệ thống để đếm trước khi tới đích.                             |
| **BR-06** | **Performance**                   | Banner images phải dùng CDN (Cloudinary), không load trực tiếp từ server.                                |
| **BR-07** | **Featured chỉ cho Listing đủ chuẩn** | Featured Listing chỉ chọn từ Listing có Property `verifiedByAdmin = true` (UC-08).                    |
| **BR-08** | **Fairness với UC-07**            | Listing được featured chỉ boost tối đa **+15%** trong scoring engine (đồng bộ UC-07 BR-04).             |
| **BR-09** | **Audit log**                     | Mọi thao tác tạo / sửa / xoá banner ghi log: admin, timestamp, diff.                                     |
| **BR-10** | **Không hiển thị banner expired** | Banner `expired`/`paused` không được render frontend, kể cả khi vẫn còn trong cache.                     |

---

## 8. TRẠNG THÁI BANNER

| Trạng thái   | Mô tả                                       | Hiển thị ra ngoài? |
| ------------ | ------------------------------------------- | ------------------ |
| `draft`      | Đang soạn thảo, chưa publish                | Không              |
| `active`     | Đang chạy (trong khoảng thời gian)          | Có                 |
| `paused`     | Tạm dừng bởi Admin                          | Không              |
| `scheduled`  | Đã set thời gian, chưa đến `startDate`      | Không              |
| `expired`    | Đã qua `endDate`                            | Không              |

---

## 9. DATA MODEL

```javascript
{
  name: String,                 // Tên nội bộ
  slotId: String,               // "hero_banner" | "search_top" | ...
  imageUrl: String,             // Cloudinary URL
  linkUrl: String,              // Destination URL
  priority: Number,             // Cao = hiện trước
  startDate: Date,
  endDate: Date,
  status: "draft" | "active" | "paused" | "scheduled" | "expired",
  stats: {
    impressions: Number,
    clicks: Number
  },
  createdBy: ObjectId,          // Admin user ID
  createdAt: Date,
  updatedAt: Date
}
```

---

## 10. YÊU CẦU PHI CHỨC NĂNG (NFR)

| **ID**     | **Yêu cầu**             | **Mức cam kết**                                              |
| ---------- | ----------------------- | ------------------------------------------------------------ |
| **NFR-01** | Page load impact        | LCP của trang không tăng quá **+200ms** khi banner active.   |
| **NFR-02** | Image delivery          | Phục vụ qua CDN, P95 TTFB < 100ms toàn cầu.                  |
| **NFR-03** | Stats freshness         | Impression / click cập nhật ≤ **5 phút**.                     |
| **NFR-04** | Auto-expire job         | Job chạy mỗi 5 phút; banner `expired` không bao giờ hiển thị. |
| **NFR-05** | Audit retention         | Lưu audit log ≥ **365 ngày**.                                  |

---

## 11. PHỤ THUỘC

| Phụ thuộc                       | Loại     | Ghi chú                                                |
| ------------------------------- | -------- | ------------------------------------------------------ |
| **UC-07** (AI Gợi ý)            | Bắt buộc | Cap +15% boost cho paid listing (BR-08).               |
| **UC-08** (Property)            | Bắt buộc | Featured Listing yêu cầu Property verified (BR-07).    |
| Cloudinary (CDN)                | Hạ tầng  | Lưu và phục vụ ảnh banner.                              |
| Cron / BullMQ                   | Hạ tầng  | Auto-expire banner.                                     |

---

## 12. RỦI RO & GIẢ ĐỊNH

| Loại        | Mô tả                                                                      | Mức độ | Hành động giảm thiểu                                |
| ----------- | -------------------------------------------------------------------------- | ------ | --------------------------------------------------- |
| Risk        | Banner làm chậm page load → ảnh hưởng SEO + UX.                            | Cao    | NFR-01 + lazy load + dùng CDN.                       |
| Risk        | Featured Listing chiếm hết top kết quả → giảm trust với organic listing.   | Cao    | BR-08 cap +15% + UC-07 BR-07 diversity (max 3/Host). |
| Risk        | Click tracking bị bypass (user dùng adblock) → metric thiếu.                | Trung  | Server-side tracking ngay khi serve banner (impression). |
| Assumption  | Marketing team có sẵn creative chuẩn theo size yêu cầu.                    | Thấp   | Cung cấp template + auto resize/crop.                |

---

## 13. KPI & METRIC THÀNH CÔNG

| Metric                                              | Mục tiêu sau 30 ngày |
| --------------------------------------------------- | -------------------- |
| Tỷ lệ banner publish thành công không cần dev      | **100%**             |
| Trung bình CTR banner `hero_banner`                 | ≥ **1.5%**           |
| LCP page chính khi có banner                        | < **2.5s**           |
| Số lần Admin phải gọi dev xử lý sự cố banner/tháng  | < **2**              |

---

## 14. ACCEPTANCE CRITERIA

- **AC-01:** Admin có thể tạo, chỉnh sửa, bật/tắt banner mà không cần developer.
- **AC-02:** Banner tự động tắt khi đến `endDate` (không cần Admin tắt thủ công).
- **AC-03:** Admin xem được impressions và clicks của từng banner.
- **AC-04:** Preview banner trước khi publish.
- **AC-05:** Banner dùng CDN, không ảnh hưởng page load speed (LCP < 2.5s).
- **AC-06:** Featured Listing chỉ chọn từ Listing có Property verified.
- **AC-07:** Mỗi slot không có quá 3 banner active cùng lúc.
- **AC-08:** Click vào banner đều đi qua redirect URL hệ thống và được đếm.

---

## 15. THUẬT NGỮ

| Thuật ngữ           | Định nghĩa                                                       |
| ------------------- | ---------------------------------------------------------------- |
| **Slot**            | Vị trí cố định trên web/app dành cho banner.                      |
| **Impression**      | Một lần banner được render và xem bởi user.                       |
| **CTR**             | Click-Through Rate = clicks / impressions × 100%.                  |
| **LCP**             | Largest Contentful Paint — chỉ số đo tốc độ load Core Web Vitals. |
| **CDN**             | Content Delivery Network — phân phối tài nguyên qua edge servers.  |

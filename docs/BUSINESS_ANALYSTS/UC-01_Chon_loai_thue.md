# UC-01 — TÀI LIỆU ĐẶC TẢ TÍNH NĂNG TÌM KIẾM & CHỌN LOẠI THUÊ

**Dự án:** Rental Home — Hệ thống đặt phòng thông minh
**Mã Use Case:** UC-01
**Phiên bản:** 1.2
**Ngày cập nhật:** 2026-05-08
**Nguồn yêu cầu:** Dazk Dev
**Người soạn:** Business Analyst Team

### Lịch sử thay đổi (Version History)

| Version | Ngày        | Người sửa | Nội dung                                           |
| ------- | ----------- | --------- | -------------------------------------------------- |
| 1.0     | 2026-04-20  | Dazk Dev  | Khởi tạo đặc tả ban đầu cho luồng thuê dài hạn    |
| 1.1     | 2026-05-06  | Dazk Dev  | Bổ sung scoring engine và Flexible Mode            |
| 1.2     | 2026-05-08  | BA Team   | Chuẩn hoá template, thêm Actors / NFR / Edge cases |

---

## 1. MỤC TIÊU (OBJECTIVES)

Cung cấp công cụ tìm kiếm thống nhất cho hai phân khúc thuê **Ngắn hạn** (theo đêm) và **Dài hạn** (1–12 tháng), trong đó:

- Người dùng được chọn **đúng loại nhu cầu** ngay từ bước đầu để hệ thống áp đúng logic giá, lịch và filter.
- Phân khúc dài hạn áp dụng **Scoring-based ranking** thay vì hard-filter, đảm bảo không bị "0 kết quả" khi yêu cầu hơi lệch so với cung thực tế.
- Hỗ trợ cả người dùng **đã có kế hoạch cụ thể** (Exact Mode) lẫn **chưa chốt lịch** (Flexible Mode).

---

## 2. PHẠM VI (SCOPE)

### 2.1 Trong phạm vi (In-scope)
- Tab chuyển đổi Ngắn hạn / Dài hạn trên trang Search.
- Form nhập tiêu chí thuê dài hạn (Duration, Plan Status, Date/Month).
- Thuật toán scoring cho dài hạn (Duration / Date / Other).
- Logic Multi-Point Search cho Flexible Mode.

### 2.2 Ngoài phạm vi (Out-of-scope)
- Trang chi tiết listing → thuộc UC khác.
- Đặt phòng (booking flow) → thuộc UC-02.
- Recommendation cá nhân hoá → thuộc UC-07.
- Logic giá / khuyến mãi theo mùa → quản lý ở module pricing riêng.

---

## 3. CÁC BÊN LIÊN QUAN (ACTORS & STAKEHOLDERS)

| Vai trò              | Mô tả                                                       |
| -------------------- | ----------------------------------------------------------- |
| **Guest (Primary)**  | Người tìm phòng để thuê ngắn hạn hoặc dài hạn.              |
| **System**           | Backend search service + Scoring engine.                    |
| **Host (gián tiếp)** | Cung cấp Listing và lịch trống để hệ thống match.           |
| **Product Owner**    | Dazk Dev — duyệt thay đổi business rule và trọng số scoring. |

---

## 4. ĐIỀU KIỆN (PRECONDITIONS / POSTCONDITIONS)

### 4.1 Preconditions
- Người dùng đã truy cập trang Search (không bắt buộc đăng nhập).
- Cơ sở dữ liệu listing có ít nhất 1 listing `isActive = true`.

### 4.2 Postconditions
- Hệ thống trả về tập kết quả đã ranked theo Final Score (hoặc danh sách rỗng kèm gợi ý — xem UC-07).
- Tiêu chí tìm kiếm được lưu vào lịch sử (nếu user đã đăng nhập) phục vụ cá nhân hoá.

---

## 5. QUY TRÌNH NGƯỜI DÙNG (USER FLOWS)

### [UC-01.1] Chọn loại thuê (Rental Type Switch)

**Main Flow:**
1. Guest vào trang Search.
2. Hệ thống hiển thị 2 tab: **[Ngắn hạn]** / **[Dài hạn]**.
3. Guest chọn tab.
4. Hệ thống load form tiêu chí tương ứng mà **không reset các input đã có giá trị tương đồng** (ví dụ: khu vực, số người).

**Alternative Flow:**
- A1. Guest chuyển tab sau khi đã nhập tiêu chí → Hệ thống giữ lại các trường chung (location, guests), reset các trường chuyên biệt (duration, planStatus).

### [UC-01.2] Khởi tạo tìm kiếm dài hạn

**Main Flow:**
1. Guest chọn tab **"Thuê dài hạn"**.
2. Hệ thống yêu cầu chọn **Thời gian thuê (Duration)** qua slider hoặc dropdown từ 1–12 tháng.
3. Guest chọn **Trạng thái kế hoạch**:
   - **"Đã có kế hoạch" (Exact Mode)** → Chuyển [UC-01.3].
   - **"Chưa có kế hoạch" (Flexible Mode)** → Chuyển [UC-01.4].

### [UC-01.3] Luồng Exact Mode

**Main Flow:**
1. Guest chọn `start_date` cụ thể từ lịch.
2. Guest nhấn **"Tìm kiếm"**.
3. Hệ thống tính scoring với mốc thời gian cố định và trả về kết quả ranked.

**Exception Flow:**
- E1. `start_date` < hôm nay → Hiển thị lỗi inline, không cho submit.
- E2. Số kết quả khớp 100% = 0 → Bàn giao sang **UC-07.1** (Gợi ý gần khớp).

### [UC-01.4] Luồng Flexible Mode

**Main Flow:**
1. Guest chọn 1–3 tháng có thể bắt đầu (ví dụ: Tháng 5, 6, 7).
2. Guest nhấn **"Tìm kiếm"**.
3. Hệ thống chạy **Multi-Point Search** (xem §7.1) và merge kết quả tốt nhất.

**Exception Flow:**
- E1. Guest chọn > 3 tháng → Disable thêm tháng và hiển thị tooltip giới hạn.
- E2. Khoảng tháng đã qua hiện tại → Tự động lọc bỏ tháng quá khứ.

---

## 6. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

| **ID**    | **Quy tắc**                  | **Chi tiết nội dung**                                                                                                                                                  |
| --------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BR-01** | **Đơn vị tính**              | 1 tháng quy ước = **30 ngày** để tính toán logic thống nhất giữa frontend và backend.                                                                                  |
| **BR-02** | **Thời hạn tối thiểu**       | Nếu Duration = 1 tháng → `min_duration` = 24 ngày (80%). Nếu Duration ≥ 2 tháng → `min_duration` = (Duration − 1) tháng + 1 ngày. VD: chọn 3 tháng vẫn lấy được 2 tháng 1 ngày. |
| **BR-03** | **Điều kiện loại bỏ**        | Listing bị **Reject** (không hiển thị) khi `available_duration < min_duration`.                                                                                        |
| **BR-04** | **Ngày kết thúc kỳ vọng**    | `expected_end_date = start_date + requested_duration`. Chỉ dùng tham chiếu tính score, **không** dùng để hard-filter.                                                  |
| **BR-05** | **Mặc định tab**             | Lần đầu vào trang → mặc định **Ngắn hạn**. Lần sau → ghi nhớ tab cuối cùng (LocalStorage 30 ngày).                                                                       |
| **BR-06** | **Giữ input khi switch tab** | Khi chuyển Ngắn hạn ↔ Dài hạn, **không reset** các input dùng chung (location, số khách).                                                                              |
| **BR-07** | **Giới hạn Flexible Mode**   | Tối đa 3 tháng được chọn cùng lúc trong Flexible Mode để giới hạn chi phí compute scoring.                                                                              |

---

## 7. LOGIC TÍNH TOÁN VÀ CHẤM ĐIỂM (SCORING)

Hệ thống tính điểm cho từng phòng trên thang **0.0 – 1.0**.

### 7.1 Duration Score — Trọng số 60%
> `duration_score = min(1, available_duration / requested_duration)`

### 7.2 Date Score — Trọng số 30% *(chỉ áp dụng cho Exact Mode)*

| Trường hợp                                                    | Điểm                              |
| ------------------------------------------------------------- | --------------------------------- |
| Phòng sẵn sàng (`available_from <= start_date`)               | **1.0**                           |
| Phòng trống muộn (`start_date < available_from <= start+7`)   | **1 − (số ngày trễ / 7)**         |
| Phòng trống quá 7 ngày sau `start_date`                       | **0** (không tính, listing bị loại) |

### 7.3 Other Score — Trọng số 10%
Tổng hợp tie-break dựa trên rating, giá so với mặt bằng khu vực, và độ đầy đủ thông tin listing.

### 7.4 Final Score
> `Final_score = (Duration × 0.6) + (Date × 0.3) + (Other × 0.1)`

> **Lưu ý:** Trong Flexible Mode, `Date Score` được thay bằng giá trị trung bình của các điểm bắt đầu giả lập (xem §8.1).

---

## 8. LƯU Ý KỸ THUẬT (IMPLEMENTATION NOTES)

### 8.1 Xử lý Flexible Mode — "Multi-Point Search"

1. Với mỗi tháng được chọn, hệ thống tự sinh **6 mốc bắt đầu giả lập**: ngày 1, 5, 10, 15, 20, 25.
2. Chạy Exact-Mode scoring cho từng mốc.
3. **Merge:** Nếu cùng 1 listing xuất hiện nhiều lần, giữ bản ghi có **Final Score cao nhất** kèm theo `suggested_start_date`.
4. Sắp xếp toàn bộ kết quả theo `Final Score` giảm dần.

### 8.2 Logic hiển thị ngày bắt đầu

| Tình huống                                                        | Ngày hiển thị        | Hành vi UI                            |
| ----------------------------------------------------------------- | -------------------- | ------------------------------------- |
| `available_from <= start_date`                                    | `start_date`         | Bình thường                           |
| `available_from < start_date` nhưng cần để đạt `min_duration`     | `available_from`     | Bình thường                           |
| `available_from > start_date`                                     | `available_from`     | Highlight cảnh báo "Trống muộn hơn"   |

---

## 9. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

| **ID**     | **Yêu cầu**            | **Mức cam kết**                                              |
| ---------- | ---------------------- | ------------------------------------------------------------ |
| **NFR-01** | Tốc độ trả kết quả     | P95 < **800ms** với top 50 kết quả ranked.                    |
| **NFR-02** | Tải đồng thời          | Hỗ trợ ≥ **500 search/giây** ở giờ cao điểm.                  |
| **NFR-03** | Cache scoring          | Cache kết quả 60 giây cho cùng tổ hợp tiêu chí.               |
| **NFR-04** | Mobile responsive      | Form search dùng được trên màn hình ≥ 320px chiều rộng.       |
| **NFR-05** | Logging                | Log mỗi search request: tiêu chí + số kết quả + thời gian P95. |

---

## 10. PHỤ THUỘC (DEPENDENCIES)

| Phụ thuộc                                       | Loại        | Ghi chú                                              |
| ----------------------------------------------- | ----------- | ---------------------------------------------------- |
| **UC-07** (AI Gợi ý tìm kiếm)                   | Bắt buộc    | Gọi khi 0 kết quả khớp 100%.                          |
| **UC-06** (Bảo mật vị trí)                      | Bắt buộc    | Kết quả search không trả `street`/`houseNumber`.      |
| **UC-08** (Admin Property)                      | Bắt buộc    | Chỉ search trên Listing có Property đã verified.      |
| MongoDB Geo Index                               | Hạ tầng     | Cần index 2dsphere trên `location.coordinates`.       |

---

## 11. RỦI RO & GIẢ ĐỊNH (RISKS & ASSUMPTIONS)

| Loại        | Mô tả                                                                              | Mức độ | Hành động giảm thiểu                                  |
| ----------- | ---------------------------------------------------------------------------------- | ------ | ---------------------------------------------------- |
| Risk        | Multi-Point Search × 3 tháng × 6 mốc = 18 lần exact-search → tăng tải DB.          | Cao    | Cache, batched query, giới hạn 3 tháng (BR-07).      |
| Risk        | Người dùng không hiểu sự khác biệt Exact vs Flexible.                              | Trung  | Thêm tooltip + microcopy ngắn ở UI.                  |
| Assumption  | Listing có dữ liệu `available_from` chính xác (không bị Host cập nhật chậm).        | Trung  | Dashboard nhắc Host cập nhật calendar (UC-04).       |
| Assumption  | Trọng số 60/30/10 phù hợp cho thị trường VN.                                        | Thấp   | A/B test sau 30 ngày launch để hiệu chỉnh.           |

---

## 12. KPI & METRIC THÀNH CÔNG (SUCCESS METRICS)

| Metric                                  | Mục tiêu sau 30 ngày launch                  |
| --------------------------------------- | -------------------------------------------- |
| Tỷ lệ search có ≥ 1 kết quả             | ≥ **95%**                                    |
| Tỷ lệ click từ search → listing detail  | ≥ **35%**                                    |
| Tỷ lệ search → booking                  | ≥ **3%**                                     |
| P95 search latency                       | < 800ms                                       |
| Tỷ lệ chuyển từ Flexible → Booking       | ≥ Exact Mode × 0.6                            |

---

## 13. ACCEPTANCE CRITERIA

- **AC-01:** Tab mặc định = Ngắn hạn ở phiên đầu, sau đó nhớ tab cuối cùng dùng.
- **AC-02:** Khi switch tab → các input chung (location, số khách) được giữ lại.
- **AC-03:** Exact Mode bắt buộc nhập `start_date` ≥ ngày hiện tại trước khi cho submit.
- **AC-04:** Flexible Mode chặn chọn quá 3 tháng và lọc bỏ tháng đã qua.
- **AC-05:** Listing có `available_duration < min_duration` không xuất hiện trong kết quả.
- **AC-06:** Listing trống muộn hơn `start_date` ≤ 7 ngày được hiển thị kèm cảnh báo.
- **AC-07:** Final Score được tính đúng công thức `(D × 0.6) + (Date × 0.3) + (Other × 0.1)` (kiểm chứng bằng unit test).
- **AC-08:** Khi 0 kết quả khớp 100% → chuyển sang luồng UC-07.1 (không hiển thị màn hình trống).

---

## 14. THUẬT NGỮ (GLOSSARY)

| Thuật ngữ              | Định nghĩa                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------- |
| **Exact Mode**         | Người dùng đã chọn ngày bắt đầu cụ thể.                                               |
| **Flexible Mode**      | Người dùng chỉ chọn tháng có thể vào ở, hệ thống tự suy luận điểm bắt đầu tốt nhất.   |
| **Duration**           | Số tháng người dùng muốn thuê (1–12).                                                 |
| **available_duration** | Số ngày thực tế listing còn trống tính từ `start_date`.                               |
| **min_duration**       | Ngưỡng tối thiểu chấp nhận hiển thị (BR-02).                                          |
| **Final Score**        | Điểm tổng hợp ranking, thang 0.0–1.0.                                                  |

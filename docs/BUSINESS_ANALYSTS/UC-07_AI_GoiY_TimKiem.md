# UC-07 — TÀI LIỆU ĐẶC TẢ TÍNH NĂNG AI GỢI Ý TÌM KIẾM

**Dự án:** Rental Home — Hệ thống đặt phòng thông minh
**Mã Use Case:** UC-07
**Phiên bản:** 1.1
**Ngày cập nhật:** 2026-05-08
**Nguồn yêu cầu:** Dazk Dev
**Người soạn:** Business Analyst Team

## Lịch sử thay đổi

| Version | Ngày        | Người sửa | Nội dung                                          |
| ------- | ----------- | --------- | ------------------------------------------------- |
| 1.0     | 2026-05-06  | Dazk Dev  | Khởi tạo đặc tả Scoring Engine + Empty State      |
| 1.1     | 2026-05-08  | BA Team   | Bổ sung Actors, NFR, KPI, fairness, glossary      |

---

## 1. MỤC TIÊU (OBJECTIVES)

Xây dựng engine gợi ý thông minh giải quyết 2 bài toán:

1. **Khi tìm kiếm trả về 0 kết quả** → Gợi ý các listing "gần khớp" thay vì màn hình trống.
2. **Khi có quá nhiều kết quả** → Sắp xếp theo độ phù hợp (Scoring) thay vì random, giúp listing tốt nổi lên đầu.

→ Tăng tỷ lệ click & booking, đồng thời tránh lãng phí impression cho listing kém chất lượng.

---

## 2. PHẠM VI (SCOPE)

### 2.1 In-scope

- Empty-state recovery: khi 0 kết quả khớp 100% → gợi ý gần khớp.
- Relevance Score sort cho kết quả tìm kiếm.
- Personalization "Dành riêng cho bạn".
- Boost / penalty rules cho ranking.

### 2.2 Out-of-scope

- ML model nâng cao (collaborative filtering) — giai đoạn 2 sau khi đủ data.
- Trả phí quảng cáo listing — UC-09 quản lý riêng, UC-07 chỉ tôn trọng cap +15% (BR-04).

---

## 3. CÁC BÊN LIÊN QUAN (ACTORS)

| Vai trò                | Mô tả                                                       |
| ---------------------- | ----------------------------------------------------------- |
| **Guest (Primary)**    | User tìm kiếm và xem gợi ý.                                  |
| **Scoring Engine**     | Service tính score và rank listing.                          |
| **Logger**             | Lưu hành vi click/view/booking để cải thiện model.            |
| **Product Owner**      | Dazk Dev — duyệt trọng số, ngưỡng, và rule fairness.          |

---

## 4. ĐIỀU KIỆN

### 4.1 Preconditions

- Listing index sẵn sàng (search service hoạt động).
- Pre-computed boost/penalty đã được cập nhật ≤ 24h trước.

### 4.2 Postconditions

- Trả về kết quả ranked theo Final Score.
- Mỗi gợi ý có thể giải thích "tại sao được gợi ý" (explainability).

---

## 5. QUY TRÌNH NGƯỜI DÙNG (USER FLOWS)

### [UC-07.1] Tìm kiếm không có kết quả chính xác

**Main Flow:**

1. User nhập tiêu chí → Hệ thống trả về 0 listing khớp 100%.
2. Hệ thống **không** hiển thị "Không tìm thấy".
3. Thay vào đó, hiển thị section **"Gợi ý gần khớp"**: *"Không tìm thấy kết quả chính xác — Đây là các lựa chọn gần nhất:"*.
4. Mỗi gợi ý hiển thị:
   - % phù hợp (VD: "85% phù hợp").
   - Highlight lý do match và lý do lệch (✅ Khu vực, ✅ Giá — ⚠️ Diện tích nhỏ hơn 10m²).
5. User có thể click **"Mở rộng tiêu chí"** để adjust và search lại.

**Exception Flow:**

- E1. Không có gợi ý nào đạt ≥ 0.4 → Hiển thị empty state "thông minh" với CTA "Tạo yêu cầu săn nhà" (chuyển sang UC-05).

### [UC-07.2] Sắp xếp kết quả theo độ phù hợp

**Main Flow:**

1. User search có kết quả → Mặc định sort **"Phù hợp nhất"** (Relevance Score).
2. User có thể đổi sang: Giá thấp / Giá cao / Mới nhất / Đánh giá cao.
3. Mỗi listing card hiển thị badge điểm (nếu user bật "Hiển thị độ phù hợp").

### [UC-07.3] Gợi ý dựa trên lịch sử (Personalization)

**Main Flow:**

1. User đã đăng nhập và có lịch sử search/view listing.
2. Trang chủ / trang kết quả hiển thị section **"Dành riêng cho bạn"**.
3. Gợi ý dựa trên: khu vực hay xem, khoảng giá hay chọn, loại phòng hay quan tâm.

**Exception Flow:**

- E1. User chưa đăng nhập hoặc chưa đủ 3 hành vi → Ẩn section, fallback sang "Listing nổi bật".

---

## 6. SCORING ENGINE

### 6.1 Các chiều tính điểm

| Chiều                  | Trọng số | Cách tính                                                                            |
| ---------------------- | -------- | ------------------------------------------------------------------------------------ |
| **Khu vực**            | 35%      | Khớp ward = **1.0** / Khớp district = **0.7** / Khớp province = **0.3**             |
| **Giá**                | 25%      | Trong ngưỡng = **1.0** / Vượt ≤ 15% = **0.7** / Vượt ≤ 30% = **0.4** / Vượt > 30% = **0** |
| **Ngày trống**         | 20%      | Khớp chính xác = **1.0** / Trễ ≤ 3 ngày = **0.7** / Trễ ≤ 7 ngày = **0.4**         |
| **Diện tích**          | 10%      | ≥ yêu cầu = **1.0** / Nhỏ hơn ≤ 10% = **0.6** / Nhỏ hơn > 10% = **0.2**            |
| **Chất lượng listing** | 10%      | `(avg_rating / 5) × 0.6 + min(số_review / 50, 1) × 0.4`                             |

> **Final Score = Σ (weight_i × score_i)**

### 6.2 Boost factors (áp sau base score)

| Điều kiện                          | Boost   |
| ---------------------------------- | ------- |
| Listing có ≥ 5 ảnh                  | +5%     |
| Host phản hồi trong < 1h            | +5%     |
| Listing được đặt ≥ 3 lần/tháng      | +3%     |
| Listing mới đăng (≤ 7 ngày)         | +5%     |

### 6.3 Penalty factors

| Điều kiện                          | Penalty |
| ---------------------------------- | ------- |
| Host có tỷ lệ từ chối > 30%        | −10%    |
| Listing không cập nhật > 30 ngày   | −5%     |
| Có báo cáo vi phạm chưa xử lý      | −20%    |

### 6.4 Fairness cap

- Tổng boost không vượt **+20%**.
- Listing trả phí quảng cáo (UC-09) chỉ được boost tối đa **+15%** và **không được vượt qua** listing organic chất lượng cao (BR-04).

---

## 7. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

| **ID**    | **Quy tắc**                       | **Chi tiết**                                                                                              |
| --------- | --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **BR-01** | **Không màn hình trống**          | Khi 0 kết quả chính xác → BẮT BUỘC hiển thị gợi ý gần khớp (score ≥ 0.4).                                  |
| **BR-02** | **Minh bạch lý do**               | Mỗi gợi ý phải giải thích rõ tại sao được gợi ý và tại sao không khớp 100%.                               |
| **BR-03** | **Tốc độ**                        | Engine scoring phải trả kết quả trong < **500ms** (dùng pre-computed index).                              |
| **BR-04** | **Tách biệt với paid listing**    | Listing trả phí quảng cáo chỉ được boost tối đa +15%, không được vượt qua listing organic chất lượng cao. |
| **BR-05** | **Log dữ liệu hành vi**           | Log click/view/booking từ recommendation để train model sau này.                                           |
| **BR-06** | **Privacy-first**                 | Chỉ dùng dữ liệu hành vi của chính user; không dùng dữ liệu user khác để cá nhân hoá nếu chưa opt-in.    |
| **BR-07** | **Diversity**                     | Top 10 kết quả không được toàn bộ thuộc 1 Host duy nhất; max 3 listing cùng Host trong top 10.            |

---

## 8. YÊU CẦU PHI CHỨC NĂNG (NFR)

| **ID**     | **Yêu cầu**             | **Mức cam kết**                                              |
| ---------- | ----------------------- | ------------------------------------------------------------ |
| **NFR-01** | Latency                 | P95 < **500ms** với top 50 kết quả.                            |
| **NFR-02** | Index freshness         | Boost/penalty cập nhật ≤ **24h**.                              |
| **NFR-03** | Throughput              | ≥ 500 search/giây.                                            |
| **NFR-04** | Explainability          | Mỗi listing trong top 50 có metadata "match reasons".         |
| **NFR-05** | Logging                 | Log hành vi user retention ≥ 180 ngày.                         |

---

## 9. PHỤ THUỘC

| Phụ thuộc                       | Loại     | Ghi chú                                                |
| ------------------------------- | -------- | ------------------------------------------------------ |
| **UC-01** (Search)              | Bắt buộc | Là entry point cho UC-07.                               |
| **UC-05** (Săn nhà)             | Liên quan | Cùng dùng scoring engine, fallback khi 0 gợi ý.         |
| **UC-09** (Banner / Quảng cáo)  | Bắt buộc | Cap +15% cho paid listing.                              |
| Search index (MongoDB / Elasticsearch) | Hạ tầng | Pre-computed score lưu sẵn.                       |

---

## 10. RỦI RO & GIẢ ĐỊNH

| Loại        | Mô tả                                                                  | Mức độ | Hành động giảm thiểu                                |
| ----------- | ---------------------------------------------------------------------- | ------ | --------------------------------------------------- |
| Risk        | Trọng số fixed gây bias (luôn ưu tiên khu vực over giá).               | Trung  | A/B test trọng số, thu data để hiệu chỉnh.          |
| Risk        | Personalization lộ thông tin user (qua API public).                    | Cao    | Tách endpoint `/recommendations/me` yêu cầu auth.    |
| Risk        | Listing chất lượng thấp lợi dụng paid boost.                            | Trung  | BR-04 cap + BR-07 diversity.                        |
| Assumption  | User chấp nhận sort theo "Phù hợp nhất" làm mặc định.                   | Trung  | A/B test với "Mới nhất" làm baseline.               |

---

## 11. KPI & METRIC THÀNH CÔNG

| Metric                                              | Mục tiêu sau 30 ngày |
| --------------------------------------------------- | -------------------- |
| Tỷ lệ search 0 kết quả → click vào gợi ý gần khớp   | ≥ **30%**            |
| Tỷ lệ click trên kết quả top 5                      | ≥ **40%**            |
| Tỷ lệ search → booking                              | Tăng ≥ **20%** so với baseline |
| P95 latency                                         | < 500ms              |

---

## 12. ACCEPTANCE CRITERIA

- **AC-01:** Search 0 kết quả → Hiển thị tối thiểu 3 gợi ý gần khớp (nếu tồn tại).
- **AC-02:** Mỗi gợi ý hiển thị % phù hợp và breakdown lý do.
- **AC-03:** Kết quả mặc định sắp xếp theo Relevance Score (cao xuống thấp).
- **AC-04:** Engine trả kết quả trong < 500ms.
- **AC-05:** Hành vi user (click, view, book) được log để cải thiện model theo thời gian.
- **AC-06:** Top 10 kết quả không có quá 3 listing cùng 1 Host.
- **AC-07:** Listing paid không lọt top organic chất lượng cao (verify qua test).

---

## 13. THUẬT NGỮ

| Thuật ngữ           | Định nghĩa                                                       |
| ------------------- | ---------------------------------------------------------------- |
| **Relevance Score** | Điểm tổng hợp 0.0–1.0 dùng để rank kết quả.                       |
| **Boost**           | Tăng % vào Final Score khi đáp ứng tiêu chí dương.                |
| **Penalty**         | Giảm % vào Final Score khi vi phạm rule.                          |
| **Empty state**     | Trạng thái UI khi không có dữ liệu để hiển thị.                   |
| **Explainability**  | Khả năng giải thích lý do hệ thống gợi ý / xếp hạng listing.       |

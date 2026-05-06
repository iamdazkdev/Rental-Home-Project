# Kế Hoạch Tối Ưu Hóa Kiến Trúc Frontend (Client)

**Tên Dự Án:** Rental Home Project  
**Ngày Review:** 06/05/2026  
**Trạng Thái:** 📝 Đề xuất (Proposed)  
**Người Lập Kế Hoạch:** Dazk Dev
**Mô Đun:** React Client (Front-end)  

---

## 🎯 Mục Tiêu Tổng Quan

Dựa trên kết quả review mã nguồn Client, kế hoạch này nhằm giải quyết các điểm thắt cổ chai về hiệu năng, cải thiện trải nghiệm người dùng (UX) và chuẩn hóa cấu trúc State Management / Routing để dễ bảo trì, mở rộng trong tương lai.

Các phase được sắp xếp theo mức độ rủi ro từ thấp đến cao để đảm bảo không làm gián đoạn các luồng nghiệp vụ hiện tại.

---

## 📅 Kế Hoạch Chi Tiết (Action Plan)

### Phase 1: Dọn dẹp & Tổ chức lại Cấu trúc Thư mục (Quick Wins & Low Risk)

**Mục tiêu:** Làm sạch thư mục `src/components`, giúp dự án gọn gàng và phân vùng Component theo miền (domain) rõ ràng.

- **Bước 1.1:** Tạo thư mục `src/components/ui` để chứa các UI Component dùng chung (ví dụ: `Button`, `Input`, `ModalWrapper`, `Loader`).
- **Bước 1.2:** Phân bổ các component hiện đang nằm rời rạc ở root `components/` về đúng thư mục chức năng:
  - `CheckoutModal.jsx`, `RecordPaymentModal.jsx`, `CashPaymentConfirmModal.jsx` ➡️ `src/components/payment/`
  - `BookingWidget.jsx`, `BookingLockIndicator.jsx`, `BookingSuccessModal.jsx` ➡️ `src/components/booking/`
  - `ListingCard.jsx`, `ListingLockedMessage.jsx` ➡️ `src/components/listing/`
- **Bước 1.3:** Rà soát và cập nhật lại toàn bộ đường dẫn import (`import paths`) bị ảnh hưởng trên toàn dự án.
- **Thời gian dự kiến:** 1 - 2 ngày làm việc.

---

### Phase 2: Cải thiện UX với Skeleton Loaders (Medium Effort - High Visual Impact)

**Mục tiêu:** Nâng cấp trải nghiệm tải trang. Thay thế màn hình Loading truyền thống (`<PageLoader>`) bằng các giao diện dạng khung xương (Skeleton) mượt mà hơn khi dùng React.lazy và Suspense.

- **Bước 2.1:** Thiết kế các Skeleton Component dùng Material UI (`<Skeleton>`) hoặc CSS thuần:
  - `ListingCardSkeleton` (cho danh sách phòng)
  - `FormSkeleton` (cho các form đăng ký/đặt phòng)
  - `DetailSkeleton` (cho trang chi tiết phòng)
- **Bước 2.2:** Tại `App.js`, gỡ bỏ thẻ `<Suspense>` bao bọc ở ngoài cùng của toàn bộ `<Routes>`. Thay vào đó, áp dụng `<Suspense>` cục bộ cho từng nhóm Route.
- **Bước 2.3:** Truyền Skeleton tương ứng làm `fallback` cho mỗi page bị lazy load.
- **Thời gian dự kiến:** 2 - 3 ngày làm việc.

---

### Phase 3: Tái cấu trúc State Management (High Effort - Core Architecture)

**Mục tiêu:** Phân định rõ ràng trách nhiệm của Redux Toolkit, Zustand và React Context API. Hạn chế sử dụng lạm dụng quá nhiều công cụ để quản lý state gây chồng chéo.

- **Bước 3.1: Kiểm tra State hiện hành (State Audit):** Rà soát các Redux slice và Zustand store hiện có.
- **Bước 3.2: Quy hoạch chuẩn (Standardization):**
  - **Redux Toolkit:** Chỉ dùng làm Global State lớn (như Auth State, User Profile, App Config) và cho các API Cache (RTK Query nếu dùng).
  - **Zustand:** Chỉ quản lý state cục bộ cho UI / luồng phức tạp nhưng không cần lưu toàn cầu (ví dụ: Form nhiều bước tạo Listing, Filter nâng cao của chức năng Tìm kiếm).
  - **Context API:** Chỉ giữ lại cho các cấu hình như `SocketProvider`, `ThemeProvider`.
- **Bước 3.3:** Refactor dần các UI Component đang lưu trữ state tạm thời trên Redux sang dùng Zustand hoặc Local State `useState`.
- **Thời gian dự kiến:** 1 tuần làm việc. *Yêu cầu: Viết Unit Test hoặc Test kỹ lưỡng luồng Đăng nhập, Thanh toán.*

---

### Phase 4: Chuyển đổi React Router sang Data API (High Risk & High Reward)

**Mục tiêu:** Cập nhật kỹ thuật định tuyến (Routing) sang chuẩn `React Router v6.4+` để tận dụng Data Fetching (Loader) và Data Mutations (Action), giải quyết hiện tượng giật màn hình khi tải dữ liệu.

- **Bước 4.1:** Chuyển đổi `<BrowserRouter>` và thẻ `<Routes>` cổ điển sang object-based router dùng hàm `createBrowserRouter`.
- **Bước 4.2:** Bóc tách logic gọi API (Fetch API) từ các hook `useEffect` trên các trang sang hàm `loader` của React Router. (Giúp tải data song song với lúc render page).
- **Bước 4.3:** Đưa các xử lý logic submit form sang hàm `action` của React Router. Áp dụng hook `useNavigation` để hiển thị trạng thái loading chung.
- **Bước 4.4:** Thiết lập `errorElement` (Trang lỗi cục bộ) cho các Route, tránh trường hợp 1 Component lỗi làm sập toàn ứng dụng.
- **Thời gian dự kiến:** 1 - 2 tuần làm việc. Nên làm theo phương pháp dần dần, áp dụng cho tính năng Admin hoặc Roommate mới trước, sau đó tới các tính năng cũ.

---

## 📝 Tổng kết & Đề xuất

Khuyến nghị áp dụng chiến lược **"Refactor as you go"** (Làm đến đâu tối ưu đến đó).

- Bắt đầu thực thi ngay **Phase 1** để lấy đà vì rất nhanh và dễ kiểm soát rủi ro.
- **Phase 4** là quan trọng nhất về kiến trúc nhưng cần được làm cẩn thận và cuốn chiếu từng phân hệ.

# Kế Hoạch Tối Ưu Hóa Kiến Trúc Frontend (Client)

**Tên Dự Án:** Rental Home Project  
**Ngày Review:** 07/05/2026  
**Trạng Thái:** 🔄 Đang tiến hành (In Progress)  
**Người Lập Kế Hoạch:** Dazk Dev  
**Mô Đun:** React Client (Front-end)

---

## 🎯 Mục Tiêu Tổng Quan

Dựa trên kết quả review toàn bộ mã nguồn Client (127 file JS/JSX), kế hoạch này giải quyết các điểm thắt cổ chai về hiệu năng, các vấn đề bảo mật, cải thiện UX, và chuẩn hóa cấu trúc State Management / Routing để dễ bảo trì và mở rộng trong tương lai.

Các phase được sắp xếp theo mức độ rủi ro từ thấp đến cao.

---

## 🚨 Báo Cáo Issues Phát Hiện (Audit Report — 07/05/2026)

### Critical

| # | Issue | File | Tác động |
|---|-------|------|----------|
| C1 | Không có Error Boundary nào | `App.js` | Một component lỗi làm sập toàn bộ app |
| C2 | Token lưu plaintext trong localStorage | `redux/state.js`, `services/api.js` | Dễ bị XSS đánh cắp token |
| C3 | Component `CreateListing.jsx` 1445 dòng | `pages/host/CreateListing.jsx` | Hiệu năng cực tệ, không thể maintain |

### High

| # | Issue | File | Tác động |
|---|-------|------|----------|
| H1 | Token lưu kép: Redux + localStorage | `pages/auth/LoginPage.jsx` | Có thể dẫn đến stale token, state không đồng bộ |
| H2 | User ID field không nhất quán (`_id` vs `id`) | 50+ file | Bug logic khi so sánh ID người dùng |
| H3 | Form `CreateListing` không có validation nào | `pages/host/CreateListing.jsx` | Gửi data rác lên API |
| H4 | Mixed fetch/axios — một số file dùng `fetch()`, số khác dùng `axios` | `services/` | Không đi qua interceptor, bỏ qua auth logic |
| H5 | Canvas placeholder trong `MessagesPage` re-generate mỗi lần render | `pages/messages/MessagesPage.jsx` | Memory leak, perf drop |
| H6 | Navbar poll unread count mỗi 30s bằng HTTP | `components/layout/Navbar.jsx` | Lãng phí request; đã có WebSocket |

### Medium

| # | Issue | File | Tác động |
|---|-------|------|----------|
| M1 | 344+ `console.log` (Đang giữ lại cho Developing, dọn trước Release) | Khắp nơi | Code smell, rò rỉ thông tin nội bộ trên Prod |
| M2 | Không có route 404 | `App.js` | User gặp trang trắng khi nhập URL sai |
| M3 | `NotificationDropdown` xuất hiện ở 2 nơi | `components/common/` và `components/layout/` | Confusing, tổ chức không rõ ràng |
| M4 | `NotificationDropdown` truy cập `localStorage` trực tiếp thay vì Redux | `components/common/NotificationDropdown.jsx` | Bypass state management |
| M5 | Redux `user` slice gộp cả auth + user data + danh sách | `redux/state.js` | Slice quá nặng, khó test |
| M6 | Không có cơ chế refresh token | `services/api.js` | Token hết hạn buộc user login lại |
| M7 | Không có loading state prevention khi submit form | Các form (Login, Register) | Có thể double-submit |
| M8 | Không có React.memo trên bất kỳ component nào | Toàn bộ `components/` | Re-render không cần thiết |
| M9 | Không có thư viện form validation (react-hook-form, Formik, Zod) | `pages/auth/` | Validation thủ công, dễ sót case |

### Low

| # | Issue | File | Tác động |
|---|-------|------|----------|
| L1 | Thiếu test: Chỉ có 1 test file duy nhất | `components/search/SearchWidget.test.jsx` | Không có safety net khi refactor |
| L2 | `CheckoutModal` trùng tên ở cả `components/booking/` và `components/payment/` | Cả hai thư mục | Nhầm lẫn import |
| L3 | Không có redirect về trang gốc sau khi login thành công | `components/guards/ProtectedRoute.jsx` | UX kém — luôn về Home sau login |

---

## 📅 Kế Hoạch Chi Tiết (Action Plan)

### Phase 0: Hotfix ngay — Critical Issues (No Delay)

**Mục tiêu:** Vá các lỗ hổng nghiêm trọng nhất trước khi làm bất kỳ refactor nào.

- **Bước 0.1 — Error Boundary:**
  - Tạo `src/components/common/ErrorBoundary.jsx`
  - Wrap toàn bộ `<Routes>` trong `App.js` bằng `<ErrorBoundary>`
  - Hiển thị UI fallback thân thiện thay vì crash trắng màn hình

- **Bước 0.2 — [HOÃN LẠI] Xử lý `console.log`:**
  - *Ghi chú:* Giữ lại toàn bộ `console.log` vì dự án đang trong giai đoạn Developing.
  - Việc dọn dẹp hoặc cấu hình tự động ẩn log sẽ được đẩy xuống làm ở bước cuối cùng trước khi build lên Production.

- **Bước 0.3 — Route 404:**
  - Thêm route `path="*"` vào `App.js` trỏ tới `NotFoundPage.jsx`

- **Thời gian dự kiến:** 0.5 ngày.

---

### Phase 1: Dọn dẹp & Tổ chức lại Cấu trúc Thư mục (Quick Wins — Low Risk)

**Mục tiêu:** Làm sạch thư mục `src/components`, phân vùng theo domain rõ ràng, xóa trùng lặp.

- **Bước 1.1 — Tạo thư mục `src/components/ui`** để chứa UI dùng chung:
  - `Button`, `Input`, `ModalWrapper`, `Loader`, `Skeleton` variants

- **Bước 1.2 — Phân bổ component về đúng domain:**
  - `CheckoutModal.jsx`, `RecordPaymentModal.jsx`, `CashPaymentConfirmModal.jsx` ➡️ `src/components/payment/` (xóa bản trùng trong `booking/`)
  - `BookingWidget.jsx`, `BookingLockIndicator.jsx`, `BookingSuccessModal.jsx` ➡️ `src/components/booking/`
  - `ListingCard.jsx`, `ListingLockedMessage.jsx` ➡️ `src/components/listing/`

- **Bước 1.3 — Xử lý `NotificationDropdown` trùng lặp:**
  - Giữ lại duy nhất bản ở `components/common/NotificationDropdown.jsx`
  - Xóa bản wrapper ở `components/layout/`
  - Cập nhật import

- **Bước 1.4 — Cập nhật tất cả import paths** bị ảnh hưởng.

- **Thời gian dự kiến:** 1 - 2 ngày.

---

### Phase 2: Sửa lỗi Logic & Nhất quán hóa Code (Medium Effort — High Value)

**Mục tiêu:** Giải quyết H1, H2, H4, M4, M7, M9 — các lỗi làm phát sinh bug runtime.

- **Bước 2.1 — Chuẩn hóa User ID (`_id` vs `id`):**
  - Quy định thống nhất dùng `user._id` (MongoDB default)
  - Tìm + sửa toàn bộ nơi dùng `user.id` nhằm loại bỏ dual-check

- **Bước 2.2 — Gộp token storage về 1 nơi (Redux only):**
  - Xóa `localStorage.setItem('token', ...)` trực tiếp
  - `services/api.js` chỉ lấy token từ Redux store (đã có interceptor đúng)
  - Sửa `NotificationDropdown` đọc từ Redux thay vì `localStorage`

- **Bước 2.3 — Chuyển toàn bộ `fetch()` sang `axios` instance:**
  - Đảm bảo mọi API call đều đi qua interceptor (auth header + 401 handling)
  - Tìm: `grep -r "fetch(" src/ --include="*.js" --include="*.jsx"`

- **Bước 2.4 — Thêm `disabled` / loading state khi submit form:**
  - `LoginPage.jsx`, `RegisterPage.jsx`: disable button khi đang submit
  - Dùng `isLoading` state + set `true` khi gọi API, `false` khi xong

- **Bước 2.5 — Sửa redirect sau login:**
  - `ProtectedRoute.jsx`: truyền `state={{ from: location }}` vào `<Navigate>`
  - `LoginPage.jsx`: đọc `location.state?.from` và navigate về đó sau khi login

- **Bước 2.6 — Fix Navbar polling → WebSocket:**
  - Xóa `setInterval` poll 30s trong `Navbar.jsx`
  - Lắng nghe event Socket.io `notification:new` để update unread count

- **Bước 2.7 — Fix Canvas placeholder trong MessagesPage:**
  - Chuyển canvas placeholder generation ra ngoài render, dùng `useMemo`

- **Thời gian dự kiến:** 3 - 4 ngày.

---

### Phase 3: Cải thiện UX với Skeleton Loaders (Medium Effort — High Visual Impact)

**Mục tiêu:** Thay `<PageLoader>` toàn app bằng Skeleton cục bộ trên từng nhóm route.

- **Bước 3.1 — Tạo Skeleton Components (MUI `<Skeleton>`):**
  - `ListingCardSkeleton.jsx`
  - `FormSkeleton.jsx`
  - `DetailPageSkeleton.jsx`

- **Bước 3.2 — Refactor `App.js`:**
  - Gỡ bỏ `<Suspense>` bọc toàn bộ `<Routes>`
  - Áp dụng `<Suspense fallback={<SkeletonXyz />}>` cục bộ cho từng nhóm route
  - Giữ nguyên `React.lazy()` ở các page

- **Thời gian dự kiến:** 2 - 3 ngày.

---

### Phase 4: Tái cấu trúc State Management (High Effort — Core Architecture)

**Mục tiêu:** Phân định rõ Redux, Zustand, Context. Giải quyết M5.

- **Bước 4.1 — Tách Redux `user` slice:**
  - Slice `authSlice`: chỉ lưu `token`, `isAuthenticated`
  - Slice `userSlice`: lưu `user` profile data
  - Slice `listingsSlice`: lưu `tripList`, `wishList`, `propertyList`, `reservationList`
  - Thêm `loading` + `error` state cho mỗi async action

- **Bước 4.2 — Quy hoạch chuẩn state:**
  - **Redux Toolkit:** Auth, User Profile, App Config
  - **Zustand:** UI state (filters, modals, multi-step form state như `CreateListing`)
  - **Context API:** `SocketProvider`, `ThemeProvider` (giữ nguyên)

- **Bước 4.3 — Refactor `CreateListing.jsx` sang Zustand store:**
  - Tạo `stores/useCreateListingStore.js` cho state của form tạo listing
  - Không cần persist, clear store khi unmount

- **Thời gian dự kiến:** 1 tuần. Yêu cầu: Test kỹ luồng Login, Booking, Checkout.

---

### Phase 5: Tách `CreateListing.jsx` & Thêm Form Validation (Done)

**Mục tiêu:** Giải quyết C3, H3 — component quái và không có validation.

- [x] **Bước 5.1 — Cài react-hook-form:**
  - `npm install react-hook-form @hookform/resolvers zod`

- [x] **Bước 5.2 — Tách `CreateListing.jsx` (1445 dòng) thành sub-components:**
  - `CreateListingPhotoUpload.jsx` — drag-drop ảnh, preview
  - `CreateListingDescriptionForm.jsx` — title, description, category
  - `CreateListingLocationForm.jsx` — địa chỉ, map
  - `CreateListingAmenitiesSelector.jsx` — tiện ích
  - `CreateListingPricing.jsx` — giá, chính sách hủy
  - `CreateListing.jsx` — orchestrator, điều phối các sub-components

- [x] **Bước 5.3 — Thêm Zod schema validation cho từng step.**

- [x] **Bước 5.4 — Áp dụng react-hook-form cho `LoginPage`, `RegisterPage`.**

- **Thời gian dự kiến:** 1 - 1.5 tuần.

---

### Phase 6: Performance Optimization (Done)

**Mục tiêu:** Giải quyết M8 — thiếu memoization.

- [x] **Bước 6.1 — Áp dụng `React.memo` có chọn lọc:**
  - Áp dụng cho `ListingCard` để tránh re-render không cần thiết.

- [x] **Bước 6.2 — `useCallback` / `useMemo` cho heavy computations:**
  - Wrap logic filter mảng lớn bằng `useMemo` trong `Listing.jsx` và `MyRooms.jsx`.

- [x] **Bước 6.3 — Lazy load heavy modals:**
  - Cải thiện `TripList.jsx` với việc lazy load `ExtendStayModal`, `CheckoutModal`, `CancelBookingModal` sử dụng `Suspense`.

- **Thời gian dự kiến:** 3 - 5 ngày (kết hợp khi làm các phase trên).

---

### Phase 7: Chuyển đổi React Router sang Data API (High Risk — Deferred)

**Mục tiêu:** Upgrade sang `createBrowserRouter` + Loaders/Actions (React Router v6.4+).

> ⚠️ **Chỉ làm sau khi Phase 1-5 đã ổn định.** Đây là thay đổi kiến trúc lớn, làm cuốn chiếu từng feature.

- **Bước 7.1:** Chuyển `<BrowserRouter>` sang `createBrowserRouter`.
- **Bước 7.2:** Bóc tách `useEffect` + API call sang `loader` functions.
- **Bước 7.3:** Submit form logic sang `action` functions.
- **Bước 7.4:** Thêm `errorElement` cho mỗi route thay thế Error Boundary global.
- **Bắt đầu từ:** Feature `admin/` hoặc `roommate/` (ít traffic nhất, ít rủi ro nhất).
- **Thời gian dự kiến:** 2 - 3 tuần (cuốn chiếu).

---

## 📊 Tóm Tắt Theo Category

| Category | Điểm Hiện Tại | Mục Tiêu | Phase Xử Lý |
|----------|--------------|----------|-------------|
| Kiến trúc | ⚠️ Fair | ✅ Good | Phase 1, 4, 5 |
| State Management | ⚠️ Fair | ✅ Good | Phase 4 |
| API Layer | ⚠️ Fair | ✅ Good | Phase 2 |
| Hiệu năng | ❌ Poor | ✅ Good | Phase 3, 6 |
| Bảo mật | ❌ Poor | ✅ Good | Phase 0, 2 |
| Code Quality | ⚠️ Fair | ✅ Good | Phase 0, 1, 5 |
| Routing | ✅ Good | ✅ Good | Phase 7 (later) |
| Auth Flow | ⚠️ Fair | ✅ Good | Phase 2, 4 |
| Forms | ❌ Poor | ✅ Good | Phase 5 |
| Naming | ✅ Good | ✅ Good | Phase 2 (ID chuẩn hóa) |

---

## 📝 Tổng kết & Đề xuất

Chiến lược: **"Patch Critical → Clean → Refactor → Optimize"**

| Ưu tiên | Phase | Thời gian | Trạng thái | Ghi chú |
|---------|-------|-----------|------------|---------|
| 🔴 Ngay | Phase 0 | 0.5 ngày | ✅ Đã xong | Error boundary, 404 route |
| 🟠 Sớm | Phase 1 | 1-2 ngày | ✅ Đã xong | Dọn thư mục, xóa trùng lặp |
| 🟠 Sớm | Phase 2 | 3-4 ngày | ✅ Đã xong | Fix logic bugs, chuẩn hóa API layer |
| 🟡 Normal | Phase 3 | 2-3 ngày | ✅ Đã xong | Skeleton UX |
| 🟡 Normal | Phase 4 | 1 tuần | ✅ Đã xong | State management refactor |
| 🟡 Normal | Phase 5 | 1-1.5 tuần | ⏳ Chờ xử lý | Split CreateListing + form validation |
| 🟢 Ongoing | Phase 6 | Kết hợp | 🔄 Đang làm | Performance memoization (Đã áp dụng useCallback & Lazy load) |
| 🔵 Deferred | Phase 7 | 2-3 tuần | ⏳ Chờ xử lý | Router upgrade — sau khi app ổn |

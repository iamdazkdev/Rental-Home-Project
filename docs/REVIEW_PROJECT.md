# Kế Hoạch Tái Cấu Trúc (Refactoring Plan) cho Rental Home Project

Kế hoạch này nhằm giải quyết các vấn đề về kiến trúc (code smells) đã được phát hiện trong quá trình code review, bao gồm chia nhỏ các "God files", làm sạch các file tạm rác, và loại bỏ `console.log` để dự án gọn gàng, an toàn và dễ bảo trì hơn.

## 🔍 Báo Cáo Kiểm Tra Source Code (Background Context)

Dựa trên quá trình quét và phân tích kiến trúc dự án **Rental Home Project**, dưới đây là những điểm cốt lõi cần được cải thiện:

### 1. 🚨 Component/File Khổng Lồ (God Objects / God Files)
Có những file chứa quá nhiều dòng code và gánh vác quá nhiều trách nhiệm. Điều này vi phạm nguyên tắc **Single Responsibility Principle (SRP)**.

- **`client/src/pages/host/CreateListing.jsx` (1451 dòng code):** Xử lý toàn bộ logic UI, state form, validate, kéo thả ảnh (Drag and Drop), và gọi API. 
- **`server/routes/roomRental.js` (1629 dòng code):** Xử lý toàn bộ logic CRUD, query, bảo mật, phân trang và cloudinary.
- **`server/routes/roommate.js` (1039 dòng code)** và **`server/services/bookingService.js` (940 dòng code)** cũng nằm trong tình trạng tương tự.

### 2. 🗑 Code Dư Thừa và File Chuyển Tiếp Tạm Thời
- **`client/src/components/Navbar.jsx`:** File chỉ chứa 2 dòng code để re-export.
- **TODO Comments bị bỏ quên:** Trong `server/services/notificationService.js` có nhiều comment giả lập việc gửi email.

### 3. 🐛 Để Lọt Quá Nhiều `console.log` Trong Code Thực Tế
Sau khi quét, phát hiện gần 50 vị trí vẫn còn chứa `console.log()`. Để lại log trên Production gây rác terminal và rò rỉ dữ liệu.

### 4. 🗄 Một Vài Vấn Đề Về Logic Component
- **Thiết kế API Route "Nặng":** Việc nhồi nhét upload hình ảnh (Cloudinary multer upload) với validate request chung trong Route file làm cho test unit rất khó.

---

## User Review Required

> [!IMPORTANT]  
> Quá trình refactor `CreateListing.jsx` và `roomRental.js` sẽ thay đổi mạnh cấu trúc file nhưng KHÔNG làm thay đổi logic (behavior) của tính năng. Tuy nhiên, xin bạn xác nhận rằng hiện tại không có ai (người dùng khác hay chính bạn) đang triển khai viết code mới trực tiếp lên 2 file này, để tránh xung đột mã nguồn (merge conflicts) sau khi tôi làm xong!

---

## Proposed Changes

### 1. Refactor: Tách Nhỏ Component Frontend `CreateListing.jsx`
*Khu vực:* `client/src/pages/host/`

`CreateListing.jsx` (1450+ dòng) sẽ được tách ra thành một bộ form nhiều bước (Wizard/Stepper) hoặc các component quản lý section riêng biệt.

#### [MODIFY] [CreateListing.jsx](file:///Users/iamdazkdev/Data/SourceCode/Visual%20Studio%20Code/Rental%20Home%20Project/client/src/pages/host/CreateListing.jsx)
- Cắt code: Chuyển toàn bộ các phần nhập `Location`, `Basic Details` (Số phòng, người), `Photos`, `Description`, `Host Profile` ra các file component con mới.
- Component chính chỉ lo giữ state tổng, handle submit gọi API và logic chuyển đổi qua lại giữa các view form.

#### [NEW] [CreateListingLocation.jsx](file:///Users/iamdazkdev/Data/SourceCode/Visual%20Studio%20Code/Rental%20Home%20Project/client/src/pages/host/components/CreateListingLocation.jsx)
#### [NEW] [CreateListingPhotos.jsx](file:///Users/iamdazkdev/Data/SourceCode/Visual%20Studio%20Code/Rental%20Home%20Project/client/src/pages/host/components/CreateListingPhotos.jsx)
#### [NEW] [CreateListingPricing.jsx](file:///Users/iamdazkdev/Data/SourceCode/Visual%20Studio%20Code/Rental%20Home%20Project/client/src/pages/host/components/CreateListingPricing.jsx)

---

### 2. Refactor: Tổ Chức Lại Backend Route `roomRental.js`
*Khu vực:* `server/`

Thực hiện tách kiến trúc MVC (Model - View - Controller). Chuyển logic rườm rà ra khỏi file routes.

#### [MODIFY] [roomRental.js](file:///Users/iamdazkdev/Data/SourceCode/Visual%20Studio%20Code/Rental%20Home%20Project/server/routes/roomRental.js)
- Chỉ giữ lại khai báo router (vd: `router.post('/rooms/create', controller.createRoom)`), xóa file logic nghiệp vụ khỏi file này.

#### [NEW] [roomRentalController.js](file:///Users/iamdazkdev/Data/SourceCode/Visual%20Studio%20Code/Rental%20Home%20Project/server/controllers/roomRentalController.js)
- Chứa logic nhận HTTP Request, gọi qua Data Service và trả HTTP Response.

#### [NEW] [roomRentalService.js](file:///Users/iamdazkdev/Data/SourceCode/Visual%20Studio%20Code/Rental%20Home%20Project/server/services/roomRentalService.js)
- (Nếu phần `server/services/roomRentalValidation.js` chưa đủ) Tạo service xử lý database (CRUD), logic giá, logic tìm kiếm.

---

### 3. Dọn Dẹp File Dư Thừa Tại Client
*Khu vực:* `client/src/components/`

Rất nhiều file gốc đang chứa duy nhất 1 dòng code trỏ về thư mục con (VD: `export { default } from "./layout/Navbar";`). Ta sẽ xóa chúng và sửa lại đường dẫn ở những nơi đang import.

#### [DELETE] [Navbar.jsx](file:///Users/iamdazkdev/Data/SourceCode/Visual%20Studio%20Code/Rental%20Home%20Project/client/src/components/Navbar.jsx)
#### [DELETE] Các file wrapper chuyển tiếp khác trong `src/components/`
- Tôi sẽ chạy lệnh quét và xóa các file `<ComponentName>.jsx` chỉ có tính chất re-export.
- Sửa lại các đường dẫn tại tất cả màn hình (pages) tương ứng.

---

### 4. Xóa Console.log An Toàn
*Khu vực:* Toàn Server & Toàn Client

- Tự động chạy lệnh quét loại bỏ hơn 50 vị trí của `console.log()` trừ các `console.error` cần thiết để báo lỗi.

---

## Open Questions

> [!WARNING]  
> 1. Bạn có muốn tự động triển khai (automating release) hay sau khi thay đổi xong, bạn muốn tự mình deploy lên các môi trường (như Vercel hoặc Railway) để test thủ công?
> 2. Có tính năng nào trong `CreateListing.jsx` bạn nghĩ nên gỡ hẳn (như Roommate matching tạm thời disabled) để logic càng gọn hơn không?

## Verification Plan

### Automated Tests
- Chạy npm build (front-end) để đảm bảo không gãy react build do sai đường dẫn import.
- Chạy node (backend) để đảm bảo không crash ứng dụng.

### Manual Verification
- Bạn sẽ duyệt lại `git diff` và truy cập thử trang `http://localhost:3000/create-listing` dưới máy cục bộ của bạn để kiểm tra tính luân chuyển mượt mà của form.

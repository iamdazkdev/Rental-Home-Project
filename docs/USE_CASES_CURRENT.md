# TÀI LIỆU ĐẶC TẢ USE CASES - HỆ THỐNG RENTAL HOME

**Dự án:** Rental Home - Multi-Process Rental Platform  
**Ngày:** December 30, 2025  
**Phiên bản:** 2.0 (Updated)

---

## TỔNG QUAN HỆ THỐNG

Hệ thống Rental Home là nền tảng **đa quy trình** với **3 PROCESS RIÊNG BIỆT**:

1. **Process 1: Entire Place Rental** - Cho thuê toàn bộ căn hộ/nhà (Airbnb-like)
2. **Process 2: Room Rental** - Cho thuê phòng trong nhà chung
3. **Process 3: Roommate Matching** - Tìm bạn cùng phòng

---

## DANH MỤC USE CASES

### 1. Authentication & User Management (UC01 - UC05)
- UC01: Đăng ký
- UC02: Đăng nhập  
- UC03: Quên mật khẩu
- UC04: Đặt lại mật khẩu
- UC05: Đăng xuất

### 2. Identity Verification (UC06 - UC08)
- UC06: Xác thực danh tính (User)
- UC07: Quản lý xác thực danh tính (Admin)
- UC08: Cập nhật xác thực danh tính

### 3. PROCESS 1 - Entire Place Rental (UC10 - UC22)
- UC10: Tạo listing Entire Place
- UC11: Chỉnh sửa listing
- UC12: Ẩn/Hiện listing
- UC13: Tìm kiếm Entire Place
- UC14: Xem chi tiết Entire Place
- UC15: Đặt phòng với BookingIntent
- UC16: Thanh toán VNPay (Full/Deposit)
- UC17: Thanh toán Cash
- UC18: Host chấp nhận/từ chối booking
- UC19: Guest check-in
- UC20: Guest check-out
- UC21: Hủy đặt phòng
- UC22: Xem lịch sử booking

### 4. PROCESS 2 - Room Rental (UC30 - UC42)
- UC30: Tạo listing Room
- UC31: Tìm kiếm Room
- UC32: Xem chi tiết Room
- UC33: Gửi yêu cầu thuê phòng
- UC34: Host xem yêu cầu thuê
- UC35: Host chấp nhận/từ chối yêu cầu
- UC36: Tạo Agreement
- UC37: Tenant ký Agreement
- UC38: Host ký Agreement
- UC39: Quản lý thanh toán hàng tháng
- UC40: Move-in xác nhận
- UC41: Kết thúc thuê phòng
- UC42: Xem danh sách thuê

### 5. PROCESS 3 - Roommate Matching (UC50 - UC60)
- UC50: Tạo bài đăng tìm bạn cùng phòng
- UC51: Tìm kiếm bài đăng Roommate
- UC52: Xem chi tiết bài đăng
- UC53: Gửi yêu cầu kết nối
- UC54: Chấp nhận/Từ chối yêu cầu
- UC55: Tạo Match
- UC56: Chat với roommate
- UC57: Chỉnh sửa bài đăng
- UC58: Đóng bài đăng
- UC59: Xem yêu cầu đã gửi
- UC60: Xem yêu cầu nhận được

### 6. Messaging & Communication (UC70 - UC73)
- UC70: Gửi tin nhắn
- UC71: Xem danh sách hội thoại
- UC72: Xem lịch sử tin nhắn
- UC73: Liên hệ Host

### 7. Reviews & Wishlist (UC80 - UC83)
- UC80: Viết đánh giá
- UC81: Xem đánh giá
- UC82: Thêm vào Wishlist
- UC83: Xóa khỏi Wishlist

### 8. Admin Management (UC90 - UC95)
- UC90: Xem Admin Dashboard
- UC91: Quản lý Users
- UC92: Quản lý Listings
- UC93: Quản lý Identity Verification
- UC94: Quản lý Categories
- UC95: Quản lý Facilities

---

## 1. AUTHENTICATION & USER MANAGEMENT

### **UC01: Đăng ký**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC01 |
| **Use Case Name** | Đăng ký |
| **Actor** | Guest |
| **Short Description** | Guest đăng ký để tạo tài khoản sử dụng hệ thống |
| **Pre-Conditions** | - Guest chưa có tài khoản trong hệ thống<br>- Guest truy cập trang đăng ký |
| **Post-Conditions** | - Tài khoản được tạo thành công<br>- User được tự động đăng nhập<br>- User được chuyển đến trang chủ |

**Main Flow:**
1. Guest truy cập `/register`
2. Guest nhập thông tin:
   - First Name
   - Last Name  
   - Email
   - Password
   - Confirm Password
3. Guest upload ảnh đại diện (optional)
4. Guest click "REGISTER"
5. Hệ thống validate thông tin
6. Hệ thống kiểm tra email chưa tồn tại
7. Hệ thống tạo tài khoản mới
8. Hệ thống tự động đăng nhập user
9. Hệ thống chuyển hướng đến `/`

**Alternate Flow(s):**
- **6a. Email đã tồn tại:**
  - 6a.1. Hệ thống hiển thị lỗi "An account with this email already exists"
  - 6a.2. Use case quay lại bước 2
  
- **5b. Password không khớp:**
  - 5b.1. Hệ thống hiển thị cảnh báo "Passwords do not match"
  - 5b.2. Use case quay lại bước 2

- **5c. Email format không đúng:**
  - 5c.1. Hệ thống hiển thị lỗi "Invalid email format"
  - 5c.2. Use case quay lại bước 2

**Exception Flow(s):**
- **3.1. File ảnh không hợp lệ:**
  - 3.1.a. Hệ thống hiển thị "Only image files are allowed"
- **7.1. Server error:**
  - 7.1.a. Hệ thống hiển thị "Failed to create account"

**Notes:**
- Password phải đủ mạnh (tối thiểu 8 ký tự)
- Sau đăng ký, user tự động được đăng nhập (không cần qua trang login)
- Token được lưu vào Redux store

---

### **UC02: Đăng nhập**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC02 |
| **Use Case Name** | Đăng nhập |
| **Actor** | Guest |
| **Short Description** | Guest đăng nhập vào hệ thống |
| **Pre-Conditions** | - Guest đã có tài khoản<br>- Guest chưa đăng nhập |
| **Post-Conditions** | - User được đăng nhập<br>- JWT token được tạo<br>- Socket.IO connection được thiết lập<br>- User được chuyển đến trang chủ (hoặc Admin Dashboard nếu là Admin) |

**Main Flow:**
1. Guest truy cập `/login`
2. Guest nhập Email
3. Guest nhập Password
4. Guest click "LOG IN"
5. Hệ thống validate thông tin
6. Hệ thống xác thực email và password
7. Hệ thống tạo JWT token
8. Hệ thống lưu token và user info vào Redux store
9. Hệ thống thiết lập Socket.IO connection
10. Hệ thống kiểm tra role của user:
    - Nếu Admin → Chuyển đến `/admin`
    - Nếu User → Chuyển đến `/`

**Alternate Flow(s):**
- **6a. Email không tồn tại:**
  - 6a.1. Hệ thống hiển thị "User not found"
  - 6a.2. Use case quay lại bước 2

- **6b. Password sai:**
  - 6b.1. Hệ thống hiển thị "Invalid password"
  - 6b.2. Use case quay lại bước 3

**Exception Flow(s):**
- **9.1. Không thể kết nối Socket:**
  - 9.1.a. Hệ thống vẫn cho phép đăng nhập nhưng real-time features bị disable

**Notes:**
- Admin được redirect tự động đến Admin Dashboard
- Socket connection cho phép real-time messaging

---

### **UC03: Quên mật khẩu**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC03 |
| **Use Case Name** | Quên mật khẩu |
| **Actor** | Guest |
| **Short Description** | Guest yêu cầu reset mật khẩu |
| **Pre-Conditions** | - Guest đã có tài khoản<br>- Guest truy cập trang quên mật khẩu |
| **Post-Conditions** | - Email chứa reset link được gửi<br>- Reset token được tạo và lưu |

**Main Flow:**
1. Guest truy cập `/forgot-password`
2. Guest nhập Email
3. Guest click "SEND RESET LINK"
4. Hệ thống validate email format
5. Hệ thống kiểm tra email tồn tại
6. Hệ thống tạo reset token (hết hạn sau 1 giờ)
7. Hệ thống gửi email chứa reset link
8. Hệ thống hiển thị "Reset link sent to your email"

**Alternate Flow(s):**
- **5a. Email không tồn tại:**
  - 5a.1. Hệ thống hiển thị "No account found with this email"
  - 5a.2. Use case quay lại bước 2

**Exception Flow(s):**
- **7.1. Gửi email thất bại:**
  - 7.1.a. Hệ thống hiển thị "Failed to send email. Please try again."

**Notes:**
- Reset link format: `/reset-password?token=xxx&email=xxx`
- Token hết hạn sau 1 giờ

---

### **UC04: Đặt lại mật khẩu**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC04 |
| **Use Case Name** | Đặt lại mật khẩu |
| **Actor** | Guest |
| **Short Description** | Guest đặt lại mật khẩu mới sau khi nhận email reset |
| **Pre-Conditions** | - Guest đã yêu cầu reset password<br>- Guest có reset token hợp lệ |
| **Post-Conditions** | - Password được cập nhật<br>- Guest được chuyển đến trang đăng nhập |

**Main Flow:**
1. Guest click link reset từ email
2. Hệ thống chuyển đến `/reset-password?token=xxx&email=xxx`
3. Guest nhập Password mới
4. Guest nhập Confirm Password
5. Guest click "RESET PASSWORD"
6. Hệ thống validate thông tin
7. Hệ thống kiểm tra token hợp lệ
8. Hệ thống cập nhật password mới
9. Hệ thống hiển thị "Password reset successfully"
10. Hệ thống chuyển hướng đến `/login`

**Alternate Flow(s):**
- **6a. Password không khớp:**
  - 6a.1. Hệ thống hiển thị cảnh báo "Passwords do not match"
  - 6a.2. Use case quay lại bước 3

- **7a. Token hết hạn:**
  - 7a.1. Hệ thống hiển thị "Reset token expired"
  - 7a.2. Use case kết thúc

- **7b. Token không hợp lệ:**
  - 7b.1. Hệ thống hiển thị "Invalid reset token"
  - 7b.2. Use case kết thúc

**Exception Flow(s):**
- **8.1. Cập nhật thất bại:**
  - 8.1.a. Hệ thống hiển thị "Failed to reset password"

**Notes:**
- Token chỉ có thể sử dụng một lần
- Sau reset, token bị vô hiệu hóa

---

### **UC05: Đăng xuất**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC05 |
| **Use Case Name** | Đăng xuất |
| **Actor** | User, Admin |
| **Short Description** | Actor đăng xuất khỏi hệ thống |
| **Pre-Conditions** | - Actor đang đăng nhập |
| **Post-Conditions** | - Session được xóa<br>- Socket.IO connection bị ngắt<br>- Actor được chuyển đến trang chủ |

**Main Flow:**
1. Actor click vào avatar menu
2. Actor click "Log Out"
3. Hệ thống xóa token khỏi Redux store
4. Hệ thống ngắt Socket.IO connection
5. Hệ thống chuyển hướng đến `/`

**Notes:**
- Token bị xóa hoàn toàn từ client
- Cần đăng nhập lại để sử dụng các tính năng yêu cầu authentication

---

## 2. IDENTITY VERIFICATION

### **UC06: Xác thực danh tính (User)**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC06 |
| **Use Case Name** | Xác thực danh tính |
| **Actor** | User |
| **Short Description** | User cung cấp thông tin xác thực danh tính để sử dụng tính năng Room Rental hoặc Roommate |
| **Pre-Conditions** | - User đã đăng nhập<br>- User chưa có identity verification hoặc đã bị reject |
| **Post-Conditions** | - Thông tin xác thực được lưu<br>- Status = "pending"<br>- Đợi Admin duyệt |

**Main Flow:**
1. User chọn tạo listing type "Room(s)" hoặc "A Shared Room"
2. Hệ thống kiểm tra verification status
3. Hệ thống hiển thị form Identity Verification
4. User nhập thông tin:
   - Họ và tên đầy đủ
   - Số điện thoại
   - Ngày tháng năm sinh
5. User upload ảnh CCCD mặt trước
6. User upload ảnh CCCD mặt sau
7. User click "Submit Verification"
8. Hệ thống validate thông tin
9. Hệ thống upload ảnh lên Cloudinary
10. Hệ thống lưu verification với status = "pending"
11. Hệ thống hiển thị thông báo thành công
12. User đợi Admin duyệt

**Alternate Flow(s):**
- **2a. User đã có verification approved:**
  - 2a.1. Hệ thống cho phép tiếp tục tạo listing

- **2b. User có verification pending:**
  - 2b.1. Hệ thống hiển thị thông tin đang chờ duyệt
  - 2b.2. User không thể submit mới

- **2c. User có verification rejected:**
  - 2c.1. Hệ thống hiển thị lý do reject
  - 2c.2. User có thể submit lại

**Exception Flow(s):**
- **9.1. Upload ảnh thất bại:**
  - 9.1.a. Hệ thống hiển thị "Failed to upload images"

**Notes:**
- Identity Verification là bắt buộc cho Room Rental và Roommate
- Mỗi user chỉ có 1 verification record
- Có thể cập nhật lại nếu bị rejected

---

### **UC07: Quản lý xác thực danh tính (Admin)**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC07 |
| **Use Case Name** | Quản lý xác thực danh tính |
| **Actor** | Admin |
| **Short Description** | Admin xem và duyệt các yêu cầu xác thực danh tính |
| **Pre-Conditions** | - Admin đã đăng nhập<br>- Có yêu cầu xác thực pending |
| **Post-Conditions** | - Verification được approve hoặc reject |

**Main Flow:**
1. Admin truy cập Admin Dashboard
2. Admin click vào tab "Identity Verification"
3. Hệ thống hiển thị danh sách verifications pending
4. Admin click vào một verification để xem chi tiết
5. Admin xem thông tin: tên, SĐT, ngày sinh, ảnh CCCD
6. Admin click "Approve" hoặc "Reject"
   - Nếu Reject: Admin nhập lý do
7. Hệ thống cập nhật status
8. Hệ thống gửi notification cho user
9. Hệ thống hiển thị thông báo thành công

**Alternate Flow(s):**
- **6a. Admin reject:**
  - 6a.1. Dialog yêu cầu nhập rejection reason
  - 6a.2. Admin nhập lý do và confirm
  - 6a.3. Status = "rejected" với rejectionReason

**Notes:**
- Admin có thể filter theo status: pending, approved, rejected
- Rejection reason hiển thị cho user khi họ xem verification status

---

## 3. PROCESS 1 - ENTIRE PLACE RENTAL

### **UC10: Tạo listing Entire Place**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC10 |
| **Use Case Name** | Tạo listing Entire Place |
| **Actor** | User (trở thành Host) |
| **Short Description** | User tạo listing cho thuê toàn bộ căn hộ/nhà |
| **Pre-Conditions** | - User đã đăng nhập<br>- User truy cập trang tạo listing |
| **Post-Conditions** | - Listing được tạo thành công<br>- Listing hiển thị trên trang chủ<br>- User trở thành Host |

**Main Flow:**
1. User click "Become a Host"
2. Hệ thống hiển thị dialog chọn type
3. User chọn "An entire place"
4. Hệ thống chuyển đến form tạo listing
5. User hoàn thành các bước:
   - Step 1: Chọn Category
   - Step 2: Nhập địa chỉ
   - Step 3: Nhập thông tin cơ bản (guests, bedrooms, beds, bathrooms)
   - Step 4: Chọn Facilities
   - Step 5: Upload ảnh (5-10 ảnh)
   - Step 6: Nhập tiêu đề và mô tả
   - Step 7: Nhập giá theo ngày
6. User click "Create Listing"
7. Hệ thống validate thông tin
8. Hệ thống upload ảnh lên Cloudinary
9. Hệ thống tạo listing với type = "An entire place"
10. Hệ thống chuyển hướng đến listing detail

**Alternate Flow(s):**
- **7a. Thiếu thông tin bắt buộc:**
  - 7a.1. Hệ thống highlight các field cần điền
  - 7a.2. Use case quay lại bước tương ứng

**Exception Flow(s):**
- **8.1. Upload ảnh thất bại:**
  - 8.1.a. Hệ thống hiển thị lỗi và cho phép retry

**Notes:**
- Minimum 5 ảnh, maximum 10 ảnh
- Giá theo ngày (daily rate)
- Listing tự động active sau khi tạo

---

### **UC15: Đặt phòng với BookingIntent**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC15 |
| **Use Case Name** | Đặt phòng với BookingIntent |
| **Actor** | User (Guest) |
| **Short Description** | Guest đặt phòng với cơ chế khóa tạm thời để tránh trùng booking |
| **Pre-Conditions** | - User đã đăng nhập<br>- User đang xem chi tiết listing<br>- Ngày đã chọn còn trống |
| **Post-Conditions** | - BookingIntent được tạo (LOCKED)<br>- Listing bị khóa tạm thời cho user này<br>- User được chuyển đến trang thanh toán |

**Main Flow:**
1. Guest chọn ngày check-in và check-out trên Listing Detail
2. Hệ thống tính tổng tiền
3. Guest click "Reserve"
4. Hệ thống kiểm tra availability
5. Hệ thống tạo BookingIntent với status = "locked"
6. Hệ thống set thời gian hết hạn (10 phút)
7. Hệ thống chuyển đến trang Booking Checkout
8. Guest chọn phương thức thanh toán:
   - VNPay Full (100%)
   - VNPay Deposit (30%)
   - Cash

**Alternate Flow(s):**
- **4a. Ngày đã được đặt:**
  - 4a.1. Hệ thống hiển thị "These dates are already booked"
  - 4a.2. Use case quay lại bước 1

- **4b. Ngày đang bị khóa bởi user khác:**
  - 4b.1. Hệ thống hiển thị "Currently being booked by another user"
  - 4b.2. Guest có thể chờ hoặc chọn ngày khác

**Exception Flow(s):**
- **5.1. Tạo BookingIntent thất bại:**
  - 5.1.a. Hệ thống hiển thị lỗi và refresh availability

**Notes:**
- BookingIntent tự động hết hạn sau 10 phút
- Nếu không thanh toán, lock được giải phóng
- Chỉ 1 user có thể lock 1 ngày tại 1 thời điểm

---

### **UC16: Thanh toán VNPay (Full/Deposit)**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC16 |
| **Use Case Name** | Thanh toán VNPay |
| **Actor** | Guest |
| **Short Description** | Guest thanh toán qua VNPay (100% hoặc 30% deposit) |
| **Pre-Conditions** | - Guest đã tạo BookingIntent<br>- Guest đang ở trang checkout |
| **Post-Conditions** | - Payment thành công → Booking được tạo<br>- VNPay Full → Booking auto-approved<br>- VNPay Deposit → Booking pending |

**Main Flow:**
1. Guest chọn "VNPay Full Payment" hoặc "VNPay Deposit (30%)"
2. Guest đồng ý điều khoản
3. Guest click "Pay Now"
4. Hệ thống tạo VNPay payment URL
5. Hệ thống redirect đến VNPay
6. Guest hoàn thành thanh toán trên VNPay
7. VNPay redirect về callback URL
8. Hệ thống verify payment từ VNPay
9. Hệ thống tạo Booking:
   - VNPay Full: bookingStatus = "approved", paymentStatus = "paid"
   - VNPay Deposit: bookingStatus = "pending", paymentStatus = "partially_paid"
10. Hệ thống cập nhật BookingIntent status = "paid"
11. Hệ thống hiển thị Payment Success với thông tin booking

**Alternate Flow(s):**
- **6a. Guest hủy thanh toán:**
  - 6a.1. VNPay redirect về với response code khác 00
  - 6a.2. Hệ thống hiển thị "Payment cancelled"
  - 6a.3. BookingIntent vẫn còn valid để thử lại

- **8a. Payment failed:**
  - 8a.1. Hệ thống hiển thị lỗi thanh toán
  - 8a.2. Guest có thể thử lại

**Exception Flow(s):**
- **7.1. VNPay timeout:**
  - 7.1.a. BookingIntent hết hạn
  - 7.1.b. Listing lock được giải phóng

**Notes:**
- VNPay Full → Auto-approved (không cần Host xác nhận)
- VNPay Deposit 30% → Cần Host approve + Guest trả phần còn lại
- Payment history được ghi nhận

---

### **UC17: Thanh toán Cash**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC17 |
| **Use Case Name** | Thanh toán Cash |
| **Actor** | Guest |
| **Short Description** | Guest chọn thanh toán tiền mặt khi check-in |
| **Pre-Conditions** | - Guest đã tạo BookingIntent<br>- Guest đang ở trang checkout |
| **Post-Conditions** | - Booking được tạo với status = "pending"<br>- paymentStatus = "unpaid"<br>- Host nhận được thông báo |

**Main Flow:**
1. Guest chọn "Cash Payment"
2. Guest đồng ý điều khoản
3. Guest click "Reserve"
4. Hệ thống tạo Booking:
   - bookingStatus = "pending"
   - paymentMethod = "cash"
   - paymentType = "cash"
   - paymentStatus = "unpaid"
5. Hệ thống cập nhật BookingIntent status = "completed"
6. Hệ thống gửi notification cho Host
7. Hệ thống hiển thị Booking Success
8. Hệ thống chuyển về Trip List

**Notes:**
- Cash payment không auto-approve
- Host cần xác nhận booking
- Guest thanh toán khi check-in

---

### **UC18: Host chấp nhận/từ chối booking**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC18 |
| **Use Case Name** | Host chấp nhận/từ chối booking |
| **Actor** | Host |
| **Short Description** | Host review và quyết định chấp nhận hoặc từ chối booking request |
| **Pre-Conditions** | - Host đã đăng nhập<br>- Có booking với status = "pending" |
| **Post-Conditions** | - Booking status = "approved" hoặc "rejected"<br>- Guest nhận notification |

**Main Flow:**
1. Host truy cập Booking Requests
2. Host xem danh sách booking pending
3. Host click vào một booking để xem chi tiết
4. Host xem thông tin: guest, ngày, giá, payment method
5. Host click "Accept" hoặc "Reject"
   - Accept: bookingStatus → "approved"
   - Reject: Host nhập rejection reason, bookingStatus → "rejected"
6. Hệ thống cập nhật booking
7. Hệ thống gửi notification cho Guest
8. Hệ thống hiển thị thông báo thành công

**Alternate Flow(s):**
- **5a. Reject booking:**
  - 5a.1. Hệ thống hiển thị dialog nhập lý do
  - 5a.2. Host nhập rejection reason
  - 5a.3. Hệ thống lưu reason vào booking.rejectionReason

**Notes:**
- VNPay Full payment → auto-approved, không qua bước này
- Deposit và Cash cần Host approve
- Rejection reason hiển thị cho Guest

---

### **UC21: Hủy đặt phòng**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC21 |
| **Use Case Name** | Hủy đặt phòng |
| **Actor** | Guest |
| **Short Description** | Guest hủy booking trước khi check-in |
| **Pre-Conditions** | - Guest đã đăng nhập<br>- Booking status = "pending" hoặc "approved"<br>- Chưa check-in |
| **Post-Conditions** | - Booking status = "cancelled"<br>- Cancellation reason được lưu<br>- Host nhận notification |

**Main Flow:**
1. Guest truy cập Trip List
2. Guest chọn booking muốn hủy
3. Guest click "Cancel Request"
4. Hệ thống hiển thị Cancel Booking Modal
5. Guest nhập lý do hủy (optional)
6. Guest click "Confirm Cancel"
7. Hệ thống cập nhật booking:
   - bookingStatus = "cancelled"
   - cancellationReason = [lý do]
8. Hệ thống gửi notification cho Host
9. Hệ thống hiển thị thông báo thành công

**Alternate Flow(s):**
- **3a. Booking đã check-in:**
  - 3a.1. Nút Cancel không hiển thị
  
- **3b. Booking đã rejected:**
  - 3b.1. Không thể cancel booking đã bị reject

**Notes:**
- Guest có thể hủy bất cứ lúc nào trước check-in
- Refund policy tùy thuộc vào chính sách Host (hiện tại không tự động refund)

---

### **UC33: Gửi yêu cầu thuê phòng**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC33 |
| **Use Case Name** | Gửi yêu cầu thuê phòng |
| **Actor** | Tenant |
| **Short Description** | Tenant gửi yêu cầu thuê phòng cho Host |
| **Pre-Conditions** | - Tenant đã đăng nhập<br>- Tenant đã xác thực danh tính (approved)<br>- Phòng còn trống |
| **Post-Conditions** | - RentalRequest được tạo với status = "REQUESTED"<br>- Host nhận notification |

**Main Flow:**
1. Tenant xem chi tiết phòng
2. Tenant click "Request to Rent"
3. Hệ thống kiểm tra identity verification
4. Hệ thống hiển thị form gửi yêu cầu
5. Tenant nhập:
   - Tin nhắn giới thiệu bản thân (50-1000 ký tự)
   - Ngày dự kiến dọn vào
   - Thời gian ở dự kiến (tháng)
6. Tenant click "Submit Request"
7. Hệ thống validate thông tin
8. Hệ thống tạo RentalRequest
9. Hệ thống gửi notification cho Host
10. Hệ thống hiển thị thông báo thành công

**Alternate Flow(s):**
- **3a. Chưa xác thực danh tính:**
  - 3a.1. Hệ thống hiển thị dialog yêu cầu xác thực
  - 3a.2. Tenant click "Verify My Identity"
  - 3a.3. Chuyển đến form Identity Verification

- **7a. Message quá ngắn (<50 ký tự):**
  - 7a.1. Hệ thống hiển thị "Message must be at least 50 characters"
  - 7a.2. Use case quay lại bước 5

**Exception Flow(s):**
- **8.1. Tạo request thất bại:**
  - 8.1.a. Hệ thống hiển thị lỗi
  - 8.1.b. Tenant có thể thử lại

**Notes:**
- Message là bắt buộc (50-1000 ký tự)
- Tenant cần được Host approve trước khi có Agreement
- Một Tenant chỉ có thể gửi 1 request active cho 1 phòng

---

### **UC34: Host xem yêu cầu thuê**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC34 |
| **Use Case Name** | Host xem yêu cầu thuê |
| **Actor** | Host |
| **Short Description** | Host xem danh sách yêu cầu thuê phòng |
| **Pre-Conditions** | - Host đã đăng nhập<br>- Có RentalRequest với status = "REQUESTED" |
| **Post-Conditions** | - Host xem được thông tin chi tiết yêu cầu |

**Main Flow:**
1. Host truy cập "Room Rental Requests"
2. Hệ thống hiển thị danh sách requests
3. Host click vào một request để xem chi tiết
4. Hệ thống hiển thị thông tin:
   - Thông tin Tenant (tên, ảnh)
   - Message giới thiệu
   - Ngày dự kiến dọn vào
   - Thời gian ở dự kiến
   - Thông tin phòng
5. Host có thể:
   - Chat với Tenant
   - Approve request (UC35)
   - Reject request (UC35)

**Alternate Flow(s):**
- **2a. Không có request nào:**
  - 2a.1. Hệ thống hiển thị "No rental requests yet"

**Notes:**
- Requests được sắp xếp theo thời gian (mới nhất trước)
- Host có thể filter theo status

---

### **UC35: Host chấp nhận/từ chối yêu cầu thuê**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC35 |
| **Use Case Name** | Host chấp nhận/từ chối yêu cầu thuê |
| **Actor** | Host |
| **Short Description** | Host quyết định chấp nhận hoặc từ chối rental request |
| **Pre-Conditions** | - Host đã đăng nhập<br>- RentalRequest status = "REQUESTED" |
| **Post-Conditions** | - Request status = "APPROVED" hoặc "REJECTED"<br>- Nếu approved → RentalAgreement được tạo<br>- Tenant nhận notification |

**Main Flow (Approve):**
1. Host xem chi tiết request (UC34)
2. Host click "Approve"
3. Hệ thống hiển thị confirm dialog
4. Host xác nhận
5. Hệ thống cập nhật request status = "APPROVED"
6. Hệ thống tự động tạo RentalAgreement (UC36)
7. Hệ thống gửi notification cho Tenant
8. Hệ thống hiển thị thông báo thành công

**Main Flow (Reject):**
1. Host xem chi tiết request
2. Host click "Reject"
3. Hệ thống hiển thị dialog nhập lý do
4. Host nhập rejection reason
5. Host click "Confirm Reject"
6. Hệ thống cập nhật request:
   - status = "REJECTED"
   - rejectionReason = [lý do]
7. Hệ thống gửi notification cho Tenant
8. Hệ thống hiển thị thông báo thành công

**Alternate Flow(s):**
- **4a. Host hủy approve:**
  - 4a.1. Host click "Cancel" trong dialog
  - 4a.2. Use case kết thúc

**Notes:**
- Approve → tự động tạo Agreement
- Reject → Tenant có thể gửi request mới
- Rejection reason hiển thị cho Tenant

---

### **UC36: Tạo Agreement**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC36 |
| **Use Case Name** | Tạo Agreement |
| **Actor** | System |
| **Short Description** | Hệ thống tạo Digital Agreement sau khi Host approve request |
| **Pre-Conditions** | - Host đã approve rental request |
| **Post-Conditions** | - RentalAgreement được tạo với status = "DRAFT"<br>- Tenant nhận notification để ký |

**Main Flow:**
1. Host approve rental request (UC35)
2. Hệ thống tự động tạo RentalAgreement:
   - room_id = request.roomId
   - tenant_id = request.tenantId
   - host_id = request.hostId
   - rentAmount = room.monthlyRent
   - depositAmount = rentAmount (1 tháng)
   - paymentMethod = "CASH" (default)
   - noticePeriod = 30 (days)
   - houseRules = room.houseRules
   - status = "DRAFT"
3. Hệ thống gửi notification cho Tenant
4. Agreement hiển thị trong "My Agreements" của cả hai

**Notes:**
- Agreement tự động tạo khi approve
- Cần cả hai bên ký mới active
- Deposit mặc định = 1 tháng rent
- Notice period mặc định = 30 ngày

---

### **UC37: Tenant ký Agreement**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC37 |
| **Use Case Name** | Tenant ký Agreement |
| **Actor** | Tenant |
| **Short Description** | Tenant xem và ký digital agreement |
| **Pre-Conditions** | - Agreement status = "DRAFT"<br>- Tenant chưa ký |
| **Post-Conditions** | - agreedByTenantAt được set<br>- Đợi Host ký |

**Main Flow:**
1. Tenant truy cập "My Agreements"
2. Tenant chọn agreement cần ký
3. Tenant xem chi tiết agreement:
   - Rent amount
   - Deposit amount
   - Payment method
   - Notice period
   - House rules
4. Tenant click "Accept Agreement"
5. Hệ thống hiển thị confirm dialog
6. Tenant xác nhận
7. Hệ thống cập nhật:
   - agreedByTenantAt = now()
8. Nếu Host đã ký → status = "ACTIVE"
9. Hệ thống gửi notification cho Host
10. Hệ thống hiển thị thông báo thành công

**Alternate Flow(s):**
- **8a. Cả hai đã ký:**
  - 8a.1. Hệ thống set status = "ACTIVE"
  - 8a.2. Move-in process bắt đầu

**Notes:**
- Digital signature = timestamp khi click Accept
- Agreement chỉ active khi cả hai đã ký
- Sau khi active, Tenant có thể proceed move-in

---

### **UC38: Host ký Agreement**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC38 |
| **Use Case Name** | Host ký Agreement |
| **Actor** | Host |
| **Short Description** | Host xem và ký digital agreement |
| **Pre-Conditions** | - Agreement status = "DRAFT"<br>- Host chưa ký |
| **Post-Conditions** | - agreedByHostAt được set<br>- Nếu Tenant đã ký → status = "ACTIVE" |

**Main Flow:**
1. Host truy cập "Room Rental Agreements"
2. Host chọn agreement cần ký
3. Host xem chi tiết agreement
4. Host click "Accept Agreement"
5. Hệ thống hiển thị confirm dialog
6. Host xác nhận
7. Hệ thống cập nhật:
   - agreedByHostAt = now()
8. Nếu Tenant đã ký → status = "ACTIVE"
9. Hệ thống gửi notification cho Tenant
10. Hệ thống hiển thị thông báo thành công

**Notes:**
- Tương tự UC37 nhưng cho Host
- Cần cả hai ký mới activate

---

### **UC39: Quản lý thanh toán hàng tháng**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC39 |
| **Use Case Name** | Quản lý thanh toán hàng tháng |
| **Actor** | Tenant, Host |
| **Short Description** | Hệ thống quản lý và tracking payment hàng tháng |
| **Pre-Conditions** | - Agreement status = "ACTIVE"<br>- Rental status = "ACTIVE" |
| **Post-Conditions** | - Monthly payment được ghi nhận |

**Main Flow:**
1. Hệ thống tự động tạo monthly payment record:
   - amount = agreement.rentAmount
   - dueDate = ngày 1 mỗi tháng
   - status = "UNPAID"
2. Hệ thống gửi payment reminder cho Tenant (3 ngày trước due date)
3. Tenant thanh toán:
   - **Option 1:** Chuyển khoản trực tiếp cho Host
   - **Option 2:** Thanh toán qua platform (nếu có)
4. Host xác nhận đã nhận tiền:
   - Host click "Confirm Payment Received"
5. Hệ thống cập nhật payment:
   - status = "PAID"
   - paidAt = now()
   - method = "CASH" hoặc "ONLINE"
6. Hệ thống cập nhật payment history

**Alternate Flow(s):**
- **3a. Tenant thanh toán muộn:**
  - 3a.1. Hệ thống gửi overdue reminder
  - 3a.2. Host có thể xem danh sách overdue
  
- **3b. Tenant không thanh toán:**
  - 3b.1. Sau 30 ngày → Host có thể initiate termination

**Exception Flow(s):**
- **5.1. Host chưa confirm payment:**
  - 5.1.a. Payment vẫn ở status "UNPAID"
  - 5.1.b. Tenant có thể gửi proof of payment

**Notes:**
- Payment history được lưu trong RentalPayment model
- Reminder tự động gửi qua notification
- Platform không giữ tiền (chỉ tracking)

---

### **UC40: Move-in xác nhận**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC40 |
| **Use Case Name** | Move-in xác nhận |
| **Actor** | Tenant, Host |
| **Short Description** | Xác nhận Tenant đã dọn vào phòng |
| **Pre-Conditions** | - Agreement status = "ACTIVE"<br>- Đã đến ngày move-in |
| **Post-Conditions** | - Rental status = "ACTIVE"<br>- Monthly payment cycle bắt đầu |

**Main Flow:**
1. Tenant dọn vào phòng
2. Tenant click "Confirm Move-In" trong app
3. Hệ thống hiển thị confirm dialog
4. Tenant xác nhận
5. Hệ thống cập nhật:
   - rental status = "PENDING_MOVE_IN" → "ACTIVE"
   - moveInConfirmedAt = now()
6. Hệ thống gửi notification cho Host
7. Host xác nhận Tenant đã arrival:
   - Host click "Confirm Tenant Arrival"
8. Hệ thống cập nhật:
   - moveInConfirmedByHostAt = now()
9. Hệ thống bắt đầu monthly payment cycle
10. Hệ thống tạo first monthly payment record

**Alternate Flow(s):**
- **7a. Host chưa confirm:**
  - 7a.1. Rental vẫn ở trạng thái waiting confirmation
  - 7a.2. Payment cycle chưa bắt đầu

**Notes:**
- Cần cả Tenant và Host confirm
- Payment cycle bắt đầu sau move-in confirmation
- First payment thường là deposit + first month rent

---

### **UC41: Kết thúc thuê phòng**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC41 |
| **Use Case Name** | Kết thúc thuê phòng |
| **Actor** | Tenant, Host |
| **Short Description** | Tenant hoặc Host kết thúc hợp đồng thuê |
| **Pre-Conditions** | - Rental status = "ACTIVE"<br>- Đã tuân thủ notice period |
| **Post-Conditions** | - Rental status = "COMPLETED"<br>- Agreement status = "TERMINATED"<br>- Deposit được xử lý |

**Main Flow (Tenant initiate):**
1. Tenant truy cập "My Rentals"
2. Tenant chọn rental đang active
3. Tenant click "Request Termination"
4. Hệ thống hiển thị notice period requirement
5. Tenant chọn ngày move-out dự kiến
6. Tenant nhập lý do (optional)
7. Tenant click "Submit Termination Request"
8. Hệ thống kiểm tra notice period (30 ngày)
9. Hệ thống cập nhật rental status = "TERMINATING"
10. Hệ thống gửi notification cho Host
11. Đến ngày move-out:
    - Tenant confirm move-out
    - Host inspect phòng
12. Host xác nhận:
    - Host click "Confirm Move-Out"
    - Host đánh giá tình trạng phòng
    - Host quyết định refund deposit (full/partial)
13. Hệ thống cập nhật:
    - rental status = "COMPLETED"
    - agreement status = "TERMINATED"
    - depositRefundAmount = [số tiền]
14. Cả hai có thể viết review

**Main Flow (Host initiate):**
1. Host truy cập "Room Rentals"
2. Host chọn rental cần terminate
3. Host click "Terminate Rental"
4. Host nhập lý do terminate
5. Host chọn ngày yêu cầu Tenant move-out
6. Các bước 9-14 tương tự

**Alternate Flow(s):**
- **8a. Notice period không đủ:**
  - 8a.1. Hệ thống hiển thị warning
  - 8a.2. Tenant vẫn có thể submit nhưng có thể mất deposit

- **12a. Phòng bị hư hại:**
  - 12a.1. Host chọn "Partial Refund"
  - 12a.2. Host nhập số tiền khấu trừ và lý do
  - 12a.3. Deposit refund = deposit - deduction

**Exception Flow(s):**
- **12.1. Tranh chấp về deposit:**
  - 12.1.a. Tenant có thể khiếu nại
  - 12.1.b. Admin có thể can thiệp

**Notes:**
- Notice period mặc định = 30 ngày
- Deposit refund tùy thuộc vào tình trạng phòng
- Cả hai bên có thể initiate termination

---

### **UC42: Xem danh sách thuê**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC42 |
| **Use Case Name** | Xem danh sách thuê |
| **Actor** | Tenant, Host |
| **Short Description** | Xem danh sách các rental đang active và history |
| **Pre-Conditions** | - User đã đăng nhập |
| **Post-Conditions** | - User xem được danh sách rentals |

**Main Flow (Tenant):**
1. Tenant click "My Rentals"
2. Hệ thống hiển thị tabs:
   - Active Rentals
   - Past Rentals
3. Tenant chọn tab
4. Hệ thống hiển thị danh sách rentals:
   - Room title, ảnh
   - Host name
   - Rent amount
   - Status
   - Move-in date
5. Tenant click vào một rental để xem chi tiết:
   - Agreement details
   - Payment history
   - Messages với Host
   - Actions (terminate, pay rent, etc.)

**Main Flow (Host):**
1. Host click "Room Rentals"
2. Hệ thống hiển thị tabs:
   - Active Rentals
   - Past Rentals
3. Host chọn tab
4. Hệ thống hiển thị danh sách với filter:
   - By property
   - By status
5. Host xem chi tiết từng rental:
   - Tenant info
   - Payment status
   - Agreement
   - Actions

**Alternate Flow(s):**
- **4a. Không có rental nào:**
  - 4a.1. Hệ thống hiển thị "No rentals found"

**Notes:**
- Active = đang thuê
- Past = đã kết thúc (completed, terminated)
- Payment history hiển thị đầy đủ

---

## 5. PROCESS 3 - ROOMMATE MATCHING

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC33 |
| **Use Case Name** | Gửi yêu cầu thuê phòng |
| **Actor** | Tenant |
| **Short Description** | Tenant gửi yêu cầu thuê phòng cho Host |
| **Pre-Conditions** | - Tenant đã đăng nhập<br>- Tenant đã xác thực danh tính (approved)<br>- Phòng còn trống |
| **Post-Conditions** | - RentalRequest được tạo với status = "REQUESTED"<br>- Host nhận notification |

**Main Flow:**
1. Tenant xem chi tiết phòng
2. Tenant click "Request to Rent"
3. Hệ thống kiểm tra identity verification
4. Hệ thống hiển thị form gửi yêu cầu
5. Tenant nhập:
   - Tin nhắn giới thiệu bản thân (50-1000 ký tự)
   - Ngày dự kiến dọn vào
   - Thời gian ở dự kiến (tháng)
6. Tenant click "Submit Request"
7. Hệ thống validate thông tin
8. Hệ thống tạo RentalRequest
9. Hệ thống gửi notification cho Host
10. Hệ thống hiển thị thông báo thành công

**Alternate Flow(s):**
- **3a. Chưa xác thực danh tính:**
  - 3a.1. Hệ thống hiển thị dialog yêu cầu xác thực
  - 3a.2. Tenant click "Verify My Identity"
  - 3a.3. Chuyển đến form Identity Verification

**Notes:**
- Message là bắt buộc (50-1000 ký tự)
- Tenant cần được Host approve trước khi có Agreement

---

### **UC36: Tạo Agreement**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC36 |
| **Use Case Name** | Tạo Agreement |
| **Actor** | Host |
| **Short Description** | Hệ thống tạo Digital Agreement sau khi Host approve request |
| **Pre-Conditions** | - Host đã approve rental request |
| **Post-Conditions** | - RentalAgreement được tạo với status = "DRAFT"<br>- Tenant nhận notification để ký |

**Main Flow:**
1. Host approve rental request (UC35)
2. Hệ thống tự động tạo RentalAgreement:
   - rentAmount = room.monthlyRent
   - depositAmount = rentAmount (1 tháng)
   - paymentMethod = "CASH" (default)
   - noticePeriod = 30 (days)
   - status = "DRAFT"
3. Hệ thống gửi notification cho Tenant
4. Agreement hiển thị trong "My Agreements" của cả hai

**Notes:**
- Agreement tự động tạo khi approve
- Cần cả hai bên ký mới active

---

### **UC37: Tenant ký Agreement**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC37 |
| **Use Case Name** | Tenant ký Agreement |
| **Actor** | Tenant |
| **Short Description** | Tenant xem và ký digital agreement |
| **Pre-Conditions** | - Agreement status = "DRAFT"<br>- Tenant chưa ký |
| **Post-Conditions** | - agreedByTenantAt được set<br>- Đợi Host ký |

**Main Flow:**
1. Tenant truy cập "My Agreements"
2. Tenant chọn agreement cần ký
3. Tenant xem chi tiết agreement
4. Tenant click "Accept Agreement"
5. Hệ thống confirm dialog
6. Tenant xác nhận
7. Hệ thống cập nhật agreedByTenantAt = now()
8. Nếu Host đã ký → status = "ACTIVE"
9. Hệ thống gửi notification

**Notes:**
- Digital signature = timestamp khi click Accept
- Agreement chỉ active khi cả hai đã ký

---

## 5. PROCESS 3 - ROOMMATE MATCHING

### **UC50: Tạo bài đăng tìm bạn cùng phòng**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC50 |
| **Use Case Name** | Tạo bài đăng tìm bạn cùng phòng |
| **Actor** | User |
| **Short Description** | User tạo bài đăng tìm roommate |
| **Pre-Conditions** | - User đã đăng nhập<br>- User đã xác thực danh tính |
| **Post-Conditions** | - RoommatePost được tạo với status = "ACTIVE"<br>- Bài đăng hiển thị trong tìm kiếm |

**Main Flow:**
1. User click "Become a Host"
2. User chọn "A Shared Room"
3. Hệ thống kiểm tra identity verification
4. Hệ thống chuyển đến Roommate Post Form
5. User nhập thông tin:
   - Post type: SEEKER hoặc PROVIDER
   - Tiêu đề
   - Mô tả
   - Vị trí
   - Ngân sách min-max
   - Ngày dọn vào dự kiến
   - Gender preference
   - Lifestyle (sleep schedule, smoking, pets, cleanliness)
   - Preferred contact method
6. User upload ảnh (optional)
7. User click "Create Post"
8. Hệ thống validate và tạo post
9. Hệ thống chuyển đến post detail

**Alternate Flow(s):**
- **3a. Chưa xác thực:**
  - 3a.1. Chuyển đến Identity Verification form

**Notes:**
- SEEKER: Đang tìm chỗ ở chung
- PROVIDER: Có chỗ ở, tìm người ở cùng
- Không có booking hay payment

---

### **UC53: Gửi yêu cầu kết nối**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC53 |
| **Use Case Name** | Gửi yêu cầu kết nối |
| **Actor** | User |
| **Short Description** | User gửi request kết nối với chủ bài đăng |
| **Pre-Conditions** | - User đã đăng nhập<br>- User đã xác thực danh tính<br>- Bài đăng status = "ACTIVE" |
| **Post-Conditions** | - RoommateRequest được tạo<br>- Receiver nhận notification |

**Main Flow:**
1. User xem bài đăng roommate
2. User click "Send Request"
3. User nhập message
4. User click "Send"
5. Hệ thống tạo RoommateRequest với status = "PENDING"
6. Hệ thống gửi notification
7. Hiển thị thành công

**Alternate Flow(s):**
- **2a. User đã gửi request cho bài này:**
  - 2a.1. Hiển thị "You already sent a request"

**Notes:**
- Không thể gửi request cho chính bài đăng của mình
- Một user chỉ gửi được 1 request cho mỗi bài

---

### **UC55: Tạo Match**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC55 |
| **Use Case Name** | Tạo Match |
| **Actor** | System |
| **Short Description** | Hệ thống tạo match khi request được accept |
| **Pre-Conditions** | - RoommateRequest được accept |
| **Post-Conditions** | - RoommateMatch được tạo<br>- RoommatePost status → "MATCHED"<br>- Chat được enable |

**Main Flow:**
1. Post owner accept request
2. Hệ thống tạo RoommateMatch
3. Hệ thống cập nhật post status = "MATCHED"
4. Hệ thống set matchedWith = requester
5. Post không còn hiển thị trong search
6. Cả hai có thể chat với nhau

**Notes:**
- Match = kết nối thành công
- Post tự động ẩn khỏi search
- Không có transaction qua platform

---

### **UC56: Chat với roommate**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC56 |
| **Use Case Name** | Chat với roommate |
| **Actor** | User |
| **Short Description** | User chat với roommate đã match |
| **Pre-Conditions** | - User đã đăng nhập<br>- RoommateMatch đã được tạo |
| **Post-Conditions** | - Message được gửi và nhận real-time |

**Main Flow:**
1. User truy cập "My Roommate Requests"
2. User chọn request đã được accepted
3. User click "Start Chat"
4. Hệ thống mở chat window
5. User nhập tin nhắn
6. User click "Send" hoặc Enter
7. Hệ thống lưu message
8. Hệ thống emit qua Socket.IO
9. Receiver nhận message real-time
10. Message hiển thị trong chat

**Alternate Flow(s):**
- **3a. Chat từ Post Detail:**
  - 3a.1. User click "Contact" trong post detail
  - 3a.2. Chuyển đến chat window

**Notes:**
- Chat chỉ khả dụng sau khi match
- Support text và image
- Real-time qua Socket.IO

---

### **UC57: Chỉnh sửa bài đăng**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC57 |
| **Use Case Name** | Chỉnh sửa bài đăng roommate |
| **Actor** | User |
| **Short Description** | User cập nhật thông tin bài đăng tìm roommate |
| **Pre-Conditions** | - User đã đăng nhập<br>- User là owner của post<br>- Post status = "ACTIVE" |
| **Post-Conditions** | - Post được cập nhật<br>- updatedAt được set |

**Main Flow:**
1. User truy cập "My Roommate Posts"
2. User chọn post cần edit
3. User click "Edit Post"
4. Hệ thống hiển thị edit form với data hiện tại
5. User cập nhật thông tin:
   - Tiêu đề
   - Mô tả
   - Vị trí
   - Ngân sách
   - Ngày dọn vào
   - Lifestyle preferences
   - Contact preference
6. User upload/xóa ảnh (optional)
7. User click "Update Post"
8. Hệ thống validate thông tin
9. Hệ thống upload ảnh mới (nếu có)
10. Hệ thống cập nhật post:
    - updatedAt = now()
11. Hệ thống hiển thị thông báo thành công
12. Hệ thống redirect về post detail

**Alternate Flow(s):**
- **8a. Validation failed:**
  - 8a.1. Hệ thống highlight errors
  - 8a.2. Use case quay lại bước 5

- **3a. Post đã matched:**
  - 3a.1. Không cho phép edit
  - 3a.2. Hiển thị "Cannot edit matched post"

**Exception Flow(s):**
- **9.1. Upload ảnh thất bại:**
  - 9.1.a. Hệ thống giữ ảnh cũ
  - 9.1.b. Hiển thị warning

**Notes:**
- Chỉ owner mới có thể edit
- Không thể edit post đã matched
- Post type không thể thay đổi

---

### **UC58: Đóng bài đăng**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC58 |
| **Use Case Name** | Đóng bài đăng roommate |
| **Actor** | User |
| **Short Description** | User đóng bài đăng khi đã tìm được roommate |
| **Pre-Conditions** | - User đã đăng nhập<br>- User là owner của post<br>- Post status = "ACTIVE" hoặc "MATCHED" |
| **Post-Conditions** | - Post status = "CLOSED"<br>- Post không hiển thị trong search |

**Main Flow:**
1. User truy cập "My Roommate Posts"
2. User chọn post cần đóng
3. User click "Close Post"
4. Hệ thống hiển thị confirm dialog:
   - "Are you sure you want to close this post?"
   - "You can reopen it later if needed"
5. User click "Confirm"
6. Hệ thống cập nhật:
   - status = "CLOSED"
   - closedAt = now()
7. Post bị ẩn khỏi search
8. Hệ thống hiển thị thông báo thành công

**Alternate Flow(s):**
- **5a. User hủy:**
  - 5a.1. User click "Cancel"
  - 5a.2. Use case kết thúc

- **6a. Reopen post:**
  - 6a.1. User click "Reopen Post"
  - 6a.2. Hệ thống set status = "ACTIVE"
  - 6a.3. Post hiển thị lại trong search

**Notes:**
- User có thể reopen post đã closed
- Closed post vẫn hiển thị trong "My Posts"
- Pending requests vẫn còn hiệu lực

---

### **UC59: Xem yêu cầu đã gửi**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC59 |
| **Use Case Name** | Xem yêu cầu đã gửi |
| **Actor** | User |
| **Short Description** | User xem danh sách request đã gửi cho các bài đăng |
| **Pre-Conditions** | - User đã đăng nhập<br>- User đã gửi ít nhất 1 request |
| **Post-Conditions** | - User xem được danh sách requests |

**Main Flow:**
1. User click "My Roommate Requests"
2. User chọn tab "Sent Requests"
3. Hệ thống hiển thị danh sách requests đã gửi:
   - Post title, ảnh
   - Receiver name
   - Message đã gửi
   - Status (PENDING, ACCEPTED, REJECTED)
   - Sent date
4. User click vào một request để xem chi tiết
5. Hệ thống hiển thị:
   - Full message
   - Post details
   - Status và timestamp
   - Actions tùy status:
     - PENDING: Cancel Request
     - ACCEPTED: Start Chat
     - REJECTED: View Reason (if any)

**Alternate Flow(s):**
- **3a. Không có request nào:**
  - 3a.1. Hiển thị "You haven't sent any requests yet"
  - 3a.2. Button "Find Roommates"

- **5a. Cancel request:**
  - 5a.1. User click "Cancel Request"
  - 5a.2. Confirm dialog
  - 5a.3. Status = "CANCELLED"

**Notes:**
- Filter theo status: All, Pending, Accepted, Rejected
- Sort theo thời gian mới nhất

---

### **UC60: Xem yêu cầu nhận được**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC60 |
| **Use Case Name** | Xem yêu cầu nhận được |
| **Actor** | User |
| **Short Description** | User xem danh sách request nhận được cho bài đăng của mình |
| **Pre-Conditions** | - User đã đăng nhập<br>- User có ít nhất 1 post active<br>- Có request gửi đến |
| **Post-Conditions** | - User xem được danh sách requests |

**Main Flow:**
1. User click "My Roommate Requests"
2. User chọn tab "Received Requests"
3. Hệ thống hiển thị danh sách requests nhận được:
   - Sender name, ảnh
   - Message preview
   - Post title
   - Status
   - Received date
4. User click vào một request để xem chi tiết
5. Hệ thống hiển thị:
   - Sender profile summary
   - Full message
   - Post details
   - Actions:
     - PENDING: Accept / Reject
     - ACCEPTED: Start Chat
     - REJECTED: View history

**Alternate Flow(s):**
- **3a. Không có request nào:**
  - 3a.1. Hiển thị "No requests received yet"

- **5a. Accept request (UC54):**
  - 5a.1. User click "Accept"
  - 5a.2. Match được tạo
  - 5a.3. Post status → MATCHED

- **5b. Reject request:**
  - 5b.1. User click "Reject"
  - 5b.2. Optional: nhập lý do
  - 5b.3. Status = "REJECTED"

**Notes:**
- Pending requests có priority cao (hiển thị trước)
- Badge notification cho pending requests
- Filter theo status và post

---

## 6. MESSAGING & COMMUNICATION

### **UC70: Gửi tin nhắn**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC70 |
| **Use Case Name** | Gửi tin nhắn |
| **Actor** | User |
| **Short Description** | User gửi tin nhắn cho user khác |
| **Pre-Conditions** | - User đã đăng nhập<br>- Có kết nối (booking, match, etc.) |
| **Post-Conditions** | - Message được lưu<br>- Receiver nhận real-time notification |

**Main Flow:**
1. User mở conversation
2. User nhập tin nhắn
3. User click "Send" hoặc Enter
4. Hệ thống lưu message vào database
5. Hệ thống emit qua Socket.IO
6. Receiver nhận message real-time
7. Message hiển thị trong chat window

**Notes:**
- Real-time qua Socket.IO
- Hỗ trợ gửi ảnh

---

## 7. REVIEWS

### **UC80: Viết đánh giá**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC80 |
| **Use Case Name** | Viết đánh giá |
| **Actor** | Guest, Host |
| **Short Description** | User viết đánh giá sau khi hoàn thành booking |
| **Pre-Conditions** | - Booking status = "completed"<br>- User chưa viết review cho booking này |
| **Post-Conditions** | - Review được tạo<br>- Rating được cập nhật |

**Main Flow:**
1. User truy cập booking completed
2. User click "Write Review"
3. User chọn rating (1-5 sao)
4. User nhập comment
5. User click "Submit"
6. Hệ thống lưu review
7. Hệ thống cập nhật average rating

**Notes:**
- Chỉ có thể review sau khi completed
- Mỗi user chỉ review 1 lần cho mỗi booking

---

## 8. ADMIN MANAGEMENT

### **UC90: Xem Admin Dashboard**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC90 |
| **Use Case Name** | Xem Admin Dashboard |
| **Actor** | Admin |
| **Short Description** | Admin xem thống kê và quản lý hệ thống |
| **Pre-Conditions** | - User có role = "admin" |
| **Post-Conditions** | - Admin xem được statistics và có thể quản lý |

**Main Flow:**
1. Admin đăng nhập
2. Hệ thống tự động redirect đến `/admin`
3. Admin xem Dashboard với:
   - Total Users
   - Total Listings
   - Total Bookings
   - Total Revenue
4. Admin có thể navigate đến:
   - User Management
   - Listing Management
   - Identity Verification
   - Categories Management
   - Facilities Management

**Notes:**
- Admin không thấy user features (booking, wishlist, etc.)
- Navbar chỉ hiện Admin Dashboard và Logout

---

## APPENDIX: STATE DIAGRAMS

### Booking Status Flow (Entire Place)
```
draft → pending → approved → checked_in → checked_out → completed
                ↘ rejected
          pending → cancelled
          approved → cancelled
```

### RentalRequest Status Flow (Room Rental)
```
REQUESTED → APPROVED → (Agreement Created)
         ↘ REJECTED
         ↘ CANCELLED
```

### RentalAgreement Status Flow
```
DRAFT → ACTIVE → TERMINATED
(Both parties sign)
```

### RoommatePost Status Flow
```
ACTIVE → MATCHED → CLOSED
      ↘ CLOSED
```

---

**Document Status:** CURRENT  
**Version:** 2.0  
**Last Modified:** December 30, 2025



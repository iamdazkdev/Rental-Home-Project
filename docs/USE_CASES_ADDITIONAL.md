# USE CASES - BỔ SUNG

**Document:** Use Cases Additional  
**Project:** Rental Home Platform  
**Version:** 1.0  
**Date:** December 30, 2025

---

## MỤC ĐÍCH

File này bổ sung các use case còn thiếu từ file USE_CASES_CURRENT.md

---

## DANH SÁCH USE CASES BỔ SUNG

### UC08: Cập nhật xác thực danh tính
### UC19: Guest check-in
### UC20: Guest check-out
### UC33: Gửi yêu cầu thuê phòng
### UC34: Host xem yêu cầu thuê
### UC39: Quản lý thanh toán hàng tháng
### UC40: Move-in xác nhận
### UC41: Kết thúc thuê phòng
### UC42: Xem danh sách thuê
### UC56: Chat với roommate
### UC57: Chỉnh sửa bài đăng
### UC58: Đóng bài đăng
### UC59: Xem yêu cầu đã gửi
### UC60: Xem yêu cầu nhận được
### UC70: Gửi tin nhắn
### UC71: Xem danh sách hội thoại
### UC72: Xem lịch sử tin nhắn
### UC73: Liên hệ Host
### UC91: Quản lý Users
### UC92: Quản lý Listings
### UC93: Quản lý Identity Verification
### UC94: Quản lý Categories
### UC95: Quản lý Facilities

---

## 1. IDENTITY VERIFICATION

### **UC08: Cập nhật xác thực danh tính**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC08 |
| **Use Case Name** | Cập nhật xác thực danh tính |
| **Actor** | User |
| **Short Description** | User cập nhật lại thông tin xác thực danh tính sau khi bị reject |
| **Pre-Conditions** | - User đã đăng nhập<br>- Verification status = "rejected" |
| **Post-Conditions** | - Verification được cập nhật<br>- Status chuyển về "pending"<br>- Admin nhận notification |

**Main Flow:**
1. User truy cập Identity Verification form
2. Hệ thống hiển thị rejection reason từ Admin
3. User cập nhật thông tin:
   - Họ và tên đầy đủ
   - Số điện thoại
   - Ngày tháng năm sinh
4. User upload lại ảnh CCCD mặt trước (nếu cần)
5. User upload lại ảnh CCCD mặt sau (nếu cần)
6. User click "Resubmit Verification"
7. Hệ thống validate thông tin
8. Hệ thống upload ảnh mới lên Cloudinary
9. Hệ thống cập nhật verification:
   - status = "pending"
   - rejectionReason = null
   - updatedAt = now()
10. Hệ thống gửi notification cho Admin
11. Hệ thống hiển thị thông báo thành công

**Alternate Flow(s):**
- **2a. Verification status = "approved":**
  - 2a.1. Hệ thống hiển thị thông tin đã được duyệt
  - 2a.2. Không cho phép cập nhật

**Exception Flow(s):**
- **8.1. Upload ảnh thất bại:**
  - 8.1.a. Hệ thống hiển thị "Failed to upload images"
  - 8.1.b. Use case quay lại bước 4

**Notes:**
- User chỉ có thể cập nhật khi status = "rejected"
- Mỗi lần update, status reset về "pending"
- Rejection reason được xóa sau khi resubmit

---

## 2. ENTIRE PLACE RENTAL - CHECK-IN/OUT

### **UC19: Guest check-in**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC19 |
| **Use Case Name** | Guest check-in |
| **Actor** | Guest |
| **Short Description** | Guest xác nhận check-in khi đến nơi |
| **Pre-Conditions** | - Guest đã đăng nhập<br>- Booking status = "approved"<br>- Ngày check-in đã đến |
| **Post-Conditions** | - Booking status = "checked_in"<br>- checkInAt được set<br>- Host nhận notification |

**Main Flow:**
1. Guest truy cập Trip List
2. Guest chọn booking sắp check-in
3. Guest click "Check In"
4. Hệ thống hiển thị confirm dialog
5. Guest xác nhận
6. Hệ thống cập nhật booking:
   - bookingStatus = "checked_in"
   - checkInAt = now()
7. Hệ thống gửi notification cho Host
8. Hệ thống hiển thị thông báo thành công

**Alternate Flow(s):**
- **3a. Chưa đến ngày check-in:**
  - 3a.1. Nút "Check In" bị disable
  - 3a.2. Hiển thị "Check-in available on [date]"

- **3b. Đã quá ngày check-in:**
  - 3b.1. Vẫn cho phép check-in
  - 3b.2. Hiển thị warning "Late check-in"

**Exception Flow(s):**
- **6.1. Cập nhật thất bại:**
  - 6.1.a. Hệ thống hiển thị lỗi
  - 6.1.b. Guest có thể thử lại

**Notes:**
- Check-in có thể thực hiện trong ngày check-in hoặc sau đó
- Chỉ Guest có thể trigger check-in
- Sau check-in, nút "Check Out" sẽ xuất hiện

---

### **UC20: Guest check-out**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC20 |
| **Use Case Name** | Guest check-out |
| **Actor** | Guest |
| **Short Description** | Guest xác nhận check-out khi rời khỏi |
| **Pre-Conditions** | - Guest đã đăng nhập<br>- Booking status = "checked_in"<br>- Đã đến hoặc qua ngày check-out |
| **Post-Conditions** | - Booking status = "checked_out"<br>- checkOutAt được set<br>- Host có thể complete booking<br>- Review được enable |

**Main Flow:**
1. Guest truy cập Trip List
2. Guest chọn booking đang ở
3. Guest click "Check Out"
4. Hệ thống hiển thị confirm dialog
5. Guest xác nhận
6. Hệ thống cập nhật booking:
   - bookingStatus = "checked_out"
   - checkOutAt = now()
   - isCheckedOut = true
7. Hệ thống gửi notification cho Host để complete
8. Hệ thống hiển thị thông báo thành công
9. Guest có thể viết review

**Alternate Flow(s):**
- **3a. Chưa check-in:**
  - 3a.1. Không hiển thị nút "Check Out"

- **3b. Check-out sớm:**
  - 3b.1. Vẫn cho phép check-out
  - 3b.2. Không hoàn tiền tự động

- **3c. Check-out muộn:**
  - 3c.1. Cho phép check-out
  - 3c.2. Có thể phát sinh phí (tùy Host policy)

**Exception Flow(s):**
- **6.1. Cập nhật thất bại:**
  - 6.1.a. Hệ thống hiển thị lỗi
  - 6.1.b. Guest có thể thử lại

**Notes:**
- Check-out có thể thực hiện bất cứ lúc nào sau check-in
- Sau check-out, Host cần complete booking
- Review chỉ khả dụng sau check-out
- Booking chuyển sang completed sau khi Host confirm

---

## 3. ROOM RENTAL

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

## 4. ROOMMATE - INTERACTION

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

## 5. MESSAGING & COMMUNICATION

### **UC70: Gửi tin nhắn**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC70 |
| **Use Case Name** | Gửi tin nhắn |
| **Actor** | User |
| **Short Description** | User gửi tin nhắn cho user khác |
| **Pre-Conditions** | - User đã đăng nhập<br>- Có conversation với receiver |
| **Post-Conditions** | - Message được gửi và lưu<br>- Receiver nhận real-time hoặc notification |

**Main Flow:**
1. User mở conversation
2. User nhập tin nhắn vào input box
3. User click "Send" hoặc nhấn Enter
4. Hệ thống validate message (không rỗng)
5. Hệ thống tạo Message:
   - conversationId
   - senderId
   - receiverId
   - text
   - createdAt
6. Hệ thống lưu message vào database
7. Hệ thống emit message qua Socket.IO
8. Receiver nhận message real-time (nếu online)
9. Message hiển thị trong conversation
10. Hệ thống cập nhật lastMessage của conversation

**Alternate Flow(s):**
- **8a. Receiver offline:**
  - 8a.1. Hệ thống tạo notification
  - 8a.2. Notification hiển thị khi receiver login lại

- **3a. Gửi ảnh:**
  - 3a.1. User click attach icon
  - 3a.2. User chọn ảnh
  - 3a.3. Hệ thống upload ảnh
  - 3a.4. Message type = "image"
  - 3a.5. photoUrl được set

**Exception Flow(s):**
- **6.1. Lưu message thất bại:**
  - 6.1.a. Hệ thống hiển thị "Failed to send message"
  - 6.1.b. User có thể retry

**Notes:**
- Support text và image
- Real-time qua Socket.IO
- Message history được lưu vĩnh viễn
- Typing indicator (optional)

---

### **UC71: Xem danh sách hội thoại**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC71 |
| **Use Case Name** | Xem danh sách hội thoại |
| **Actor** | User |
| **Short Description** | User xem tất cả conversations |
| **Pre-Conditions** | - User đã đăng nhập |
| **Post-Conditions** | - User xem được danh sách conversations |

**Main Flow:**
1. User click "Messages" icon
2. Hệ thống load conversations của user
3. Hệ thống hiển thị danh sách conversations:
   - Ảnh đại diện của người chat
   - Tên người chat
   - Last message preview
   - Timestamp của last message
   - Unread badge (nếu có)
4. Conversations được sắp xếp theo:
   - Unread trước
   - Thời gian gần nhất
5. User click vào một conversation
6. Hệ thống mở chat screen (UC72)

**Alternate Flow(s):**
- **2a. Không có conversation nào:**
  - 2a.1. Hiển thị "No conversations yet"
  - 2a.2. Suggestion: "Contact a host or find roommates"

- **3a. Có unread messages:**
  - 3a.1. Badge hiển thị số unread
  - 3a.2. Conversation được highlight

**Notes:**
- Real-time update khi có message mới
- Unread count update tự động
- Search conversation by name

---

### **UC72: Xem lịch sử tin nhắn**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC72 |
| **Use Case Name** | Xem lịch sử tin nhắn |
| **Actor** | User |
| **Short Description** | User xem toàn bộ messages trong một conversation |
| **Pre-Conditions** | - User đã đăng nhập<br>- Conversation tồn tại |
| **Post-Conditions** | - User xem được message history<br>- Unread messages được mark as read |

**Main Flow:**
1. User chọn conversation (UC71)
2. Hệ thống load tất cả messages của conversation
3. Hệ thống hiển thị messages:
   - Sender messages: bên phải
   - Receiver messages: bên trái
   - Timestamp cho mỗi message
   - Avatar của sender
4. Hệ thống tự động scroll xuống message mới nhất
5. Hệ thống mark tất cả messages as read
6. User có thể:
   - Scroll lên xem messages cũ
   - Gửi message mới (UC70)
   - View ảnh full size (nếu có)

**Alternate Flow(s):**
- **2a. Conversation mới (chưa có message):**
  - 2a.1. Hiển thị "No messages yet"
  - 2a.2. Placeholder: "Start the conversation"

- **3a. Message là ảnh:**
  - 3a.1. Hiển thị thumbnail
  - 3a.2. User click để view full size

**Notes:**
- Messages load theo pages (pagination)
- Real-time update khi có message mới
- Auto-scroll khi có message mới

---

### **UC73: Liên hệ Host**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC73 |
| **Use Case Name** | Liên hệ Host |
| **Actor** | Guest |
| **Short Description** | Guest gửi tin nhắn cho Host từ listing detail |
| **Pre-Conditions** | - Guest đã đăng nhập<br>- Đang xem listing detail |
| **Post-Conditions** | - Conversation được tạo (nếu chưa có)<br>- Message được gửi |

**Main Flow:**
1. Guest xem listing detail
2. Guest click "Contact Host"
3. Hệ thống kiểm tra conversation với Host
4. Nếu chưa có conversation:
   - 4a. Hệ thống tạo Conversation mới
   - 4b. Hệ thống set participants = [guest, host]
5. Hệ thống mở chat screen
6. Hệ thống tự động điền template message (optional):
   - "Hi, I'm interested in your listing: [Listing Title]"
7. Guest có thể chỉnh sửa hoặc gửi message
8. Guest gửi message (UC70)

**Alternate Flow(s):**
- **4a. Đã có conversation:**
  - 4a.1. Hệ thống mở conversation hiện có
  - 4a.2. Hiển thị message history

- **2a. Guest chưa login:**
  - 2a.1. Hệ thống yêu cầu login
  - 2a.2. Sau login, quay lại listing detail

**Notes:**
- Một conversation cho mỗi cặp Guest-Host
- Template message giúp bắt đầu conversation
- Conversation được reuse nếu đã tồn tại

---

## 6. ADMIN MANAGEMENT

### **UC91: Quản lý Users**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC91 |
| **Use Case Name** | Quản lý Users |
| **Actor** | Admin |
| **Short Description** | Admin xem, quản lý và thống kê users |
| **Pre-Conditions** | - Admin đã đăng nhập |
| **Post-Conditions** | - Admin xem được thông tin users |

**Main Flow:**
1. Admin truy cập Admin Dashboard
2. Admin click tab "Users"
3. Hệ thống hiển thị danh sách users:
   - ID, Name, Email
   - Role (user, admin)
   - Registration date
   - Status (active, blocked)
   - Total bookings
   - Total listings
4. Admin có thể:
   - Search user by name/email
   - Filter by role
   - Sort by date, bookings, etc.
5. Admin click vào user để xem chi tiết:
   - Full profile
   - Booking history
   - Listing history
   - Reviews given/received
   - Identity verification status
6. Admin có thể:
   - Block/Unblock user
   - Reset password
   - Change role
   - View activity log

**Alternate Flow(s):**
- **6a. Block user:**
  - 6a.1. Admin click "Block User"
  - 6a.2. Confirm dialog
  - 6a.3. User không thể login
  - 6a.4. Active bookings/listings được notify

**Notes:**
- Admin không thể block chính mình
- Block user không xóa data
- Unblock khôi phục quyền truy cập

---

### **UC92: Quản lý Listings**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC92 |
| **Use Case Name** | Quản lý Listings |
| **Actor** | Admin |
| **Short Description** | Admin xem và quản lý tất cả listings |
| **Pre-Conditions** | - Admin đã đăng nhập |
| **Post-Conditions** | - Admin xem được listings |

**Main Flow:**
1. Admin truy cập Admin Dashboard
2. Admin click tab "Listings"
3. Hệ thống hiển thị danh sách listings:
   - Title, Type
   - Host name
   - Price
   - Status (active, hidden, deleted)
   - Created date
   - Total bookings
4. Admin có thể:
   - Search by title/location
   - Filter by type, status
   - Sort by date, bookings, price
5. Admin click vào listing để xem chi tiết
6. Admin có thể:
   - View full listing info
   - View booking history
   - View reviews
   - Hide/Unhide listing
   - Delete listing (soft delete)

**Alternate Flow(s):**
- **6a. Hide listing:**
  - 6a.1. Admin click "Hide Listing"
  - 6a.2. Listing không hiển thị trong search
  - 6a.3. Host được notify

**Notes:**
- Admin có thể hide bất kỳ listing nào
- Soft delete giữ data nhưng không hiển thị
- Admin log được ghi nhận mọi action

---

### **UC93: Quản lý Identity Verification**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC93 |
| **Use Case Name** | Quản lý Identity Verification |
| **Actor** | Admin |
| **Short Description** | Admin duyệt yêu cầu xác thực danh tính |
| **Pre-Conditions** | - Admin đã đăng nhập<br>- Có verification requests pending |
| **Post-Conditions** | - Verification được approve/reject |

**Main Flow:**
1. Admin truy cập Admin Dashboard
2. Admin click tab "Identity Verification"
3. Hệ thống hiển thị tabs:
   - Pending (badge với số lượng)
   - Approved
   - Rejected
4. Admin chọn tab "Pending"
5. Hệ thống hiển thị danh sách pending verifications:
   - User name, email
   - Submitted date
   - Status
6. Admin click vào verification để xem chi tiết:
   - Full name
   - Phone number
   - Date of birth
   - ID card front image
   - ID card back image
7. Admin verify thông tin
8. Admin chọn action:
   - **Approve:** 
     - 8a.1. Admin click "Approve"
     - 8a.2. Confirm dialog
     - 8a.3. Status = "approved"
     - 8a.4. User được notify
   - **Reject:**
     - 8b.1. Admin click "Reject"
     - 8b.2. Admin nhập rejection reason
     - 8b.3. Status = "rejected"
     - 8b.4. User được notify với reason

**Alternate Flow(s):**
- **6a. Filter by status:**
  - 6a.1. Admin chọn tab
  - 6a.2. View approved/rejected history

**Notes:**
- Pending có priority notification
- Rejection reason hiển thị cho user
- User có thể resubmit sau khi rejected

---

### **UC94: Quản lý Categories**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC94 |
| **Use Case Name** | Quản lý Categories |
| **Actor** | Admin |
| **Short Description** | Admin thêm, sửa, xóa, ẩn/hiện categories |
| **Pre-Conditions** | - Admin đã đăng nhập |
| **Post-Conditions** | - Categories được cập nhật |

**Main Flow:**
1. Admin truy cập Admin Dashboard
2. Admin click tab "Data Management"
3. Admin chọn "Categories"
4. Hệ thống hiển thị danh sách categories:
   - Name
   - Description
   - Icon
   - Display Order
   - Status (active/inactive)
   - Created/Updated date
5. Admin có thể:
   - **Add new:**
     - 5a.1. Click "Add Category"
     - 5a.2. Nhập name, description
     - 5a.3. Chọn icon
     - 5a.4. Set display order
     - 5a.5. Save
   - **Edit existing:**
     - 5b.1. Click edit icon
     - 5b.2. Update thông tin
     - 5b.3. Save changes
   - **Hide/Show:**
     - 5c.1. Toggle active status
     - 5c.2. Hidden category không hiển thị cho user
   - **Delete:**
     - 5d.1. Click delete (chỉ nếu không có listing dùng)
     - 5d.2. Confirm
     - 5d.3. Category bị xóa

**Alternate Flow(s):**
- **5d.1. Category đang được sử dụng:**
  - 5d.1.a. Hệ thống hiển thị "Cannot delete - in use"
  - 5d.1.b. Chỉ có thể hide

**Notes:**
- Display order ảnh hưởng thứ tự hiển thị
- Icon sử dụng React Icons
- Hide category = soft delete

---

### **UC95: Quản lý Facilities**

| Thuộc tính | Mô tả |
|------------|-------|
| **UseCase ID** | UC95 |
| **Use Case Name** | Quản lý Facilities |
| **Actor** | Admin |
| **Short Description** | Admin thêm, sửa, xóa, ẩn/hiện facilities (amenities) |
| **Pre-Conditions** | - Admin đã đăng nhập |
| **Post-Conditions** | - Facilities được cập nhật |

**Main Flow:**
1. Admin truy cập Admin Dashboard
2. Admin click tab "Data Management"
3. Admin chọn "Facilities"
4. Hệ thống hiển thị danh sách facilities:
   - Name
   - Icon
   - Display Order
   - Status (active/inactive)
   - Usage count (số listing đang dùng)
5. Admin có thể:
   - **Add new facility:**
     - 5a.1. Click "Add Facility"
     - 5a.2. Nhập name
     - 5a.3. Chọn icon
     - 5a.4. Set display order
     - 5a.5. Save
   - **Edit facility:**
     - 5b.1. Click edit
     - 5b.2. Update name/icon
     - 5b.3. Save
   - **Hide/Show:**
     - 5c.1. Toggle active status
     - 5c.2. Hidden không hiển thị cho user
   - **Delete:**
     - 5d.1. Click delete (nếu không có listing dùng)
     - 5d.2. Confirm
     - 5d.3. Facility bị xóa

**Alternate Flow(s):**
- **5d.1. Facility đang được sử dụng:**
  - 5d.1.a. Hiển thị "Cannot delete - used by X listings"
  - 5d.1.b. Chỉ có thể hide

**Notes:**
- Facilities = amenities
- Icon sử dụng Material Icons
- Usage count hiển thị số lượng listings đang dùng
- Hidden facility vẫn hiển thị cho listings đã chọn trước đó

---

**Document End**


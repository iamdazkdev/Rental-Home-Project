# PLAN — UC-02: Calendar & Pre-booking

**Dự án:** Rental Home — Hệ thống đặt phòng thông minh
**Mã Use Case:** UC-02
**Ngày lập kế hoạch:** 2026-05-08
**Nguồn yêu cầu:** Dazk Dev

---

## 1. Hiện trạng (Audit Summary)

### Backend

| Thành phần | Trạng thái | Ghi chú |
| --- | --- | --- |
| `PreBooking` model | ❌ Thiếu | Chỉ có `PendingBooking` (deprecated, sai state machine) |
| `Booking` model | ✅ Có | Đủ field, nhưng thiếu trạng thái `awaiting_payment` |
| Pre-booking routes / services | ❌ Thiếu | 0 endpoint nào cho pre-booking |
| `checkAvailability()` | ✅ Có | Logic overlap tốt, nhưng chưa bao gồm pre-booking |
| Scheduler 24h auto-transition | ❌ Thiếu | `paymentReminder.service.js` hiện tại không đủ |
| `notification.service.js` | ✅ Có | Đủ các hàm, nhưng chưa emit Socket.io |
| Socket.io server-side | ✅ Có | Setup sẵn, chưa emit booking events |

### Frontend

| Thành phần | Trạng thái | Ghi chú |
| --- | --- | --- |
| `ListDetailPage.jsx` | ✅ Có | Có DateRange picker, không có 3-state calendar |
| `HostCalendar.jsx` | ✅ Có | 1 listing, thiếu multi-listing và pre-booking state |
| `react-calendar` library | ✅ Cài sẵn | Chưa dùng cho availability |
| Pre-booking components | ❌ Thiếu | Không có modal, confirmation |
| `calendarService.js` | ✅ Có | Có get/block/unblock dates, thiếu pre-booking calls |
| Zustand / Redux cho booking | ❌ Thiếu | Không có store nào track pre-booking state |
| Socket.io client | ✅ Có | `SocketContext.js` chỉ track user online, thiếu booking events |

---

## 2. Nguyên tắc bắt tay Server ↔ Client

```
Server xây API contract trước → Client implement theo đúng contract đó.
Không ai "đoán" response shape của nhau.
```

**API Contract chính — Calendar Data:**

```json
// GET /pre-bookings?listingId=xxx&month=5&year=2026
{
  "days": {
    "2026-05-10": "booked",
    "2026-05-15": "pre_booked",
    "2026-05-20": "available"
  },
  "bookings": [...],
  "preBookings": [...]
}
```

---

## 3. State Machine — PreBooking

```
                  ┌──────────┐
           ┌─────▶│ rejected │ (Terminal)
           │      └──────────┘
       ┌───┴───┐
START─▶│pending│──approve──▶┌──────────┐──(start_date-24h)──▶┌───────────────────┐
       └───┬───┘             │ approved │                      │ awaiting_payment  │
           │                 └──────────┘                      └────────┬──────────┘
           │cancel                │cancel                    pay ▼      │ timeout(24h)
           ▼                      ▼                      ┌──────────┐   ▼
       ┌───────────┐         ┌───────────┐               │confirmed │ ┌─────────┐
       │ cancelled │         │ cancelled │               │(→Booking)│ │ expired │
       └───────────┘         └───────────┘               └──────────┘ └─────────┘
         (Terminal)            (Terminal)                  (Terminal)   (Terminal)
```

---

## 4. Thứ tự triển khai

```
Phase 1 — Server Foundation
├─ 1. server/models/PreBooking.js              ~30 min
├─ 2. Update checkAvailability()               ~20 min
├─ 3. server/services/preBooking.service.js    ~2-3h
└─ 4. server/routes/preBooking.js + controller ~1h

Phase 2 — Server Automation
├─ 5. server/services/preBookingScheduler.js   ~1h
└─ 6. Socket.io emit trong notification        ~30 min

Phase 3 — Client: Calendar Component
├─ 7. components/booking/AvailabilityCalendar  ~2h
├─ 8. services/preBookingService.js + Zustand  ~1h
└─ 9. Tích hợp vào ListDetailPage              ~1h

Phase 4 — Client: Host Dashboard
├─ 10. HostCalendar multi-listing              ~2-3h
└─ 11. Socket.io listeners trong SocketContext ~30 min
```

**Tổng ước tính:** ~12–14h dev time

---

## 5. Chi tiết từng Phase

### Phase 1.1 — `PreBooking` Model

**File:** `server/models/PreBooking.js`

Fields quan trọng:

```js
{
  guestId:      ObjectId,  // ref: User
  hostId:       ObjectId,  // ref: User
  listingId:    ObjectId,  // ref: Listing
  startDate:    Date,
  endDate:      Date,
  status:       String,    // pending | approved | awaiting_payment | confirmed | expired | rejected | cancelled
  autoApprove:  Boolean,   // copy từ Host setting lúc tạo
  expiresAt:    Date,      // set khi chuyển → awaiting_payment (= now + 24h)
  approvedAt:   Date,
  rejectedAt:   Date,
  rejectionReason: String,
  cancellationReason: String,
  notes:        String,    // ghi chú của guest (≤300 ký tự)
  bookingId:    ObjectId,  // set khi confirmed → sinh Booking chính thức
}
```

Indexes: `listingId + startDate + endDate` (compound), `guestId`, `status`.

### Phase 1.2 — Cập nhật `checkAvailability()`

**File:** `server/services/booking.service.js`

Thêm query PreBooking song song với Booking hiện tại:

```js
const preBookingConflicts = await PreBooking.find({
  listingId,
  status: { $in: ['approved', 'awaiting_payment'] },
  startDate: { $lt: endDate },
  endDate:   { $gt: startDate },
});
```

Merge kết quả vào `conflicts[]` trước khi return.

### Phase 1.3 — `preBooking.service.js`

**File:** `server/services/preBooking.service.js`

| Hàm | Business Rules kiểm tra |
| --- | --- |
| `createPreBooking()` | Overlap, max 3 active (BR-05), start ≥ now+3 ngày (BR-02), start ≤ now+6 tháng (BR-06), auto-approve nếu Host bật |
| `approvePreBooking()` | Chỉ Host của listing mới được duyệt |
| `rejectPreBooking()` | Chỉ Host, lưu `rejectionReason` |
| `cancelPreBooking()` | Guest được huỷ khi status = pending/approved, không được huỷ khi awaiting_payment |
| `getCalendarData()` | Merge Booking + PreBooking + BlockedDates → shape `{days, bookings, preBookings}` |
| `confirmPreBooking()` | Gọi từ Payment service sau thanh toán, tạo Booking, set `status = confirmed` |

### Phase 1.4 — Routes & Controller

**File:** `server/routes/preBooking.js`

```
POST   /pre-bookings                   Guest tạo pre-booking
GET    /pre-bookings/calendar          Calendar data (listingId, month, year query)
PATCH  /pre-bookings/:id/approve       Host duyệt
PATCH  /pre-bookings/:id/reject        Host từ chối
PATCH  /pre-bookings/:id/cancel        Guest huỷ
GET    /pre-bookings/my                Guest xem danh sách của mình
GET    /pre-bookings/host              Host xem incoming requests
```

Auth middleware: tất cả routes yêu cầu JWT. Approve/reject kiểm tra `hostId` khớp với caller.

### Phase 2.1 — `preBookingScheduler.service.js`

**File:** `server/services/preBookingScheduler.service.js`

```js
// Job 1 — Mỗi 30 phút
// approved + startDate ≤ now+24h → awaiting_payment + set expiresAt = now+24h
cron.schedule('*/30 * * * *', transitionToAwaitingPayment);

// Job 2 — Mỗi giờ
// awaiting_payment + expiresAt < now → expired
cron.schedule('0 * * * *', expireOverduePreBookings);
```

Đăng ký trong `server/index.js` cùng chỗ với các scheduler hiện tại (dòng 59–66).

### Phase 2.2 — Socket.io Emit

**File:** `server/services/notification.service.js`

Thêm vào hàm `_emitNotification()` sau `Notification.create()`:

```js
const io = require('../index').io;
if (io) {
  io.to(`user_${notification.userId}`).emit('notification', notification);
}
```

Thêm notification types mới: `pre_booking_new`, `pre_booking_approved`, `pre_booking_rejected`, `pre_booking_payment_due`, `pre_booking_expired`.

### Phase 3.1 — `AvailabilityCalendar` Component

**File:** `client/src/components/booking/AvailabilityCalendar.jsx`

Dùng `react-calendar` (đã cài). Custom `tileClassName` theo `days` map từ API:

```js
tileClassName = ({ date }) => {
  const key = format(date, 'yyyy-MM-dd');
  return days[key] ?? 'available'; // 'booked' | 'pre_booked' | 'available'
}
```

CSS: `.booked` → red, `.pre_booked` → yellow, `.available` → green (khi hover).

Props: `listingId`, `onRangeSelect(start, end)`.

### Phase 3.2 — `preBookingService.js` + Zustand Store

**File:** `client/src/services/preBookingService.js`

```js
getCalendarData(listingId, month, year)
createPreBooking({ listingId, startDate, endDate, notes })
cancelPreBooking(preBookingId)
getMyPreBookings()
```

**File:** `client/src/stores/usePreBookingStore.js`

```js
state: { calendarData, myPreBookings, loading, error }
actions: { fetchCalendar, createPreBooking, cancelPreBooking }
```

### Phase 3.3 — Tích hợp `ListDetailPage.jsx`

Thay `DateRange` picker bằng `AvailabilityCalendar`. Thêm flow:
1. Guest chọn range → click **"Đặt trước"**.
2. Mở `PreBookingConfirmModal` — hiển thị summary (ngày, tổng, điều kiện).
3. Confirm → `POST /pre-bookings` → toast success.

### Phase 4.1 — `HostCalendar.jsx` Multi-listing

Fetch calendar data cho tất cả listing của Host. Mỗi listing 1 màu riêng (palette cố định). Click vào block → popup chi tiết + nút **Duyệt / Từ chối** pre-booking trực tiếp.

### Phase 4.2 — Socket.io Listeners

**File:** `client/src/context/SocketContext.js`

```js
socket.on('notification', (data) => {
  useNotificationStore.getState().addNotification(data);
  if (['pre_booking_new', 'pre_booking_approved'].includes(data.type)) {
    usePreBookingStore.getState().fetchCalendar(...);
  }
});
```

---

## 6. Files sẽ tạo mới

```
server/
├── models/PreBooking.js
├── services/preBooking.service.js
├── services/preBookingScheduler.service.js
├── controllers/preBooking.controller.js
└── routes/preBooking.js

client/src/
├── components/booking/AvailabilityCalendar.jsx
├── components/booking/PreBookingConfirmModal.jsx
├── services/preBookingService.js
└── stores/usePreBookingStore.js
```

## 7. Files sẽ chỉnh sửa

```
server/
├── services/booking.service.js     ← thêm PreBooking vào checkAvailability()
├── services/notification.service.js ← thêm Socket.io emit + new types
├── app.js                           ← mount route preBooking
└── index.js                        ← đăng ký preBookingScheduler

client/src/
├── pages/listing/ListDetailPage.jsx ← thay DateRange bằng AvailabilityCalendar
├── pages/host/HostCalendar.jsx      ← nâng cấp multi-listing + pre-booking
└── context/SocketContext.js         ← thêm booking event listeners
```

---

## 8. Acceptance Criteria (từ UC-02)

- **AC-01:** Calendar phân biệt rõ 3 màu: trống / đang thuê / đặt trước.
- **AC-02:** Không thể chọn ngày overlap với Booking/Pre-booking đã tồn tại.
- **AC-03:** Pre-booking hết hạn sau 24h nếu Guest không thanh toán khi đến hạn.
- **AC-04:** Host nhận thông báo realtime (< 3s) khi có Pre-booking mới.
- **AC-05:** Host Dashboard hiển thị tất cả listing trên 1 calendar tổng hợp.
- **AC-06:** Guest có > 3 pre-booking active không thể tạo thêm.
- **AC-07:** Mọi chuyển trạng thái đều có audit log đầy đủ actor + timestamp.

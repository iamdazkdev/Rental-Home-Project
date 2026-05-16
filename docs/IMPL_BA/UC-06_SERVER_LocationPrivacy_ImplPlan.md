# UC-06 — Implementation Plan: Bảo mật vị trí (Location Privacy)

**Platform:** Server (Express.js Backend)
**UC Reference:** `docs/BUSINESS_ANALYSTS/UC-06_BaoMat_ViTri.md`
**Phiên bản:** 1.0
**Ngày tạo:** 2026-05-16
**Trạng thái:** ⏳ Chờ implement (`/tdd-server`)

---

## 1. Mục tiêu

Bảo vệ địa chỉ thật của Host bằng cách **chỉ tiết lộ địa chỉ chính xác sau khi booking được duyệt**:

- `GET /listings/:id` (public) → KHÔNG bao giờ trả `streetAddress`, `aptSuite`, tọa độ thật. Trả `mapCenter` đã offset stable ±150m.
- `GET /bookings/:id` (auth) → Inject địa chỉ đầy đủ vào response KHI `bookingStatus ∈ {approved, checked_in, completed}` VÀ caller là `customerId`.
- `PATCH /bookings/:id/approve` → Notification gửi cho Guest có chứa full address.
- Mọi lần reveal địa chỉ đầy đủ → ghi `LocationAuditLog`.

---

## 2. Phân tích Codebase

### 2.1 Trạng thái hiện tại

| File | Vấn đề |
|:-----|:-------|
| `models/Listing.js` | Có `streetAddress`, `aptSuite`, nhưng **không có** `coordinates` field |
| `services/listing.service.js` | `getListingById` trả raw listing — **không lọc** sensitive fields |
| `services/booking.service.js` | `getBookingById` populate `listingId` full — **không inject** full address theo status |
| `services/notification.service.js` | `sendBookingApproved` chỉ có `listing.title` — **thiếu** full address (AC-03) |
| `controllers/booking.controller.js` | Không truyền `ip`/`userAgent` xuống service |

### 2.2 Điểm mạnh sẵn có

- `bookingStatus` enum đầy đủ: `pending`, `approved`, `checked_in`, `completed`, ...
- `customerId` / `hostId` trên Booking → dùng để check authorization
- `HttpError` + `asyncHandler` pattern đã chuẩn
- Jest + mock Mongoose pattern có sẵn trong `tests/search.service.test.js`

---

## 3. Scope — 7 files thay đổi, 3 test files

### 3.1 Files CREATE mới

| # | File | Mục đích |
|:--|:-----|:---------|
| 1 | `server/models/LocationAuditLog.js` | Model ghi log mỗi lần địa chỉ đầy đủ được reveal (TTL 365 ngày) |
| 2 | `server/services/location.service.js` | Core logic: stable offset, sanitize, buildFullAddress, logAccess |
| 3 | `server/tests/location.service.test.js` | Unit tests cho location.service (8 test cases) |
| 4 | `server/tests/listing.location-privacy.test.js` | Tests listing API không leak sensitive fields (4 test cases) |
| 5 | `server/tests/booking.location-reveal.test.js` | Tests booking inject full address khi approved (5 test cases) |

### 3.2 Files MODIFY

| # | File | Thay đổi |
|:--|:-----|:---------|
| 6 | `server/models/Listing.js` | Thêm `coordinates: { lat, lng }` optional (backward-safe) |
| 7 | `server/services/listing.service.js` | `getListingById` + `getListings` → gọi `locationService.sanitizePublicListing` |
| 8 | `server/services/booking.service.js` | `getBookingById` → inject full address khi approved + log audit; thêm `meta` param |
| 9 | `server/controllers/booking.controller.js` | Pass `{ ip: req.ip, userAgent: req.headers['user-agent'] }` xuống service |
| 10 | `server/services/notification.service.js` | `sendBookingApproved` → populate address fields + inject `fullAddress` vào notification data |

---

## 4. Data Flow

```
┌────────────────────────────────────────────────────────────┐
│  GET /listings/:id  (PUBLIC — no auth)                     │
│                                                            │
│  listingController.getListingById                          │
│    └─ listingService.getListingById(id)                    │
│        └─ locationService.sanitizePublicListing(listing)   │
│            ├─ STRIP: streetAddress, aptSuite, coordinates  │
│            ├─ ADD: mapCenter = computeStableMapCenter(...)  │
│            └─ RETURN: { city, province, country, mapCenter }│
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  GET /bookings/:id  (AUTH required)                        │
│                                                            │
│  bookingController.getBookingById                          │
│    └─ bookingService.getBookingById(id, userId, role, meta)│
│        ├─ Existing auth check (customer | host | admin)    │
│        ├─ if status IN [approved, checked_in, completed]   │
│        │   AND userId === customerId                       │
│        │   → locationService.buildFullAddress(listing)     │
│        │   → locationService.logAccess(userId, bookingId, ip)│
│        │   → Inject fullAddress + real coordinates        │
│        └─ else → listing location vẫn sanitized           │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  PATCH /bookings/:id/approve  (Host approves)              │
│                                                            │
│  bookingService.approveBooking                             │
│    └─ notificationService.sendBookingApproved(booking)     │
│        ├─ populate listingId: 'title streetAddress         │
│        │   aptSuite city province country'                 │
│        └─ data.fullAddress = buildFullAddress(listing)     │
└────────────────────────────────────────────────────────────┘
```

---

## 5. Chi tiết từng file

### 5.1 `models/LocationAuditLog.js` (CREATE)

```javascript
const LocationAuditLogSchema = new mongoose.Schema({
  userId:    { type: ObjectId, ref: 'User',    required: true },
  bookingId: { type: ObjectId, ref: 'Booking', required: true },
  listingId: { type: ObjectId, ref: 'Listing', required: true },
  ip:        { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// TTL: tự xóa sau 365 ngày (NFR-02)
LocationAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });
LocationAuditLogSchema.index({ userId: 1, createdAt: -1 });
LocationAuditLogSchema.index({ bookingId: 1 });
```

### 5.2 `services/location.service.js` (CREATE)

```javascript
// computeStableMapCenter(listingId, lat, lng)
// - seed = parseInt(listingId.slice(-8), 16)
// - latOffset  = ((seed % 300) - 150) / 111000      // ±150m lat
// - lngOffset  = (((seed >> 8) % 300) - 150) / (111000 * cos(lat_rad))
// - Cùng listingId → cùng offset (BR-06 stable random)
// - Không có coordinates → return null

// sanitizePublicListing(listingObj)
// - delete listing.streetAddress
// - delete listing.aptSuite
// - delete listing.coordinates (real)
// - listing.mapCenter = computeStableMapCenter(...) || null
// - return sanitized copy

// buildFullAddress(listingObj)
// - Ghép: [aptSuite + ] streetAddress + ", " + city + ", " + province + ", " + country
// - Bỏ qua field rỗng/null

// logAccess(userId, bookingId, listingId, ip, userAgent)
// - LocationAuditLog.create({ userId, bookingId, listingId, ip, userAgent })
// - Non-blocking (fire and forget, catch error silently)
```

### 5.3 `models/Listing.js` — Thêm field (MODIFY)

```javascript
// Thêm vào schema (backward-safe, optional):
coordinates: {
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
},
```

### 5.4 `services/listing.service.js` (MODIFY)

```javascript
// getListingById:
const listing = await Listing.findById(id).populate('creator').lean();
if (!listing) return null;
return locationService.sanitizePublicListing(listing);  // ← thêm

// getListings:
// Sau khi lọc available listings → map qua sanitizePublicListing
return availableListings
  .filter(l => l !== null)
  .map(l => locationService.sanitizePublicListing(l));  // ← thêm
```

### 5.5 `services/booking.service.js` (MODIFY)

```javascript
// Thay đổi signature (non-breaking, default param):
async getBookingById(bookingId, userId, role, { ip = null, userAgent = null } = {}) {
  const booking = await Booking.findById(bookingId)
    .populate('customerId', 'firstName lastName email profileImagePath phone')
    .populate('hostId',     'firstName lastName email profileImagePath phone')
    .populate('listingId')
    .lean();

  if (!booking) throw HttpError.NotFound('Booking not found');

  if (
    booking.customerId._id.toString() !== userId &&
    booking.hostId._id.toString() !== userId &&
    role !== 'admin'
  ) throw HttpError.Forbidden();

  // ── UC-06: Location reveal logic ──────────────────────────────────
  const REVEAL_STATUSES = ['approved', 'checked_in', 'completed'];
  const isGuestWithApprovedBooking =
    REVEAL_STATUSES.includes(booking.bookingStatus) &&
    booking.customerId._id.toString() === userId;

  if (isGuestWithApprovedBooking) {
    booking.listingId.fullAddress = locationService.buildFullAddress(booking.listingId);
    // logAccess là fire-and-forget
    locationService.logAccess(userId, bookingId, booking.listingId._id, ip, userAgent);
  }

  // Sanitize public-facing fields bất kể ai xem
  // (giữ fullAddress nếu đã inject)
  const keepFull = isGuestWithApprovedBooking;
  booking.listingId = locationService.sanitizePublicListing(booking.listingId, keepFull);
  // ── End UC-06 ─────────────────────────────────────────────────────

  return booking;
}
```

### 5.6 `controllers/booking.controller.js` (MODIFY)

```javascript
const getBookingById = async (req, res) => {
  const booking = await bookingService.getBookingById(
    req.params.id,
    req.user.id,
    req.user.role,
    { ip: req.ip, userAgent: req.headers['user-agent'] }  // ← thêm
  );
  res.status(HTTP_STATUS.OK).json({ success: true, data: booking });
};
```

### 5.7 `services/notification.service.js` — `sendBookingApproved` (MODIFY)

```javascript
async sendBookingApproved(booking) {
  await booking.populate([
    { path: 'customerId', select: 'firstName lastName email' },
    { path: 'hostId',     select: 'firstName lastName email' },
    { path: 'listingId',  select: 'title streetAddress aptSuite city province country' }, // ← thêm fields
  ]);
  const { customerId: guest, listingId: listing } = booking;
  const fullAddress = locationService.buildFullAddress(listing); // ← thêm

  await Notification.create({
    userId: guest._id,
    type: 'booking_approved',
    title: 'Booking Approved!',
    message: `Your booking for "${listing.title}" has been approved. Address: ${fullAddress}`, // ← thêm address
    link: `/booking/${booking._id}`,
    read: false,
    data: {
      bookingId: booking._id,
      listingId: listing._id,
      fullAddress,  // ← thêm (AC-03)
    },
  });
  return true;
}
```

---

## 6. Test Plan (TDD — RED → GREEN → REFACTOR)

### `location.service.test.js` (8 test cases)

| # | Test | Mô tả |
|:--|:-----|:------|
| 1 | stable offset | Cùng listingId + coords → cùng `mapCenter` (idempotent) |
| 2 | different offset | 2 listingId khác nhau → 2 `mapCenter` khác nhau |
| 3 | offset range | Offset ≤ 150m tính từ tọa độ gốc |
| 4 | no coordinates | `computeStableMapCenter(id, null, null)` → returns `null` |
| 5 | strips sensitive | `sanitizePublicListing` xóa `streetAddress`, `aptSuite`, `coordinates` |
| 6 | preserves public | `sanitizePublicListing` giữ `city`, `province`, `country`, `title` |
| 7 | full address format | `buildFullAddress` ghép đúng chuỗi đầy đủ |
| 8 | skips empty fields | `buildFullAddress` bỏ qua field rỗng/null |

### `listing.location-privacy.test.js` (4 test cases)

| # | Test | AC |
|:--|:-----|:---|
| 1 | Không trả `streetAddress` | AC-01, AC-04 |
| 2 | Không trả `aptSuite` | AC-01, AC-04 |
| 3 | Trả `mapCenter` khi có coordinates | AC-07 stable |
| 4 | `mapCenter: null` khi không có coordinates | Backward-safe |

### `booking.location-reveal.test.js` (5 test cases)

| # | Test | AC |
|:--|:-----|:---|
| 1 | Inject `fullAddress` khi `approved` + caller = customerId | AC-05 |
| 2 | KHÔNG inject khi `pending` | AC-04 |
| 3 | KHÔNG inject khi caller ≠ customerId (dù status approved) | BR-03 |
| 4 | Gọi `locationService.logAccess` khi reveal | AC-06 |
| 5 | Host/Admin thấy booking nhưng không có `fullAddress` inject | BR-04 scope |

---

## 7. Acceptance Criteria Coverage

| AC | Mô tả | File chịu trách nhiệm |
|:---|:------|:---------------------|
| AC-01 | Trang listing không hiện tên đường / số nhà | `location.service.js → sanitizePublicListing` |
| AC-02 | Bản đồ dùng circle blur, không pin chính xác | `location.service.js → computeStableMapCenter` |
| AC-03 | Full address trong notification khi booking approved | `notification.service.js → sendBookingApproved` |
| AC-04 | `GET /listings/:id` không bao giờ trả `street`/`houseNumber` | `listing.service.js → getListingById` |
| AC-05 | Guest của booking approved xem được full address | `booking.service.js → getBookingById` |
| AC-06 | Mọi lần đọc địa chỉ đầy đủ → audit log | `location.service.js → logAccess` |
| AC-07 | F5 nhiều lần trên listing trả `mapCenter` ổn định | `location.service.js → computeStableMapCenter` (seeded) |

---

## 8. Business Rules Coverage

| BR | Quy tắc | Implementation |
|:---|:--------|:---------------|
| BR-01 | Không lộ địa chỉ trước booking | `sanitizePublicListing` trong `listing.service` |
| BR-02 | Map blur bắt buộc | `computeStableMapCenter` → backend trả `mapCenter` đã offset |
| BR-03 | Tiết lộ sau approve | `getBookingById` conditional + status check |
| BR-04 | Host luôn thấy đầy đủ | Out of scope ACs (sẽ xử lý trong UC-08 Host Dashboard) |
| BR-05 | Audit log | `LocationAuditLog` model + `logAccess` |
| BR-06 | Random offset stable | Seeded by `listingId.slice(-8)` |
| BR-07 | Share link không lộ địa chỉ chi tiết | Frontend concern (OpenGraph) |

---

## 9. Risks & Mitigation

| Risk | Impact | Mitigation |
|:-----|:-------|:-----------|
| Listing cũ không có `coordinates` | `mapCenter = null` — frontend không show blur circle | Backward-safe: field optional, `null` là valid state |
| `getListings` (list view) chưa sanitize | `streetAddress` leak ở search results | Plan đã include sanitize trong `getListings` |
| Existing tests cho `getBookingById` fail | Test breaking change | Thêm default `{}` cho `meta` param — non-breaking |
| `logAccess` fail không nên crash request | Audit failure stop main flow | Fire-and-forget: wrap trong `try/catch`, silently log |
| `sanitizePublicListing` mutate original object | Side effects nếu object được dùng lại | Dùng `Object.assign({}, listing)` — shallow copy |

---

## 10. Estimated Effort

| Phase | Tasks | Ước tính |
|:------|:------|:---------|
| 🔴 RED — viết tests trước | 3 test files, 17 test cases | ~1.5h |
| 🟢 GREEN — implement | 2 files create + 4 files modify | ~2h |
| 🔵 REFACTOR — cleanup + review | `/review-server` | ~0.5h |
| **Total** | | **~4h** |

---

## 11. Commit Convention

```
feat(be-server): implement UC-06 location privacy — sanitize public listing API
feat(be-server): implement UC-06 booking location reveal on approved status
feat(be-server): implement UC-06 location audit log model and service
test(be-server): add unit tests for UC-06 location privacy service
```

---

## 12. Next Steps

1. ✅ Plan confirmed → chạy `/tdd-server` để implement
2. Sequence: **Model → Service (location) → listing.service → booking.service → notification.service → Controller → Tests**
3. Sau khi implement → chạy `/review-server` trước khi commit

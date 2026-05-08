---
review_date: 2026-05-07
status: Updated
reviewer: Claude Code (Senior Node.js Engineer)
---

# Server Architecture Review — Rento Backend

## Tổng quan

Rento backend là một Express 5 + Mongoose 8 server theo mô hình **Route → Validator (Zod) → Controller → Service → Model**. Codebase bao gồm 33+ route files, 19 controllers, 24 services, 24 models, 18 validators. Kết quả đánh giá tổng thể: **C+ (Fair)** — có nền tảng tốt nhưng chưa sẵn sàng cho production.

---

## Thống kê

| Metric            | Value                              |
| ----------------- | ---------------------------------- |
| Route files       | 33+                                |
| Controllers       | 19                                 |
| Services          | 24                                 |
| Models            | 24                                 |
| Validators        | 18                                 |
| LoC (Services)    | ~5,045                             |
| Largest service   | `booking.service.js` (1,074 lines) |
| Database indexes  | **0**                              |
| Unit tests        | **0**                              |
| Integration tests | **0**                              |

---

## Điểm mạnh

- Clean separation of concerns theo đúng luồng Route → Controller → Service → Model
- Zod validation framework đã được thiết lập
- Rate limiting (`express-rate-limit`) có trên auth và payment routes
- CORS được cấu hình với origin whitelist
- Socket.IO cho real-time chat
- `asyncHandler` wrapper tồn tại trong `errorHandler.js`
- `HttpError` class với factory methods (`BadRequest`, `NotFound`, v.v.)
- Logger utility với color-coded output

---

## Vấn đề nghiêm trọng (CRITICAL)

### 1. Credentials bị lộ trong `.env`

`.env` file có thể đã được commit vào git history, bao gồm:

- `MONGO_URL` — MongoDB Atlas credentials
- `JWT_SECRET` — có thể forge JWT tokens
- `EMAIL_APP_PASSWORD` — tài khoản email
- `CLOUDINARY_URL` — API keys
- `VNP_HASH_SECRET` — có thể forge VNPay signatures

**Hành động ngay:** Rotate tất cả credentials, kiểm tra git history với `git log --all -- .env`.

### 2. `isHost()` middleware luôn thất bại

`middleware/auth.js`: `isHost()` kiểm tra `req.user.role === 'host'`, nhưng User model chỉ có enum `["user", "admin"]` — không có role `"host"`.

**Fix:** Thêm role `"SUPPLIER"` vào User model hoặc dùng `isOwner` middleware riêng kiểm tra ownership của listing.

### 3. Không có Database Indexes

Không có `.index()` nào trong toàn bộ 24 model files — mọi query đang full collection scan.

**Fix cần thiết:**

```javascript
// User.js
UserSchema.index({ email: 1 });

// Booking.js
BookingSchema.index({ listingId: 1, bookingStatus: 1 });
BookingSchema.index({ customerId: 1 });
BookingSchema.index({ hostId: 1 });
BookingSchema.index({ startDate: 1, endDate: 1 });

// Listing.js
ListingSchema.index({ creator: 1 });
ListingSchema.index({ category: 1, rentalType: 1 });
```

---

## Vấn đề cao (HIGH)

### 4. `booking.service.js` quá lớn (1,074 lines)

Vi phạm Single Responsibility Principle. Service này xử lý: availability checking, booking creation, payment processing, extensions, cancellations, checkout, notifications.

**Đề xuất tách:**

- `booking-core.service.js` — Create, get, delete
- `booking-workflow.service.js` — Approve, reject, checkin/checkout
- `booking-extension.service.js` — Extension requests
- `booking-payment.service.js` — Payment-related operations

### 5. Thiếu Mongoose Transactions cho multi-step operations

`booking.service.js` tạo Booking + PaymentHistory trong sequence mà không dùng transactions. Nếu bước 2 thất bại, bước 1 đã commit = data inconsistency.

**Fix:**

```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  await Booking.create([bookingData], { session });
  await PaymentHistory.create([paymentData], { session });
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}
```

### 6. Không có `asyncHandler` trên booking routes

`routes/booking.js` không wrap controllers với `asyncHandler`. Uncaught promise rejections sẽ không được xử lý bởi global error handler.

**Fix:** Import và áp dụng `asyncHandler` giống như `routes/listing.js`.

### 7. Không có validation middleware trên nhiều routes

`booking.js`, `bookingHistory.js`, `concurrentBooking.js` không có `validate()` middleware. Input đi thẳng vào controller mà không được validate.

### 8. File upload validation yếu

`cloudinary.service.js` chấp nhận `application/octet-stream` và `binary/octet-stream` — tức là bất kỳ file type nào. Chỉ nên whitelist:

```javascript
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
```

### 9. Thiếu `.lean()` trên read-only queries

`booking.service.js` dùng `.populate()` nhưng không kèm `.lean()`. Trả về Mongoose documents đầy đủ thay vì plain JSON — chậm hơn 50%+.

### 10. Business logic trong `auth.controller.js`

Lines 10-19: Validation logic (email regex, password regex) nằm trong controller. Phải chuyển vào `auth.validator.js` và dùng Zod schema nhất quán.

---

## Vấn đề trung bình (MEDIUM)

### 11. Hardcoded business values

`booking.service.js` lines 56-57:

```javascript
const serviceFee = 0.10;  // Nên ở config
const tax = 0.05;         // Nên ở config
```

**Fix:** Tạo `/server/config/defaults.js`:

```javascript
module.exports = {
  PAYMENT: { SERVICE_FEE_PERCENT: 0.10, TAX_PERCENT: 0.05, DEPOSIT_PERCENT: 0.30 },
  BOOKING: { INTENT_TIMEOUT_MS: 30 * 60 * 1000 },
  FILE: { MAX_SIZE: 10 * 1024 * 1024, MAX_FILES: 10 }
};
```

### 12. Hai error class trùng lặp

`utils/errors.js` (AppError) và `utils/HttpError.js` (HttpError) cùng tồn tại.

**Fix:** Dùng `HttpError` duy nhất (factory methods tốt hơn), deprecate `errors.js`.

### 13. JWT không có expiration

`jwt.sign()` không set `expiresIn` → tokens có lifetime vô hạn.

**Fix:**

```javascript
jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
```

### 14. Password policy không nhất quán

- `auth.validator.js`: min 6 chars
- `auth.controller.js`: min 8 chars + uppercase + lowercase + number

Nên dùng Zod schema làm single source of truth.

### 15. Rate limiting thiếu trên booking endpoints

`/booking` routes chỉ có general limiter (200 req/15min). Nên thêm:

```javascript
const bookingLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
```

### 16. Duplicate CORS config

CORS origins được define ở cả `index.js` (Socket.IO) và `app.js` (Express). Nên centralize vào `config/cors.js`.

### 17. `adminAuth.js` duplicate authentication

`middleware/admin/adminAuth.js` duplicate logic của `authenticateToken` từ `middleware/auth.js`. Nên dùng main auth middleware + `isAdmin` middleware.

### 18. Model schema quá lỏng

```javascript
// User.js — sai
propertyList: { type: Array, default: [] }

// Đúng
propertyList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }]
```

### 19. Booking date validation chỉ là string

`booking.validator.js`:

```javascript
startDate: z.string().min(1)  // Không validate format
```

Nên dùng:

```javascript
startDate: z.string().datetime()  // hoặc z.coerce.date()
```

Và thêm cross-field validation `endDate > startDate`.

### 20. `console.log` thay vì logger

`booking.service.js` có nhiều `console.log()` calls. Dùng `logger` utility đã có sẵn.

---

## Vấn đề nhỏ (LOW)

### 21. Stripe dependency không dùng

`stripe: ^20.1.0` được install nhưng không import ở đâu. Nên remove.

### 22. `crypto` package thừa

`crypto: ^1.0.1` là polyfill — Node.js đã có built-in `crypto`. Remove và dùng `require('crypto')`.

### 23. `querystring` deprecated

Dùng `URLSearchParams` (built-in) hoặc `qs` package thay thế.

### 24. Thiếu graceful shutdown

`index.js` không có handler cho `SIGTERM`/`SIGINT` — MongoDB connection không được đóng khi process exit.

```javascript
process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  process.exit(0);
});
```

### 25. Health check endpoint nghèo nàn

`/health` route trả về generic message. Nên include: DB connection status, uptime, version.

### 26. Không có request logging

Không có Morgan hoặc tương đương. Khó debug/monitor trong production.

---

## Không có tests

Toàn bộ codebase không có automated tests. Scripts trong `package.json` là manual test scripts, không phải test suite. Cần implement:

- Unit tests cho services (Jest)
- Integration tests cho endpoints (Supertest)
- Target: 70%+ code coverage

Xem workflow `/tdd-server` để bắt đầu.

---

## Kế hoạch xử lý theo Phase

### Phase 1 — CRITICAL (Ưu tiên ngay)

- [x] Kiểm tra và rotate tất cả credentials bị lộ
- [x] Fix `isHost()` role bug trong auth middleware
- [x] Thêm database indexes vào Booking, User, Listing models
- [x] Fix file upload validation — whitelist mimetypes
- [x] Đảm bảo `.env` trong `.gitignore`

### Phase 2 — HIGH (Sprint này)

- [x] Wrap tất cả booking routes với `asyncHandler`
- [x] Thêm `validate()` middleware vào booking, notification, payment routes
- [x] Implement Mongoose transactions cho booking creation
- [x] Split `booking.service.js` thành 4 services nhỏ hơn
- [x] Thêm JWT expiration
- [x] Replace `console.log` với `logger`
- [x] Consolidate error classes — chỉ dùng `HttpError`
- [x] Move validation logic ra khỏi `auth.controller.js`

### Phase 3 — MEDIUM (Sprint sau)

- [x] Tạo `/config/defaults.js` cho hardcoded values
- [x] Centralize CORS config
- [x] Fix password policy inconsistency
- [x] Thêm booking rate limiter
- [x] Add `.lean()` cho read-only queries trong booking service
- [x] Thêm graceful shutdown handler
- [x] Request logging (Morgan)
- [x] Improve health check endpoint

### Phase 4 — LOW (Backlog)

- [x] Bắt đầu viết tests (unit → integration)
- [x] Remove unused dependencies (stripe, crypto polyfill, querystring)
- [x] API documentation (Swagger/OpenAPI)
- [ ] Caching layer (Redis) cho search
- [ ] Background job queue (Bull) thay node-cron
- [ ] Error tracking (Sentry)

---

Review date: 2026-05-07 | Reviewer: Claude Code — Senior Node.js Engineer persona

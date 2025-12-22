# 📖 HƯỚNG DẪN SỬ DỤNG WISHLIST - ADD TO WISHLIST

## 🎯 Tính Năng Add to Wishlist

Tính năng này cho phép bạn **lưu các listings yêu thích** để xem lại sau.

---

## 🚀 CÁCH THÊM VÀO WISHLIST

### Bước 1: Đảm Bảo Đã Đăng Nhập ✅

**Điều kiện:**
- ✅ Phải đăng nhập vào hệ thống
- ✅ Không thể thêm listing của chính mình

**Cách kiểm tra:**
- Nhìn góc phải trên → thấy avatar của bạn = đã đăng nhập
- Nếu chưa đăng nhập → Click "Login" và đăng nhập

### Bước 2: Tìm Listing Bạn Thích ❤️

**Nơi tìm listing:**
1. **Trang chủ (Home Page)** - Hiển thị tất cả listings
2. **Search** - Tìm kiếm theo địa điểm
3. **Categories** - Lọc theo loại (Beach, Mountain, v.v.)

### Bước 3: Click Icon Trái Tim ❤️

**Trên mỗi listing card, bạn sẽ thấy:**

```
┌─────────────────────────┐
│  [Ảnh Listing]          │ ← Slider ảnh
│                    ❤️    │ ← CLICK VÀO ĐÂY!
│  Beach House            │
│  Đà Nẵng, Vietnam       │
│  $100/night             │
└─────────────────────────┘
```

**Vị trí icon:**
- Góc phải trên của mỗi listing card
- Icon hình trái tim ❤️

**Cách click:**
1. Di chuột đến icon trái tim
2. Click 1 lần

### Bước 4: Xem Kết Quả 🎉

**Khi THÊM vào wishlist:**
- ❤️ Icon chuyển từ **TRẮNG** → **ĐỎ**
- Console log: "Wishlist updated: Added to wishlist"
- Listing đã được lưu!

**Khi XÓA khỏi wishlist:**
- ❤️ Icon chuyển từ **ĐỎ** → **TRẮNG**
- Console log: "Wishlist updated: Removed from wishlist"
- Listing đã bị xóa!

---

## 📋 XEM DANH SÁCH WISHLIST

### Cách 1: Qua Menu
1. Click vào **avatar** (góc phải trên)
2. Menu dropdown xuất hiện
3. Click **"Wish List"**
4. Trang wishlist mở ra với tất cả listings đã lưu

### Cách 2: Qua URL
```
http://localhost:3000/{userId}/wishlist
```
*(Thay {userId} bằng ID của bạn)*

### Trang Wishlist Hiển Thị Gì?

```
┌────────────────────────────────────────┐
│  Your Wish List                        │
├────────────────────────────────────────┤
│                                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐│
│  │ Beach   │  │ Mountain│  │ City    ││
│  │ House   │  │ Villa   │  │ Apt     ││
│  │ ❤️ $100 │  │ ❤️ $150 │  │ ❤️ $80  ││
│  └─────────┘  └─────────┘  └─────────┘│
│                                        │
└────────────────────────────────────────┘
```

**Trên trang Wishlist bạn có thể:**
- ✅ Xem tất cả listings đã lưu
- ✅ Click vào listing → xem chi tiết
- ✅ Click ❤️ để xóa khỏi wishlist
- ✅ Danh sách tự động cập nhật

---

## 💡 TIPS & TRICKS

### 1. Toggle On/Off
Icon trái tim hoạt động như **công tắc:**
- Click 1 lần = Thêm (❤️ đỏ)
- Click lại = Xóa (❤️ trắng)

### 2. Check Trạng Thái
**Cách biết listing đã trong wishlist:**
- Icon trái tim màu **ĐỎ** = Đã trong wishlist
- Icon trái tim màu **TRẮNG** = Chưa có trong wishlist

### 3. Không Thể Thêm Listing Của Mình
Nếu bạn là chủ listing:
- Icon trái tim vẫn hiển thị
- Nhưng khi click → console log: "Cannot add own listing to wishlist"
- Không có thay đổi

### 4. Phải Đăng Nhập
Nếu chưa đăng nhập:
- Icon trái tim bị **disabled** (mờ)
- Không click được
- Cần login trước

---

## 🔍 DEMO FLOW HOÀN CHỈNH

### Scenario: Lưu một Beach House

**1. Đăng nhập**
```
http://localhost:3000/login
→ Enter email & password
→ Click "Login"
```

**2. Về trang chủ**
```
http://localhost:3000/
→ Thấy danh sách listings
```

**3. Tìm Beach House**
```
Scroll xuống
→ Thấy card "Beach Front Villa"
→ Giá $200/night
```

**4. Thêm vào Wishlist**
```
Hover lên card
→ Thấy icon ❤️ (trắng) góc phải trên
→ Click vào ❤️
→ Icon chuyển sang đỏ ✅
```

**5. Kiểm tra console**
```
Mở DevTools (F12)
→ Tab Console
→ Thấy: "Wishlist updated: Added to wishlist"
```

**6. Vào trang Wishlist**
```
Click avatar (góc phải trên)
→ Click "Wish List"
→ Thấy Beach Front Villa trong danh sách ✅
```

**7. Xóa khỏi Wishlist**
```
Trên trang Wishlist
→ Click ❤️ trên Beach Front Villa
→ Icon chuyển sang trắng
→ Card biến mất khỏi danh sách ✅
```

---

## 🐛 TROUBLESHOOTING

### Vấn đề 1: Icon không đổi màu
**Nguyên nhân:**
- Chưa đăng nhập
- Server không chạy
- Network error

**Giải pháp:**
1. Kiểm tra đã login chưa
2. Check server: `lsof -i :5000` (should see node process)
3. Mở DevTools → Network tab → xem có request failed không
4. Mở Console → xem có error message không

### Vấn đề 2: Click vào ❤️ nhưng không có gì xảy ra
**Nguyên nhân:**
- Button bị disabled (chưa login)
- Đang thêm listing của chính mình

**Giải pháp:**
1. Login vào hệ thống
2. Thử với listing của người khác

### Vấn đề 3: Trang Wishlist trống
**Nguyên nhân:**
- Chưa thêm gì vào wishlist
- Wishlist bị clear

**Giải pháp:**
1. Thêm vài listings vào wishlist trước
2. Refresh trang
3. Check Redux DevTools → state.user.wishList

### Vấn đề 4: Icon đỏ nhưng không thấy trong Wishlist page
**Giải pháp:**
1. Refresh trang Wishlist
2. Check console có errors không
3. Check Network tab xem API calls có thành công không

---

## 🎨 TECHNICAL DETAILS

### API Endpoint
```http
PATCH /user/{userId}/{listingId}
```

**Request:**
- Method: PATCH
- Headers: Content-Type: application/json
- No body needed

**Response Success:**
```json
{
  "message": "Added to wishlist",
  "wishList": ["listingId1", "listingId2", ...]
}
```

**Response Remove:**
```json
{
  "message": "Removed from wishlist",
  "wishList": ["listingId1", ...]
}
```

### Redux State
```javascript
state.user.wishList = [
  "691c477ec358f8a3d6555e6a",
  "691c477ec358f8a3d6555e6b",
  ...
]
```

### Component Code Flow
```javascript
// 1. Check if liked
const isLiked = wishList?.find(item => {
  const itemId = item?._id || item?.id || item;
  return String(itemId) === String(listingId);
});

// 2. On click heart icon
const patchWishList = async () => {
  // Validate user
  if (!user?._id) return;
  if (user._id === creator._id) return;
  
  // Call API
  const response = await fetch(url, {
    method: 'PATCH',
    headers: DEFAULT_HEADERS
  });
  
  // Update Redux
  const data = await response.json();
  dispatch(setWishList(data.wishList));
}

// 3. Render heart icon
<Favorite sx={{color: isLiked ? "red" : "white"}} />
```

---

## ✅ CHECKLIST

Trước khi sử dụng, đảm bảo:

- [ ] Server đang chạy (port 5000)
- [ ] Client đang chạy (port 3000)
- [ ] Đã đăng nhập vào hệ thống
- [ ] Có ít nhất 1 listing trong database (không phải của bạn)

Để test:

- [ ] Click ❤️ → icon chuyển sang đỏ
- [ ] Click lại → icon chuyển về trắng
- [ ] Vào Wish List page → thấy listings đã lưu
- [ ] Click listing → đi đến detail page
- [ ] Xóa từ wishlist → card biến mất

---

## 📞 NEED HELP?

**Documentation:**
- Chi tiết: `docs/WISHLIST_FEATURE_FIXED_VI.md`
- English: `docs/WISHLIST_FIX.md`

**Verify Setup:**
```bash
./verify-wishlist.sh
```

**Check Logs:**
- Client console (F12)
- Server terminal
- Network tab (DevTools)

---

**Happy Wishlisting! ❤️**


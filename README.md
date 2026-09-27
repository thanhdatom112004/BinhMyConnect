# Bình Mỹ Connect

Website đơn giản, chia module: bán nông sản, điểm trải nghiệm, tin tức địa phương, đặt tour/xe tại xã Bình Mỹ, Củ Chi, TP.HCM.

Giao diện tạm dùng template `fruitables-1.0.0` (sẽ chỉnh lại sau). Backend Node.js + MongoDB nằm trong `server/`.

## Chạy local

1. Cài [Node.js](https://nodejs.org/) và [MongoDB](https://www.mongodb.com/try/download/community) (hoặc MongoDB Atlas).
2. Trong thư mục dự án:

```bash
copy .env.example .env
npm install
npm run seed
npm run dev
```

3. Mở http://localhost:5000 (template HTML) và thử API http://localhost:5000/api/home

Khi bạn gửi máy chủ (SRV) sau này, chỉ cần sửa `MONGO_URI`, `JWT_SECRET`, `PORT` trong `.env` rồi `npm start`.

## Tài khoản mẫu (sau `npm run seed`)

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@binhmyconnect.vn` | `admin123` |
| Khách | `an.nguyen@gmail.com` | `123456` |
| Khách | `linh.tran@gmail.com` | `123456` |
| Nông dân | `uttam@binhmyconnect.vn` | `123456` |
| Nông dân | `nhamuoi@binhmyconnect.vn` | `123456` |
| Nông dân | `bosua@binhmyconnect.vn` | `123456` |
| Nông dân | `colan@binhmyconnect.vn` | `123456` |
| Tour | `mietvuon@binhmyconnect.vn` | `123456` |
| Xe | `xebinhmy@binhmyconnect.vn` | `123456` |

Header đăng nhập: `Authorization: Bearer <token>` nhận từ `POST /api/auth/login`.

## Module & API

Gọi JSON, tiền tố `/api`.

### Trang chủ & tìm kiếm
- `GET /api/home` — banner, 4 khối, nông trại nổi bật, nông sản bán chạy, tour 1 ngày từ TP.HCM, tin mới
- `GET /api/search?q=&type=nong_san|nong_trai|tour`

### Tài khoản
- `POST /api/auth/register` — `role`: `customer` | `farmer` | `business`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`

Khách: họ tên, SĐT, khu vực. Nông dân: tên hộ, ấp, mô tả vườn, ảnh, sản phẩm chính. Doanh nghiệp: tên đơn vị, loại `tour` / `xe` / `an_uong` / `luu_tru`.

### Nông sản
- `GET /api/products` — lọc `category=rau|trai_cay|dac_san`, `farm`, `minPrice`, `maxPrice`, `q`, `sort=price_asc|price_desc|rating`
- `GET /api/products/:id`
- `POST /api/products` (nông dân) — admin duyệt mới hiện
- `PUT /api/products/:id` (nông dân)

### Giỏ & đơn
- `GET/POST /api/cart` — thêm `{ productId, quantity }`
- `PUT/DELETE /api/cart/:productId`
- `POST /api/cart/checkout` — `{ shippingAddress, phone, note }`
- `GET /api/orders/products`
- `PATCH /api/orders/products/:id/status` — `cho_xac_nhan` | `dang_giao` | `hoan_tat` | `huy` (nông dân / admin)

### Nông trại trải nghiệm
- `GET /api/farms`
- `GET /api/farms/:id` — giới thiệu, gói, nông sản của hộ, tour gắn điểm
- `GET /api/farms/mine` — nông dân sửa trang vườn
- `POST /api/farms`, `PUT /api/farms/:id`
- `POST /api/farms/:id/packages` — tên, giá, số khách, thời lượng
- `POST /api/farms/:id/book` — khách đặt gói (vườn phải `isOpenForVisitors` + hiện)

Ẩn vườn: `isVisible: false`. Chưa đón khách: `isOpenForVisitors: false`.

### Tour & xe
- `GET /api/tours`, `GET /api/tours/:id`, `POST /api/tours` (doanh nghiệp, chờ duyệt)
- `POST /api/tours/:id/book` — `{ date, guests, phone }`
- `GET /api/vehicles`, `POST /api/vehicles`
- `POST /api/vehicles/:id/book` — `{ pickupPoint, dropoffPoint, pickupTime, guests, phone }`
- Đổi trạng thái: `PATCH /api/orders/tours/:id/status`, `PATCH /api/orders/vehicles/:id/status`, `PATCH /api/orders/experiences/:id/status` — `cho_xac_nhan` | `da_xac_nhan` | `hoan_tat` | `huy`

### Tin tức
- `GET /api/news?category=nong_nghiep|du_lich|su_kien`
- `GET /api/news/:id`
- `POST /api/news` — admin hoặc nông dân; nông dân phải chờ duyệt

### Đánh giá
Chỉ khách **đã hoàn tất** đơn/tour/xe/trải nghiệm mới được đánh giá (không phải chỉ cần đăng nhập).
- `POST /api/reviews` — `{ targetType: product|farm|tour|vehicle, targetId, rating, comment }`
- `GET /api/reviews?targetType=&targetId=`
- `GET /api/reviews/top/farms`, `GET /api/reviews/top/products`

### Nhắn tin & hợp tác
- `GET /api/messages`, `GET /api/messages/:id`
- `POST /api/messages` — `{ toUserId, text, relatedType, relatedId }` (hộ / sản phẩm / tour)
- `GET/POST /api/partnerships` — doanh nghiệp gửi `bao_tieu` hoặc `dua_khach_vao_vuon`
- `PATCH /api/partnerships/:id` — nông dân `{ status: chap_nhan|tu_choi }`

### Admin
- `GET /api/admin/pending`
- `PATCH /api/admin/products/:id` `{ status: approved|rejected }` (tương tự `farms`, `news`, `tours`)
- `GET /api/admin/orders`

## Gắn với HTML hiện có

| Trang template | Nên gọi |
|---|---|
| `index.html` | `GET /api/home` |
| `shop.html` | `GET /api/products` |
| `shop-detail.html` | `GET /api/products/:id` |
| `cart.html` | `GET /api/cart` |
| `chackout.html` | `POST /api/cart/checkout` |
| `testimonial.html` | `GET /api/reviews` |
| `contact.html` | `POST /api/messages` |

File `fruitables-1.0.0/js/binhmy-api.js` là client nhỏ (`window.BinhMyConnect`) để lát nữa nhúng vào các trang khi chỉnh giao diện.

## Dữ liệu mẫu đã có

- 4 nông trại (Út Tám, rau Nhà Mười, bò sữa, vườn Cô Lan) + 1 trang vườn ẩn chờ duyệt
- Nông sản rau / trái cây / đặc sản, có đơn chờ xác nhận, đang giao, hoàn tất
- Tour 1 ngày từ TP.HCM, nửa ngày Củ Chi, xe 4 chỗ / 7 chỗ / nhóm
- Tin nông nghiệp, du lịch, sự kiện; 1 bài chờ duyệt
- Đánh giá đã mua / đã đi, hội thoại khách–nông dân và doanh nghiệp–nông dân, đề nghị hợp tác

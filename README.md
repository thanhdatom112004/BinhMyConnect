# Bình Mỹ Connect

Website kết nối nông dân, khách hàng và doanh nghiệp tại xã Bình Mỹ, Củ Chi, TP.HCM: bán nông sản, điểm trải nghiệm, tin tức, đặt tour và xe.

Giao diện nằm trong `fruitables-1.0.0`. Các trang gọi API qua `js/binhmy-api.js` (`window.BinhMyConnect`) và được đổ dữ liệu bởi `js/bmc-app.js`. Backend Node.js + MongoDB nằm trong `server/`.

## Chạy local

1. Cài [Node.js](https://nodejs.org/). MongoDB dùng Atlas hoặc MongoDB cài trên máy.
2. Tạo file `.env` ở thư mục gốc dự án (đúng tên có dấu chấm). Server không đọc file tên `env`.

```env
PORT=5000
MONGODB_URI=mongodb+srv://.../binhmyconnect
JWT_SECRET=doi-chuoi-bi-mat
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=*
```

`MONGODB_URI` và `MONGO_URI` đều được nhận. Mỗi biến một dòng.

3. Cài gói và chạy:

```bash
npm install
npm run seed
npm run dev
```

Trên PowerShell, nếu `npm` bị chặn script, dùng `npm.cmd install`, `npm.cmd run seed`, `npm.cmd run dev`.

4. Mở http://localhost:5000 và http://localhost:5000/api/home

Chỉ chạy một tiến trình trên cổng `5000`. Nếu báo `EADDRINUSE`, tắt cửa sổ server cũ rồi chạy lại.

`npm run seed` xóa và tạo lại dữ liệu mẫu. Bỏ qua lệnh này nếu database đã có dữ liệu cần giữ. Khi server khởi động, tour và xe thiếu lịch sẽ được bổ sung giờ khởi hành mà không xóa dữ liệu.

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

Đăng nhập trên web tại `login.html`. API dùng header `Authorization: Bearer <token>` từ `POST /api/auth/login`.

## Trang web

| Trang | Việc trên trang |
|---|---|
| `index.html` | Trang chủ từ `GET /api/home`. Bốn ô dẫn tới nông sản, nông trại, tour và tin. Trên điện thoại bốn ô xếp 2 cột. |
| `shop.html` | Danh sách nông sản, lọc loại và sắp xếp |
| `shop-detail.html` | Chi tiết nông sản, thêm giỏ, nhắn chủ hộ |
| `farms.html` | Danh sách nông trại |
| `farm-detail.html` | Giới thiệu vườn. Nút **Đăng ký trải nghiệm** dưới dòng trạng thái đón khách mở hộp thoại đặt gói |
| `tours.html` | Đặt tour theo chuyến có sẵn và đặt xe |
| `news.html` | Danh sách và bài tin |
| `cart.html` | Giỏ hàng |
| `chackout.html` | Đặt hàng nông sản |
| `testimonial.html` | Đánh giá |
| `contact.html` | Nhắn các hộ vườn |
| `login.html` | Đăng nhập và đăng ký |
| `account.html` | Lịch tour, xe, trải nghiệm và đơn nông sản. Khách hủy lịch tại đây |

## Đặt chỗ

Khách đã đăng nhập mới đặt được. Lịch `cho_xac_nhan` hoặc `da_xac_nhan` chặn khung giờ trùng trong cùng tài khoản. Muốn đặt lại thì hủy lịch cũ hoặc chọn giờ khác. Giờ tính theo `Asia/Ho_Chi_Minh`. Không đặt giờ đã qua.

- **Trải nghiệm** `POST /api/farms/:id/book` với `{ packageId, date: "YYYY-MM-DD", time: "HH:mm", guests, phone }`. Cả buổi (giờ đến cộng thời lượng gói) phải nằm trong giờ mở cửa của vườn, kể cả ngày trong tuần nếu vườn ghi rõ. Ngoài giờ thì API bảo chọn giờ khác.
- **Tour** `POST /api/tours/:id/book` với `{ date, guests, phone }`. `date` là `startAt` của một chuyến trong `nextDepartures` (mỗi tour trả về khi `GET /api/tours`). Hết chỗ của chuyến đó thì chọn giờ khác hoặc giảm số khách.
- **Xe** `POST /api/vehicles/:id/book` với `{ pickupPoint, dropoffPoint, pickupTime: "YYYY-MM-DDTHH:mm", guests, phone }`. Xe đã có chuyến trùng giờ thì không đặt được. Số khách không vượt quá số chỗ.

Khách hủy lịch của mình: `PATCH /api/orders/tours/:id/status`, `.../vehicles/:id/status`, `.../experiences/:id/status` với `{ "status": "huy" }`. Lịch `hoan_tat` không hủy. Nông dân, doanh nghiệp và admin vẫn đổi các trạng thái `cho_xac_nhan`, `da_xac_nhan`, `hoan_tat`, `huy` của lịch thuộc đơn vị mình.

## Module & API

Gọi JSON, tiền tố `/api`.

### Trang chủ & tìm kiếm

- `GET /api/home` — banner, 4 khối, nông trại nổi bật, nông sản bán chạy, tin mới
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
- `POST /api/farms/:id/book` — khách đặt gói (vườn phải `isOpenForVisitors` và đang hiện)

Ẩn vườn: `isVisible: false`. Chưa đón khách: `isOpenForVisitors: false`.

### Tour & xe

- `GET /api/tours`, `GET /api/tours/:id` — kèm `nextDepartures` (giờ khởi hành, còn bao nhiêu chỗ)
- `POST /api/tours` (doanh nghiệp, chờ duyệt)
- `POST /api/tours/:id/book`
- `GET /api/vehicles`, `POST /api/vehicles`
- `POST /api/vehicles/:id/book`
- Xem lịch: `GET /api/orders/tours`, `GET /api/orders/vehicles`, `GET /api/orders/experiences`
- Đổi trạng thái: `PATCH /api/orders/tours/:id/status`, `PATCH /api/orders/vehicles/:id/status`, `PATCH /api/orders/experiences/:id/status`

### Tin tức

- `GET /api/news?category=nong_nghiep|du_lich|su_kien`
- `GET /api/news/:id`
- `POST /api/news` — admin hoặc nông dân; nông dân phải chờ duyệt

### Đánh giá

Chỉ khách **đã hoàn tất** đơn, tour, xe hoặc trải nghiệm mới được đánh giá.

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

## Dữ liệu mẫu

- 4 nông trại đang mở (Út Tám, rau Nhà Mười, bò sữa, vườn Cô Lan) và 1 trang vườn ẩn chờ duyệt
- Út Tám mở thứ 6, thứ 7, Chủ nhật. Nhà Mười 06:00–11:00. Bò sữa 08:00–16:00. Cô Lan 08:00–17:00
- Nông sản rau, trái cây, đặc sản. Có đơn chờ xác nhận, đang giao, hoàn tất
- Tour 1 ngày từ TP.HCM (thứ 7 và Chủ nhật 07:00), nửa ngày Củ Chi (thứ 7 07:30), tour chèo xuồng (Chủ nhật 07:30)
- Xe 4 chỗ, 7 chỗ và xe nhóm
- Tin nông nghiệp, du lịch, sự kiện. Một bài chờ duyệt
- Đánh giá của khách đã mua hoặc đã đi, hội thoại và đề nghị hợp tác

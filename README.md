# PetroITM Web

Ứng dụng web quản lý bán hàng và hóa đơn điện tử cho hệ thống cửa hàng xăng dầu. Ứng dụng cung cấp màn hình đăng nhập, tra cứu các lượt bơm, theo dõi trạng thái thanh toán, thanh toán tiền mặt/chuyển khoản bằng QR và quản lý cấu hình phát hành hóa đơn tự động.

> **Trạng thái hiện tại:** đây là frontend React. Backend phải chạy riêng và cung cấp REST API/WebSocket theo các đường dẫn được mô tả trong tài liệu này.

## Mục lục

- [Tính năng](#tính-năng)
- [Công nghệ](#công-nghệ)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt và chạy local](#cài-đặt-và-chạy-local)
- [Biến môi trường](#biến-môi-trường)
- [Cách sử dụng](#cách-sử-dụng)
- [Luồng nghiệp vụ](#luồng-nghiệp-vụ)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Tích hợp API](#tích-hợp-api)
- [Build và triển khai](#build-và-triển-khai)
- [Kiểm thử](#kiểm-thử)
- [Lưu ý vận hành và giới hạn hiện tại](#lưu-ý-vận-hành-và-giới-hạn-hiện-tại)
- [Xử lý sự cố](#xử-lý-sự-cố)

## Tính năng

### Xác thực và phân quyền

- Đăng nhập bằng mã nhân viên/số điện thoại và mật khẩu.
- Gọi `POST /api/v1/auth/login` để nhận access token, thông tin người dùng và danh sách menu.
- Token được mã hóa trước khi lưu vào `localStorage` với khóa `access_token`.
- Tự động xác thực lại phiên bằng `GET /api/v1/users/me` khi tải lại trang.
- Tự động đính kèm token vào header `Authorization` của các request API.
- Bảo vệ route `/dashboard`; người chưa đăng nhập sẽ được chuyển tới `/login`.
- Đăng xuất bằng cách xóa token, menu đã lưu và chuyển về `/login`.

### Tra cứu lượt bơm

Màn hình **Tra cứu lượt bơm** cho phép:

- Chọn khoảng thời gian từ ngày/đến ngày.
- Lọc theo trụ bơm.
- Lọc trạng thái hóa đơn:
  - `Tất cả`
  - `Chưa phát hành`
  - `Đã phát hành`
- Hiển thị mã biên lai, trụ bơm, thời gian, số lượng (lít), thành tiền, trạng thái thanh toán và số hóa đơn.
- Phân trang 20 bản ghi mỗi trang.
- Có giao diện bảng cho desktop và giao diện thẻ cho mobile.

### Thanh toán

Khi chọn một lượt bơm, ứng dụng mở modal **Thanh toán hóa đơn** và hỗ trợ:

- Thanh toán tiền mặt qua `POST /api/v1/petro/pay-cash/{docTruId}`.
- Thanh toán chuyển khoản qua `POST /api/v1/petro/pay-transfer/{docTruId}`.
- Chọn hình thức chuyển khoản từ danh mục backend cung cấp.
- Tạo nội dung QR thanh toán thông qua `GET /api/v1/petro/qr-content`.
- Hiển thị QR ngay trên trình duyệt bằng `react-qr-code`, không gọi dịch vụ QR bên thứ ba.
- Theo dõi kết quả chuyển khoản theo thời gian thực bằng WebSocket:
  `ws://<host>:4111/api/v1/petro/ws/payment/{docTruId}`.
- Tự động đóng modal và tải lại danh sách sau khi thanh toán thành công.

Thông tin tài khoản ngân hàng hiện đang được cấu hình trực tiếp trong mã nguồn:

- Ngân hàng: `Vietcombank`
- Số tài khoản: `0006970436`

Nếu triển khai cho môi trường khác, cần thay đổi cấu hình này hoặc chuyển sang biến môi trường/backend trước khi phát hành.

### Quản lý hóa đơn

- Hiển thị trạng thái đã/chưa phát hành và số hóa đơn trên danh sách lượt bơm.
- Đọc và lưu cấu hình hóa đơn tự động qua:
  - `GET /api/v1/system/auto-invoice-config`
  - `POST /api/v1/system/auto-invoice-config`
- Cấu hình gồm:
  - Bật/tắt tự động phát hành (`AutoInvoice_Enable`)
  - Ngưỡng tiền (`AutoInvoice_Threshold`)
  - Số phút trì hoãn (`AutoInvoice_DelayMins`)
  - Giờ phát hành cuối ngày (`AutoInvoice_EndOfDay`)

### Menu, giao diện và cập nhật

- Sidebar có thể thu gọn/mở rộng.
- Menu nghiệp vụ được tải theo dữ liệu `menus` trả về từ backend.
- Hiển thị người dùng hiện tại, mã người dùng, ngày hiện tại và phiên bản ứng dụng.
- Responsive cho desktop và mobile.
- Toast thông báo thao tác đăng nhập.
- Tự động kiểm tra bản cập nhật qua `GET /api/v1/update/check`.
- Cho phép yêu cầu cập nhật qua `POST /api/v1/update/do-update`, sau đó chờ server khởi động lại và tải lại trang.
- Có service worker và manifest để hỗ trợ cài đặt như PWA.

## Công nghệ

- React 19 và Create React App (`react-scripts` 5).
- React Router DOM 7.
- Redux 5, React Redux và Redux Thunk.
- TanStack React Query.
- Axios.
- Tailwind CSS 3.
- Lucide React.
- `react-qr-code`.
- `react-hot-toast`.
- Workbox service worker.
- Trình quản lý package khuyến nghị: **pnpm** (repository có `pnpm-lock.yaml`).

## Yêu cầu hệ thống

- Node.js phiên bản LTS, khuyến nghị Node.js 20 trở lên.
- pnpm 8 trở lên (hoặc npm tương đương).
- Backend PetroITM chạy được trên máy chủ mà trình duyệt có thể truy cập.
- Cổng `4111` mở cho HTTP REST API và WebSocket.

## Cài đặt và chạy local

### 1. Clone mã nguồn

```bash
git clone <repository-url>
cd petroitm-web
```

### 2. Cài dependencies

```bash
pnpm install
```

Nếu dùng npm:

```bash
npm install
```

### 3. Cấu hình môi trường

Tạo file `.env.local` ở thư mục gốc:

```env
REACT_APP_API_URL=http://127.0.0.1:4111/api/v1
REACT_APP_ENCRYPT_KEY=thay-bang-khoa-bi-mat-cua-moi-truong
```

Không commit `.env`, `.env.local` hoặc bất kỳ secret thật nào vào Git.

> **Lưu ý quan trọng về code hiện tại:** `src/services/api.js` hiện tự tạo base URL theo `window.location.hostname` và cổng `4111`:
>
> `http://<hostname>:4111/api/v1`
>
> Vì vậy `REACT_APP_API_URL` trong file môi trường hiện chưa được sử dụng ở runtime. Nếu backend chạy khác hostname/cổng, cần cập nhật `src/services/api.js` hoặc cấu hình reverse proxy.

### 4. Khởi động môi trường phát triển

```bash
pnpm start
```

Mở [http://localhost:3000](http://localhost:3000). Với npm, dùng `npm start`.

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
| --- | --- | --- |
| `REACT_APP_API_URL` | Theo thiết kế | URL API dự kiến. Hiện chưa được `src/services/api.js` sử dụng trực tiếp. |
| `REACT_APP_ENCRYPT_KEY` | Có | Khóa dùng để mã hóa/giải mã access token trong trình duyệt. Phải giữ ổn định trong suốt phiên bản triển khai. |
| `ENABLE_OBFUSCATION` | Không | Đặt `true` khi build để chạy bước làm rối JavaScript sau build. |

Các biến `REACT_APP_*` được đóng gói vào bundle frontend. Không đặt API secret, private key hoặc thông tin nhạy cảm vào các biến này.

## Cách sử dụng

### Đăng nhập

1. Truy cập `/login`.
2. Nhập mã nhân viên/số điện thoại và mật khẩu.
3. Chọn **Đăng nhập hệ thống**.
4. Khi thành công, ứng dụng chuyển tới `/dashboard`.

Tài khoản đăng nhập do backend quản lý. Frontend không tạo tài khoản mới.

### Tra cứu lượt bơm

1. Chọn ngày bắt đầu và ngày kết thúc.
2. Chọn trụ bơm nếu cần.
3. Chọn trạng thái hóa đơn.
4. Nhấn **Tìm kiếm**.
5. Dùng các nút **Đầu**, **Trước**, **Sau**, **Cuối** để chuyển trang.

### Thanh toán một lượt bơm

1. Nhấn biểu tượng **TT / In** ở bản ghi cần xử lý.
2. Kiểm tra thông tin lượt bơm và QR được tạo.
3. Chọn:
   - **Tiền mặt**, xác nhận để gọi API thanh toán tiền mặt; hoặc
   - **Chuyển khoản**, chọn hình thức thanh toán và xác nhận.
4. Với chuyển khoản, hệ thống chờ sự kiện `PAID` qua WebSocket.
5. Khi thành công, danh sách được tải lại.

### Cấu hình hóa đơn tự động

1. Nhấn **Cài đặt Hóa đơn**.
2. Điều chỉnh trạng thái bật/tắt, ngưỡng tiền, thời gian trì hoãn và giờ cuối ngày.
3. Nhấn **Lưu cài đặt**.

Các giá trị có hiệu lực phụ thuộc vào backend; frontend chỉ đọc và gửi cấu hình.

## Luồng nghiệp vụ

```text
Mở ứng dụng
    |
    +-- Có token? -- Không --> /login
    |                            |
    |                            +-- POST /auth/login
    |                                  |
    |                                  +-- Lưu token + menus --> /dashboard
    |
    +-- Có --> GET /users/me --> /dashboard
                                      |
                                      +-- GET /petro/pumps
                                      +-- GET /petro/danh-muc-thanh-toan
                                      +-- GET /system/auto-invoice-config
                                      +-- GET /petro/sales
                                      |
                                      +-- Chọn lượt bơm
                                            |
                                            +-- GET /petro/qr-content
                                            +-- WebSocket theo dõi thanh toán
                                            +-- POST pay-cash hoặc pay-transfer
```

## Cấu trúc dự án

```text
petroitm-web/
├── public/                         # HTML, favicon, manifest, PWA assets
├── scripts/
│   └── postbuild-obfuscate.js      # Làm rối JS tùy chọn sau build
├── src/
│   ├── assets/                     # Hình ảnh tĩnh
│   ├── constants/                 # Hằng số dùng chung
│   ├── pages/
│   │   ├── users/login/            # Màn hình đăng nhập
│   │   └── home/dashboard/         # Layout, dashboard, bán hàng, updater
│   ├── routers/                    # Route public/protected
│   ├── services/api.js             # Axios instance và Authorization interceptor
│   ├── stores/redux/               # Store, reducer, action xác thực
│   ├── utils/                      # Token, mã hóa, format và validation
│   ├── App.js                      # Bootstrap auth, toast, updater, router
│   └── index.js                    # React root, Redux, Query Client, PWA
├── package.json
├── pnpm-lock.yaml
└── tailwind.config.js
```

## Tích hợp API

Frontend mặc định gọi API tại:

```text
http://<hostname-của-trình-duyệt>:4111/api/v1
```

### Các endpoint đang sử dụng

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| `POST` | `/auth/login` | Đăng nhập bằng multipart form `username`, `password`. |
| `GET` | `/users/me` | Lấy người dùng hiện tại và kiểm tra token. |
| `GET` | `/petro/pumps` | Lấy danh sách trụ bơm. |
| `GET` | `/petro/sales` | Tra cứu lượt bơm, nhận bộ lọc `tu_ngay`, `den_ngay`, `tru_id`. |
| `GET` | `/petro/danh-muc-thanh-toan` | Lấy danh mục hình thức thanh toán. |
| `GET` | `/petro/qr-content` | Tạo nội dung QR với `bank`, `account`, `amount`, `content`. |
| `POST` | `/petro/pay-cash/{docTruId}` | Ghi nhận thanh toán tiền mặt. |
| `POST` | `/petro/pay-transfer/{docTruId}` | Ghi nhận chuyển khoản và `hinh_thuc_thanh_toan`. |
| `GET` | `/system/auto-invoice-config` | Lấy cấu hình hóa đơn tự động. |
| `POST` | `/system/auto-invoice-config` | Lưu cấu hình hóa đơn tự động. |
| `GET` | `/update/check` | Kiểm tra phiên bản mới. |
| `POST` | `/update/do-update` | Yêu cầu backend cập nhật phiên bản. |
| `WS` | `/petro/ws/payment/{docTruId}` | Nhận trạng thái thanh toán thời gian thực. |

Backend nên trả lỗi với thông tin rõ ràng, đặc biệt là trường `detail` cho lỗi đăng nhập và `message`/`error` cho lỗi nghiệp vụ để frontend hiển thị đúng.

### CORS và reverse proxy

Khi frontend chạy ở `localhost:3000` và backend ở cổng `4111`, backend phải cho phép CORS từ origin frontend. Khi triển khai production, nên dùng HTTPS và reverse proxy để phục vụ frontend/API cùng domain, đồng thời dùng `wss://` cho WebSocket.

## Build và triển khai

### Build production

```bash
pnpm build
```

Hoặc:

```bash
npm run build
```

Kết quả được tạo trong thư mục `build/`. Lệnh build tắt source map bằng `GENERATE_SOURCEMAP=false`.

### Bật làm rối JavaScript

Bước `postbuild` luôn được chạy sau `build`, nhưng mặc định bỏ qua làm rối. Để bật:

```bash
pnpm exec cross-env ENABLE_OBFUSCATION=true pnpm build
```

Script sẽ làm rối các file JavaScript trong `build/static/js`. Nên kiểm thử kỹ sau khi bật vì quá trình này làm tăng thời gian build và có thể ảnh hưởng việc debug.

### Phục vụ thư mục build

Có thể triển khai nội dung `build/` lên Nginx, Apache, CDN hoặc máy chủ static hosting. Máy chủ phải:

1. Trả `index.html` cho các route SPA như `/login` và `/dashboard`.
2. Cho phép frontend truy cập backend REST tại cổng `4111`.
3. Cho phép kết nối WebSocket tới endpoint thanh toán.
4. Phục vụ đúng các file hashed trong `build/static/`.

## Kiểm thử

Chạy test ở chế độ watch:

```bash
pnpm test
```

Chạy một lần trong CI:

```bash
pnpm test -- --watchAll=false
```

Test hiện dùng Jest/React Testing Library theo cấu hình mặc định của Create React App. Trước khi release nên kiểm tra tối thiểu: đăng nhập thành công/thất bại, route bảo vệ, tải danh sách lượt bơm, thanh toán tiền mặt, thanh toán chuyển khoản và xử lý mất kết nối WebSocket.

## Lưu ý vận hành và giới hạn hiện tại

- **Phát hành hóa đơn điện tử đang tạm khóa:** hàm gọi cổng VNPT đã được comment; thao tác hiện chỉ hiển thị thông báo bảo trì, không phát hành hóa đơn thật.
- **Xuất hóa đơn hàng loạt đang tạm khóa:** phần UI bị comment. Logic xử lý hiện tại trong mã nguồn chỉ là giả lập thành công và không gọi API; không dùng cho nghiệp vụ production nếu chưa mở lại và kiểm thử.
- Nút **Quên mật khẩu** và checkbox **Ghi nhớ đăng nhập** hiện chỉ là giao diện, chưa có luồng xử lý riêng.
- Access token được lưu trong `localStorage`; cần cân nhắc mô hình cookie HttpOnly nếu yêu cầu bảo mật production cao hơn.
- File `.env` không nên chứa giá trị secret thật trong repository. Nếu repository đã từng public hoặc đã chia sẻ khóa, cần thay khóa và triển khai lại.
- API hiện dùng HTTP/WS theo hostname và cổng cố định `4111`; production nên chuyển sang HTTPS/WSS.
- Tài khoản ngân hàng tạo QR đang hard-code trong `PetroSales.js`; cần đưa về backend hoặc cấu hình bảo mật nếu có nhiều cửa hàng.
- `serviceWorkerRegistration.register()` khiến trình duyệt có thể giữ asset cũ. Khi release bản mới, cần kiểm tra cache/service worker nếu người dùng chưa thấy phiên bản mới.
- Phiên bản hiển thị trên giao diện hiện được khai báo riêng trong `LoginPage.js` và `Layout.js`; khi phát hành bản mới cần cập nhật đồng bộ.

## Xử lý sự cố

### Không đăng nhập được

1. Kiểm tra backend có chạy tại `http://<frontend-host>:4111` không.
2. Kiểm tra request `POST /api/v1/auth/login` trong DevTools.
3. Kiểm tra CORS nếu request bị chặn bởi trình duyệt.
4. Xóa `access_token` và `menus` trong `localStorage`, sau đó thử lại.

### Danh sách lượt bơm trống

1. Kiểm tra khoảng ngày và trạng thái hóa đơn.
2. Kiểm tra response của `GET /api/v1/petro/sales`.
3. Kiểm tra `GET /api/v1/petro/pumps` nếu bộ lọc trụ bơm không có dữ liệu.
4. Xác nhận token vẫn còn hiệu lực.

### QR không hiển thị hoặc chuyển khoản không cập nhật

1. Kiểm tra response `GET /api/v1/petro/qr-content`.
2. Xác nhận số tiền và mã biên lai của lượt bơm hợp lệ.
3. Kiểm tra backend đã mở WebSocket `/petro/ws/payment/{docTruId}`.
4. Nếu dùng HTTPS, bảo đảm frontend dùng `wss://` thay vì `ws://`.

### Sau build không thấy phiên bản mới

1. Hard refresh trình duyệt.
2. Kiểm tra service worker và cache trong DevTools.
3. Xác nhận file `build/asset-manifest.json`/các file hashed đã được deploy đầy đủ.
4. Kiểm tra server static có trả fallback `index.html` đúng cho route SPA.

## Đóng góp

1. Tạo branch cho thay đổi.
2. Cài dependencies và chạy test trước khi tạo pull request.
3. Không commit secret, token, file `.env` hoặc artifact build nếu repository không yêu cầu.
4. Mô tả rõ thay đổi giao diện, API và ảnh hưởng tới backend trong pull request.

## License

Chưa có thông tin license được khai báo trong repository. Không tự ý phân phối hoặc sử dụng thương mại nếu chưa được chủ sở hữu dự án cho phép.

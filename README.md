# 🖨️ AutoPack Print - Công cụ Dàn Trang In Ảnh A4 Tự Động & Tối Ưu Bố Cục

Ứng dụng web chuyên nghiệp hỗ trợ dàn trang in ảnh khổ A4 tự động thông minh, tối ưu diện tích giấy in, tùy biến kích thước hàng loạt, cân chỉnh màu sắc & làm nét ảnh tự động, hỗ trợ in trực tiếp và xuất file chất lượng cao 300 DPI hoặc tải trọn bộ file ZIP.

---

## 🌟 Cây thư mục dự án (Project Structure)

```text
autopack-print/
├── src/
│   ├── components/
│   │   ├── A4PreviewArea.tsx        # Vùng xem trước A4, thước đo mm, lưới căn lề, kéo chỉnh tâm ảnh
│   │   ├── BatchToolsSidebar.tsx    # Thanh công cụ xử lý hàng loạt, bộ kích thước chuẩn, in ấn & xuất file
│   │   ├── CropModal.tsx            # Hộp thoại cắt cúp, xoay, lật, bộ lọc màu & chỉnh sáng chi tiết
│   │   ├── CustomSizeModal.tsx      # Hộp thoại tạo & lưu kích thước in tùy chỉnh cá nhân
│   │   ├── ImageListSidebar.tsx     # Danh sách ảnh đã tải lên, thay đổi số lượng, đánh giá nét DPI
│   │   └── Toast.tsx                # Thông báo nổi (Toasts) tương tác người dùng
│   ├── utils/
│   │   ├── imageUtils.ts            # Xử lý render Canvas 300 DPI, làm nét, chỉnh màu, nén & xuất ZIP
│   │   └── packing.ts               # Thuật toán xếp ảnh tối ưu Shelf Packing trên khổ A4
│   ├── types.ts                     # Định nghĩa kiểu dữ liệu TypeScript
│   ├── App.tsx                      # Component chính điều phối luồng dữ liệu & phím tắt toàn cục
│   ├── main.tsx                     # Entry point khởi chạy ứng dụng React
│   └── index.css                    # Tailwind CSS & quy chuẩn in ấn khổ A4 (@media print)
├── .env.example                     # Mẫu biến môi trường
├── .gitignore                       # Danh sách tệp loại trừ khi commit Git
├── package.json                     # Quản lý phụ thuộc & lệnh thực thi
├── vite.config.ts                   # Cấu hình Vite & Tailwind plugin
└── README.md                        # Hướng dẫn chi tiết dự án
```

---

## ✨ Tính năng nổi bật & Toàn diện

### 1. 📥 Tải & Quản lý danh sách ảnh thông minh
- **Đa dạng phương thức nhập**: Chọn file từ máy tính, kéo thả tệp (Drag & Drop) hoặc dán trực tiếp từ bộ nhớ tạm Clipboard / Zalo (`Ctrl + V`).
- **Thử nghiệm nhanh**: Nút *"Thử ngay với ảnh mẫu"* hỗ trợ nạp bộ ảnh chất lượng cao để trải nghiệm ngay lập tức.
- **Đánh giá độ nét (DPI Analyzer)**: Tự động phân tích kích thước tệp và hiển thị huy hiệu chất lượng in thực tế:
  - 🟢 **300 DPI**: Chuẩn in ấn studio chuyên nghiệp.
  - 🔵 **Chuẩn nét**: Đáp ứng tốt nhu cầu in ảnh cá nhân.
  - 🟡 **Cảnh báo mờ**: Nhắc nhở người dùng khi ảnh có độ phân giải quá thấp.
- **Sắp xếp thứ tự linh hoạt**: Nút di chuyển vị trí (Lên/Xuống) hoặc kéo thả trực tiếp (`⠿` Grip) trên danh sách.
- **Tùy chỉnh số lượng in**: Tăng/giảm số lượng bản in từng ảnh hoặc chọn nhanh (1, 2, 3, 4, 5 bản).

---

### 2. 📐 Đa dạng kích thước & Hình dạng (Presets & Custom Size)
- **Kích thước thông dụng & Decor**:
  - 5x7 cm, 6x8 cm, **6x9 cm (phổ biến nhất)**, 9x12 cm, 10x15 cm (4R), 13x18 cm (5R), 15x21 cm (A5).
  - Polaroid (8x10 cm), Thẻ bài / Photocard Kpop (5.4x8.6 cm), Vuông (6x6 cm, 8x8 cm, 10x10 cm).
- **Ảnh thẻ chuẩn quốc tế**:
  - 3x4 cm, 4x6 cm, Passport quốc tế (3.5x4.5 cm).
- **Hình dạng đặc biệt**:
  - **Chữ nhật / Vuông** bo góc mềm mại.
  - **Hình tròn** (Sticker, Huy hiệu, Tag dán).
  - **Hình trái tim** (Quà tặng, móc khóa, kỷ niệm).
- **Tạo & Lưu kích thước tùy chỉnh (Custom Size Modal)**:
  - Tự do nhập kích thước theo đơn vị Centimet (cm) hoặc Milimet (mm).
  - Tùy chọn hình dạng và xem trước tỷ lệ thực trực quan.
  - Lưu mẫu kích thước cá nhân vào bộ nhớ để tái sử dụng mọi lúc.

---

### 3. ⚡ Thao tác xử lý hàng loạt (Batch Tools)
- **Áp dụng kích thước đồng loạt**: Đổi kích thước toàn bộ ảnh chỉ với 1 cú click.
- **Xoay 90° tất cả**: Đổi chiều ảnh ngang/dọc nhanh chóng.
- **Đồng bộ số lượng in**: Thay đổi số bản in cho tất cả các bức ảnh cùng lúc.
- **Tự động cân chỉnh màu sắc & sáng**: Tự động cân bằng sáng, cải thiện độ tương phản (Auto Levels) giúp ảnh in ra không bị tối hay xỉn màu.
- **Tăng chất lượng TẤT CẢ**: Thuật toán Unsharp Masking ma trận convolution giúp tái tạo độ sắc nét, khử mờ cho toàn bộ ảnh.
- **Khôi phục màu gốc**: Hoàn tác các tùy chỉnh màu sắc về nguyên bản dễ dàng.

---

### 4. 🖼️ Vùng xem trước A4 & Trải nghiệm in ấn tương tác cao
- **Thuật toán Shelf Packing tối ưu**: Tự động xếp kín ảnh theo diện tích trang A4 (khổ Dọc hoặc Ngang).
- **Đo lường hiệu suất giấy (% Efficiency)**: Hiển thị tỷ lệ diện tích sử dụng thực tế (ví dụ: *88% diện tích*) trên từng trang.
- **Thước đo mm & Lưới căn lề**: Tích hợp thước đo milimet thực và lưới ô 10mm giúp căn chỉnh lề in chính xác.
- **Kéo chỉnh tâm trực tiếp (Direct Pan)**: Kéo rê chuột trực tiếp trên từng bức ảnh trong trang A4 để chọn góc crop đẹp nhất (tỉ lệ 1:1 pixel).
- **Hoán đổi vị trí ảnh (Drag & Drop Swap)**: Kéo biểu tượng `⠿` trên ảnh để đổi vị trí cho nhau giữa các khung hình.
- **Đường nét đứt cắt giấy (Cut lines)**: Tùy chọn bật/tắt viền phụ trợ khi cắt ảnh sau khi in.
- **Tùy chỉnh lề & khoảng cách**: Tự do điều chỉnh lề trang (Margin: 0–20mm) và khoảng cách giữa các ảnh (Gap: 0–15mm).
- **Chế độ Zen Mode**: Xem trước A4 toàn màn hình không bị phân tâm.

---

### 5. 🎨 Bộ chỉnh sửa ảnh chuyên sâu (Crop & Filter Modal)
- Khung cắt ảnh tự do hoặc khóa theo tỷ lệ in chuẩn.
- Phóng to / Thu nhỏ (Scale Zoom từ 1.0x đến 3.0x).
- Xoay tự do theo độ hoặc xoay nhanh 90°, lật ảnh ngang/dọc (Flip Horizontal/Vertical).
- Tinh chỉnh thủ công: Độ sáng (Brightness), Độ tương phản (Contrast), Độ bão hòa màu (Saturation).
- Bộ lọc màu nghệ thuật: *Tự nhiên, Đen trắng (B&W), Vintage/Sepia, Ấm áp (Warm), Lạnh (Cool), Tươi tắn (Vivid)*.
- **Smart Portrait Crop**: Tự động lấy nét và canh giữa gương mặt khi xếp ảnh chân dung.

---

### 6. 🖨️ In ấn & Xuất file chuyên nghiệp
- **In trực tiếp chuẩn A4 (`Ctrl + P`)**: Được tối ưu bằng CSS `@media print` giúp in chính xác kích thước thật, không bị lệch lề, không viền thừa trình duyệt.
- **Xuất ảnh siêu nét 300 DPI**: Kết xuất từng trang A4 thành file PNG / JPG chất lượng in ấn độ phân giải cao.
- **Tải trọn bộ file ZIP**: Xuất toàn bộ các trang A4 thành 1 file nén `.zip` tiện lợi chỉ trong vài giây.
- **Hệ thống Hoàn tác (Undo `Ctrl+Z` / Redo `Ctrl+Y`)**: Lưu trữ lịch sử thao tác, cho phép quay lại bước trước an toàn.

---

## ⌨️ Phím tắt tiện ích (Keyboard Shortcuts)

| Phím tắt | Chức năng |
| :--- | :--- |
| `Ctrl + P` / `Cmd + P` | Mở hộp thoại in ấn tiêu chuẩn A4 |
| `Ctrl + V` / `Cmd + V` | Dán ảnh trực tiếp từ Clipboard / Zalo |
| `Ctrl + Z` / `Cmd + Z` | Hoàn tác thao tác gần nhất (Undo) |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Làm lại thao tác vừa hoàn tác (Redo) |
| `Kéo rê trên ảnh A4` | Di chuyển tâm ảnh (Pan/Framing) |
| `Kéo biểu tượng ⠿` | Hoán đổi vị trí 2 bức ảnh trên trang in |
| `Nhấp đúp vào ảnh` | Mở trình chỉnh sửa cắt cúp & bộ lọc màu |

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS (chế độ in ấn & giao diện Pastel hiện đại)
- **Thư viện đồ họa & Tiện ích**:
  - `JSZip`: Đóng gói file ZIP xuất hàng loạt trang in.
  - `lucide-react`: Hệ thống icon vector nhất quán.
  - `HTML5 Canvas API`: Kết xuất đồ họa 300 DPI và xử lý ma trận làm nét/chỉnh màu.

---

## 🚀 Hướng dẫn cài đặt & Chạy cục bộ

```bash
# 1. Clone mã nguồn về máy
git clone https://github.com/your-username/autopack-print.git
cd autopack-print

# 2. Cài đặt các thư viện phụ thuộc
npm install

# 3. Chạy môi trường phát triển (Dev)
npm run dev

# 4. Đóng gói mã nguồn (Production Build)
npm run build
```

---

## 🌐 Hướng dẫn Triển khai (Deployment Guide)

Dự án tương thích hoàn hảo để triển khai trên các nền tảng:
- **Vercel / Netlify / Cloudflare Pages**: Kết nối GitHub repository và chọn build command `npm run build`, output directory `dist`.
- **Node.js Hosting (cPanel / Tenten / Vibe Host / Cloud Run)**:
  - Khởi tạo cổng kết nối động qua `process.env.PORT || 3000`.
  - Chạy ứng dụng qua lệnh tiêu chuẩn `npm start` hoặc trỏ trực tiếp thư mục `dist/` vào Web Root (Static Hosting).

---

## 📄 Giấy phép (License)

Phát hành theo giấy phép **MIT License**. Tự do sử dụng, tùy biến cho mục đích cá nhân và thương mại.


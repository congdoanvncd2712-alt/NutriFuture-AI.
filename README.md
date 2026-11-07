# NutriFuture – Ứng dụng học tập và thực hành dinh dưỡng cho học sinh THPT

Website tĩnh (HTML/CSS/JS thuần), chạy trực tiếp trên GitHub Pages, không cần máy chủ.

## Đăng lên github.io
1. Tạo repo mới trên GitHub (ví dụ `nutrifuture`), tải 4 file lên: `index.html`, `style.css`, `app.js`, `foods.js`.
2. Vào **Settings → Pages → Build and deployment → Source: Deploy from a branch**, chọn nhánh `main`, thư mục `/ (root)` → Save.
3. Sau 1–2 phút, web có tại `https://<tên-tài-khoản>.github.io/nutrifuture/`.
(GitHub Pages dùng https nên camera trên điện thoại hoạt động bình thường.)

## Lấy khóa Gemini API miễn phí
1. Mở https://aistudio.google.com/apikey và đăng nhập tài khoản Google.
2. Bấm **Create API key** → chọn/tạo project → sao chép khóa (bắt đầu bằng `AIza…`).
3. Mở web NutriFuture → bấm ⚙️ ở góc phải → dán khóa → **Lưu**.
Khóa chỉ lưu trong trình duyệt của người dùng (localStorage), **không ghi vào mã nguồn** để tránh bị lộ khi repo công khai. Mỗi học sinh tự nhập khóa của mình trên thiết bị của họ.

## Model AI
Mặc định app thử lần lượt `gemini-flash-lite-latest` → `gemini-2.5-flash-lite` → `gemini-flash-latest` (nhanh, ít tốn hạn mức nhất) và nhớ model chạy được. Có thể nhập tên model khác trong ⚙️ nếu Google đổi tên. Hạn mức miễn phí có giới hạn số lượt/phút và/ngày; hết lượt app sẽ báo “thử lại sau”.

## Dữ liệu & cách tính
- 252 món lấy từ bảng trong file của bạn + 9 món cơ bản bổ sung (cơm trắng, 7 loại trái cây, trứng luộc, sữa) để dựng thực đơn.
- Cột “Đặc sản”, “Có thể chứa (dị ứng)” và “Vitamin & khoáng chất” **do hệ thống ước tính theo tên món/nhóm thực phẩm** – nên rà soát lại trong `foods.js`.
- BMI: ngưỡng châu Á – Thái Bình Dương (18,5 / 23 / 25). Calo: Mifflin–St Jeor × hệ số vận động. Nước: 33 ml/kg.

# NutriFuture — Web tĩnh cho GitHub Pages

## Cấu trúc
- `index.html` — giao diện + 6 tính năng
- `js/app.js` — toàn bộ logic (hồ sơ, tra cứu, Gemini, thực đơn, nhật ký, game)
- `js/foods.js` — CSDL 253 món (sinh từ file docx)
- `js/config.js` — nơi dán API key Gemini

## Lấy API key Gemini miễn phí
1. Vào https://aistudio.google.com/apikey và đăng nhập Google.
2. Bấm **Create API key**, chọn/tạo project, sao chép key (dạng `AIza...`).
3. Dán vào `js/config.js` tại `GEMINI_API_KEY`.
4. Model dùng mặc định: `gemini-2.5-flash-lite` (nhanh, ít tốn quota), tự dự phòng `gemini-2.0-flash-lite` khi gặp lỗi 429/404.

## Bảo mật key trên github.io
Web tĩnh không giấu được key khỏi trình duyệt. Hãy vào Google Cloud Console → Credentials:
- Application restrictions: **HTTP referrers** → `https://<user>.github.io/*`
- API restrictions: chỉ **Generative Language API**
- Đặt quota thấp (vd 100–200 request/ngày). Nếu thấy lỗi 429 bất thường, hãy tạo key mới.

## Deploy
Đẩy toàn bộ thư mục lên repo → Settings → Pages → Deploy from a branch → `main` / root.

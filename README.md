# Tài & Linh — Online Wedding Invitation

Demo thiệp cưới online bằng Next.js, TypeScript và CSS thuần.

## 1. Cài đặt

```bash
npm install
npm run dev
```

Mở http://localhost:3000

## 2. Build production

```bash
npm run build
npm start
```

## 3. Deploy Vercel

Push project lên GitHub, sau đó import repository vào Vercel.

Hoặc dùng Vercel CLI:

```bash
npm i -g vercel
vercel
```

## 4. Chỉnh nội dung

File chính:

```text
components/WeddingInvitation.tsx
```

Bạn có thể sửa:

- Tên cô dâu/chú rể
- Ngày cưới
- Địa điểm
- Timeline
- Nội dung câu chuyện
- Link Google Maps
- Ảnh gallery

## 5. RSVP

Bản demo hiện chỉ hiển thị thông báo ở frontend.

Khi làm production, có thể kết nối:

- Supabase
- Vercel Postgres
- API Route / Server Action

để lưu tên khách, số người và lời chúc.

## 6. Ảnh

Demo sử dụng ảnh từ Unsplash qua URL. Khi production nên tải ảnh của bạn lên:

- Vercel Blob
- Cloudinary
- Supabase Storage
- hoặc thư mục `public/`

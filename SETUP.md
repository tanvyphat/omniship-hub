# Hướng dẫn thiết lập Supabase — OmniShip Hub

## Bước 1 — Tạo Supabase Project

Vào Supabase Dashboard → tạo project mới.

Sau khi project được tạo:

- Vào **Project Settings → API**.
- Copy **Project URL**.
- Copy **anon public key**.
- Không đưa `service_role` key vào frontend.

## Bước 2 — Tạo database và RLS

Mở **SQL Editor → New query**, copy toàn bộ nội dung `supabase/schema.sql` và bấm **Run**.

Script sẽ tạo:

- `warehouse_documents`: 1 record = 1 phiếu.
- `warehouse_document_items`: nhiều sản phẩm thuộc 1 phiếu.
- index cho lịch sử.
- RLS chỉ cho tài khoản ADMIN đọc dữ liệu.
- RPC `create_warehouse_document()` để tạo phiếu + các dòng sản phẩm trong một transaction.

## Bước 3 — Tạo tài khoản ADMIN

Vào **Authentication → Users → Add user → Create new user**.

Thiết lập chính xác:

- Email: `admin@gmail.com`
- Password: `admin@admin`
- Bảo đảm user đã ở trạng thái **Confirmed / Email confirmed** để có thể đăng nhập ngay.

Không cần tự tạo row trong `warehouse_documents`; dữ liệu sẽ được tạo từ app.

## Bước 4 — Xác nhận tài khoản ADMIN

Trong **Authentication → Users**, mở `admin@gmail.com`. Kiểm tra trường xác nhận email. Supabase không cho phép đăng nhập bằng password nếu email của user chưa được xác nhận khi tùy chọn **Confirm Email** đang bật. citeturn278159search6turn278159search3

Nếu đang tạo user bằng Admin API, có thể auto-confirm bằng `email_confirm: true`; trong Dashboard, hãy dùng tùy chọn xác nhận user/email tương ứng. citeturn278159search0

## Bước 5 — Cấu hình frontend

Tạo `.env` từ `.env.example`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
```

Khởi động:

```bash
npm install
npm run dev
```

## Bước 6 — Kiểm tra flow

1. Mở `/login`.
2. Đăng nhập `admin@gmail.com` / `admin@admin`.
3. Tạo phiếu xuất: chọn TikTok hoặc Shopee → nhập thông tin → thêm nhiều sản phẩm → lưu.
4. Tạo phiếu hoàn theo flow tương tự.
5. Mở lịch sử TikTok/Shopee.
6. Dùng F5 ở một URL sâu như `/warehouse/outbound/create?platform=tiktok`; route vẫn được giữ.
7. Thử filter từ/đến. Khoảng thời gian lớn hơn 1 năm sẽ bị từ chối ở frontend.

## Bước 7 — Deploy

### Vercel

Import repository/project. Không cần thêm rewrite thủ công vì `vercel.json` đã có.

Thêm Environment Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Netlify

`public/_redirects` đã được thêm để hỗ trợ SPA deep-link.

Thêm cùng hai Environment Variables.

## Bảo mật

Frontend chỉ giữ Supabase anon key. Quyền đọc dữ liệu được bảo vệ ở database bằng RLS. RPC tạo phiếu dùng `SECURITY DEFINER` và kiểm tra email ADMIN trước khi insert; không tin vào một cờ role do frontend gửi lên.

## Khắc phục lỗi "Không thể lưu phiếu"

Tính năng Lưu phiếu gọi RPC `public.create_warehouse_document(jsonb, jsonb)`. Nếu app báo lỗi khi lưu, mở **Supabase → SQL Editor** và chạy:

```sql
select routine_schema, routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'create_warehouse_document';
```

Kết quả phải có đúng `public / create_warehouse_document`. Nếu không có, chạy lại toàn bộ `supabase/schema.sql`.

Kiểm tra quyền:

```sql
select has_function_privilege(
  'authenticated',
  'public.create_warehouse_document(jsonb, jsonb)',
  'EXECUTE'
);
```

Kết quả phải là `true`.

Sau khi thay đổi SQL, đăng xuất rồi đăng nhập lại frontend để lấy JWT mới.

## Cấu trúc phiếu nhiều đơn

Một phiếu OmniShip Hub hiện đại diện cho một đợt xuất/hoàn theo ngày và nền tảng. Mỗi dòng sản phẩm có **Mã đơn hàng riêng**, vì vậy một mã đơn có thể xuất hiện trên nhiều dòng khi cùng một đơn có nhiều sản phẩm.

### Database migration

Schema mới bổ sung `warehouse_document_items.order_code` và tự backfill mã đơn cũ từ `warehouse_documents.order_code` (trường legacy). Chạy lại `supabase/schema.sql` trong Supabase SQL Editor; script dùng `IF NOT EXISTS`/`ALTER` an toàn và không yêu cầu xóa dữ liệu cũ.

# OmniShip Hub — Warehouse Management

Web app quản lý phiếu xuất hàng và phiếu hoàn hàng cho TikTok Shop / Shopee.

## Stack

- React + TypeScript + Vite
- TailwindCSS
- Supabase Authentication + PostgreSQL + Row Level Security
- ExcelJS cho export `.xlsx`
- React Router cho flow step-by-step và deep-link/reload ổn định

## Luồng URL

- `/login` — đăng nhập ADMIN
- `/` — dashboard
- `/warehouse/outbound/platform` — chọn nền tảng xuất hàng
- `/warehouse/outbound/create?tiktok|shopee` — tạo phiếu xuất
- `/warehouse/returns/platform` — chọn nền tảng hoàn hàng
- `/warehouse/returns/create?tiktok|shopee` — tạo phiếu hoàn
- `/warehouse/history/tiktok` — lịch sử TikTok
- `/warehouse/history/shopee` — lịch sử Shopee

> Các route tạo phiếu cũng chấp nhận `?platform=tiktok|shopee`. Route redirect về `platform` nếu query không hợp lệ.

## 1. Cài đặt

```bash
npm install
cp .env.example .env
npm run dev
```

## 2. Supabase

1. Tạo project Supabase.
2. Mở **SQL Editor** và chạy toàn bộ `supabase/schema.sql`.
3. Vào **Authentication → Users → Add user** và tạo:
   - Email: `admin@gmail.com`
   - Password: `admin@admin`
4. Chỉ dùng Supabase **anon key** ở frontend. Không đưa `service_role` key vào `.env` frontend.
5. Điền URL + anon key vào `.env`.

Schema đã bật RLS và giới hạn dữ liệu app cho tài khoản ADMIN theo email `admin@gmail.com`.

## 3. Build production

```bash
npm run build
npm run preview
```

## Excel export

Mỗi phiếu xuất/hoàn được tải xuống thành workbook gồm:

- `PHIEU` — bố cục phiếu chuyên nghiệp, tiêu đề, thông tin đơn và bảng sản phẩm.
- `CHI_TIET` — dữ liệu chi tiết phù hợp để đối soát/import.
- `THONG_TIN` — metadata nền tảng, loại phiếu, tổng sản phẩm.

## Lưu ý dữ liệu

Ngày được lưu dạng PostgreSQL `date` để filter/sort chính xác; giao diện nhập/hiển thị `dd/MM/yyyy`. Mỗi phiếu có nhiều dòng `document_items` và tổng số lượng được tính từ các dòng đó.

## Cấu trúc phiếu nhiều đơn

Một phiếu OmniShip Hub hiện đại diện cho một đợt xuất/hoàn theo ngày và nền tảng. Mỗi dòng sản phẩm có **Mã đơn hàng riêng**, vì vậy một mã đơn có thể xuất hiện trên nhiều dòng khi cùng một đơn có nhiều sản phẩm.

### Database migration

Schema mới bổ sung `warehouse_document_items.order_code` và tự backfill mã đơn cũ từ `warehouse_documents.order_code` (trường legacy). Chạy lại `supabase/schema.sql` trong Supabase SQL Editor; script dùng `IF NOT EXISTS`/`ALTER` an toàn và không yêu cầu xóa dữ liệu cũ.

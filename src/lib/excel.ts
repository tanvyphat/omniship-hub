import ExcelJS from 'exceljs';
import type { DocumentInput } from '../types/document';
import { getTodayISO } from './date';

const navy = '0F172A';
const blue = '2563EB';
const lightBlue = 'EFF6FF';
const slate = '475569';
const border = 'CBD5E1';

function addBorder(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: border } },
      left: { style: 'thin', color: { argb: border } },
      bottom: { style: 'thin', color: { argb: border } },
      right: { style: 'thin', color: { argb: border } },
    };
  });
}

function platformLabel(platform: DocumentInput['platform']) {
  return platform === 'tiktok' ? 'TikTok Shop' : 'Shopee';
}

export async function exportDocumentExcel(input: DocumentInput) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'OmniShip Hub';
  workbook.created = new Date();

  const includeVariant = true;
  const sheet = workbook.addWorksheet('PHIEU', { views: [{ showGridLines: false }] });

  sheet.columns = [
    { width: 6 }, { width: 24 }, { width: 32 }, { width: 30 }, { width: 22 }, { width: 18 }, { width: 15 },
  ];

  const lastColumn = 'G';
  sheet.mergeCells(`A1:${lastColumn}1`);
  sheet.getCell('A1').value = input.type === 'outbound' ? 'PHIẾU XUẤT HÀNG' : 'PHIẾU HOÀN HÀNG';
  sheet.getCell('A1').font = { name: 'Times New Roman', size: 20, bold: true, color: { argb: 'FFFFFF' } };
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: navy } };
  sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 32;

  if (includeVariant) {
    sheet.mergeCells('A3:B3');
    sheet.getCell('A3').value = 'Nền tảng';
    sheet.mergeCells('C3:G3');
    sheet.getCell('C3').value = platformLabel(input.platform);
    sheet.mergeCells('A4:B4');
    sheet.getCell('A4').value = 'Ngày';
    sheet.mergeCells('C4:G4');
    sheet.getCell('C4').value = input.documentDate;
  } else {
    sheet.mergeCells('A3:B3');
    sheet.getCell('A3').value = 'Nền tảng';
    sheet.mergeCells('C3:F3');
    sheet.getCell('C3').value = platformLabel(input.platform);
    sheet.mergeCells('A4:B4');
    sheet.getCell('A4').value = 'Ngày';
    sheet.mergeCells('C4:F4');
    sheet.getCell('C4').value = input.documentDate;
  }

  for (let rowNumber = 3; rowNumber <= 4; rowNumber += 1) {
    sheet.getRow(rowNumber).eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: border } },
        left: { style: 'thin', color: { argb: border } },
        bottom: { style: 'thin', color: { argb: border } },
        right: { style: 'thin', color: { argb: border } },
      };
      cell.alignment = { vertical: 'middle' };
    });
  }

  ['A3', 'A4'].forEach((ref) => {
    sheet.getCell(ref).font = { name: 'Times New Roman', bold: true, color: { argb: slate } };
    sheet.getCell(ref).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightBlue } };
  });

  const headers = ['STT', 'Mã đơn hàng', 'Tên sản phẩm', 'SKU', 'Dung tích / Khối lượng', 'Hương / Màu', 'Số lượng'];
  const header = sheet.addRow(headers);
  header.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { name: 'Times New Roman', bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: blue } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  header.height = 30;
  addBorder(header);

  input.items.forEach((item, index) => {
    const row = sheet.addRow([index + 1, item.orderCode, item.productName, item.sku, item.unit, item.variant || '-', item.quantity]);
    row.alignment = { vertical: 'middle', wrapText: true };
    if (index % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
      });
    }
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
    addBorder(row);
  });

  const totalColumn = 'G';
  const totalCell = { formula: `SUM(${totalColumn}${header.number + 1}:${totalColumn}${sheet.rowCount})` };
  const totalRow = sheet.addRow(['', 'TỔNG CỘNG', '', '', '', '', totalCell]);
  totalRow.font = { name: 'Times New Roman', bold: true };
  totalRow.getCell(2).font = { name: 'Times New Roman', bold: true, color: { argb: navy } };
  totalRow.getCell(7).font = { name: 'Times New Roman', bold: true, color: { argb: blue } };
  addBorder(totalRow);

  const footerRow = sheet.rowCount + 2;
  sheet.mergeCells(`A${footerRow}:${lastColumn}${footerRow}`);
  sheet.getCell(`A${footerRow}`).value = `Xuất file: ${getTodayISO()} · OmniShip Hub`;
  sheet.getCell(`A${footerRow}`).font = { name: 'Times New Roman', italic: true, size: 9, color: { argb: slate } };

  const detail = workbook.addWorksheet('CHI_TIET', { views: [{ showGridLines: false }] });
  detail.columns = [
    { header: 'STT', key: 'no', width: 8 }, { header: 'Ngày', key: 'date', width: 16 },
    { header: 'Nền tảng', key: 'platform', width: 18 }, { header: 'Loại phiếu', key: 'type', width: 18 },
    { header: 'Mã đơn hàng', key: 'order', width: 24 }, { header: 'Tên sản phẩm', key: 'product', width: 36 },
    { header: 'SKU', key: 'sku', width: 20 }, { header: 'Dung tích / Khối lượng', key: 'unit', width: 24 },
    { header: 'Hương / Màu', key: 'variant', width: 20 }, { header: 'Số lượng', key: 'qty', width: 12 },
  ];
  input.items.forEach((item, index) => {
    detail.addRow({
      no: index + 1,
      date: input.documentDate,
      platform: platformLabel(input.platform),
      type: input.type === 'outbound' ? 'Xuất hàng' : 'Hoàn hàng',
      order: item.orderCode,
      product: item.productName,
      sku: item.sku,
      unit: item.unit,
      variant: item.variant || '-',
      qty: item.quantity,
    });
  });

  const detailHeader = detail.getRow(1);
  detailHeader.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { name: 'Times New Roman', bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: blue } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  detailHeader.height = 28;
  detail.eachRow((row, index) => { if (index > 1) { row.eachCell((cell) => { cell.font = { name: 'Times New Roman' }; }); addBorder(row); } });
  detail.autoFilter = { from: 'A1', to: 'J1' };
  detail.views = [{ state: 'frozen', ySplit: 1, showGridLines: false }];

  const meta = workbook.addWorksheet('THONG_TIN', { views: [{ showGridLines: false }] });
  meta.columns = [{ width: 28 }, { width: 48 }];
  meta.addRows([
    ['Thông tin', 'Giá trị'],
    ['Hệ thống', 'OmniShip Hub'],
    ['Nền tảng', platformLabel(input.platform)],
    ['Loại phiếu', input.type === 'outbound' ? 'Xuất hàng' : 'Hoàn hàng'],
    ['Ngày phiếu', input.documentDate],
    ['Số mã đơn hàng', new Set(input.items.map((item) => item.orderCode.trim()).filter(Boolean)).size],
    ['Số dòng sản phẩm', input.items.length],
    ['Tổng số lượng', input.items.reduce((sum, item) => sum + item.quantity, 0)],
  ]);
  const metaHeader = meta.getRow(1);
  metaHeader.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { name: 'Times New Roman', bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: blue } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  meta.eachRow((row) => addBorder(row));

  workbook.eachSheet((worksheet) => {
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.font = { ...(cell.font ?? {}), name: 'Times New Roman' };
      });
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const orderCodes = Array.from(new Set(input.items.map((item) => item.orderCode.trim()).filter(Boolean)));
  const orderSuffix = orderCodes.length === 0 ? 'Khong-Ma-Don' : `${orderCodes[0]}${orderCodes.length > 1 ? `-va-${orderCodes.length - 1}-ma-khac` : ''}`;
  const safeOrderSuffix = orderSuffix.replace(/[^a-zA-Z0-9-_]/g, '_');
  anchor.download = `${input.type === 'outbound' ? 'Phieu_Xuat' : 'Phieu_Hoan'}_${input.platform}_${input.documentDate.replaceAll('/', '-')}_${safeOrderSuffix}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}

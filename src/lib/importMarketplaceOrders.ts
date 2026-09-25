import ExcelJS from 'exceljs';
import type { DocumentItemInput, Platform } from '../types/document';

export interface MarketplaceImportResult {
  platform: Platform;
  items: DocumentItemInput[];
  totalRows: number;
  cancelledRows: number;
  cancelledOrders: number;
  skippedRows: number;
}

const SHOPEE_HEADERS = [
  'Mã đơn hàng',
  'Trạng Thái Đơn Hàng',
  'Tên sản phẩm',
  'SKU phân loại hàng',
  'Tên phân loại hàng',
  'Số lượng',
];

const TIKTOK_HEADERS = [
  'Order ID',
  'Order Status',
  'Seller SKU',
  'Product Name',
  'Variation',
  'Quantity',
];

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim()
    .toLowerCase();
}

function isCancelledStatus(status: string) {
  const normalized = normalizeText(status);
  return normalized.includes('da huy') || normalized.includes('cancelled') || normalized.includes('canceled');
}

function extractCapacity(productName: string) {
  const match = productName.match(/(\d+(?:[.,]\d+)?)\s*(ml|kg|gr|g|l)\b/i);
  if (!match) return '';

  const amount = match[1].replace(',', '.');
  const unit = match[2].toLowerCase();
  const displayUnit = unit === 'ml' ? 'ml' : unit === 'kg' ? 'KG' : unit === 'gr' ? 'Gr' : unit === 'l' ? 'L' : 'g';
  return `${amount}${displayUnit}`;
}

function rowCellText(row: ExcelJS.Row, column: number) {
  return row.getCell(column).text.trim();
}

function buildHeaderMap(row: ExcelJS.Row) {
  const map = new Map<string, number>();
  row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    const text = cell.text.trim();
    if (text) map.set(text, columnNumber);
  });
  return map;
}

function hasHeaders(map: Map<string, number>, requiredHeaders: string[]) {
  return requiredHeaders.every((header) => map.has(header));
}

function findMarketplaceWorksheet(workbook: ExcelJS.Workbook) {
  for (const worksheet of workbook.worksheets) {
    const maxRowsToScan = Math.min(10, worksheet.rowCount);
    for (let rowNumber = 1; rowNumber <= maxRowsToScan; rowNumber += 1) {
      const headerMap = buildHeaderMap(worksheet.getRow(rowNumber));
      if (hasHeaders(headerMap, SHOPEE_HEADERS)) {
        return { worksheet, headerRowNumber: rowNumber, headerMap, platform: 'shopee' as const };
      }
      if (hasHeaders(headerMap, TIKTOK_HEADERS)) {
        return { worksheet, headerRowNumber: rowNumber, headerMap, platform: 'tiktok' as const };
      }
    }
  }
  throw new Error('Không nhận diện được file Shopee/TikTok. Vui lòng dùng file Excel xuất trực tiếp từ Seller Center.');
}

function getColumn(headerMap: Map<string, number>, header: string) {
  const column = headerMap.get(header);
  if (!column) throw new Error(`Thiếu cột bắt buộc: ${header}`);
  return column;
}

function parseQuantity(text: string) {
  const quantity = Number(text.replace(',', '.'));
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
}

function parseShopeeRow(row: ExcelJS.Row, headerMap: Map<string, number>) {
  const orderCode = rowCellText(row, getColumn(headerMap, 'Mã đơn hàng'));
  const status = rowCellText(row, getColumn(headerMap, 'Trạng Thái Đơn Hàng'));
  const productName = rowCellText(row, getColumn(headerMap, 'Tên sản phẩm'));
  const sku = rowCellText(row, getColumn(headerMap, 'SKU phân loại hàng'));
  const variant = rowCellText(row, getColumn(headerMap, 'Tên phân loại hàng'));
  const quantity = parseQuantity(rowCellText(row, getColumn(headerMap, 'Số lượng')));

  return {
    orderCode,
    status,
    item: {
      orderCode,
      productName,
      sku,
      unit: extractCapacity(productName),
      variant,
      quantity,
    } satisfies DocumentItemInput,
  };
}

function parseTikTokRow(row: ExcelJS.Row, headerMap: Map<string, number>) {
  const orderCode = rowCellText(row, getColumn(headerMap, 'Order ID'));
  const status = rowCellText(row, getColumn(headerMap, 'Order Status'));
  const productName = rowCellText(row, getColumn(headerMap, 'Product Name'));
  const sku = rowCellText(row, getColumn(headerMap, 'Seller SKU'));
  const variant = rowCellText(row, getColumn(headerMap, 'Variation'));
  const quantity = parseQuantity(rowCellText(row, getColumn(headerMap, 'Quantity')));

  return {
    orderCode,
    status,
    item: {
      orderCode,
      productName,
      sku,
      unit: extractCapacity(productName),
      variant,
      quantity,
    } satisfies DocumentItemInput,
  };
}

function isTikTokDescriptionRow(orderCode: string, status: string) {
  const normalizedOrder = normalizeText(orderCode);
  const normalizedStatus = normalizeText(status);
  return normalizedOrder.includes('platform unique order id') || normalizedStatus.includes('current order status');
}

export async function importMarketplaceOrders(file: File, expectedPlatform: Platform): Promise<MarketplaceImportResult> {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  const detected = findMarketplaceWorksheet(workbook);
  if (detected.platform !== expectedPlatform) {
    const expectedLabel = expectedPlatform === 'shopee' ? 'Shopee' : 'TikTok Shop';
    const detectedLabel = detected.platform === 'shopee' ? 'Shopee' : 'TikTok Shop';
    throw new Error(`File này là file ${detectedLabel}, nhưng phiếu hiện tại đang chọn ${expectedLabel}.`);
  }

  const items: DocumentItemInput[] = [];
  const cancelledOrderCodes = new Set<string>();
  let totalRows = 0;
  let cancelledRows = 0;
  let skippedRows = 0;

  for (let rowNumber = detected.headerRowNumber + 1; rowNumber <= detected.worksheet.rowCount; rowNumber += 1) {
    const row = detected.worksheet.getRow(rowNumber);
    const parsed = detected.platform === 'shopee'
      ? parseShopeeRow(row, detected.headerMap)
      : parseTikTokRow(row, detected.headerMap);

    if (!parsed.orderCode && !parsed.item.productName && !parsed.item.sku) continue;
    if (detected.platform === 'tiktok' && isTikTokDescriptionRow(parsed.orderCode, parsed.status)) continue;

    totalRows += 1;

    if (isCancelledStatus(parsed.status)) {
      cancelledRows += 1;
      if (parsed.orderCode) cancelledOrderCodes.add(parsed.orderCode);
      continue;
    }

    if (!parsed.orderCode || !parsed.item.productName || !parsed.item.sku || parsed.item.quantity <= 0) {
      skippedRows += 1;
      continue;
    }

    items.push(parsed.item);
  }

  if (items.length === 0) {
    throw new Error('Không tìm thấy dòng đơn hàng hợp lệ để đưa vào phiếu.');
  }

  return {
    platform: detected.platform,
    items,
    totalRows,
    cancelledRows,
    cancelledOrders: cancelledOrderCodes.size,
    skippedRows,
  };
}

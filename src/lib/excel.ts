import ExcelJS from 'exceljs';
import type {DocumentInput} from '../types/document';
import {getTodayISO} from './date';

const navy = '0F172A';
const blue = '2563EB';
const lightBlue = 'EFF6FF';
const slate = '475569';
const border = 'CBD5E1';

function addBorder(row: ExcelJS.Row) {
    row.eachCell({includeEmpty: true}, (cell) => {
        cell.border = {
            top: {style: 'thin', color: {argb: border}},
            left: {style: 'thin', color: {argb: border}},
            bottom: {style: 'thin', color: {argb: border}},
            right: {style: 'thin', color: {argb: border}},
        };
    });
}

function platformLabel(platform: DocumentInput['platform']) {
    return platform === 'tiktok' ? 'TikTok Shop' : 'Shopee';
}

function moneyValue(value: number | null | undefined) {
    return value == null || Number.isNaN(Number(value)) ? '' : Number(value);
}

function applyDataAlignment(row: ExcelJS.Row) {
    row.eachCell({includeEmpty: true}, (cell) => {
        cell.alignment = {horizontal: 'center', vertical: 'middle', wrapText: true};
    });
}

/** Parse ISO (YYYY-MM-DD) or Vietnamese (D/M/YYYY) dates for chronological export sorting. */
function getBulkExportDateParts(value: string): {year: number; month: number; day: number} | null {
    const normalized = value.trim();
    const iso = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    const vn = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const shortVn = normalized.match(/^(\d{1,2})\/(\d{1,2})$/);
    let year: number; let month: number; let day: number;
    if (iso) { year = Number(iso[1]); month = Number(iso[2]); day = Number(iso[3]); }
    else if (vn) { day = Number(vn[1]); month = Number(vn[2]); year = Number(vn[3]); }
    else if (shortVn) { day = Number(shortVn[1]); month = Number(shortVn[2]); year = new Date().getFullYear(); }
    else return null;
    const check = new Date(Date.UTC(year, month - 1, day));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
    return {year, month, day};
}

function bulkExportDateSortKey(value: string): number {
    const parts = getBulkExportDateParts(value);
    if (parts) return Date.UTC(parts.year, parts.month - 1, parts.day);
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function normalizeBulkExportDate(value: string): string {
    const parts = getBulkExportDateParts(value);
    if (!parts) return value.trim();
    return String(parts.year).padStart(4, '0') + '-' + String(parts.month).padStart(2, '0') + '-' + String(parts.day).padStart(2, '0');
}

function formatBulkExportDate(value: string): string {
    const parts = getBulkExportDateParts(value);
    if (!parts) return value;
    return String(parts.day).padStart(2, '0') + '/' + String(parts.month).padStart(2, '0') + '/' + parts.year;
}

const MAIN_HEADERS = [
    'STT', 'Ngày', 'Mã đơn hàng', 'Tên sản phẩm', 'SKU',
    'Dung tích / Khối lượng', 'Hương / Màu', 'Số lượng', 'Đơn Giá', 'Quyết Toán',
];

const BULK_HEADERS = [
    'STT', 'Ngày', 'Nền tảng', 'Loại phiếu', 'Mã đơn hàng', 'Tên sản phẩm',
    'SKU', 'Dung tích / Khối lượng', 'Hương / Màu', 'Số lượng', 'Đơn Giá', 'Quyết Toán',
];

export async function exportDocumentExcel(input: DocumentInput) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'OmniShip Hub';
    workbook.created = new Date();

    // ==========================================
    // SHEET 1: PHIẾU
    // ==========================================
    const sheet = workbook.addWorksheet('PHIEU', {views: [{showGridLines: false}]});
    sheet.columns = [
        {width: 6}, {width: 14}, {width: 24}, {width: 32}, {width: 30},
        {width: 22}, {width: 18}, {width: 15}, {width: 20}, {width: 20},
    ];

    const lastColumn = 'J';
    sheet.mergeCells(`A1:${lastColumn}1`);
    sheet.getCell('A1').value = input.type === 'outbound' ? 'PHIẾU XUẤT HÀNG' : 'PHIẾU HOÀN HÀNG';
    sheet.getCell('A1').font = {name: 'Times New Roman', size: 20, bold: true, color: {argb: 'FFFFFF'}};
    sheet.getCell('A1').fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: navy}};
    sheet.getCell('A1').alignment = {vertical: 'middle', horizontal: 'center'};
    sheet.getRow(1).height = 32;

    sheet.mergeCells(`A3:B3`);
    sheet.getCell('A3').value = 'Nền tảng';
    sheet.mergeCells(`C3:${lastColumn}3`);
    sheet.getCell('C3').value = platformLabel(input.platform);
    sheet.mergeCells('A4:B4');
    sheet.getCell('A4').value = 'Ngày';
    sheet.mergeCells(`C4:${lastColumn}4`);
    sheet.getCell('C4').value = input.documentDate;

    for (let rowNumber = 3; rowNumber <= 4; rowNumber += 1) {
        sheet.getRow(rowNumber).eachCell({includeEmpty: true}, (cell) => {
            cell.border = {
                top: {style: 'thin', color: {argb: border}},
                left: {style: 'thin', color: {argb: border}},
                bottom: {style: 'thin', color: {argb: border}},
                right: {style: 'thin', color: {argb: border}},
            };
            cell.alignment = {horizontal: 'center', vertical: 'middle', wrapText: true};
        });
    }
    ['A3', 'A4'].forEach((ref) => {
        sheet.getCell(ref).font = {name: 'Times New Roman', bold: true, color: {argb: slate}};
        sheet.getCell(ref).fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: lightBlue}};
    });

    const header = sheet.addRow(MAIN_HEADERS);
    header.eachCell({includeEmpty: true}, (cell) => {
        cell.font = {name: 'Times New Roman', bold: true, color: {argb: 'FFFFFF'}};
        cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: blue}};
        cell.alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};
    });
    header.height = 30;
    addBorder(header);

    const sortedItems = [...input.items].sort((a, b) => (a.orderCode || '').localeCompare(b.orderCode || ''));
    let currentOrderCode = '';
    let startMergeRow = -1;

    sortedItems.forEach((item, index) => {
        const rowIndex = header.number + 1 + index;
        const row = sheet.addRow([
            index + 1,
            input.documentDate,
            item.orderCode,
            item.productName,
            item.sku,
            item.unit,
            item.variant || '-',
            item.quantity,
            moneyValue(item.salePrice),
            moneyValue(item.orderSettlementAmount),
        ]);

        applyDataAlignment(row);
        row.getCell(9).numFmt = '#,##0';
        row.getCell(10).numFmt = '#,##0';
        if (index % 2 === 1) {
            row.eachCell({includeEmpty: true}, (cell) => {
                cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'F8FAFC'}};
            });
        }
        addBorder(row);

        if (item.orderCode !== currentOrderCode) {
            if (startMergeRow !== -1 && rowIndex - 1 > startMergeRow) {
                sheet.mergeCells(startMergeRow, 3, rowIndex - 1, 3);
                sheet.getCell(startMergeRow, 3).alignment = {horizontal: 'center', vertical: 'middle', wrapText: true};
            }
            currentOrderCode = item.orderCode;
            startMergeRow = rowIndex;
        }
    });

    const lastRowIndex = header.number + sortedItems.length;
    if (startMergeRow !== -1 && lastRowIndex > startMergeRow) {
        sheet.mergeCells(startMergeRow, 3, lastRowIndex, 3);
        sheet.getCell(startMergeRow, 3).alignment = {horizontal: 'center', vertical: 'middle', wrapText: true};
    }

    const footerRow = sheet.rowCount + 2;
    sheet.mergeCells(`A${footerRow}:${lastColumn}${footerRow}`);
    sheet.getCell(`A${footerRow}`).value = `Xuất file: ${getTodayISO()} · OmniShip Hub`;
    sheet.getCell(`A${footerRow}`).font = {name: 'Times New Roman', italic: true, size: 9, color: {argb: slate}};

    // ==========================================
    // SHEET 2: TỔNG HỢP SẢN PHẨM
    // ==========================================
    const summarySheet = workbook.addWorksheet('TONG_HOP_SP', {views: [{showGridLines: false}]});
    summarySheet.columns = [
        {header: 'STT', key: 'no', width: 8},
        {header: 'Tên sản phẩm', key: 'product', width: 40},
        {header: 'SKU', key: 'sku', width: 25},
        {header: 'Dung tích / Khối lượng', key: 'unit', width: 25},
        {header: 'Hương / Màu', key: 'variant', width: 20},
        {header: 'Tổng xuất', key: 'totalQty', width: 15},
    ];
    const summaryHeader = summarySheet.getRow(1);
    summaryHeader.eachCell({includeEmpty: true}, (cell) => {
        cell.font = {name: 'Times New Roman', bold: true, color: {argb: 'FFFFFF'}};
        cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: blue}};
        cell.alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};
    });
    summaryHeader.height = 30;

    const productSummaryMap = new Map<string, {productName: string; sku: string; unit: string; variant: string; quantity: number}>();
    input.items.forEach((item) => {
        const key = `${item.sku}_${item.productName}_${item.variant || '-'}_${item.unit}`;
        if (!productSummaryMap.has(key)) {
            productSummaryMap.set(key, {
                productName: item.productName,
                sku: item.sku,
                unit: item.unit,
                variant: item.variant || '-',
                quantity: 0,
            });
        }
        productSummaryMap.get(key)!.quantity += Number(item.quantity) || 0;
    });

    const summaryItems = Array.from(productSummaryMap.values()).sort((a, b) => a.productName.localeCompare(b.productName));
    let totalSummaryQty = 0;
    summaryItems.forEach((item, index) => {
        totalSummaryQty += item.quantity;
        const row = summarySheet.addRow({
            no: index + 1,
            product: item.productName,
            sku: item.sku,
            unit: item.unit,
            variant: item.variant,
            totalQty: item.quantity,
        });
        applyDataAlignment(row);
        row.getCell('totalQty').font = {bold: true, color: {argb: blue}};
        if (index % 2 === 1) row.eachCell({includeEmpty: true}, (cell) => {
            cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'F8FAFC'}};
        });
        addBorder(row);
    });
    const summaryTotalRow = summarySheet.addRow(['', 'TỔNG CỘNG TẤT CẢ SẢN PHẨM', '', '', '', totalSummaryQty]);
    summaryTotalRow.font = {name: 'Times New Roman', bold: true};
    summaryTotalRow.getCell(2).font = {name: 'Times New Roman', bold: true, color: {argb: navy}};
    summaryTotalRow.getCell(6).font = {name: 'Times New Roman', bold: true, color: {argb: 'E11D48'}};
    applyDataAlignment(summaryTotalRow);
    addBorder(summaryTotalRow);

    // ==========================================
    // SHEET 3: CHI TIẾT DATA
    // ==========================================
    const detail = workbook.addWorksheet('CHI_TIET_DATA', {views: [{showGridLines: false}]});
    detail.columns = [
        {header: 'STT', key: 'no', width: 8}, {header: 'Ngày', key: 'date', width: 16},
        {header: 'Nền tảng', key: 'platform', width: 18}, {header: 'Loại phiếu', key: 'type', width: 18},
        {header: 'Mã đơn hàng', key: 'order', width: 24}, {header: 'Tên sản phẩm', key: 'product', width: 36},
        {header: 'SKU', key: 'sku', width: 20}, {header: 'Dung tích / Khối lượng', key: 'unit', width: 24},
        {header: 'Hương / Màu', key: 'variant', width: 20}, {header: 'Số lượng', key: 'qty', width: 12},
        {header: 'Đơn Giá', key: 'unitPrice', width: 20}, {header: 'Quyết Toán', key: 'settlement', width: 20},
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
            unitPrice: moneyValue(item.salePrice),
            settlement: moneyValue(item.orderSettlementAmount),
        });
    });
    detail.getRow(1).eachCell({includeEmpty: true}, (cell) => {
        cell.font = {name: 'Times New Roman', bold: true, color: {argb: 'FFFFFF'}};
        cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: slate}};
        cell.alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};
        cell.border = {top: {style: 'thin', color: {argb: border}}, left: {style: 'thin', color: {argb: border}}, bottom: {style: 'thin', color: {argb: border}}, right: {style: 'thin', color: {argb: border}}};
    });
    detail.getRow(1).height = 28;
    detail.eachRow((row, index) => {
        if (index > 1) {
            applyDataAlignment(row);
            row.getCell(11).numFmt = '#,##0';
            row.getCell(12).numFmt = '#,##0';
            addBorder(row);
        }
    });
    detail.autoFilter = {from: 'A1', to: 'L1'};
    detail.views = [{state: 'frozen', ySplit: 1, showGridLines: false}];

    // ==========================================
    // SHEET 4: THÔNG TIN
    // ==========================================
    const meta = workbook.addWorksheet('THONG_TIN', {views: [{showGridLines: false}]});
    meta.columns = [{width: 28}, {width: 48}];
    meta.addRows([
        ['Thông tin', 'Giá trị'],
        ['Hệ thống', 'OmniShip Hub'],
        ['Nền tảng', platformLabel(input.platform)],
        ['Loại phiếu', input.type === 'outbound' ? 'Xuất hàng' : 'Hoàn hàng'],
        ['Ngày phiếu', input.documentDate],
        ['Số mã đơn hàng', new Set(input.items.map((item) => item.orderCode.trim()).filter(Boolean)).size],
        ['Số mã SKU khác nhau (Mã SP)', summaryItems.length],
        ['Số dòng sản phẩm (Trong phiếu)', input.items.length],
        ['Tổng số lượng sản phẩm', input.items.reduce((sum, item) => sum + item.quantity, 0)],
    ]);
    meta.getRow(1).eachCell({includeEmpty: true}, (cell) => {
        cell.font = {name: 'Times New Roman', bold: true, color: {argb: 'FFFFFF'}};
        cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: blue}};
        cell.alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};
    });
    meta.eachRow((row) => { applyDataAlignment(row); addBorder(row); });

    workbook.eachSheet((worksheet) => {
        worksheet.eachRow({includeEmpty: false}, (row) => {
            row.eachCell({includeEmpty: false}, (cell) => {
                cell.font = {...(cell.font ?? {}), name: 'Times New Roman'};
            });
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const platformName = input.platform === 'tiktok' ? 'TiktokShop' : 'Shopee';
    const typeName = input.type === 'outbound' ? 'PhieuXuat' : 'PhieuHoan';
    let shortDate = input.documentDate;
    if (shortDate.includes('/')) {
        const [dayStr, monthStr] = shortDate.split('/');
        const day = parseInt(dayStr, 10);
        const month = parseInt(monthStr, 10);
        if (!isNaN(day) && !isNaN(month)) shortDate = `${day}.${month}`;
    } else shortDate = shortDate.replace(/[^a-zA-Z0-9]/g, '.');
    anchor.download = `${typeName}_${platformName}_${shortDate}.xlsx`;
    anchor.click();
    URL.revokeObjectURL(url);
}

/** Export multiple saved documents into one workbook. */
export async function exportHistoryDocumentsExcel(inputs: DocumentInput[]) {
    if (inputs.length === 0) throw new Error('Không có phiếu nào để xuất Excel.');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'OmniShip Hub';
    workbook.created = new Date();
    workbook.subject = 'Xuất gộp lịch sử phiếu';
    const sheet = workbook.addWorksheet('PHIEU_GOP', {views: [{showGridLines: false}]});
    sheet.columns = [
        {width: 7}, {width: 14}, {width: 18}, {width: 18}, {width: 24}, {width: 34},
        {width: 22}, {width: 24}, {width: 20}, {width: 12}, {width: 20}, {width: 20},
    ];
    sheet.views = [{state: 'frozen', ySplit: 0, showGridLines: false}];

    const sorted = [...inputs].sort((a, b) =>
        bulkExportDateSortKey(a.documentDate) - bulkExportDateSortKey(b.documentDate)
        || a.platform.localeCompare(b.platform)
        || a.type.localeCompare(b.type),
    );
    const dayGroups = new Map<string, DocumentInput[]>();
    for (const input of sorted) {
        const dateKey = normalizeBulkExportDate(input.documentDate);
        const group = dayGroups.get(dateKey) ?? [];
        group.push(input);
        dayGroups.set(dateKey, group);
    }

    let globalRow = 1;
    let totalItems = 0;
    let totalQuantity = 0;
    let ticketNumber = 0;
    const detailRows: Array<Record<string, string | number>> = [];

    for (const [date, documents] of dayGroups) {
        const dayHeader = sheet.getRow(globalRow);
        dayHeader.getCell(1).value = `NGÀY: ${formatBulkExportDate(date)}  ·  ${documents.length} PHIẾU`;
        for (let column = 1; column <= 12; column += 1) {
            const cell = dayHeader.getCell(column);
            cell.font = {name: 'Times New Roman', size: 15, bold: true, color: {argb: 'FFFFFF'}};
            cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: navy}};
            cell.alignment = {vertical: 'middle', horizontal: 'left'};
        }
        sheet.getRow(globalRow).height = 28;
        globalRow += 1;

        for (const input of documents) {
            ticketNumber += 1;
            const ticketHeader = sheet.getRow(globalRow);
            ticketHeader.getCell(1).value = `PHIẾU ${ticketNumber}  |  ${input.type === 'outbound' ? 'XUẤT HÀNG' : 'HOÀN HÀNG'}  |  ${platformLabel(input.platform)}  |  ${input.items.length} dòng sản phẩm`;
            for (let column = 1; column <= 12; column += 1) {
                const cell = ticketHeader.getCell(column);
                cell.font = {name: 'Times New Roman', bold: true, color: {argb: navy}};
                cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: lightBlue}};
                cell.alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};
            }
            sheet.getRow(globalRow).height = 23;
            globalRow += 1;

            const header = sheet.getRow(globalRow);
            header.values = BULK_HEADERS;
            header.eachCell({includeEmpty: true}, (cell) => {
                cell.font = {name: 'Times New Roman', bold: true, color: {argb: 'FFFFFF'}};
                cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: blue}};
                cell.alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};
                cell.border = {top: {style: 'thin', color: {argb: border}}, left: {style: 'thin', color: {argb: border}}, bottom: {style: 'thin', color: {argb: border}}, right: {style: 'thin', color: {argb: border}}};
            });
            header.height = 30;
            globalRow += 1;

            const items = [...input.items].sort((a, b) => (a.orderCode || '').localeCompare(b.orderCode || ''));
            items.forEach((item, index) => {
                const values = [
                    index + 1, formatBulkExportDate(date), platformLabel(input.platform),
                    input.type === 'outbound' ? 'Xuất hàng' : 'Hoàn hàng', item.orderCode,
                    item.productName, item.sku, item.unit, item.variant || '-', item.quantity,
                    moneyValue(item.salePrice), moneyValue(item.orderSettlementAmount),
                ];
                const row = sheet.getRow(globalRow);
                row.values = values;
                applyDataAlignment(row);
                row.getCell(11).numFmt = '#,##0';
                row.getCell(12).numFmt = '#,##0';
                row.eachCell({includeEmpty: true}, (cell) => {
                    cell.font = {name: 'Times New Roman'};
                    cell.border = {top: {style: 'thin', color: {argb: border}}, left: {style: 'thin', color: {argb: border}}, bottom: {style: 'thin', color: {argb: border}}, right: {style: 'thin', color: {argb: border}}};
                    if (index % 2 === 1) cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'F8FAFC'}};
                });
                detailRows.push({
                    Ngày: formatBulkExportDate(date),
                    'Nền tảng': platformLabel(input.platform),
                    'Loại phiếu': input.type === 'outbound' ? 'Xuất hàng' : 'Hoàn hàng',
                    'Mã đơn hàng': item.orderCode,
                    'Tên sản phẩm': item.productName,
                    SKU: item.sku,
                    'Dung tích / Khối lượng': item.unit,
                    'Hương / Màu': item.variant || '-',
                    'Số lượng': item.quantity,
                    'Đơn Giá': moneyValue(item.salePrice),
                    'Quyết Toán': moneyValue(item.orderSettlementAmount),
                });
                totalItems += 1;
                totalQuantity += Number(item.quantity) || 0;
                globalRow += 1;
            });
            globalRow += 1;
        }
        globalRow += 1;
    }

    // Raw-data sheet for bulk export also keeps the two financial columns immediately after quantity.
    const detail = workbook.addWorksheet('CHI_TIET_DATA', {views: [{state: 'frozen', ySplit: 1, showGridLines: false}]});
    detail.columns = [
        {header: 'STT', key: 'no', width: 8}, {header: 'Ngày', key: 'date', width: 16},
        {header: 'Nền tảng', key: 'platform', width: 18}, {header: 'Loại phiếu', key: 'type', width: 18},
        {header: 'Mã đơn hàng', key: 'order', width: 24}, {header: 'Tên sản phẩm', key: 'product', width: 36},
        {header: 'SKU', key: 'sku', width: 20}, {header: 'Dung tích / Khối lượng', key: 'unit', width: 24},
        {header: 'Hương / Màu', key: 'variant', width: 20}, {header: 'Số lượng', key: 'qty', width: 12},
        {header: 'Đơn Giá', key: 'unitPrice', width: 20}, {header: 'Quyết Toán', key: 'settlement', width: 20},
    ];
    detailRows.forEach((item, index) => detail.addRow({
        no: index + 1, date: item['Ngày'], platform: item['Nền tảng'], type: item['Loại phiếu'],
        order: item['Mã đơn hàng'], product: item['Tên sản phẩm'], sku: item.SKU,
        unit: item['Dung tích / Khối lượng'], variant: item['Hương / Màu'], qty: item['Số lượng'],
        unitPrice: item['Đơn Giá'], settlement: item['Quyết Toán'],
    }));
    detail.getRow(1).eachCell({includeEmpty: true}, (cell) => {
        cell.font = {name: 'Times New Roman', bold: true, color: {argb: 'FFFFFF'}};
        cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: slate}};
        cell.alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};
        cell.border = {top: {style: 'thin', color: {argb: border}}, left: {style: 'thin', color: {argb: border}}, bottom: {style: 'thin', color: {argb: border}}, right: {style: 'thin', color: {argb: border}}};
    });
    detail.getRow(1).height = 28;
    detail.eachRow((row, index) => {
        if (index > 1) {
            applyDataAlignment(row);
            row.getCell(11).numFmt = '#,##0';
            row.getCell(12).numFmt = '#,##0';
            addBorder(row);
        }
    });
    detail.autoFilter = {from: 'A1', to: 'L1'};

    const meta = workbook.addWorksheet('THONG_TIN', {views: [{showGridLines: false}]});
    meta.columns = [{width: 32}, {width: 30}];
    meta.addRows([
        ['Thông tin', 'Giá trị'],
        ['Hệ thống', 'OmniShip Hub'],
        ['Nền tảng', [...new Set(inputs.map((item) => platformLabel(item.platform)))].join(', ')],
        ['Ngày có phiếu', dayGroups.size],
        ['Tổng số phiếu', inputs.length],
        ['Tổng dòng sản phẩm', totalItems],
        ['Tổng số lượng sản phẩm', totalQuantity],
        ['Ngày xuất file', getTodayISO()],
    ]);
    meta.getRow(1).eachCell({includeEmpty: true}, (cell) => {
        cell.font = {name: 'Times New Roman', bold: true, color: {argb: 'FFFFFF'}};
        cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: blue}};
        cell.alignment = {vertical: 'middle', horizontal: 'center', wrapText: true};
    });
    meta.eachRow((row) => { applyDataAlignment(row); addBorder(row); });

    workbook.eachSheet((worksheet) => {
        worksheet.eachRow({includeEmpty: false}, (row) => {
            row.eachCell({includeEmpty: false}, (cell) => {
                cell.font = {...(cell.font ?? {}), name: 'Times New Roman'};
            });
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `LichSuPhieu_Gop_${inputs.length}_phieu_${getTodayISO()}.xlsx`;
    anchor.click();
    URL.revokeObjectURL(url);
}

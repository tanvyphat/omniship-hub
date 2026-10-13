import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  FileUp,
  Info,
  Layers3,
  Plus,
  Save,
  ShoppingBag,
  Sparkles,
  Store,
  Trash2,
} from 'lucide-react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { ProductRow } from '../components/ProductRow';
import { Select } from '../components/Select';
import { createDocument, fetchDocument, getDocumentSaveErrorMessage, updateDocument } from '../features/documents/document.service';
import { validateDocument } from '../features/documents/document.validation';
import { formatDateVN, getTodayISO } from '../lib/date';
import { exportDocumentExcel } from '../lib/excel';
import { importMarketplaceOrders } from '../lib/importMarketplaceOrders';
import type { MarketplaceImportResult } from '../lib/importMarketplaceOrders';
import type { DocumentInput, DocumentItemInput, DocumentType, Platform } from '../types/document';

const emptyItem = (): DocumentItemInput => ({ orderCode: '', productName: '', sku: '', variant: '', unit: '', quantity: 1 });

interface Props {
  type?: DocumentType;
  edit?: boolean;
}

interface ImportSummary extends MarketplaceImportResult {
  fileName: string;
}

function hasItemData(item: DocumentItemInput) {
  return Boolean(item.orderCode.trim() || item.productName.trim() || item.sku.trim() || item.variant.trim() || item.unit.trim());
}

export function CreateDocumentPage({ type: createType, edit = false }: Props) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { id: routeId } = useParams();
  const editId = edit ? routeId : undefined;
  const rawPlatform = params.get('platform');
  const createPlatform: Platform | null = rawPlatform === 'tiktok' || rawPlatform === 'shopee' ? rawPlatform : null;

  const [documentType, setDocumentType] = useState<DocumentType | null>(edit ? null : createType ?? null);
  const [platform, setPlatform] = useState<Platform | null>(edit ? null : createPlatform);
  const [documentDate, setDocumentDate] = useState(getTodayISO());
  const [items, setItems] = useState<DocumentItemInput[]>([emptyItem()]);
  const [loadingDocument, setLoadingDocument] = useState(edit);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    if (!edit || !editId) return;
    let active = true;
    setLoadingDocument(true);
    setError('');
    void fetchDocument(editId)
      .then((document) => {
        if (!active) return;
        setDocumentType(document.type);
        setPlatform(document.platform);
        setDocumentDate(document.documentDate.includes('/') ? (() => {
          const [day, month, year] = document.documentDate.split('/');
          return `${year}-${month}-${day}`;
        })() : document.documentDate);
        setItems(document.items.length > 0 ? document.items : [emptyItem()]);
        setImportSummary(null);
        setSaved(false);
      })
      .catch((err: unknown) => {
        if (active) setError(getDocumentSaveErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoadingDocument(false);
      });
    return () => { active = false; };
  }, [edit, editId]);

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + (Number.isFinite(item.quantity) ? item.quantity : 0), 0),
    [items],
  );

  if (!edit && (!documentType || !platform)) {
    return <Navigate to={createType === 'outbound' ? '/warehouse/outbound/platform' : '/warehouse/returns/platform'} replace />;
  }

  if (edit && !editId) {
    return <Navigate to={platform ? `/warehouse/history/${platform}` : '/'} replace />;
  }

  if (loadingDocument || !documentType || !platform) {
    return (
      <div className="relative overflow-hidden rounded-[24px] border border-white/70 bg-white/80 p-12 text-center text-sm font-semibold text-slate-500 shadow-xl shadow-violet-100/40 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-50/60 via-violet-50/50 to-fuchsia-50/60" />
        <div className="relative">Đang tải thông tin phiếu…</div>
      </div>
    );
  }

  const input: DocumentInput = {
    type: documentType,
    platform,
    documentDate: formatDateVN(documentDate),
    items,
  };

  function updateItem(index: number, item: DocumentItemInput) {
    setItems((current) => current.map((row, i) => i === index ? item : row));
    setImportSummary(null);
    setSaved(false);
    setError('');
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
    setImportSummary(null);
    setSaved(false);
    setError('');
  }

  function addItem() {
    setItems((current) => [...current, emptyItem()]);
    setImportSummary(null);
    setSaved(false);
    setError('');
  }

  function handleResetForm() {
    setShowConfirmReset(true);
  }

  function confirmReset() {
    setItems([emptyItem()]);
    setDocumentDate(getTodayISO());
    setImportSummary(null);
    setSaved(false);
    setError('');
    setShowConfirmReset(false);
  }

  async function handleImportFile(file: File) {
    if (documentType !== 'outbound') return;

    const hasExistingData = items.some(hasItemData);
    if (hasExistingData) {
      const shouldReplace = window.confirm('Nhập file sẽ thay thế danh sách sản phẩm đang có trên phiếu. Sếp có muốn tiếp tục không?');
      if (!shouldReplace) return;
    }

    setImporting(true);
    setError('');
    setImportSummary(null);
    setSaved(false);

    try {
      const result = await importMarketplaceOrders(file, platform);
      setItems(result.items);
      setImportSummary({ ...result, fileName: file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đọc file Excel. Vui lòng kiểm tra lại file và thử lại.');
    } finally {
      setImporting(false);
    }
  }

  async function save() {
    setError('');
    const validation = validateDocument(input);
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    try {
      if (editId) await updateDocument(editId, input);
      else await createDocument(input);
      setSaved(true);
    } catch (err) {
      setSaved(false);
      setError(getDocumentSaveErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function exportExcel() {
    setError('');
    const validation = validateDocument(input);
    if (validation) {
      setError(validation);
      return;
    }
    setExporting(true);
    try {
      await exportDocumentExcel(input);
    } catch {
      setError('Không thể xuất file Excel. Vui lòng thử lại.');
    } finally {
      setExporting(false);
    }
  }

  const historyPath = `/warehouse/history/${platform}`;
  const backPath = editId
    ? historyPath
    : (documentType === 'outbound' ? '/warehouse/outbound/platform' : '/warehouse/returns/platform');

  const isShopee = platform === 'shopee';
  const platformLabel = isShopee ? 'Shopee' : 'TikTok Shop';
  const PlatformIcon = isShopee ? ShoppingBag : Store;
  const accentText = isShopee ? 'text-orange-600' : 'text-cyan-700';
  const accentBg = isShopee ? 'bg-orange-50' : 'bg-cyan-50';
  const accentBorder = isShopee ? 'border-orange-200' : 'border-cyan-200';
  const accentIcon = isShopee ? 'bg-orange-500 text-white shadow-orange-500/20' : 'bg-slate-950 text-cyan-300 shadow-cyan-500/20';

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={editId ? 'Edit document' : 'Step 2 / 2'}
        title={editId ? 'Chỉnh sửa phiếu' : (documentType === 'outbound' ? 'Thông tin phiếu xuất' : 'Thông tin phiếu hoàn')}
        description={`${platformLabel} · ${editId ? 'Có thể chỉnh sửa toàn bộ thông tin và lưu cập nhật.' : '1 đơn có thể chứa nhiều sản phẩm.'}`}
        action={(
          <Button variant="ghost" onClick={() => navigate(backPath)}>
            <ArrowLeft className="h-4 w-4" />
            {editId ? 'Về lịch sử' : 'Đổi nền tảng'}
          </Button>
        )}
      />

      <section className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/80 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={`absolute -right-16 -top-20 h-56 w-56 animate-pulse rounded-full blur-3xl ${isShopee ? 'bg-orange-300/15' : 'bg-cyan-300/15'}`} />
          <div className="absolute -left-20 top-1/3 h-56 w-56 animate-pulse rounded-full bg-violet-300/10 blur-3xl [animation-delay:800ms]" />
        </div>

        <div className={`relative border-b border-slate-100/90 p-5 md:p-6`}>
          <div className={`grid gap-5 ${editId ? 'md:grid-cols-4' : 'md:grid-cols-[1fr_1.35fr]'}`}>
            {editId && (
              <Select
                label="Loại phiếu"
                value={documentType}
                onChange={(e) => {
                  const next = e.target.value as DocumentType;
                  setDocumentType(next);
                  setImportSummary(null);
                  setSaved(false);
                  setError('');
                }}
                options={[
                  { value: 'outbound', label: 'Phiếu xuất hàng' },
                  { value: 'return', label: 'Phiếu hoàn hàng' },
                ]}
              />
            )}

            {editId && (
              <Select
                label="Nền tảng"
                value={platform}
                onChange={(e) => {
                  setPlatform(e.target.value as Platform);
                  setImportSummary(null);
                  setSaved(false);
                  setError('');
                }}
                options={[
                  { value: 'tiktok', label: 'TikTok Shop' },
                  { value: 'shopee', label: 'Shopee' },
                ]}
              />
            )}

            <label className="group grid gap-1.5 text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-2 transition-colors group-focus-within:text-violet-700">
                <CalendarDays className="h-4 w-4" />
                Ngày {documentType === 'outbound' ? 'xuất kho' : 'hoàn hàng'}
              </span>
              <input
                className="h-11 cursor-pointer rounded-xl border border-slate-200 bg-white/90 px-3 text-sm outline-none transition-all duration-200 hover:border-slate-300 focus:-translate-y-[1px] focus:border-violet-400 focus:bg-white focus:shadow-lg focus:shadow-violet-100/70 focus:ring-4 focus:ring-violet-100/70"
                type="date"
                value={documentDate}
                onChange={(e) => {
                  setDocumentDate(e.target.value);
                  setSaved(false);
                }}
              />
            </label>

            <div className={`relative overflow-hidden rounded-2xl border ${accentBorder} ${accentBg} p-4`}>
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/70 blur-2xl" />
              <div className="relative flex items-start gap-3">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-lg ${accentIcon}`}>
                  <PlatformIcon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className={`text-sm font-black ${accentText}`}>{platformLabel}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-600">
                    {documentType === 'outbound' ? 'Đang tạo phiếu xuất kho.' : 'Đang tạo phiếu hoàn về kho.'}
                    {' '}Mỗi phiếu có thể chứa nhiều đơn và nhiều sản phẩm.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative p-5 md:p-6">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20">
                <Layers3 className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950">Danh sách sản phẩm</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Bắt buộc: mã đơn, tên sản phẩm, SKU, dung tích/khối lượng và số lượng. Một mã đơn có thể xuất hiện ở nhiều dòng.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {documentType === 'outbound' && (
                <>
                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = '';
                      if (file) void handleImportFile(file);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => importFileRef.current?.click()}
                    disabled={saving || exporting || importing}
                    className={`group relative inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border px-4 py-2 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
                      isShopee
                        ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:shadow-orange-100'
                        : 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 hover:shadow-cyan-100'
                    }`}
                  >
                    <FileUp className={`h-4 w-4 ${importing ? 'animate-bounce' : 'transition-transform duration-300 group-hover:-translate-y-0.5'}`} />
                    {importing ? 'Đang đọc file…' : `Nhập Excel ${isShopee ? 'Shopee' : 'TikTok'}`}
                  </button>
                </>
              )}

              <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />
                {items.length} dòng · {totalQuantity} sản phẩm
              </div>
            </div>
          </div>

          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-5 text-blue-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <span className="font-bold">Một phiếu = nhiều đơn.</span> Mỗi dòng nhập một mã đơn hàng; cùng một mã đơn có thể xuất hiện nhiều lần nếu đơn đó có nhiều sản phẩm.
            </div>
          </div>

          {importSummary && (
            <div className="mb-4 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/80 shadow-sm">
              <div className="flex items-start gap-3 px-4 py-3 text-sm text-emerald-800">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold">Đã đọc {importSummary.fileName} và điền {importSummary.items.length} dòng hợp lệ vào phiếu.</div>
                  <div className="mt-1 text-xs leading-5 text-emerald-700">
                    Đã kiểm tra {importSummary.totalRows} dòng đơn hàng. Đã loại {importSummary.cancelledRows} dòng thuộc {importSummary.cancelledOrders} đơn đã huỷ.
                    {importSummary.skippedRows > 0 ? ` Bỏ qua ${importSummary.skippedRows} dòng thiếu dữ liệu bắt buộc.` : ''}
                    {' '}Dữ liệu mới chỉ được điền vào form, chưa lưu vào hệ thống cho đến khi Sếp bấm Lưu phiếu.
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {items.map((item, index) => (
              <ProductRow
                key={`${index}-${item.sku}`}
                index={index}
                item={item}
                onChange={(next) => updateItem(index, next)}
                onRemove={() => removeItem(index)}
                canRemove={items.length > 1}
                showVariant
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="group mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50/50 px-4 py-2.5 text-sm font-bold text-violet-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-100 hover:shadow-md hover:shadow-violet-100 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
            Thêm sản phẩm
          </button>
        </div>

        {(error || saved) && (
          <div className="relative border-t border-slate-100 px-5 py-4 md:px-6">
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            {saved && !error && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {editId ? 'Đã cập nhật phiếu thành công.' : 'Đã lưu phiếu thành công vào hệ thống.'}
              </div>
            )}
          </div>
        )}

        <div className="relative flex flex-col gap-3 border-t border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-violet-50/60 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <button
            type="button"
            onClick={handleResetForm}
            disabled={saving || exporting || importing}
            className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-rose-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-50 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 transition-transform duration-300 group-hover:rotate-6" />
            Xoá toàn bộ
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => void exportExcel()}
              loading={exporting}
              disabled={Boolean(validateDocument(input)) || saving || importing}
            >
              <Download className="h-4 w-4" />
              Xuất Excel
            </Button>
            <Button onClick={() => void save()} loading={saving} disabled={exporting || importing || saved}>
              <Save className="h-4 w-4" />
              {saved ? 'Đã lưu' : editId ? 'Lưu thay đổi' : 'Lưu phiếu'}
            </Button>
          </div>
        </div>
      </section>

      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-md">
          <div className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-white/70 bg-white p-6 shadow-2xl shadow-rose-950/15">
            <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-rose-200/50 blur-3xl" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="pt-1">
                <div className="mb-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.16em] text-rose-500">
                  <Sparkles className="h-3 w-3" />
                  Làm mới dữ liệu
                </div>
                <h3 className="text-lg font-black text-slate-900">Xác nhận xoá toàn bộ</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Sếp có chắc chắn muốn xoá toàn bộ dữ liệu đang nhập để làm lại không? Thao tác này không thể hoàn tác.
                </p>
              </div>
            </div>
            <div className="relative mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
              <Button variant="secondary" onClick={() => setShowConfirmReset(false)}>
                Huỷ bỏ
              </Button>
              <button
                type="button"
                onClick={confirmReset}
                className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
              >
                Xác nhận xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

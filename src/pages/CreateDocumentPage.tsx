import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, Plus, Save, CheckCircle2 } from 'lucide-react';
import { Navigate, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Select } from '../components/Select';
import { PageHeader } from '../components/PageHeader';
import { ProductRow } from '../components/ProductRow';
import { fetchDocument, createDocument, getDocumentSaveErrorMessage, updateDocument } from '../features/documents/document.service';
import { validateDocument } from '../features/documents/document.validation';
import { exportDocumentExcel } from '../lib/excel';
import { formatDateVN, getTodayISO } from '../lib/date';
import type { DocumentInput, DocumentItemInput, DocumentType, Platform } from '../types/document';

const emptyItem = (): DocumentItemInput => ({ orderCode: '', productName: '', sku: '', variant: '', unit: '', quantity: 1 });

interface Props {
  type?: DocumentType;
  edit?: boolean;
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
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

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
    return <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm font-medium text-slate-500 shadow-sm">Đang tải thông tin phiếu…</div>;
  }

  const input: DocumentInput = {
    type: documentType,
    platform,
    documentDate: formatDateVN(documentDate),
    items,
  };

  function updateItem(index: number, item: DocumentItemInput) {
    setItems((current) => current.map((row, i) => i === index ? item : row));
    setSaved(false); setError('');
  }
  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
    setSaved(false); setError('');
  }
  function addItem() { setItems((current) => [...current, emptyItem()]); setSaved(false); setError(''); }

  async function save() {
    setError('');
    const validation = validateDocument(input);
    if (validation) { setError(validation); return; }
    setSaving(true);
    try {
      if (editId) await updateDocument(editId, input);
      else await createDocument(input);
      setSaved(true);
    } catch (err) {
      setSaved(false);
      setError(getDocumentSaveErrorMessage(err));
    } finally { setSaving(false); }
  }

  async function exportExcel() {
    setError('');
    const validation = validateDocument(input);
    if (validation) { setError(validation); return; }
    setExporting(true);
    try {
      await exportDocumentExcel(input);
    } catch {
      setError('Không thể xuất file Excel. Vui lòng thử lại.');
    } finally { setExporting(false); }
  }

  const historyPath = `/warehouse/history/${platform}`;
  const backPath = editId
    ? historyPath
    : (documentType === 'outbound' ? '/warehouse/outbound/platform' : '/warehouse/returns/platform');

  return (
    <div>
      <PageHeader
        eyebrow={editId ? 'Edit document' : 'Step 2 / 2'}
        title={editId ? 'Chỉnh sửa phiếu' : (documentType === 'outbound' ? 'Thông tin phiếu xuất' : 'Thông tin phiếu hoàn')}
        description={`${platform === 'tiktok' ? 'TikTok Shop' : 'Shopee'} · ${editId ? 'Có thể chỉnh sửa toàn bộ thông tin và lưu cập nhật.' : '1 đơn có thể chứa nhiều sản phẩm.'}`}
        action={<Button variant="ghost" onClick={() => navigate(backPath)}><ArrowLeft className="h-4 w-4" />{editId ? 'Về lịch sử' : 'Đổi nền tảng'}</Button>}
      />
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className={`grid gap-5 border-b border-slate-100 p-5 md:p-6 ${editId ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
          {editId && <Select label="Loại phiếu" value={documentType} onChange={(e) => { const next = e.target.value as DocumentType; setDocumentType(next); setSaved(false); setError(''); }} options={[{ value: 'outbound', label: 'Phiếu xuất hàng' }, { value: 'return', label: 'Phiếu hoàn hàng' }]} />}
          {editId && <Select label="Nền tảng" value={platform} onChange={(e) => { setPlatform(e.target.value as Platform); setSaved(false); setError(''); }} options={[{ value: 'tiktok', label: 'TikTok Shop' }, { value: 'shopee', label: 'Shopee' }]} />}
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Ngày {documentType === 'outbound' ? 'xuất kho' : 'hoàn hàng'}
            <input className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" type="date" value={documentDate} onChange={(e) => { setDocumentDate(e.target.value); setSaved(false); }} />
          </label>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900">
            <div className="font-bold">Một phiếu = nhiều đơn</div>
            <div className="mt-1 leading-6">Mỗi dòng sản phẩm nhập <span className="font-semibold">Mã đơn hàng riêng</span>. Một mã đơn có thể xuất hiện ở nhiều dòng khi đơn có nhiều sản phẩm.</div>
          </div>
        </div>
        <div className="p-5 md:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-bold text-slate-950">Danh sách sản phẩm</h2><p className="mt-1 text-xs text-slate-500">Bắt buộc mỗi dòng: mã đơn, tên, SKU, dung tích/khối lượng và số lượng. Một mã đơn có thể có nhiều sản phẩm.</p></div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{items.length} dòng · {totalQuantity} sản phẩm</div>
          </div>
          <div className="space-y-3">{items.map((item, index) => <ProductRow key={`${index}-${item.sku}`} index={index} item={item} onChange={(next) => updateItem(index, next)} onRemove={() => removeItem(index)} canRemove={items.length > 1} showVariant />)}</div>
          <button type="button" onClick={addItem} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"><Plus className="h-4 w-4" />Thêm sản phẩm</button>
        </div>
        {(error || saved) && <div className="border-t border-slate-100 px-5 py-4 md:px-6">{error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}{saved && !error && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4 shrink-0" />{editId ? 'Đã cập nhật phiếu thành công.' : 'Đã lưu phiếu thành công vào hệ thống.'}</div>}</div>}
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 p-5 sm:flex-row sm:justify-end md:p-6">
          <Button variant="secondary" onClick={() => void exportExcel()} loading={exporting} disabled={Boolean(validateDocument(input)) || saving}><Download className="h-4 w-4" />Xuất Excel</Button>
          <Button onClick={() => void save()} loading={saving} disabled={exporting || saved}><Save className="h-4 w-4" />{saved ? 'Đã lưu' : editId ? 'Lưu thay đổi' : 'Lưu phiếu'}</Button>
        </div>
      </section>
    </div>
  );
}

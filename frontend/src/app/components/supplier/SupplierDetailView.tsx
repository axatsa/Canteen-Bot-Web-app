import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MessageSquare, Truck, Check, RefreshCcw, AlignJustify, LayoutGrid, Download, Calendar, HelpCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { Order, Branch } from '@/lib/api';
import { StatusBadge } from '@/app/components/StatusBadge';
import { HelpModal } from '@/app/components/HelpModal';
import { useLanguage } from '@/app/context/LanguageContext';

// ── Date helpers ────────────────────────────────────────────────────────────
/** "2026-04-17" → "17.04.2026" */
function isoToDmy(iso: string): string {
    if (!iso || iso.includes('.') || iso.length < 10) return iso;
    const [y, m, d] = iso.split('-');
    if (!d || !m || !y) return iso;
    return `${d}.${m}.${y}`;
}
/** "17.04.2026" → "2026-04-17" (returns '' if not 8 digits yet) */
function dmyToIso(dmy: string): string {
    const digits = dmy.replace(/\D/g, '');
    if (digits.length < 8) return '';
    return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
}
/** Auto-insert dots: "1704" → "17.04" */
function formatDateInput(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 8);
    if (d.length <= 2) return d;
    if (d.length <= 4) return `${d.slice(0, 2)}.${d.slice(2)}`;
    return `${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4)}`;
}

// ── DateInput component ──────────────────────────────────────────────────────
interface DateInputProps {
    value: string;           // ISO "YYYY-MM-DD" or ''
    onChange: (iso: string) => void;
    className?: string;
    placeholder?: string;
}
function DateInput({ value, onChange, className, placeholder = 'ДД.ММ.ГГГГ' }: DateInputProps) {
    const [display, setDisplay] = useState(() => isoToDmy(value));
    const prevIso = useRef(value);
    useEffect(() => {
        // Only update display from outside if ISO value actually changed
        if (value !== prevIso.current) {
            prevIso.current = value;
            setDisplay(isoToDmy(value));
        }
    }, [value]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatDateInput(e.target.value);
        setDisplay(formatted);
        const iso = dmyToIso(formatted);
        if (iso) { prevIso.current = iso; onChange(iso); }
        else if (!formatted) { prevIso.current = ''; onChange(''); }
    };
    return (
        <input
            type="text"
            inputMode="numeric"
            value={display}
            onChange={handleChange}
            placeholder={placeholder}
            className={className}
        />
    );
}
// ────────────────────────────────────────────────────────────────────────────

const branchNames: Record<Branch, string> = {
    beltepa_land:          'Белтепа-Land',
    uchtepa_land:          'Учтепа-Land',
    rakat_land:            'Ракат-Land',
    mukumiy_land:          'Мукумий-Land',
    yunusabad_land:        'Юнусабад-Land',
    novoi_land:            'Новои-Land',
    novza_school:          'Новза-School',
    uchtepa_school:        'Учтепа-School',
    almazar_school:        'Алмазар-School',
    general_uzakov_school: 'Ген. Узаков-School',
    namangan_school:       'Наманган-School',
    novoi_school:          'Новои-School',
};

interface SupplierDetailViewProps {
    order: Order;
    onUpdateOrder: (order: Order) => void;
    onBackToRoles: () => void;
    branch: Branch;
    onRefresh?: () => void;
}

export function SupplierDetailView({ order, onUpdateOrder, onBackToRoles, branch }: SupplierDetailViewProps) {
    const { t } = useLanguage();
    const [localProducts, setLocalProducts] = useState(order.products);
    const [isCompact, setIsCompact] = useState(true);
    const [showHelp, setShowHelp] = useState(false);
    const [estimatedDate, setEstimatedDate] = useState<string>(
        order.estimatedDeliveryDate ? order.estimatedDeliveryDate.toISOString().split('T')[0] : ''
    );

    // Синхронизация localProducts при изменении order.products
    // Синхронизация localProducts при изменении order.products
    useEffect(() => {
        setLocalProducts(order.products.map(p => ({
            ...p,
            price: (p.price && p.price > 0) ? p.price : (p.lastPrice || 0)
        })));
    }, [order.products]);

    const handleUpdateProduct = (productId: string, field: 'price' | 'comment' | 'checked' | 'deliveryDate', value: any) => {
        setLocalProducts(prev =>
            prev.map(p => {
                if (p.id === productId) {
                    const updated = { ...p, [field]: value };
                    // Если отметили как отправленное, очищаем дату досыла
                    if (field === 'checked' && value === true) {
                        updated.deliveryDate = undefined;
                    }
                    return updated;
                }
                return p;
            })
        );
    };

    const handleSend = () => {
        // Validation: Check if all products have a price
        const missingPrice = localProducts.some(p => p.quantity > 0 && (!p.price || p.price <= 0));

        if (missingPrice) {
            alert(t('alertNoPrices'));
            return;
        }

        // Validation: Check if all unsent products have a delivery date
        const missingDate = localProducts.some(p => p.quantity > 0 && !p.checked && (!p.deliveryDate || p.deliveryDate === ''));
        if (missingDate) {
            alert(t('alertSelectDates' as any) || 'Укажите дату доставки для всех товаров, которые не отправлены сегодня!');
            return;
        }

        onUpdateOrder({
            ...order,
            products: localProducts,
            status: 'waiting_snabjenec_receive',
            estimatedDeliveryDate: estimatedDate ? new Date(estimatedDate) : undefined,
        });
        alert(t('alertSentToSnabjenec' as any));
    };

    const handleExportExcel = () => {
        const data = localProducts
            .filter(p => p.quantity > 0)
            .map(p => ({
                [t('category')]: p.category,
                [t('productName')]: p.name,
                [t('quantity')]: p.quantity,
                [t('unit')]: p.unit,
                [t('price')]: p.price || 0,
                [t('sum')]: (p.price || 0) * p.quantity,
                [t('comment')]: p.comment || ''
            }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t('supplierTitle'));

        // Auto-fit columns
        const wscols = [
            { wch: 20 }, // Category
            { wch: 30 }, // Name
            { wch: 10 }, // Quantity
            { wch: 10 }, // Unit
            { wch: 15 }, // Price
            { wch: 15 }, // Sum
            { wch: 30 }  // Comment
        ];
        ws['!cols'] = wscols;

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

        saveAs(blob, `Заказ_${branchNames[branch]}_${new Date().toLocaleDateString('ru-RU')}.xlsx`);
    };

    const filteredProducts = localProducts.filter(p => p.quantity > 0);
    const categories = Array.from(new Set(filteredProducts.map(p => p.category)));
    const totalAmount = filteredProducts.reduce((sum, p) => sum + ((p.price || 0) * p.quantity), 0);
    const totalWithPrice = filteredProducts.filter(p => (p.price || 0) > 0).length;
    const allPricesFilled = filteredProducts.length > 0 && totalWithPrice === filteredProducts.length;

    return (
        <>
        <div className="h-screen overflow-hidden bg-[#f5f5f5] flex flex-col">
            <header
                className="flex-none text-white px-4 pt-4 pb-5 rounded-b-3xl shadow-lg"
                style={{ backgroundColor: '#FF6B00' }}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onBackToRoles}
                            className="w-9 h-9 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowHelp(true)}
                            className="w-9 h-9 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-xl transition-colors"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsCompact(!isCompact)}
                            className="w-9 h-9 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-xl transition-colors"
                        >
                            {isCompact ? <LayoutGrid className="w-4 h-4" /> : <AlignJustify className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="w-9 h-9 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-xl transition-colors"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-end justify-between">
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <Truck className="w-4 h-4 opacity-70" />
                            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{t('supplierTitle')}</p>
                        </div>
                        <p className="text-white/60 text-[10px] uppercase font-semibold tracking-wider mb-1">
                            {t('branch')}: {t(`branch${branch.charAt(0).toUpperCase() + branch.slice(1)}` as any)}
                        </p>
                        <h2 className="text-2xl font-black tracking-tight leading-none">
                            {order.createdAt.toLocaleDateString(t('back') === 'Orqaga' ? 'uz-UZ' : 'ru-RU', {
                                day: 'numeric',
                                month: 'short',
                            })}
                        </h2>
                    </div>
                    <StatusBadge status={order.status} />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-4 pt-3 pb-[240px]">
                <div className={isCompact ? "space-y-3" : "space-y-8"}>
                    {categories.map(category => {
                        const categoryProducts = filteredProducts.filter(p => p.category === category);
                        return (
                            <div key={category}>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                                    {category}
                                </h3>
                                <div className="space-y-2">
                                    {categoryProducts.map(product => (
                                        <div
                                            key={product.id}
                                            className={`bg-white border border-gray-100 ${isCompact ? 'rounded-2xl' : 'rounded-[2.5rem] shadow-md p-5'}`}
                                        >
                                            {isCompact ? (
                                                <div className="px-3 py-3">
                                                    {/* Top: checkbox + name + qty */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <button
                                                            onClick={() => handleUpdateProduct(product.id, 'checked', !product.checked)}
                                                            className={`w-7 h-7 rounded-lg border-2 transition-all flex items-center justify-center flex-shrink-0 ${
                                                                product.checked
                                                                    ? 'bg-orange-500 border-orange-500 text-white'
                                                                    : 'bg-white border-gray-200 text-transparent'
                                                            }`}
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className={`font-semibold text-sm leading-tight ${product.checked ? 'text-gray-300 line-through' : 'text-gray-900'}`}>
                                                                {product.name}
                                                            </h4>
                                                            <div className="flex items-center gap-1.5 text-xs mt-0.5">
                                                                <span className="text-orange-500 font-bold">{product.quantity} {product.unit}</span>
                                                                {(product.price || 0) > 0 && (
                                                                    <>
                                                                        <span className="text-gray-200">·</span>
                                                                        <span className="text-gray-500">{((product.price || 0) * product.quantity).toLocaleString()} {t('sum')}</span>
                                                                    </>
                                                                )}
                                                                {product.lastPrice && !product.price && (
                                                                    <span className="text-gray-300 text-[10px]">(пред: {product.lastPrice})</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Bottom: price + comment + date */}
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            inputMode="decimal"
                                                            placeholder="Цена"
                                                            value={product.price || ''}
                                                            onChange={(e) => handleUpdateProduct(product.id, 'price', parseFloat(e.target.value) || 0)}
                                                            className="flex-1 min-w-0 bg-gray-50 rounded-xl px-3 py-2.5 text-sm font-bold text-right focus:ring-1 focus:ring-orange-500 outline-none border-none"
                                                        />
                                                        <div className="relative flex-1 min-w-0">
                                                            <input
                                                                placeholder="Комм."
                                                                value={product.comment || ''}
                                                                onChange={(e) => handleUpdateProduct(product.id, 'comment', e.target.value)}
                                                                className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm pl-8 focus:ring-1 focus:ring-orange-500 outline-none border-none"
                                                            />
                                                            <MessageSquare className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
                                                        </div>
                                                        <DateInput
                                                            value={product.deliveryDate && product.deliveryDate !== 'Неизвестно' && product.deliveryDate !== "Noma'lum" ? product.deliveryDate : ''}
                                                            onChange={(iso) => handleUpdateProduct(product.id, 'deliveryDate', iso)}
                                                            className="flex-1 min-w-0 bg-gray-50 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 focus:ring-1 focus:ring-orange-500 outline-none border-none"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-start gap-3 flex-1">
                                                            <button
                                                                onClick={() => handleUpdateProduct(product.id, 'checked', !product.checked)}
                                                                className={`mt-1 w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center flex-shrink-0 ${product.checked
                                                                    ? 'bg-orange-500 border-orange-500 text-white'
                                                                    : 'bg-white border-gray-200 text-transparent'
                                                                    }`}
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <div>
                                                                <h4 className={`font-bold text-gray-900 text-lg leading-tight mb-2 ${product.checked ? 'text-gray-400 line-through' : ''}`}>
                                                                    {product.name}
                                                                </h4>
                                                                <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-sm font-bold">
                                                                    {product.quantity} {product.unit}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1">{t('totalPrice')}</p>
                                                            <p className="text-xl font-black text-gray-900">
                                                                {((product.price || 0) * product.quantity).toLocaleString()} {t('sum')}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                placeholder={t('pricePerUnit')}
                                                                value={product.price || ''}
                                                                onChange={(e) => handleUpdateProduct(product.id, 'price', parseFloat(e.target.value) || 0)}
                                                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-bold text-gray-900 focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-gray-300"
                                                            />
                                                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{t('sum')} / {product.unit}</span>
                                                        </div>

                                                        <div className="relative">
                                                            <textarea
                                                                placeholder={t('comment')}
                                                                value={product.comment || ''}
                                                                onChange={(e) => handleUpdateProduct(product.id, 'comment', e.target.value)}
                                                                rows={1}
                                                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-medium text-gray-700 focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                                                            />
                                                            <MessageSquare className="absolute right-5 top-4 w-4 h-4 text-gray-300" />
                                                        </div>

                                                        <div className="relative">
                                                            <DateInput
                                                                value={(product.deliveryDate && product.deliveryDate !== t('unknown' as any)) ? product.deliveryDate : ''}
                                                                onChange={(iso) => handleUpdateProduct(product.id, 'deliveryDate', iso)}
                                                                className={`w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-medium text-gray-700 focus:ring-2 focus:ring-orange-500 transition-all ${!product.checked && !product.deliveryDate ? 'ring-2 ring-red-200' : ''}`}
                                                            />
                                                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs uppercase">{t('deliveryDate')}</span>
                                                        </div>

                                                        {!product.checked && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleUpdateProduct(product.id, 'deliveryDate', t('unknown' as any))}
                                                                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${product.deliveryDate === t('unknown' as any) ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}
                                                                >
                                                                    {t('unknown' as any)}
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        const tomorrow = new Date();
                                                                        tomorrow.setDate(tomorrow.getDate() + 1);
                                                                        handleUpdateProduct(product.id, 'deliveryDate', tomorrow.toISOString().split('T')[0]);
                                                                    }}
                                                                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${product.deliveryDate && product.deliveryDate !== t('unknown' as any) ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}
                                                                >
                                                                    Завтра
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20">
                <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 font-medium">{t('deliveryDate')}:</span>
                    <DateInput
                        value={estimatedDate}
                        onChange={(iso) => setEstimatedDate(iso)}
                        className="flex-1 bg-gray-100 border-none rounded-xl px-3 py-2 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-0.5">
                            {t('filled')} <span className={allPricesFilled ? "text-green-500" : "text-orange-500"}>{totalWithPrice}/{filteredProducts.length}</span>
                        </p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-black text-gray-900 leading-none">
                                {totalAmount.toLocaleString()}
                            </p>
                            <span className="text-xs font-bold text-gray-400 uppercase">{t('sum')}</span>
                        </div>
                    </div>

                    <div className="flex-none">
                        <button
                            onClick={handleSend}
                            disabled={!allPricesFilled}
                            className="bg-[#FF6B00] text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:active:scale-100 disabled:bg-gray-300"
                        >
                            <Send className="w-4 h-4" />
                            {t('send')}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {showHelp && (
            <HelpModal
                title="Поставщик"
                color="#FF6B00"
                onClose={() => setShowHelp(false)}
                sections={[
                    {
                        label: 'Что делать',
                        items: [
                            'Получить заказ и указать цену для каждого товара',
                            'При необходимости добавить комментарий к позиции',
                            'Нажать «Отправить» — список уйдёт снабженцу на приёмку',
                        ],
                    },
                    {
                        label: 'Обязательные условия',
                        items: [
                            'Цена должна быть указана для каждого товара',
                            'Нельзя отправить список с нулевыми ценами',
                        ],
                    },
                    {
                        label: 'Нельзя',
                        items: [
                            'Отправить заказ без заполненных цен',
                            'Изменить цены после отправки',
                        ],
                    },
                ]}
            />
        )}
        </>
    );
}

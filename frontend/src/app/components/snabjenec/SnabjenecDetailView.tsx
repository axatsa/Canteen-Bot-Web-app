import { useState, useEffect } from 'react';
import { ArrowLeft, Send, CheckSquare, Save, Archive, Plus, Package, HelpCircle } from 'lucide-react';
import type { Order, Branch, Product, DeliveryItemTracking } from '@/lib/api';
import { api } from '@/lib/api';
import { StatusBadge } from '@/app/components/StatusBadge';
import { HelpModal } from '@/app/components/HelpModal';
import { useLanguage } from '@/app/context/LanguageContext';

function isoToDmy(iso: string): string {
    if (!iso || iso.includes('.') || iso.length < 10) return iso;
    const [y, m, d] = iso.split('-');
    if (!d || !m || !y) return iso;
    return `${d}.${m}.${y}`;
}

function computeDeliveryStatus(ordered: number, received: number): DeliveryItemTracking['status'] {
    if (received >= ordered) return 'delivered';
    if (received > 0) return 'partial';
    return 'not_delivered';
}

interface SnabjenecDetailViewProps {
    order: Order;
    onUpdateOrder: (order: Order) => void;
    onBackToRoles: () => void;
    branch: Branch;
    onRefresh?: () => void;
    isFromBot?: boolean;
}

export function SnabjenecDetailView({ order, onUpdateOrder, onBackToRoles, branch, onRefresh }: SnabjenecDetailViewProps) {
    const { t } = useLanguage();
    const [localProducts, setLocalProducts] = useState<Product[]>(order.products);
    const [supplierDateInput, setSupplierDateInput] = useState('');
    const [showHelp, setShowHelp] = useState(false);
    const [markingReceived, setMarkingReceived] = useState(false);
    const [savingDelivery, setSavingDelivery] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [showExtraModal, setShowExtraModal] = useState(false);
    const [masterProducts, setMasterProducts] = useState<Product[]>([]);
    const [localDeliveryTracking, setLocalDeliveryTracking] = useState<Record<string, DeliveryItemTracking>>(
        () => order.deliveryTracking ?? {}
    );
    const [localExtraItems, setLocalExtraItems] = useState<Record<string, number>>(
        () => order.extraItemsDelivered ?? {}
    );

    useEffect(() => {
        setLocalProducts(order.products);
        setLocalDeliveryTracking(order.deliveryTracking ?? {});
        setLocalExtraItems(order.extraItemsDelivered ?? {});
    }, [order.products, order.deliveryTracking, order.extraItemsDelivered]);

    const handleUpdateProduct = (productId: string, field: string, value: any) => {
        setLocalProducts(prev => prev.map(p => p.id === productId ? { ...p, [field]: value } : p));
    };

    const isReviewMode = order.status === 'review_snabjenec';
    const isSentToSupplierMode = order.status === 'sent_to_supplier';
    const isReceiveMode = order.status === 'waiting_snabjenec_receive';
    const isDeliveryTrackingMode = isReceiveMode && order.supplierResponded;
    const isLegacyReceiveMode = isReceiveMode && !order.supplierResponded;
    const canArchive = ['waiting_snabjenec_receive', 'sent_to_financier'].includes(order.status);

    const displayProducts = localProducts.filter(p => p.quantity > 0);
    const supplierSent = displayProducts.filter(p => p.checked);
    const supplierNotSent = displayProducts.filter(p => !p.checked);

    // ── Review mode handlers ──────────────────────────────────────────────────

    const handleSendToSupplier = () => {
        onUpdateOrder({ ...order, products: localProducts, status: 'sent_to_supplier' });
        alert(t('alertListSent'));
    };

    const handleSaveProgress = () => {
        onUpdateOrder({ ...order, products: localProducts });
        alert(t('saveProgress') + ' ✔️');
    };

    // ── Mark supplier received ────────────────────────────────────────────────

    const handleMarkSupplierReceived = async () => {
        if (!supplierDateInput.trim()) {
            alert('Введите дату получения');
            return;
        }
        setMarkingReceived(true);
        try {
            await api.markSupplierReceived(order.id, supplierDateInput);
            onRefresh?.();
        } catch {
            alert('Ошибка при сохранении');
        } finally {
            setMarkingReceived(false);
        }
    };

    // ── Delivery tracking handlers ────────────────────────────────────────────

    const initDeliveryTracking = () => {
        const initial: Record<string, DeliveryItemTracking> = {};
        displayProducts.forEach(p => {
            if (!localDeliveryTracking[p.id]) {
                initial[p.id] = {
                    ordered_qty: p.quantity,
                    received_qty: 0,
                    status: 'pending',
                };
            } else {
                initial[p.id] = localDeliveryTracking[p.id];
            }
        });
        return initial;
    };

    const getTracking = (productId: string, orderedQty: number): DeliveryItemTracking => {
        return localDeliveryTracking[productId] ?? {
            ordered_qty: orderedQty,
            received_qty: 0,
            status: 'pending',
        };
    };

    const handleReceivedQtyChange = (productId: string, orderedQty: number, receivedQty: number) => {
        const clampedQty = Math.max(0, receivedQty);
        setLocalDeliveryTracking(prev => ({
            ...prev,
            [productId]: {
                ordered_qty: orderedQty,
                received_qty: clampedQty,
                status: computeDeliveryStatus(orderedQty, clampedQty),
            },
        }));
    };

    const handleSaveDelivery = async () => {
        const tracking = initDeliveryTracking();
        Object.assign(tracking, localDeliveryTracking);
        setSavingDelivery(true);
        try {
            await api.updateDelivery(order.id, tracking, localExtraItems);
            alert('✅ Приёмка сохранена');
            onRefresh?.();
        } catch {
            alert('Ошибка при сохранении приёмки');
        } finally {
            setSavingDelivery(false);
        }
    };

    const handleArchive = async () => {
        if (!confirm('Отправить заказ в архив?')) return;
        setArchiving(true);
        try {
            await api.archiveOrder(order.id);
            onRefresh?.();
            onBackToRoles();
        } catch {
            alert('Ошибка при архивировании');
        } finally {
            setArchiving(false);
        }
    };

    // ── Legacy receive handlers ───────────────────────────────────────────────

    const handleCompleteReceive = () => {
        const allReceived = supplierSent.every(p => p.received);
        if (!allReceived) {
            alert('Сначала отметьте все товары как полученные!');
            return;
        }
        onUpdateOrder({ ...order, products: localProducts, status: 'sent_to_financier' });
        alert(t('alertCheckComplete'));
    };

    // ── Extra items modal ─────────────────────────────────────────────────────

    const loadMasterProducts = async () => {
        if (masterProducts.length > 0) return;
        try {
            const data = await api.getProducts();
            setMasterProducts(data);
        } catch {}
    };

    const handleOpenExtraModal = () => {
        loadMasterProducts();
        setShowExtraModal(true);
    };

    const handleAddExtraItem = (productId: string, qty: number) => {
        if (qty <= 0) return;
        setLocalExtraItems(prev => ({ ...prev, [productId]: (prev[productId] ?? 0) + qty }));
        setShowExtraModal(false);
    };

    // ── Renderers ─────────────────────────────────────────────────────────────

    const renderProductEditCard = (product: Product) => (
        <div key={product.id} className="bg-white p-4 rounded-3xl shadow-md border border-gray-100">
            <div className="mb-3">
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{t('productName')}</label>
                <input
                    type="text"
                    value={product.name}
                    onChange={(e) => handleUpdateProduct(product.id, 'name', e.target.value)}
                    className="w-full bg-gray-50 rounded-xl px-3 py-2 font-bold text-gray-900 border-none focus:ring-1 focus:ring-[#2E7D32]"
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{t('quantity')} ({product.unit})</label>
                    <input
                        type="number"
                        value={product.quantity || ''}
                        onChange={(e) => handleUpdateProduct(product.id, 'quantity', Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-gray-50 rounded-xl px-3 py-2 font-bold"
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{t('price')} ({t('sum')})</label>
                    <input
                        type="number"
                        value={product.price || ''}
                        onChange={(e) => handleUpdateProduct(product.id, 'price', Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full bg-gray-50 rounded-xl px-3 py-2 font-bold"
                    />
                </div>
            </div>
        </div>
    );

    const renderProductCheckCard = (product: Product) => (
        <div key={product.id} className="bg-white p-4 rounded-3xl shadow-md border border-gray-100 flex items-start gap-3 transition-all active:scale-[0.98]" onClick={() => handleUpdateProduct(product.id, 'received', !product.received)}>
            <button className={`mt-1 w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0 ${product.received ? 'bg-[#2E7D32] border-[#2E7D32] text-white' : 'bg-white border-gray-300 text-transparent'}`}>
                <CheckSquare className="w-4 h-4" />
            </button>
            <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                <input
                    type="text"
                    value={product.name}
                    onChange={(e) => handleUpdateProduct(product.id, 'name', e.target.value)}
                    className={`w-full bg-transparent border-none p-0 font-bold text-lg leading-tight mb-1 focus:ring-0 ${product.received ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                />
                <div className="flex gap-2 text-sm text-gray-500 font-bold mb-1">
                    <span>{product.quantity} {product.unit}</span>
                    {product.price && product.price > 0 && <span>• {(product.quantity * product.price).toLocaleString()} {t('sum')}</span>}
                </div>
            </div>
        </div>
    );

    const renderDelayedProductCard = (product: Product) => (
        <div key={product.id} className="bg-gray-100/50 p-4 rounded-3xl border border-gray-200 opacity-80">
            <input
                type="text"
                value={product.name}
                onChange={(e) => handleUpdateProduct(product.id, 'name', e.target.value)}
                className="w-full bg-transparent border-none p-0 font-bold text-lg text-gray-600 leading-tight mb-1 focus:ring-0"
            />
            <div className="flex flex-wrap gap-2 text-xs text-gray-400 font-bold mb-2">
                <span>{product.quantity} {product.unit}</span>
                {product.price && product.price > 0 && <span>• {(product.quantity * product.price).toLocaleString()} {t('sum')}</span>}
            </div>
            <div className="bg-orange-50 text-orange-600 px-3 py-2 rounded-xl border border-orange-100 flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold">{t('estimatedDelivery')}:</span>
                <span className="font-bold text-sm">{isoToDmy(product.deliveryDate!) || t('unknown' as any)}</span>
            </div>
        </div>
    );

    const renderDeliveryTrackingCard = (product: Product) => {
        const tracking = getTracking(product.id, product.quantity);
        const statusColors: Record<string, string> = {
            delivered: 'text-green-600 bg-green-50 border-green-200',
            partial: 'text-yellow-600 bg-yellow-50 border-yellow-200',
            not_delivered: 'text-red-600 bg-red-50 border-red-200',
            pending: 'text-gray-500 bg-gray-50 border-gray-200',
        };
        const statusLabels: Record<string, string> = {
            delivered: 'Доставлено полностью',
            partial: 'Частичная доставка',
            not_delivered: 'НЕ доставлено',
            pending: 'Ожидает',
        };

        return (
            <div key={product.id} className="bg-white p-4 rounded-3xl shadow-md border border-gray-100">
                <p className="font-bold text-gray-900 mb-3">{product.name}</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Заказано ({product.unit})</label>
                        <div className="bg-gray-50 rounded-xl px-3 py-2 font-bold text-gray-600">{tracking.ordered_qty}</div>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Получено ({product.unit})</label>
                        <input
                            type="number"
                            value={tracking.received_qty || ''}
                            min={0}
                            max={tracking.ordered_qty * 2}
                            onChange={(e) => handleReceivedQtyChange(product.id, tracking.ordered_qty, parseFloat(e.target.value) || 0)}
                            className="w-full bg-blue-50 rounded-xl px-3 py-2 font-bold border-none focus:ring-1 focus:ring-blue-400"
                        />
                    </div>
                </div>
                <div className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${statusColors[tracking.status]}`}>
                    {statusLabels[tracking.status]}
                </div>
            </div>
        );
    };

    // ── Extra items (from extra_items_delivered) ───────────────────────────────

    const extraItemEntries = Object.entries(localExtraItems).filter(([, qty]) => qty > 0);

    return (
        <div className="h-screen overflow-hidden bg-[#f5f5f5] flex flex-col">
            <header className="flex-none text-white p-4 rounded-b-2xl shadow-lg relative overflow-hidden" style={{ backgroundColor: '#2E7D32' }}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <button onClick={onBackToRoles} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button onClick={() => setShowHelp(true)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                    <StatusBadge status={order.status} />
                </div>
                <h2 className="text-xl font-bold">{t(`branch${branch.charAt(0).toUpperCase() + branch.slice(1)}` as any)}</h2>
            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-[200px]">

                {/* ── Review mode ─────────────────────────────────────────── */}
                {isReviewMode && (
                    <div className="space-y-4">
                        {displayProducts.map(renderProductEditCard)}
                    </div>
                )}

                {/* ── Sent to supplier: mark received date ─────────────── */}
                {isSentToSupplierMode && (
                    <div className="space-y-4">
                        <div className="bg-white p-5 rounded-3xl shadow-md border border-gray-100">
                            <div className="flex items-center gap-2 mb-4">
                                <Package className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold text-gray-900">Отметить получение от поставщика</h3>
                            </div>
                            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Дата получения (ДД.ММ.ГГГГ)</label>
                            <input
                                type="text"
                                placeholder="18.04.2026"
                                value={supplierDateInput}
                                onChange={(e) => setSupplierDateInput(e.target.value)}
                                className="w-full bg-gray-50 rounded-xl px-3 py-2 font-bold border border-gray-200 focus:ring-1 focus:ring-blue-400 mb-3"
                            />
                            <button
                                onClick={handleMarkSupplierReceived}
                                disabled={markingReceived || !supplierDateInput.trim()}
                                className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-2xl shadow active:scale-95 transition-all disabled:opacity-50"
                            >
                                {markingReceived ? 'Сохранение...' : '✓ Отметить получено от поставщика'}
                            </button>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-gray-500 uppercase pl-1">Товары в заказе</h3>
                            {displayProducts.map(p => (
                                <div key={p.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                                    <p className="font-bold text-gray-900">{p.name}</p>
                                    <p className="text-sm text-gray-500">{p.quantity} {p.unit}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Delivery tracking mode (supplier_responded = true) ── */}
                {isDeliveryTrackingMode && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-sm text-blue-700 font-medium">
                            📦 Режим приёмки товаров. Укажите полученное количество для каждого товара.
                        </div>

                        <div className="space-y-3">
                            {displayProducts.map(renderDeliveryTrackingCard)}
                        </div>

                        {extraItemEntries.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-500 uppercase pl-1">Доп. товары</h3>
                                {extraItemEntries.map(([pid, qty]) => {
                                    const name = localProducts.find(p => p.id === pid)?.name ?? `ID:${pid}`;
                                    return (
                                        <div key={pid} className="bg-yellow-50 p-3 rounded-2xl border border-yellow-200 flex items-center justify-between">
                                            <span className="font-bold text-gray-900">{name}</span>
                                            <span className="text-yellow-700 font-bold">+{qty}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Legacy receive mode (no delivery tracking yet) ──── */}
                {isLegacyReceiveMode && (
                    <div className="space-y-8">
                        {supplierSent.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-gray-800 border-l-4 pl-2 border-[#2E7D32]">{t('arrivedProducts')} ({supplierSent.length})</h3>
                                {supplierSent.map(renderProductCheckCard)}
                            </div>
                        )}
                        {supplierNotSent.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-orange-600 border-l-4 pl-2 border-orange-500">Не отправлено ({supplierNotSent.length})</h3>
                                {supplierNotSent.map(renderDelayedProductCard)}
                            </div>
                        )}
                    </div>
                )}

                {(!isReviewMode && !isSentToSupplierMode && !isReceiveMode) && (
                    <div className="text-center py-12 text-gray-400 font-bold">{t('readOnly')}</div>
                )}
            </main>

            {/* ── Bottom action bar ──────────────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex flex-col gap-2 z-20 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">

                {isReviewMode && (
                    <button
                        onClick={handleSendToSupplier}
                        className="w-full bg-[#2E7D32] text-white font-bold py-3 px-6 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Send className="w-5 h-5" />
                        {t('sendToSupplier')}
                    </button>
                )}

                {isDeliveryTrackingMode && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleOpenExtraModal}
                            className="flex-none bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-2xl active:scale-95 border border-gray-200 flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" />
                            Доп.
                        </button>
                        <button
                            onClick={handleSaveDelivery}
                            disabled={savingDelivery}
                            className="flex-1 bg-[#2E7D32] text-white font-bold py-3 px-4 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {savingDelivery ? 'Сохранение...' : 'Сохранить приёмку'}
                        </button>
                    </div>
                )}

                {isLegacyReceiveMode && (
                    <div className="flex w-full gap-2">
                        <button
                            onClick={handleSaveProgress}
                            className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 px-2 rounded-2xl active:scale-95 transition-all text-sm flex items-center justify-center gap-1 border border-gray-200"
                        >
                            <Save className="w-4 h-4" />
                            {t('saveProgress')}
                        </button>
                        <button
                            onClick={handleCompleteReceive}
                            disabled={supplierSent.some(p => !p.received)}
                            className={`flex-[1.5] text-white font-bold py-3 px-2 rounded-2xl shadow-lg active:scale-95 transition-all text-sm flex items-center justify-center gap-1 ${supplierSent.every(p => p.received) ? 'bg-[#2E7D32]' : 'bg-gray-300 opacity-50'}`}
                        >
                            <Send className="w-4 h-4" />
                            {t('completeReceive')}
                        </button>
                    </div>
                )}

                {canArchive && (
                    <button
                        onClick={handleArchive}
                        disabled={archiving}
                        className="w-full bg-gray-700 text-white font-bold py-2.5 px-6 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                        <Archive className="w-4 h-4" />
                        {archiving ? 'Архивирование...' : 'Отправить в архив'}
                    </button>
                )}
            </div>

            {/* ── Extra items modal ──────────────────────────────────── */}
            {showExtraModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
                    <div className="bg-white w-full rounded-t-3xl p-5 max-h-[70vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">Добавить доп. товар</h3>
                            <button onClick={() => setShowExtraModal(false)} className="text-gray-400 font-bold text-xl">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {masterProducts.map(p => (
                                <ExtraItemRow key={p.id} product={p} onAdd={handleAddExtraItem} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {showHelp && (
            <HelpModal
                title="Снабженец"
                color="#2E7D32"
                onClose={() => setShowHelp(false)}
                sections={[
                    {
                        label: 'Что делать',
                        items: [
                            'Получить список от шефа и отправить поставщику',
                            'При получении товара отметить каждую позицию',
                            'Нажать «Окончательно отправить» для передачи финансисту',
                        ],
                    },
                    {
                        label: 'Обязательные условия',
                        items: [
                            'Для товаров не на сегодня — обязательно указать дату доставки',
                            'Нельзя завершить приёмку если есть ожидаемые товары с будущей датой',
                        ],
                    },
                    {
                        label: 'Нельзя',
                        items: [
                            'Завершить приёмку с незаполненными датами доставки',
                            'Отправить поставщику без сохранения списка',
                        ],
                    },
                ]}
            />
        )}
    );
}

function ExtraItemRow({ product, onAdd }: { product: Product; onAdd: (id: string, qty: number) => void }) {
    const [qty, setQty] = useState(1);
    return (
        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl">
            <div className="flex-1">
                <p className="font-bold text-sm text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-400">{product.unit}</p>
            </div>
            <input
                type="number"
                value={qty}
                min={1}
                onChange={(e) => setQty(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-16 bg-white border border-gray-200 rounded-xl px-2 py-1 text-center font-bold text-sm"
            />
            <button
                onClick={() => onAdd(product.id, qty)}
                className="bg-[#2E7D32] text-white font-bold px-3 py-1.5 rounded-xl text-sm active:scale-95"
            >
                +
            </button>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { ArrowLeft, Send, Plus, Trash2, Edit2, Check, X, Wallet, FileText, Calendar, MessageSquare, RefreshCcw, AlignJustify, LayoutGrid, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { Order, Product, Unit, Branch } from '@/lib/api';
import { StatusBadge } from '@/app/components/StatusBadge';
import { useLanguage } from '@/app/context/LanguageContext';

const branchNames: Record<Branch | 'all', string> = {
    chilanzar: 'Чиланзар (Новза)',
    uchtepa: 'Учтепа',
    shayzantaur: 'Шайзантаур',
    olmazar: 'Олмазар',
    all: 'Все филиалы',
};

interface FinancierDetailViewProps {
    order: Order;
    onUpdateOrder: (order: Order) => void;
    onBackToRoles: () => void;
    branch: Branch;
    onRefresh?: () => void;
}

export function FinancierDetailView({ order, onUpdateOrder, onBackToRoles, branch, onRefresh }: FinancierDetailViewProps) {
    const { t } = useLanguage();
    const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
    const [localProducts, setLocalProducts] = useState(order.products);
    const [isCompact, setIsCompact] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newProduct, setNewProduct] = useState<Partial<Product>>({
        name: '',
        quantity: 0,
        unit: 'кг',
        category: '⭕️ Другие'
    });

    // Если статус не требует списка заявок, сразу показываем детали
    useEffect(() => {
        if (order.status === 'sent_to_financier' || order.status === 'financier_checking') {
            setViewMode('list');
        } else {
            setViewMode('details');
        }
    }, [order.status]);

    // Обновляем localProducts при изменении order
    useEffect(() => {
        setLocalProducts(order.products);
    }, [order.products]);

    const startEditing = (product: Product) => {
        setEditingId(product.id);
        setEditProduct({ ...product });
    };

    const handleSaveEdit = () => {
        if (editProduct && editingId) {
            setLocalProducts(prev =>
                prev.map(p => (p.id === editingId ? (editProduct as Product) : p))
            );
            setEditingId(null);
            setEditProduct(null);
        }
    };

    const handleDelete = (productId: string) => {
        if (confirm(t('alertDeleteConfirm'))) {
            setLocalProducts(prev => prev.filter(p => p.id !== productId));
        }
    };

    const handleAddProduct = () => {
        if (newProduct.name?.trim()) {
            const product: Product = {
                id: Date.now().toString(),
                name: newProduct.name,
                quantity: newProduct.quantity || 0,
                unit: newProduct.unit as Unit,
                category: newProduct.category || '⭕️ Другие',
            };
            setLocalProducts(prev => [...prev, product]);
            setNewProduct({ name: '', quantity: 0, unit: 'кг', category: '⭕️ Другие' });
            setIsAdding(false);
        }
    };

    const handleSend = () => {
        if (order.status === 'sent_to_financier') {
            onUpdateOrder({
                ...order,
                products: localProducts,
                status: 'sent_to_supplier',
            });
            alert(t('alertApproved'));
        } else if (order.status === 'financier_checking') {
            onUpdateOrder({
                ...order,
                products: localProducts,
                status: 'completed',
            });
            alert(t('alertOrderComplete'));
        }
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
                [t('chef') as any]: p.chefComment || '',
                [t('supplier')]: p.comment || ''
            }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t('financierTitle'));

        const wscols = [
            { wch: 15 }, // Category
            { wch: 30 }, // Name
            { wch: 10 }, // Quantity
            { wch: 10 }, // Unit
            { wch: 15 }, // Price
            { wch: 15 }, // Sum
            { wch: 20 }, // Chef
            { wch: 20 }  // Supplier
        ];
        ws['!cols'] = wscols;

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

        saveAs(blob, `Финансист_${branchNames[branch]}_${new Date().toLocaleDateString('ru-RU')}.xlsx`);
    };

    const isReadOnly = order.status !== 'sent_to_financier';
    const isFinalCheck = order.status === 'financier_checking';

    const totalAmount = localProducts.reduce((sum, p) => {
        if (p.price && p.quantity > 0) {
            return sum + p.price * p.quantity;
        }
        return sum;
    }, 0);

    // Group products by category
    const categories = Array.from(new Set(localProducts.map(p => p.category))).sort();

    // Подсчет продуктов с количеством > 0
    const productsWithQuantity = localProducts.filter(p => p.quantity > 0).length;

    if (viewMode === 'list' && (order.status === 'sent_to_financier' || order.status === 'financier_checking')) {
        return (
            <div className="h-screen overflow-hidden bg-[#f5f5f5] flex flex-col">
                <header className="flex-none text-white p-4 pb-4 rounded-b-2xl shadow-lg relative overflow-hidden" style={{ backgroundColor: '#003366' }}>
                    <div className="flex items-center justify-between mb-2 relative z-10">
                        <button onClick={onBackToRoles} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4" />
                            <h1 className="text-lg font-bold">{t('financierTitle')}</h1>
                        </div>
                        {onRefresh ? (
                            <button onClick={onRefresh} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                                <RefreshCcw className="w-5 h-5" />
                            </button>
                        ) : (
                            <div className="w-9" />
                        )}
                    </div>

                    <div className="relative z-10">
                        <p className="text-white/80 text-[10px] uppercase font-semibold">
                            {t('branch')}: {branch === 'all' ? t('allBranches') : t(`branch${(branch || '').charAt(0).toUpperCase() + (branch || '').slice(1)}` as any)}
                        </p>
                        <h2 className="text-xl font-bold italic tracking-tight leading-none">
                            {order.status === 'sent_to_financier' ? t('incomingOrders') : t('finalCheckOrders')}
                        </h2>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 -mt-6 pb-[120px]">
                    <div className="space-y-4">
                        <div
                            onClick={() => setViewMode('details')}
                            className="bg-white p-6 rounded-[2.5rem] shadow-md border border-gray-100 transition-all active:scale-[0.99] cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                                            <FileText className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {order.status === 'sent_to_financier' ? t('orderFromChef') : t('orderFromSupplier')}
                                            </h3>
                                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                <Calendar className="w-4 h-4" />
                                                {order.createdAt.toLocaleDateString('ru-RU', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="ml-16 space-y-2">
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-gray-600">{t('positions')}:</span>
                                            <span className="font-bold text-blue-600">{productsWithQuantity}</span>
                                        </div>
                                        {totalAmount > 0 && (
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-gray-600">{t('sum')}:</span>
                                                <span className="font-bold text-gray-900">{totalAmount.toLocaleString()} {t('sum')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <StatusBadge status={order.status} />
                            </div>
                            <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('clickForDetails')}</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden bg-[#f5f5f5] flex flex-col">
            <header className="flex-none text-white p-4 pb-4 rounded-b-2xl shadow-lg relative overflow-hidden" style={{ backgroundColor: '#003366' }}>
                <div className="flex items-center justify-between mb-2 relative z-10">
                    <button
                        onClick={() => {
                            if (order.status === 'sent_to_financier' || order.status === 'financier_checking') {
                                setViewMode('list');
                            } else {
                                onBackToRoles();
                            }
                        }}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        <h1 className="text-lg font-bold">{t('financierTitle')}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {onRefresh && (
                            <button onClick={onRefresh} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                                <RefreshCcw className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={() => setIsCompact(!isCompact)}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                        >
                            {isCompact ? <LayoutGrid className="w-5 h-5" /> : <AlignJustify className="w-5 h-5" />}
                        </button>
                        <button onClick={handleExportExcel} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                            <Download className="w-5 h-5" />
                        </button>
                        {!isReadOnly && (
                            <button onClick={() => setIsAdding(true)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                                <Plus className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="relative z-10 flex items-end justify-between">
                    <div>
                        <p className="text-white/80 text-[10px] uppercase font-semibold leading-none mb-1">
                            {t('branch')}: {branch === 'all' ? t('allBranches') : t(`branch${(branch || '').charAt(0).toUpperCase() + (branch || '').slice(1)}` as any)}
                        </p>
                        <h2 className="text-xl font-bold italic tracking-tight leading-none">
                            {order.createdAt.toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'short'
                            })}
                        </h2>
                        {order.estimatedDeliveryDate && (
                            <p className="text-white/90 text-xs font-bold mt-1 flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg w-fit">
                                <Calendar className="w-3 h-3" />
                                {t('estimatedDelivery')}: {order.estimatedDeliveryDate.toLocaleDateString('ru-RU', {
                                    day: 'numeric',
                                    month: 'long'
                                })}
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <StatusBadge status={order.status} />
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 -mt-6 pb-[240px]">
                <div className={isCompact ? "space-y-4" : "space-y-8"}>
                    {categories.map(category => {
                        const categoryProducts = localProducts.filter(p => p.category === category && p.quantity > 0);
                        if (categoryProducts.length === 0) return null;

                        return (
                            <div key={category} className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 pl-2 border-l-4 border-blue-500">
                                    {category}
                                </h3>
                                <div className={isCompact ? "space-y-2" : "space-y-3"}>
                                    {categoryProducts.map(product => (
                                        <div
                                            key={product.id}
                                            className={`bg-white rounded-[2.5rem] shadow-md border border-gray-100 ${isCompact ? 'p-3 rounded-xl' : 'p-5'}`}
                                        >
                                            {editingId === product.id && editProduct ? (
                                                <div className="space-y-4">
                                                    <input
                                                        autoFocus
                                                        className="text-xl font-bold w-full bg-gray-50 border-none rounded-2xl px-4 py-2 mb-2 focus:ring-2 focus:ring-blue-500"
                                                        value={editProduct.name}
                                                        onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                                                    />
                                                    <div className="flex gap-4">
                                                        <div className="flex-1">
                                                            <label className="text-[10px] uppercase font-bold text-gray-400 ml-2 mb-1 block">Кол-во</label>
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 font-bold text-lg focus:ring-2 focus:ring-blue-500"
                                                                    value={editProduct.quantity || ''}
                                                                    onChange={(e) => setEditProduct({ ...editProduct, quantity: parseFloat(e.target.value) || 0 })}
                                                                />
                                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{editProduct.unit}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="text-[10px] uppercase font-bold text-gray-400 ml-2 mb-1 block">Ед. изм.</label>
                                                            <select
                                                                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 font-bold text-lg focus:ring-2 focus:ring-blue-500 appearance-none"
                                                                value={editProduct.unit}
                                                                onChange={(e) => setEditProduct({ ...editProduct, unit: e.target.value as Unit })}
                                                            >
                                                                <option value="кг">кг</option>
                                                                <option value="шт">шт</option>
                                                                <option value="л">л</option>
                                                                <option value="г">г</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] uppercase font-bold text-gray-400 ml-2 mb-1 block">Категория</label>
                                                        <input
                                                            type="text"
                                                            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 font-bold text-lg focus:ring-2 focus:ring-blue-500"
                                                            value={editProduct.category}
                                                            onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="flex gap-3 pt-2">
                                                        <button
                                                            onClick={handleSaveEdit}
                                                            className="flex-1 bg-green-500 text-white font-bold py-3 rounded-2xl shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                                                        >
                                                            <Check className="w-5 h-5" /> Сохранить
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingId(null); setEditProduct(null); }}
                                                            className="flex-1 bg-gray-100 text-gray-500 font-bold py-3 rounded-2xl flex items-center justify-center gap-2"
                                                        >
                                                            <X className="w-5 h-5" /> Отмена
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    {isCompact ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="font-bold text-gray-900 text-sm truncate">{product.name}</h4>
                                                                    {product.checked && <Check className="w-4 h-4 text-green-500" />}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs">
                                                                    <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">
                                                                        {product.quantity} {product.unit}
                                                                    </span>
                                                                    {product.price && <span className="text-gray-500">{product.price.toLocaleString()} сум</span>}
                                                                    <span className="font-bold text-gray-900 ml-auto">
                                                                        {((product.price || 0) * product.quantity).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {!isReadOnly && !isFinalCheck && (
                                                                <div className="flex gap-1">
                                                                    <button onClick={() => startEditing(product)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <h4 className="font-bold text-gray-900 text-lg leading-tight mb-2 pr-2">{product.name}</h4>
                                                                <div className="flex items-center gap-4">
                                                                    {product.checked && (
                                                                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                                            <Check className="w-3 h-3 text-white" />
                                                                        </div>
                                                                    )}
                                                                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-bold">
                                                                        {product.quantity} {product.unit}
                                                                    </span>
                                                                    {product.price && (
                                                                        <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
                                                                            {product.price.toLocaleString()} сум / {product.unit}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {product.lastPrice && (
                                                                    <div className="text-xs text-gray-400 mt-1">
                                                                        Цена последний раз: <b>{product.lastPrice.toLocaleString()}</b> сум
                                                                    </div>
                                                                )}
                                                                {product.comment && (
                                                                    <div className="flex items-start gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg mt-2">
                                                                        <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                                                                        <p><b>Поставщик:</b> {product.comment}</p>
                                                                    </div>
                                                                )}
                                                                {product.chefComment && (
                                                                    <div className="flex items-start gap-2 text-xs text-green-600 bg-green-50 p-2 rounded-lg mt-2">
                                                                        <Check className="w-3 h-3 mt-0.5 shrink-0" />
                                                                        <p><b>Шеф-повар:</b> {product.chefComment}</p>
                                                                    </div>
                                                                )}
                                                                {product.deliveryDate && (
                                                                    <div className="flex items-start gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded-lg mt-2">
                                                                        <Calendar className="w-3 h-3 mt-0.5 shrink-0" />
                                                                        <p><b>Дата доставки:</b> {new Date(product.deliveryDate).toLocaleDateString()}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {!isReadOnly && !isFinalCheck && (
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => startEditing(product)} className="p-3 bg-gray-50 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-2xl transition-all">
                                                                        <Edit2 className="w-5 h-5" />
                                                                    </button>
                                                                    <button onClick={() => handleDelete(product.id)} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                                                        <Trash2 className="w-5 h-5" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {product.price && product.quantity > 0 && !isCompact && (
                                                        <div className="mt-4 pt-4 border-t border-dashed border-gray-100 flex justify-between items-center">
                                                            <span className="text-gray-400 text-xs font-bold uppercase">Общая стоимость:</span>
                                                            <span className="text-lg font-black text-gray-900">
                                                                {(product.price * product.quantity).toLocaleString()} сум
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center gap-4 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20">
                <div className="flex-1">
                    <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-0.5">Итого</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-black text-gray-900 leading-none">
                            {totalAmount.toLocaleString()}
                        </p>
                        <span className="text-xs font-bold text-gray-400 uppercase">сум</span>
                    </div>
                </div>

                <div className="flex-none">
                    {(order.status === 'sent_to_financier' || order.status === 'financier_checking') ? (
                        <button
                            onClick={handleSend}
                            disabled={localProducts.length === 0}
                            className="bg-[#003366] text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:active:scale-100"
                        >
                            <Send className="w-4 h-4" />
                            {order.status === 'sent_to_financier' ? 'Утвердить' : 'Завершить'}
                        </button>
                    ) : (
                        <div className="px-4 py-2 bg-gray-100 rounded-xl border border-gray-200">
                            <p className="text-gray-500 text-xs font-bold">{order.status}</p>
                        </div>
                    )}
                </div>
            </div>

            {isAdding && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl scale-in-center">
                        <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                                <Plus className="w-6 h-6" />
                            </div>
                            Новый товар
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-black text-gray-400 ml-4 mb-2 block">Наименование</label>
                                <input
                                    autoFocus
                                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all"
                                    placeholder="Например: Помидоры Черри"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-[10px] uppercase font-black text-gray-400 ml-4 mb-2 block">Кол-во</label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="0"
                                        value={newProduct.quantity || ''}
                                        onChange={(e) => setNewProduct({ ...newProduct, quantity: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] uppercase font-black text-gray-400 ml-4 mb-2 block">Ед. изм.</label>
                                    <select
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                        value={newProduct.unit}
                                        onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value as Unit })}
                                    >
                                        <option value="кг">кг</option>
                                        <option value="шт">шт</option>
                                        <option value="л">л</option>
                                        <option value="г">г</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black text-gray-400 ml-4 mb-2 block">Категория</label>
                                <input
                                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all"
                                    value={newProduct.category}
                                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button onClick={handleAddProduct} className="flex-2 bg-blue-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95">Добавить</button>
                                <button onClick={() => setIsAdding(false)} className="flex-1 bg-gray-100 text-gray-500 font-bold py-4 rounded-2xl transition-all active:scale-95">Отмена</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

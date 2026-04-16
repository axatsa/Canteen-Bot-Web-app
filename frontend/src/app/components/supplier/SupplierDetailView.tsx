import { useState, useEffect } from 'react';
import { ArrowLeft, Send, MessageSquare, Truck, Check, RefreshCcw, AlignJustify, LayoutGrid, Download, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { Order, Branch } from '@/lib/api';
import { StatusBadge } from '@/app/components/StatusBadge';
import { useLanguage } from '@/app/context/LanguageContext';

const branchNames: Record<Branch, string> = {
    chilanzar: 'Чиланзар (Новза)',
    uchtepa: 'Учтепа',
    shayzantaur: 'Шайзантаур',
    olmazar: 'Олмазар',
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
    const [isCompact, setIsCompact] = useState(false);
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
            prev.map(p =>
                p.id === productId ? { ...p, [field]: value } : p
            )
        );
    };

    const handleSend = () => {
        // Validation: Check if all products have a price
        const missingPrice = localProducts.some(p => p.quantity > 0 && (!p.price || p.price <= 0));

        if (missingPrice) {
            alert(t('alertNoPrices'));
            return;
        }

        onUpdateOrder({
            ...order,
            products: localProducts,
            status: 'chef_checking',
            estimatedDeliveryDate: estimatedDate ? new Date(estimatedDate) : undefined,
        });
        alert(t('alertSentToChef'));
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
        <div className="h-screen overflow-hidden bg-[#f5f5f5] flex flex-col">
            <header className="flex-none text-white p-4 pb-4 rounded-b-2xl shadow-lg relative overflow-hidden" style={{ backgroundColor: '#FF6B00' }}>
                <div className="flex items-center justify-between mb-2 relative z-10">
                    <button onClick={onBackToRoles} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        <h1 className="text-lg font-bold">{t('supplierTitle')}</h1>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsCompact(!isCompact)}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            {isCompact ? <LayoutGrid className="w-5 h-5" /> : <AlignJustify className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="relative z-10 flex items-end justify-between">
                    <div>
                        <p className="text-white/80 text-[10px] uppercase font-semibold leading-none mb-1">{t('branch')}: {t(`branch${branch.charAt(0).toUpperCase() + branch.slice(1)}` as any)}</p>
                        <h2 className="text-xl font-bold italic tracking-tight leading-none">
                            {order.createdAt.toLocaleDateString(t('back') === 'Orqaga' ? 'uz-UZ' : 'ru-RU', {
                                day: 'numeric',
                                month: 'short'
                            })}
                        </h2>
                    </div>
                    <StatusBadge status={order.status} />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 -mt-2 pb-[240px]">
                <div className={isCompact ? "space-y-4" : "space-y-8"}>
                    {categories.map(category => {
                        const categoryProducts = filteredProducts.filter(p => p.category === category);
                        return (
                            <div key={category} className="space-y-4">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 pl-2 border-l-4" style={{ borderColor: '#FF6B00' }}>
                                    {category}
                                </h3>
                                <div className={isCompact ? "space-y-2" : "space-y-3"}>
                                    {categoryProducts.map(product => (
                                        <div
                                            key={product.id}
                                            className={`bg-white rounded-[2.5rem] shadow-md border border-gray-100 ${isCompact ? 'p-3 flex items-center gap-3 rounded-xl' : 'p-5'
                                                }`}
                                        >
                                            {isCompact ? (
                                                <>
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <button
                                                            onClick={() => handleUpdateProduct(product.id, 'checked', !product.checked)}
                                                            className={`w-5 h-5 rounded transition-all flex items-center justify-center flex-shrink-0 ${product.checked
                                                                ? 'bg-orange-500 text-white'
                                                                : 'bg-gray-100 text-transparent'
                                                                }`}
                                                        >
                                                            <Check className="w-3 h-3" />
                                                        </button>
                                                        <div className="min-w-0 flex-1">
                                                            <h4 className={`font-bold text-gray-900 text-sm truncate ${product.checked ? 'text-gray-400 line-through' : ''}`}>
                                                                {product.name}
                                                            </h4>
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <span className="text-orange-600 font-bold">
                                                                    {product.quantity} {product.unit}
                                                                </span>
                                                                <span className="text-gray-400">
                                                                    {((product.price || 0) * product.quantity).toLocaleString()}
                                                                </span>
                                                                {product.lastPrice && !product.price && (
                                                                    <span className="text-gray-300 text-[10px] ml-1">
                                                                        (пред.: {product.lastPrice})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <input
                                                            type="number"
                                                            placeholder={t('price')}
                                                            value={product.price || ''}
                                                            onChange={(e) => handleUpdateProduct(product.id, 'price', parseFloat(e.target.value) || 0)}
                                                            className="w-20 bg-gray-50 rounded-lg px-2 py-1.5 text-sm font-bold text-right focus:ring-1 focus:ring-orange-500 outline-none"
                                                        />
                                                        <div className="relative">
                                                            <input
                                                                placeholder="..."
                                                                value={product.comment || ''}
                                                                onChange={(e) => handleUpdateProduct(product.id, 'comment', e.target.value)}
                                                                className="w-24 bg-gray-50 rounded-lg px-2 py-1.5 text-sm pl-7 focus:ring-1 focus:ring-orange-500 outline-none"
                                                            />
                                                            <MessageSquare className="absolute left-2 top-1.5 w-3.5 h-3.5 text-gray-300" />
                                                        </div>
                                                        <input
                                                            type="date"
                                                            value={product.deliveryDate ? new Date(product.deliveryDate).toISOString().split('T')[0] : ''}
                                                            onChange={(e) => handleUpdateProduct(product.id, 'deliveryDate', e.target.value)}
                                                            className="w-32 bg-gray-50 rounded-lg px-2 py-1.5 text-sm font-bold text-gray-700 focus:ring-1 focus:ring-orange-500 outline-none"
                                                        />
                                                    </div>
                                                </>
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
                                                            <input
                                                                type="date"
                                                                value={product.deliveryDate ? new Date(product.deliveryDate).toISOString().split('T')[0] : ''}
                                                                onChange={(e) => handleUpdateProduct(product.id, 'deliveryDate', e.target.value)}
                                                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-medium text-gray-700 focus:ring-2 focus:ring-orange-500 transition-all"
                                                            />
                                                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs uppercase">{t('deliveryDate')}</span>
                                                        </div>
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
                    <input
                        type="date"
                        value={estimatedDate}
                        onChange={(e) => setEstimatedDate(e.target.value)}
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
    );
}

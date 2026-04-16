import { useState, useEffect } from 'react';
import { ArrowLeft, Send, CheckSquare, Save } from 'lucide-react';
import type { Order, Branch, Product } from '@/lib/api';
import { StatusBadge } from '@/app/components/StatusBadge';
import { useLanguage } from '@/app/context/LanguageContext';

interface SnabjenecDetailViewProps {
    order: Order;
    onUpdateOrder: (order: Order) => void;
    onBackToRoles: () => void;
    branch: Branch;
    onRefresh?: () => void;
    isFromBot?: boolean;
}

export function SnabjenecDetailView({ order, onUpdateOrder, onBackToRoles, branch, isFromBot }: SnabjenecDetailViewProps) {
    const { t } = useLanguage();
    const [localProducts, setLocalProducts] = useState<Product[]>(order.products);

    useEffect(() => {
        setLocalProducts(order.products);
    }, [order.products]);

    const handleUpdateProduct = (productId: string, field: string, value: any) => {
        setLocalProducts(prev =>
            prev.map(p =>
                p.id === productId ? { ...p, [field]: value } : p
            )
        );
    };

    const isReviewMode = order.status === 'review_snabjenec';
    const isReceiveMode = order.status === 'waiting_snabjenec_receive';

    const handleSendToSupplier = () => {
        onUpdateOrder({
            ...order,
            products: localProducts,
            status: 'sent_to_supplier',
        });
        alert(t('alertListSent')); 
    };

    const handleSaveProgress = () => {
        onUpdateOrder({
            ...order,
            products: localProducts,
        });
        alert(t('saveProgress') + " \u2714\uFE0F");
    };

    const handleCompleteReceive = () => {
        const activeProducts = localProducts.filter(p => p.quantity > 0);
        const allReceived = activeProducts.every(p => p.received);
        if (!allReceived) {
            alert('Сначала отметьте все товары как полученные! / Dastlab barchasini olingan deb belgilang!');
            return;
        }

        onUpdateOrder({
            ...order,
            products: localProducts,
            status: 'sent_to_financier',
        });
        alert(t('alertCheckComplete'));
    };

    const displayProducts = localProducts.filter(p => p.quantity > 0);
    
    // Split products for Receive mode
    const arrivedProducts = displayProducts.filter(p => p.received);
    const pendingProducts = displayProducts.filter(p => !p.received);

    // Helpers to render products
    const renderProductEditCard = (product: Product) => (
        <div key={product.id} className="bg-white p-4 rounded-3xl shadow-md border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-2">{product.name}</h4>
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

    const renderProductCheckCard = (product: Product, isArrived: boolean) => (
        <div key={product.id} className="bg-white p-4 rounded-3xl shadow-md border border-gray-100 flex items-start gap-3 transition-all active:scale-[0.98]" onClick={() => handleUpdateProduct(product.id, 'received', !product.received)}>
            <button
                className={`mt-1 w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0 ${product.received
                ? 'bg-[#2E7D32] border-[#2E7D32] text-white'
                : 'bg-white border-gray-300 text-transparent'
                }`}
            >
                <CheckSquare className="w-4 h-4" />
            </button>
            <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                <h4 className={`font-bold text-lg leading-tight mb-1 ${product.received ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {product.name}
                </h4>
                <div className="flex gap-2 text-sm text-gray-500 font-bold mb-1">
                     <span>{product.quantity} {product.unit}</span>
                     {product.price && product.price > 0 && (
                         <span>• {(product.quantity * product.price).toLocaleString()} {t('sum')}</span>
                     )}
                </div>
                {!product.received && (
                    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{t('expectedDateLabel')}</label>
                        <input
                            type="text"
                            value={product.expectedDate || ''}
                            onChange={(e) => handleUpdateProduct(product.id, 'expectedDate', e.target.value)}
                            placeholder="..."
                            className="w-full bg-gray-50 rounded-xl px-3 py-2 text-sm border-none focus:ring-1 focus:ring-[#2E7D32]"
                        />
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="h-screen overflow-hidden bg-[#f5f5f5] flex flex-col">
            <header className="flex-none text-white p-4 rounded-b-2xl shadow-lg relative overflow-hidden" style={{ backgroundColor: '#2E7D32' }}>
                <div className="flex items-center justify-between mb-2">
                    <button onClick={onBackToRoles} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <StatusBadge status={order.status} />
                </div>
                <h2 className="text-xl font-bold">{t(`branch${branch.charAt(0).toUpperCase() + branch.slice(1)}` as any)}</h2>
            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-[180px]">
                {isReviewMode && (
                    <div className="space-y-4">
                        {displayProducts.map(renderProductEditCard)}
                    </div>
                )}
                
                {isReceiveMode && (
                    <div className="space-y-8">
                        {pendingProducts.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-gray-800 border-l-4 pl-2 border-[#2E7D32]">{t('pendingProducts')} ({pendingProducts.length})</h3>
                                {pendingProducts.map(p => renderProductCheckCard(p, false))}
                            </div>
                        )}

                        {arrivedProducts.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-bold text-gray-500 border-l-4 pl-2 border-gray-400">{t('arrivedProducts')} ({arrivedProducts.length})</h3>
                                {arrivedProducts.map(p => renderProductCheckCard(p, true))}
                            </div>
                        )}
                    </div>
                )}
                {(!isReviewMode && !isReceiveMode) && (
                    <div className="text-center py-12 text-gray-400 font-bold">{t('readOnly')}</div>
                )}
            </main>

            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center justify-between gap-4 z-20 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                {isReviewMode && (
                    <button
                        onClick={handleSendToSupplier}
                        className="w-full bg-[#2E7D32] text-white font-bold py-3 px-6 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Send className="w-5 h-5" />
                        {t('sendToSupplier')}
                    </button>
                )}
                {isReceiveMode && (
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
                            disabled={pendingProducts.length > 0}
                            className={`flex-[1.5] text-white font-bold py-3 px-2 rounded-2xl shadow-lg active:scale-95 transition-all text-sm flex items-center justify-center gap-1 ${pendingProducts.length === 0 ? 'bg-[#2E7D32]' : 'bg-gray-300 opacity-50'}`}
                        >
                            <Send className="w-4 h-4" />
                            {t('completeReceive')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

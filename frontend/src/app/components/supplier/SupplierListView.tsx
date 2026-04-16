import { ArrowLeft, Truck, RefreshCcw } from 'lucide-react';
import type { Order } from '@/lib/api';
import { StatusBadge } from '@/app/components/StatusBadge';
import { useLanguage } from '@/app/context/LanguageContext';

interface SupplierListViewProps {
    orders: Order[];
    onSelectOrder: (orderId: string) => void;
    onBackToRoles: () => void;
    onRefresh?: () => void;
    isFromBot?: boolean;
}

export function SupplierListView({ orders, onSelectOrder, onBackToRoles, onRefresh, isFromBot }: SupplierListViewProps) {
    const { t } = useLanguage();
    const activeOrders = orders.filter(o => o.status === 'sent_to_supplier');

    return (
        <div className="h-screen overflow-hidden bg-[#f5f5f5] flex flex-col">
            <header className="flex-none text-white p-4 pb-4 rounded-b-2xl shadow-lg relative overflow-hidden" style={{ backgroundColor: '#FF6B00' }}>
                <div className="flex items-center justify-between mb-2 relative z-10">
                    {!isFromBot ? (
                        <button onClick={onBackToRoles} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    ) : (
                        <div className="w-9" />
                    )}
                    <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        <h1 className="text-lg font-bold">{t('supplierTitle')}</h1>
                    </div>
                    {onRefresh ? (
                        <button
                            onClick={onRefresh}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                        >
                            <RefreshCcw className="w-5 h-5" />
                        </button>
                    ) : null}
                </div>

                <div className="relative z-10">
                    <h2 className="text-xl font-bold italic tracking-tight leading-none">{t('allOrders')}</h2>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 -mt-2 pb-[120px]">
                <div className="space-y-4">
                    {activeOrders.length === 0 ? (
                        <div className="bg-white p-12 rounded-[2.5rem] shadow-md border border-gray-100 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Truck className="w-10 h-10 text-gray-200" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('noOrdersYet')}</h3>
                            <p className="text-gray-500">{t('noOrdersDesc')}</p>
                        </div>
                    ) : (
                        activeOrders.map(order => (
                            <div
                                key={order.id}
                                onClick={() => onSelectOrder(order.id)}
                                className="bg-white p-6 rounded-[2.5rem] shadow-md border border-gray-100 transition-all active:scale-[0.99] cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#fff3e0' }}>
                                                <Truck className="w-6 h-6" style={{ color: '#FF6B00' }} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{t(`branch${order.branch.charAt(0).toUpperCase() + order.branch.slice(1)}` as any)}</h3>
                                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                    {order.createdAt.toLocaleDateString(t('back') === 'Orqaga' ? 'uz-UZ' : 'ru-RU', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="ml-16">
                                            <p className="text-sm text-gray-600">
                                                {t('positions')}: <span className="font-bold text-gray-900">{order.products.filter(p => p.quantity > 0).length}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <StatusBadge status={order.status} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}

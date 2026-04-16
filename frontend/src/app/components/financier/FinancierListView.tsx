import { useState } from 'react';
import { ArrowLeft, Wallet, RefreshCcw, FileText, Calendar } from 'lucide-react';
import type { Order, Branch } from '@/lib/api';
import { StatusBadge } from '@/app/components/StatusBadge';
import { useLanguage } from '@/app/context/LanguageContext';

interface FinancierListViewProps {
    orders: Order[];
    onSelectOrder: (orderId: string) => void;
    onBackToRoles: () => void;
    onRefresh?: () => void;
    isFromBot?: boolean;
}

export function FinancierListView({ orders, onSelectOrder, onBackToRoles, onRefresh, isFromBot }: FinancierListViewProps) {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
    const [branchFilter, setBranchFilter] = useState<Branch | 'all'>('all');

    // Фильтруем заявки по статусам и филиалу
    const filteredByBranch = branchFilter === 'all'
        ? orders
        : orders.filter(o => o.branch === branchFilter);

    const incomingOrders = filteredByBranch.filter(o => o.status === 'sent_to_financier');
    const checkingOrders = filteredByBranch.filter(o => o.status === 'financier_checking');
    const archiveOrders = filteredByBranch.filter(o => o.status === 'completed');

    // Функция для расчета общей суммы заявки
    const calculateTotal = (order: Order) => {
        return order.products.reduce((sum, p) => {
            if (p.price && p.quantity > 0) {
                return sum + (p.price * p.quantity);
            }
            return sum;
        }, 0);
    };

    return (
        <div className="h-screen overflow-hidden bg-[#f5f5f5] flex flex-col">
            <header className="flex-none text-white p-4 pb-4 rounded-b-2xl shadow-lg relative overflow-hidden" style={{ backgroundColor: '#003366' }}>
                <div className="flex items-center justify-between mb-2 relative z-10">
                    {!isFromBot ? (
                        <button onClick={onBackToRoles} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    ) : (
                        <div className="w-9" />
                    )}
                    <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        <h1 className="text-lg font-bold">{t('financierTitle')}</h1>
                    </div>
                    {onRefresh ? (
                        <button
                            onClick={onRefresh}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                        >
                            <RefreshCcw className="w-5 h-5" />
                        </button>
                    ) : (
                        <div className="w-9" />
                    )}
                </div>

                <div className="flex items-center justify-between mb-4 relative z-10">
                    <h2 className="text-xl font-bold italic tracking-tight leading-none">{t('allOrders')}</h2>

                    <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-sm">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'active' ? 'bg-white text-[#003366]' : 'text-white/60 hover:text-white'}`}
                        >
                            {t('incomingOrders')}
                        </button>
                        <button
                            onClick={() => setActiveTab('archive')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'archive' ? 'bg-white text-[#003366]' : 'text-white/60 hover:text-white'}`}
                        >
                            {t('archive')}
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 -mt-6 pb-[120px]">
                <div className="space-y-6">
                    {activeTab === 'active' ? (
                        <>
                            {incomingOrders.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">{t('incomingOrders')}</h3>
                                    <div className="space-y-4">
                                        {incomingOrders.map(order => {
                                            const total = calculateTotal(order);
                                            return (
                                                <div
                                                    key={order.id}
                                                    onClick={() => onSelectOrder(order.id)}
                                                    className="bg-white p-6 rounded-[2.5rem] shadow-md border border-gray-100 transition-all active:scale-[0.99] cursor-pointer"
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#e3f2fd' }}>
                                                                    <FileText className="w-6 h-6" style={{ color: '#003366' }} />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-lg font-bold text-gray-900">{t('orderFromChef')}</h3>
                                                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                                        <Calendar className="w-4 h-4" />
                                                                        {order.createdAt.toLocaleDateString(language === 'uz' ? 'uz-UZ' : 'ru-RU', {
                                                                            day: 'numeric',
                                                                            month: 'long',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="ml-16 space-y-2">
                                                                <div className="flex items-center gap-4 text-sm">
                                                                    <span className="text-gray-600">{t('branch')}:</span>
                                                                    <span className="font-bold text-gray-900">{t(`branch${order.branch.charAt(0).toUpperCase() + order.branch.slice(1)}` as any)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-4 text-sm">
                                                                    <span className="text-gray-600">{t('positions')}:</span>
                                                                    <span className="font-bold" style={{ color: '#003366' }}>
                                                                        {order.products.filter(p => p.quantity > 0).length}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <StatusBadge status={order.status} />
                                                            {total > 0 && (
                                                                <div className="mt-2">
                                                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">{t('totalAmount')}</p>
                                                                    <p className="text-xl font-black" style={{ color: '#003366' }}>
                                                                        {total.toLocaleString()} <span className="text-sm font-bold text-gray-400">{t('sum')}</span>
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {checkingOrders.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">{t('finalCheckOrders')}</h3>
                                    <div className="space-y-4">
                                        {checkingOrders.map(order => {
                                            const total = calculateTotal(order);
                                            return (
                                                <div
                                                    key={order.id}
                                                    onClick={() => onSelectOrder(order.id)}
                                                    className="bg-white p-6 rounded-[2.5rem] shadow-md border border-gray-100 transition-all active:scale-[0.99] cursor-pointer"
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#e3f2fd' }}>
                                                                    <FileText className="w-6 h-6" style={{ color: '#003366' }} />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-lg font-bold text-gray-900">{t('orderAfterChefCheck')}</h3>
                                                                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                                        <Calendar className="w-4 h-4" />
                                                                        {order.createdAt.toLocaleDateString(language === 'uz' ? 'uz-UZ' : 'ru-RU', {
                                                                            day: 'numeric',
                                                                            month: 'long',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="ml-16 space-y-2">
                                                                <div className="flex items-center gap-4 text-sm">
                                                                    <span className="text-gray-600">{t('branch')}:</span>
                                                                    <span className="font-bold text-gray-900">{t(`branch${order.branch.charAt(0).toUpperCase() + order.branch.slice(1)}` as any)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-4 text-sm">
                                                                    <span className="text-gray-600">{t('positions')}:</span>
                                                                    <span className="font-bold" style={{ color: '#003366' }}>
                                                                        {order.products.filter(p => p.quantity > 0).length}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <StatusBadge status={order.status} />
                                                            {total > 0 && (
                                                                <div className="mt-2">
                                                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">{t('totalAmount')}</p>
                                                                    <p className="text-xl font-black" style={{ color: '#003366' }}>
                                                                        {total.toLocaleString()} <span className="text-sm font-bold text-gray-400">{t('sum')}</span>
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {incomingOrders.length === 0 && checkingOrders.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-400">{t('noOrders')}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4">{t('archive')}</h3>
                            <div className="space-y-4">
                                {archiveOrders.length > 0 ? (
                                    archiveOrders.map(order => {
                                        const total = calculateTotal(order);
                                        return (
                                            <div
                                                key={order.id}
                                                onClick={() => onSelectOrder(order.id)}
                                                className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 opacity-80"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                                                                <FileText className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-700">
                                                                    {order.branch === 'all'
                                                                        ? t('allBranches')
                                                                        : t(`branch${(order.branch || '').charAt(0).toUpperCase() + (order.branch || '').slice(1)}` as any)}
                                                                </h3>
                                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {order.createdAt.toLocaleDateString('ru-RU')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <StatusBadge status={order.status} />
                                                        <p className="text-sm font-bold text-gray-900 mt-1">
                                                            {total.toLocaleString()} {t('sum')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-gray-400">{t('noOrders')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

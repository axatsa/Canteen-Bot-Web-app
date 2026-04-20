import { useState } from 'react';
import { ArrowLeft, Package, RefreshCcw, FileText, Calendar, HelpCircle } from 'lucide-react';
import type { Order, Branch } from '@/lib/api';
import { StatusBadge } from '@/app/components/StatusBadge';
import { HelpModal } from '@/app/components/HelpModal';
import { useLanguage } from '@/app/context/LanguageContext';

interface SnabjenecListViewProps {
    orders: Order[];
    onSelectOrder: (orderId: string) => void;
    onBackToRoles: () => void;
    onRefresh?: () => void;
    isFromBot?: boolean;
}

export function SnabjenecListView({ orders, onSelectOrder, onBackToRoles, onRefresh, isFromBot }: SnabjenecListViewProps) {
    const { t, language } = useLanguage();
    const [showHelp, setShowHelp] = useState(false);

    const activeOrders = orders.filter(o => 
        o.status === 'review_snabjenec' || o.status === 'waiting_snabjenec_receive'
    );

    return (
        <>
        <div className="h-screen overflow-hidden bg-[#f5f5f5] flex flex-col">
            <header className="flex-none text-white p-4 pb-4 rounded-b-2xl shadow-lg relative overflow-hidden" style={{ backgroundColor: '#2E7D32' }}>
                <div className="flex items-center justify-between mb-2 relative z-10">
                    <div className="flex items-center gap-1">
                        {!isFromBot ? (
                            <button onClick={onBackToRoles} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        ) : (
                            <div className="w-9" />
                        )}
                        <button onClick={() => setShowHelp(true)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        <h1 className="text-lg font-bold">{t('snabjenecTitle')}</h1>
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

                <div className="relative z-10">
                    <h2 className="text-xl font-bold italic tracking-tight leading-none">{t('incomingOrders')}</h2>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-[120px]">
                <div className="space-y-4">
                    {activeOrders.length > 0 ? (
                        activeOrders.map(order => (
                            <div
                                key={order.id}
                                onClick={() => onSelectOrder(order.id)}
                                className="bg-white p-6 rounded-[2.5rem] shadow-md border border-gray-100 transition-all active:scale-[0.99] cursor-pointer"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#e8f5e9' }}>
                                                <FileText className="w-6 h-6" style={{ color: '#2E7D32' }} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{t(`branch${order.branch.charAt(0).toUpperCase() + order.branch.slice(1)}` as any)}</h3>
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
                                        <div className="ml-16">
                                           <p className="text-sm text-gray-600">{t('positions')}: <span className="font-bold text-[#2E7D32]">{order.products.filter(p => p.quantity > 0).length}</span></p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <StatusBadge status={order.status} />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-400">{t('noOrders')}</p>
                        </div>
                    )}
                </div>
            </main>
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
        </>
    );
}

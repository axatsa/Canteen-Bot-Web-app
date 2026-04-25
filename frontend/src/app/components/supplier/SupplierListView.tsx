import { useState } from 'react';
import { ArrowLeft, Truck, RefreshCcw, HelpCircle, ChevronRight } from 'lucide-react';
import type { Order, Role } from '@/lib/api';
import { HelpModal } from '@/app/components/HelpModal';
import { useLanguage } from '@/app/context/LanguageContext';

const BRANCH_LABELS: Record<string, string> = {
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

interface SupplierListViewProps {
    orders: Order[];
    onSelectOrder: (orderId: string) => void;
    onBackToRoles: () => void;
    onRefresh?: () => void;
    isFromBot?: boolean;
    role: Role;
}

export function SupplierListView({ orders, onSelectOrder, onBackToRoles, onRefresh, isFromBot, role }: SupplierListViewProps) {
    const { t } = useLanguage();
    const [showHelp, setShowHelp] = useState(false);
    const activeOrders = orders.filter(o => {
        if (o.status !== 'sent_to_supplier' && o.status !== 'waiting_snabjenec_receive' && o.status !== 'supplier_collecting' && o.status !== 'supplier_delivering') return false;
        
        if (role === 'supplier_meat') return o.sentToMeatSupplier === true;
        if (role === 'supplier_products') return o.sentToProductSupplier === true;
        
        // Filter out orders that don't have any products for this supplier
        return o.products.some(p => {
            if (p.quantity <= 0) return false;
            return true;
        });
    });

    return (
        <>
            <div className="h-screen overflow-hidden bg-[#f5f5f5] flex flex-col">

                {/* Header */}
                <header
                    className="flex-none text-white px-4 pt-4 pb-5 rounded-b-3xl shadow-lg"
                    style={{ backgroundColor: '#FF6B00' }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {!isFromBot && (
                                <button
                                    onClick={onBackToRoles}
                                    className="w-9 h-9 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-xl transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => setShowHelp(true)}
                                className="w-9 h-9 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-xl transition-colors"
                            >
                                <HelpCircle className="w-4 h-4" />
                            </button>
                        </div>
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                className="w-9 h-9 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-xl transition-colors"
                            >
                                <RefreshCcw className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-end justify-between">
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <Truck className="w-4 h-4 opacity-70" />
                                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{t('supplierTitle')}</p>
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">{t('allOrders')}</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-white/60 text-[10px] uppercase font-semibold tracking-wide">Заказов</p>
                            <p className="text-3xl font-black tabular-nums">{activeOrders.length}</p>
                        </div>
                    </div>
                </header>

                {/* Order list */}
                <main className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
                    {activeOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                                <Truck className="w-8 h-8 text-gray-200" />
                            </div>
                            <h3 className="font-bold text-gray-700 mb-1">{t('noOrdersYet')}</h3>
                            <p className="text-gray-400 text-sm">{t('noOrdersDesc')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeOrders.map(order => {
                                const productCount = order.products.filter(p => p.quantity > 0).length;
                                const totalAmount = order.products.reduce((s, p) => s + ((p.price || 0) * p.quantity), 0);
                                return (
                                    <button
                                        key={order.id}
                                        onClick={() => onSelectOrder(order.id)}
                                        className="w-full bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-3 text-left active:scale-[0.99] transition-all shadow-sm"
                                    >
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fff3e0' }}>
                                            <Truck className="w-5 h-5" style={{ color: '#FF6B00' }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 text-sm mb-0.5">
                                                {BRANCH_LABELS[order.branch] ?? order.branch}
                                            </h3>
                                            <p className="text-xs text-gray-400">
                                                {order.createdAt.toLocaleDateString(t('back') === 'Orqaga' ? 'uz-UZ' : 'ru-RU', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-semibold text-gray-500">
                                                    {productCount} позиций
                                                </span>
                                                {totalAmount > 0 && (
                                                    <>
                                                        <span className="text-gray-200">•</span>
                                                        <span className="text-xs font-bold" style={{ color: '#FF6B00' }}>
                                                            {totalAmount.toLocaleString()} {t('sum')}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </main>
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

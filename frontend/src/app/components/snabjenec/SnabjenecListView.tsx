import { useState } from 'react';
import { ArrowLeft, Package, RefreshCcw, HelpCircle, ChevronRight } from 'lucide-react';
import type { Order } from '@/lib/api';
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

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
    review_snabjenec:           { label: 'Новая',       cls: 'bg-green-100 text-green-700' },
    sent_to_supplier:           { label: 'У постав.',   cls: 'bg-blue-100 text-blue-700' },
    supplier_collecting:        { label: 'Сборка',      cls: 'bg-orange-100 text-orange-700' },
    supplier_delivering:        { label: 'В пути',      cls: 'bg-purple-100 text-purple-700' },
    waiting_snabjenec_receive:  { label: 'Приёмка',     cls: 'bg-amber-100 text-amber-700' },
    sent_to_financier:          { label: 'Финансист',   cls: 'bg-indigo-100 text-indigo-700' },
};

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
        o.status === 'review_snabjenec' ||
        o.status === 'sent_to_supplier' ||
        o.status === 'supplier_collecting' ||
        o.status === 'supplier_delivering' ||
        o.status === 'waiting_snabjenec_receive' ||
        o.status === 'sent_to_financier'
    );

    return (
        <>
            <div className="h-screen overflow-hidden bg-[#f5f5f5] flex flex-col">

                {/* Header */}
                <header
                    className="flex-none text-white px-4 pt-4 pb-5 rounded-b-3xl shadow-lg"
                    style={{ backgroundColor: '#2E7D32' }}
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
                                <Package className="w-4 h-4 opacity-70" />
                                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{t('snabjenecTitle')}</p>
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">{t('incomingOrders')}</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-white/60 text-[10px] uppercase font-semibold tracking-wide">Активных</p>
                            <p className="text-3xl font-black tabular-nums">{activeOrders.length}</p>
                        </div>
                    </div>
                </header>

                {/* Order list */}
                <main className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
                    {activeOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                                <Package className="w-8 h-8 text-gray-200" />
                            </div>
                            <p className="text-gray-400 font-medium">{t('noOrders')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeOrders.map(order => {
                                const pill = STATUS_PILL[order.status];
                                const productCount = order.products.filter(p => p.quantity > 0).length;
                                const hasMeat = order.products.some(p => p.category === '🥩 Мясо');
                                const hasProducts = order.products.some(p => p.category !== '🥩 Мясо');

                                let icon = '📦';
                                let bgColor = '#e8f5e9';
                                let iconColor = '#2E7D32';
                                if (hasMeat && !hasProducts) {
                                  icon = '🥩';
                                  bgColor = '#ffebee';
                                  iconColor = '#c62828';
                                } else if (!hasMeat && hasProducts) {
                                  icon = '🥬';
                                  bgColor = '#e8f5e9';
                                  iconColor = '#2E7D32';
                                } else if (hasMeat && hasProducts) {
                                  icon = '🛒';
                                  bgColor = '#fff3e0';
                                  iconColor = '#e65100';
                                }

                                return (
                                    <button
                                        key={order.id}
                                        onClick={() => onSelectOrder(order.id)}
                                        className="w-full bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-3 text-left active:scale-[0.99] transition-all shadow-sm"
                                    >
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ backgroundColor: bgColor }}>
                                            {icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="font-bold text-gray-900 text-sm">
                                                    {BRANCH_LABELS[order.branch] ?? order.branch}
                                                </h3>
                                                {pill && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pill.cls}`}>
                                                        {pill.label}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                {order.createdAt.toLocaleDateString(language === 'uz' ? 'uz-UZ' : 'ru-RU', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                            <p className="text-xs font-semibold mt-1" style={{ color: '#2E7D32' }}>
                                                {productCount} {t('positions')}
                                            </p>
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
                    title="Снабженец"
                    color="#2E7D32"
                    onClose={() => setShowHelp(false)}
                    sections={[
                        {
                            label: 'Что делать',
                            items: [
                                'Получить список от шефа и отправить поставщику',
                                'При получении товара отметить каждую позицию',
                                'Нажать «Завершить» для передачи финансисту',
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

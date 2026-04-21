import { useState, useEffect, useCallback } from 'react';
import { BarChart2, Archive, TrendingUp, Settings, RefreshCw, HelpCircle } from 'lucide-react';
import { HelpModal } from '@/app/components/HelpModal';
import { api } from '@/lib/api';
import { SummaryCards } from './RequestsTab/SummaryCards';
import { RequestsFilters } from './RequestsTab/RequestsFilters';
import { RequestsTable } from './RequestsTab/RequestsTable';
import { RequestDetailModal } from './RequestsTab/RequestDetailModal';
import { ArchiveTable } from './ArchiveTab/ArchiveTable';
import { DeliveryChart } from './StatisticsTab/DeliveryChart';
import { TemplateManager } from './SettingsTab/TemplateManager';

type Tab = 'requests' | 'archive' | 'statistics' | 'settings';

export function FinancierDesktop({ onBackToRoles }: { onBackToRoles?: () => void }) {
    const [tab, setTab] = useState<Tab>('requests');
    const [orders, setOrders] = useState<any[]>([]);
    const [archiveOrders, setArchiveOrders] = useState<any[]>([]);
    const [statistics, setStatistics] = useState<any>(null);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [branchFilter, setBranchFilter] = useState('');

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getFinancierAllOrders({
                status: statusFilter || undefined,
                branch: branchFilter || undefined,
                limit: 200,
            });
            setOrders(data.orders ?? []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, branchFilter]);

    const loadArchive = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getFinancierArchive({ limit: 100 });
            setArchiveOrders(data.archived_orders ?? []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadStatistics = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getFinancierStatistics();
            setStatistics(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadTemplates = useCallback(async () => {
        try {
            const data = await api.getTemplates();
            setTemplates(data.templates ?? []);
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        loadTemplates();
        if (tab === 'requests') loadOrders();
        else if (tab === 'archive') loadArchive();
        else if (tab === 'statistics') loadStatistics();
    }, [tab, loadOrders, loadArchive, loadStatistics, loadTemplates]);

    const atChef       = orders.filter(o => o.status === 'sent_to_chef').length;
    const atSnabjenec  = orders.filter(o => o.status === 'review_snabjenec').length;
    const atSupplier   = orders.filter(o => o.status === 'sent_to_supplier').length;
    const inReceiving  = orders.filter(o => o.status === 'waiting_snabjenec_receive').length;
    const ready        = orders.filter(o => o.status === 'sent_to_financier').length;

    const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'requests', label: 'Заявки', icon: <BarChart2 className="w-4 h-4" /> },
        { key: 'archive', label: 'Архив', icon: <Archive className="w-4 h-4" /> },
        { key: 'statistics', label: 'Статистика', icon: <TrendingUp className="w-4 h-4" /> },
        { key: 'settings', label: 'Настройки', icon: <Settings className="w-4 h-4" /> },
    ];

    const stats = statistics?.summary;

    const handleRefresh = () => {
        if (tab === 'requests') loadOrders();
        else if (tab === 'archive') loadArchive();
        else if (tab === 'statistics') loadStatistics();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col" style={{ minWidth: 900 }}>

            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-base font-black text-gray-900 tracking-tight">Финансист</h1>
                    </div>
                    <nav className="flex items-center gap-1 ml-6">
                        {navItems.map(item => (
                            <button
                                key={item.key}
                                onClick={() => setTab(item.key)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                                    tab === item.key
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowHelp(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <HelpCircle className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleRefresh}
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 px-8 py-7">

                {/* ── Requests tab ─────────────────────────────────────── */}
                {tab === 'requests' && (
                    <div>
                        <SummaryCards
                            total={orders.length}
                            atChef={atChef}
                            atSnabjenec={atSnabjenec}
                            atSupplier={atSupplier}
                            inReceiving={inReceiving}
                            ready={ready}
                        />
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="px-5 pt-5 pb-4 border-b border-gray-50">
                                <RequestsFilters
                                    statusFilter={statusFilter}
                                    branchFilter={branchFilter}
                                    onStatusChange={setStatusFilter}
                                    onBranchChange={setBranchFilter}
                                    onClear={() => { setStatusFilter(''); setBranchFilter(''); }}
                                />
                            </div>
                            {loading ? (
                                <div className="text-center py-16 text-gray-300 font-medium">Загрузка...</div>
                            ) : (
                                <RequestsTable orders={orders} onSelectOrder={setSelectedOrderId} />
                            )}
                        </div>
                    </div>
                )}

                {/* ── Archive tab ───────────────────────────────────────── */}
                {tab === 'archive' && (
                    <div>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {[
                                { label: 'Всего в архиве', value: archiveOrders.length },
                                {
                                    label: 'Среднее % доставки',
                                    value: archiveOrders.length
                                        ? `${Math.round(archiveOrders.reduce((s, o) => s + (o.completion_rate ?? 0), 0) / archiveOrders.length)}%`
                                        : '—'
                                },
                                {
                                    label: 'Последний архив',
                                    value: archiveOrders[0]?.created_at?.slice(0, 10) ?? '—'
                                },
                            ].map(c => (
                                <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                                    <div className="text-3xl font-black text-gray-900 tracking-tight">{c.value}</div>
                                    <div className="text-xs font-medium text-gray-400 mt-2 uppercase tracking-wide">{c.label}</div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            {loading ? (
                                <div className="text-center py-16 text-gray-300 font-medium">Загрузка...</div>
                            ) : (
                                <ArchiveTable orders={archiveOrders} onSelectOrder={setSelectedOrderId} />
                            )}
                        </div>
                    </div>
                )}

                {/* ── Statistics tab ────────────────────────────────────── */}
                {tab === 'statistics' && (
                    <div className="space-y-5">
                        {loading ? (
                            <div className="text-center py-16 text-gray-300 font-medium">Загрузка...</div>
                        ) : stats ? (
                            <>
                                <div className="grid grid-cols-4 gap-3">
                                    {[
                                        { label: 'Всего заказов', value: stats.total_orders },
                                        { label: 'Полностью доставлено', value: stats.fully_delivered },
                                        { label: 'Частично доставлено', value: stats.partially_delivered },
                                        { label: 'Не доставлено', value: stats.not_delivered },
                                    ].map(c => (
                                        <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                                            <div className="text-3xl font-black text-gray-900 tracking-tight">{c.value}</div>
                                            <div className="text-xs font-medium text-gray-400 mt-2 uppercase tracking-wide">{c.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-gray-900">Среднее выполнение</h3>
                                        <span className="text-3xl font-black text-gray-900 tracking-tight">{stats.average_completion_rate}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full bg-gray-900 transition-all"
                                            style={{ width: `${Math.min(stats.average_completion_rate, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                        <h3 className="font-bold text-gray-900 mb-5">График выполнения (% по дням)</h3>
                                        <DeliveryChart data={statistics.delivery_timeline} />
                                    </div>
                                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                                        <h3 className="font-bold text-gray-900 mb-5">Эффективность снабженцев</h3>
                                        {statistics.by_snabjenec?.length > 0 ? (
                                            <div className="space-y-4">
                                                {statistics.by_snabjenec.map((s: any) => (
                                                    <div key={s.name} className="flex flex-col gap-1.5">
                                                        <div className="flex justify-between items-end">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-gray-900">{s.name}</span>
                                                                <span className="text-[10px] text-gray-400 uppercase font-medium">{s.orders_count} заказов</span>
                                                            </div>
                                                            <span className="text-sm font-black text-gray-900">{s.completion}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${
                                                                    s.completion > 90 ? 'bg-green-500' : 
                                                                    s.completion > 70 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                                style={{ width: `${s.completion}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Нет данных по снабженцам</div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-16 text-gray-300 font-medium">Нет данных</div>
                        )}
                    </div>
                )}

                {/* ── Settings tab ──────────────────────────────────────── */}
                {tab === 'settings' && (
                    <TemplateManager templates={templates} onRefresh={loadTemplates} />
                )}
            </main>

            {/* Order detail modal */}
            {selectedOrderId && (
                <RequestDetailModal
                    orderId={selectedOrderId}
                    onClose={() => setSelectedOrderId(null)}
                    templates={templates}
                />
            )}

            {showHelp && (
                <HelpModal
                    title="Финансист"
                    color="#1a1a2e"
                    onClose={() => setShowHelp(false)}
                    sections={[
                        {
                            label: 'Что делать',
                            items: [
                                '«Заявки» — просматривать входящие и активные заявки',
                                '«Архив» — завершённые и архивированные заказы',
                                '«Статистика» — аналитика по доставкам',
                            ],
                        },
                        {
                            label: 'Фильтрация',
                            items: [
                                'Фильтровать заявки по филиалу и статусу',
                                'Нажать на заявку для просмотра деталей и экспорта',
                            ],
                        },
                        {
                            label: 'Нельзя',
                            items: [
                                'Восстановить заявку из архива',
                                'Изменять цены поставщика',
                            ],
                        },
                    ]}
                />
            )}
        </div>
    );
}

import { useState, useEffect, useCallback } from 'react';
import { BarChart2, Archive, FileText, Settings, RefreshCw, HelpCircle } from 'lucide-react';
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

export function FinancierDesktop() {
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
                status: statusFilter || 'sent_to_supplier,waiting_snabjenec_receive,sent_to_financier',
                branch: branchFilter || undefined,
                limit: 100,
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

    // Summary card stats
    const inReceiving = orders.filter(o => o.status === 'waiting_snabjenec_receive').length;
    const ready = orders.filter(o => o.status === 'sent_to_financier').length;
    const avgCompletion = orders.length
        ? Math.round(orders.reduce((s, o) => s + (o.completion_rate ?? 0), 0) / orders.length)
        : 0;

    const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'requests', label: 'Заявки', icon: <BarChart2 className="w-4 h-4" /> },
        { key: 'archive', label: 'Архив', icon: <Archive className="w-4 h-4" /> },
        { key: 'statistics', label: 'Статистика', icon: <FileText className="w-4 h-4" /> },
        { key: 'settings', label: 'Настройки', icon: <Settings className="w-4 h-4" /> },
    ];

    const stats = statistics?.summary;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col" style={{ minWidth: 1280 }}>
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Финансист — Dashboard</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Управление доставками и отчётами</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowHelp(true)}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <HelpCircle className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            if (tab === 'requests') loadOrders();
                            else if (tab === 'archive') loadArchive();
                            else if (tab === 'statistics') loadStatistics();
                        }}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {/* Nav tabs */}
            <div className="bg-white border-b border-gray-200 px-8">
                <nav className="flex gap-1">
                    {navItems.map(item => (
                        <button
                            key={item.key}
                            onClick={() => setTab(item.key)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${tab === item.key
                                ? 'border-green-600 text-green-700'
                                : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main content */}
            <main className="flex-1 px-8 py-6">

                {/* ── Requests tab ─────────────────────────────────────── */}
                {tab === 'requests' && (
                    <div>
                        <SummaryCards
                            total={orders.length}
                            inReceiving={inReceiving}
                            ready={ready}
                            avgCompletion={avgCompletion}
                        />
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h2 className="font-bold text-gray-900 mb-3">Активные заявки</h2>
                                <RequestsFilters
                                    statusFilter={statusFilter}
                                    branchFilter={branchFilter}
                                    onStatusChange={setStatusFilter}
                                    onBranchChange={setBranchFilter}
                                    onClear={() => { setStatusFilter(''); setBranchFilter(''); }}
                                />
                            </div>
                            {loading ? (
                                <div className="text-center py-12 text-gray-400">Загрузка...</div>
                            ) : (
                                <RequestsTable orders={orders} onSelectOrder={setSelectedOrderId} />
                            )}
                        </div>
                    </div>
                )}

                {/* ── Archive tab ───────────────────────────────────────── */}
                {tab === 'archive' && (
                    <div>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="text-2xl font-bold text-gray-900">{archiveOrders.length}</div>
                                <div className="text-sm text-gray-500 mt-1">Всего архивов</div>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="text-2xl font-bold text-gray-900">
                                    {archiveOrders.length
                                        ? Math.round(archiveOrders.reduce((s, o) => s + (o.completion_rate ?? 0), 0) / archiveOrders.length)
                                        : 0}%
                                </div>
                                <div className="text-sm text-gray-500 mt-1">Среднее % доставки</div>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="text-2xl font-bold text-gray-900">
                                    {archiveOrders[0]?.created_at?.slice(0, 10) ?? '—'}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">Последний архив</div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                            {loading ? (
                                <div className="text-center py-12 text-gray-400">Загрузка...</div>
                            ) : (
                                <ArchiveTable orders={archiveOrders} onSelectOrder={setSelectedOrderId} />
                            )}
                        </div>
                    </div>
                )}

                {/* ── Statistics tab ────────────────────────────────────── */}
                {tab === 'statistics' && (
                    <div className="space-y-6">
                        {loading ? (
                            <div className="text-center py-12 text-gray-400">Загрузка статистики...</div>
                        ) : stats ? (
                            <>
                                <div className="grid grid-cols-4 gap-4">
                                    {[
                                        { label: 'Всего заказов', value: stats.total_orders, color: 'text-blue-700' },
                                        { label: 'Полностью доставлено', value: stats.fully_delivered, color: 'text-green-700' },
                                        { label: 'Частично доставлено', value: stats.partially_delivered, color: 'text-yellow-700' },
                                        { label: 'Не доставлено', value: stats.not_delivered, color: 'text-red-700' },
                                    ].map(c => (
                                        <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4">
                                            <div className={`text-3xl font-bold ${c.color}`}>{c.value}</div>
                                            <div className="text-sm text-gray-500 mt-1">{c.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-gray-900">Среднее % доставки</h3>
                                        <span className="text-2xl font-bold text-green-700">{stats.average_completion_rate}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className="h-3 rounded-full bg-green-500 transition-all"
                                            style={{ width: `${Math.min(stats.average_completion_rate, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                                    <h3 className="font-bold text-gray-900 mb-4">График доставок</h3>
                                    <DeliveryChart data={[]} />
                                    <p className="text-xs text-gray-400 text-center mt-2">
                                        Детальный временной график доступен при наличии данных delivery_timeline
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-gray-400">Нет данных</div>
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
                    title="Финансист — Dashboard"
                    color="#1a365d"
                    onClose={() => setShowHelp(false)}
                    sections={[
                        {
                            label: 'Что делать',
                            items: [
                                'Вкладка «Заявки» — просматривать входящие и активные заявки',
                                'Вкладка «Архив» — завершённые и архивированные заказы',
                                'Вкладка «Статистика» — аналитика по доставкам и расходам',
                            ],
                        },
                        {
                            label: 'Фильтрация',
                            items: [
                                'Фильтровать заявки по филиалу и статусу',
                                'Нажать на заявку для просмотра деталей и цен',
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

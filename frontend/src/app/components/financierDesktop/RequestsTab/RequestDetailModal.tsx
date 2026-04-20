import { useState, useEffect } from 'react';
import { X, Download, Package } from 'lucide-react';
import { api } from '@/lib/api';

interface RequestDetailModalProps {
    orderId: string;
    onClose: () => void;
    templates: any[];
}

export function RequestDetailModal({ orderId, onClose, templates }: RequestDetailModalProps) {
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('');

    useEffect(() => {
        api.getFinancierOrderDetails(orderId)
            .then(setDetails)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [orderId]);

    const handleExport = async () => {
        if (!selectedTemplate) return;
        setExporting(true);
        try {
            const blob = await api.exportOrderTemplate(orderId, selectedTemplate, 'docx');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `order_${orderId}.docx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            alert('Ошибка экспорта');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Заявка</p>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight">
                            #{orderId.slice(0, 8)}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {loading ? (
                        <div className="text-center py-16 text-gray-300 font-medium">Загрузка...</div>
                    ) : !details ? (
                        <div className="text-center py-16 text-gray-300 font-medium">Данные не найдены</div>
                    ) : (
                        <>
                            {/* Meta */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Дата', value: details.order.created_at?.slice(0, 10) },
                                    { label: 'Выполнение', value: `${details.delivery?.completion_rate ?? '—'}%` },
                                    { label: 'Статус', value: details.order.status },
                                ].map(m => (
                                    <div key={m.label} className="bg-gray-50 rounded-2xl px-4 py-3">
                                        <p className="text-xs text-gray-400 font-medium mb-1">{m.label}</p>
                                        <p className="font-bold text-gray-900 text-sm">{m.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Unified color-coded product table */}
                            <ColorTable details={details} />
                        </>
                    )}
                </div>

                {/* Export footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
                    <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-1 focus:ring-gray-400 focus:outline-none text-gray-700"
                    >
                        <option value="">Выбрать шаблон...</option>
                        {templates.map((t: any) => (
                            <option key={t.template_id} value={t.template_id}>{t.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleExport}
                        disabled={!selectedTemplate || exporting}
                        className="bg-gray-900 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm disabled:opacity-40 hover:bg-gray-800 transition-colors whitespace-nowrap"
                    >
                        <Download className="w-4 h-4" />
                        {exporting ? 'Экспорт...' : 'Скачать DOCX'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ColorTable({ details }: { details: any }) {
    const hasTracking =
        (details.delivered_items?.length ?? 0) > 0 ||
        (details.not_delivered_items?.length ?? 0) > 0;

    if (!hasTracking) {
        // No delivery tracking yet — show ordered list, all gray
        const items: any[] = details.ordered_products ?? [];
        if (!items.length) return null;
        return (
            <div className="rounded-2xl overflow-hidden border border-gray-100">
                <div className="px-4 py-2.5 bg-gray-50 flex items-center gap-2 border-b border-gray-100">
                    <Package className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Заказано · {items.length}</span>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Товар</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Ед.</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Кол-во</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {items.map((item: any, i: number) => (
                            <tr key={i} className="bg-white">
                                <td className="px-4 py-3 font-medium text-gray-500">{item.product_name}</td>
                                <td className="px-4 py-3 text-center text-gray-400 text-xs">{item.unit}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-bold tabular-nums bg-gray-100 text-gray-700">
                                        {item.ordered_qty}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    // Has delivery tracking — single table, only the received qty badge is colored
    type Row = { product_name: string; unit: string; ordered_qty: number; received_qty: number; isExtra?: boolean };
    const allRows: Row[] = [
        ...(details.delivered_items ?? []),
        ...(details.not_delivered_items ?? []),
        ...(details.extra_items ?? []).map((e: any) => ({
            product_name: e.product_name,
            unit: e.unit,
            ordered_qty: e.qty ?? 0,
            received_qty: e.qty ?? 0,
            isExtra: true,
        })),
    ];

    const getBadge = (r: Row) => {
        if (r.isExtra) return 'bg-blue-100 text-blue-700';
        if (r.received_qty >= r.ordered_qty && r.ordered_qty > 0) return 'bg-green-100 text-green-700';
        if (r.received_qty > 0) return 'bg-amber-100 text-amber-700';
        if (r.ordered_qty === 0) return 'bg-gray-100 text-gray-400';
        return 'bg-red-100 text-red-600';
    };

    return (
        <div className="rounded-2xl overflow-hidden border border-gray-100">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Товар</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Ед.</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Заказ</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">Получено</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {allRows.map((item, i) => (
                        <tr key={i} className="bg-white hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-800">{item.product_name}</td>
                            <td className="px-4 py-3 text-center text-gray-400 text-xs">{item.unit}</td>
                            <td className="px-4 py-3 text-center text-gray-500 tabular-nums">{item.ordered_qty}</td>
                            <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold tabular-nums ${getBadge(item)}`}>
                                    {item.received_qty}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

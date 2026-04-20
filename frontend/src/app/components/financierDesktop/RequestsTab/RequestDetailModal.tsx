import { useState, useEffect } from 'react';
import { X, Download, Package, CheckCircle2, XCircle, Star } from 'lucide-react';
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

                            {/* Ordered (no tracking yet) */}
                            {details.delivered_items?.length === 0 && details.not_delivered_items?.length === 0 && details.ordered_products?.length > 0 && (
                                <Section icon={<Package className="w-4 h-4" />} title={`Заказано (${details.ordered_products.length})`} accent="gray">
                                    <ProductTable
                                        items={details.ordered_products}
                                        columns={['Товар', 'Ед.', 'Кол-во']}
                                        rows={(item: any) => [item.product_name, item.unit, item.ordered_qty]}
                                    />
                                </Section>
                            )}

                            {/* Delivered */}
                            {details.delivered_items?.length > 0 && (
                                <Section icon={<CheckCircle2 className="w-4 h-4" />} title={`Привезли (${details.delivered_items.length})`} accent="green">
                                    <ProductTable
                                        items={details.delivered_items}
                                        columns={['Товар', 'Ед.', 'Заказ', 'Получено']}
                                        rows={(item: any) => [item.product_name, item.unit, item.ordered_qty, item.received_qty]}
                                        highlightLast
                                    />
                                </Section>
                            )}

                            {/* Not delivered */}
                            {details.not_delivered_items?.length > 0 && (
                                <Section icon={<XCircle className="w-4 h-4" />} title={`Не привезли (${details.not_delivered_items.length})`} accent="red">
                                    <ProductTable
                                        items={details.not_delivered_items}
                                        columns={['Товар', 'Ед.', 'Заказано']}
                                        rows={(item: any) => [item.product_name, item.unit, item.ordered_qty]}
                                    />
                                </Section>
                            )}

                            {/* Extra items */}
                            {details.extra_items?.length > 0 && (
                                <Section icon={<Star className="w-4 h-4" />} title={`Доп. товары (${details.extra_items.length})`} accent="amber">
                                    <ProductTable
                                        items={details.extra_items}
                                        columns={['Товар', 'Ед.', 'Кол-во']}
                                        rows={(item: any) => [item.product_name, item.unit, item.qty]}
                                    />
                                </Section>
                            )}
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

function Section({ icon, title, accent, children }: {
    icon: React.ReactNode;
    title: string;
    accent: 'gray' | 'green' | 'red' | 'amber';
    children: React.ReactNode;
}) {
    const colors = {
        gray: 'text-gray-600 bg-gray-50',
        green: 'text-green-700 bg-green-50',
        red: 'text-red-700 bg-red-50',
        amber: 'text-amber-700 bg-amber-50',
    };
    return (
        <div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold mb-3 ${colors[accent]}`}>
                {icon}
                {title}
            </div>
            {children}
        </div>
    );
}

function ProductTable({ items, columns, rows, highlightLast }: {
    items: any[];
    columns: string[];
    rows: (item: any) => (string | number)[];
    highlightLast?: boolean;
}) {
    return (
        <div className="rounded-2xl overflow-hidden border border-gray-100">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50">
                        {columns.map((c, i) => (
                            <th key={c} className={`px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide ${i === 0 ? 'text-left' : 'text-center'}`}>
                                {c}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {items.map((item: any, i: number) => {
                        const cells = rows(item);
                        return (
                            <tr key={i} className="bg-white hover:bg-gray-50 transition-colors">
                                {cells.map((cell, ci) => (
                                    <td
                                        key={ci}
                                        className={`px-4 py-3 ${ci === 0 ? 'font-medium text-gray-800' : 'text-center text-gray-500'} ${
                                            highlightLast && ci === cells.length - 1 ? 'font-bold text-gray-900' : ''
                                        }`}
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

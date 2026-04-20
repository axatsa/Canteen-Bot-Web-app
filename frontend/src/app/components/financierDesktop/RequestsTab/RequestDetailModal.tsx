import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-lg font-bold text-gray-900">
                        Заказ #{orderId.slice(0, 8)} — Детальный отчёт
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {loading ? (
                        <div className="text-center py-12 text-gray-400">Загрузка...</div>
                    ) : !details ? (
                        <div className="text-center py-12 text-gray-400">Данные не найдены</div>
                    ) : (
                        <>
                            {/* Order info */}
                            <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4 text-sm">
                                <div>
                                    <span className="text-gray-400">ID</span>
                                    <p className="font-bold">#{details.order.id.slice(0, 8)}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400">Дата создания</span>
                                    <p className="font-bold">{details.order.created_at?.slice(0, 10)}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400">% доставки</span>
                                    <p className="font-bold text-blue-600">{details.delivery?.completion_rate}</p>
                                </div>
                            </div>

                            {/* Ordered products (when no delivery tracking yet) */}
                            {details.delivered_items?.length === 0 && details.not_delivered_items?.length === 0 && details.ordered_products?.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-gray-700 mb-2">📋 Заказано ({details.ordered_products.length})</h3>
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 text-gray-600">
                                            <tr>
                                                <th className="text-left p-2 rounded-tl-lg">Товар</th>
                                                <th className="p-2">Ед.</th>
                                                <th className="p-2 rounded-tr-lg">Кол-во</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {details.ordered_products.map((item: any, i: number) => (
                                                <tr key={i} className="border-b border-gray-100">
                                                    <td className="p-2 font-medium">{item.product_name}</td>
                                                    <td className="p-2 text-center text-gray-500">{item.unit}</td>
                                                    <td className="p-2 text-center">{item.ordered_qty}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Delivered */}
                            {details.delivered_items?.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-green-700 mb-2">✅ Привезли ({details.delivered_items.length})</h3>
                                    <table className="w-full text-sm">
                                        <thead className="bg-green-50 text-green-700">
                                            <tr>
                                                <th className="text-left p-2 rounded-tl-lg">Товар</th>
                                                <th className="p-2">Ед.</th>
                                                <th className="p-2">Заказано</th>
                                                <th className="p-2 rounded-tr-lg">Получено</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {details.delivered_items.map((item: any) => (
                                                <tr key={item.product_id} className="border-b border-green-100">
                                                    <td className="p-2 font-medium">{item.product_name}</td>
                                                    <td className="p-2 text-center text-gray-500">{item.unit}</td>
                                                    <td className="p-2 text-center">{item.ordered_qty}</td>
                                                    <td className="p-2 text-center font-bold text-green-700">{item.received_qty}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Not delivered */}
                            {details.not_delivered_items?.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-red-700 mb-2">❌ Не привезли ({details.not_delivered_items.length})</h3>
                                    <table className="w-full text-sm">
                                        <thead className="bg-red-50 text-red-700">
                                            <tr>
                                                <th className="text-left p-2 rounded-tl-lg">Товар</th>
                                                <th className="p-2">Ед.</th>
                                                <th className="p-2 rounded-tr-lg">Заказано</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {details.not_delivered_items.map((item: any) => (
                                                <tr key={item.product_id} className="border-b border-red-100">
                                                    <td className="p-2 font-medium">{item.product_name}</td>
                                                    <td className="p-2 text-center text-gray-500">{item.unit}</td>
                                                    <td className="p-2 text-center">{item.ordered_qty}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Extra items */}
                            {details.extra_items?.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-yellow-700 mb-2">⭐ Доп. товары ({details.extra_items.length})</h3>
                                    <table className="w-full text-sm">
                                        <thead className="bg-yellow-50 text-yellow-700">
                                            <tr>
                                                <th className="text-left p-2 rounded-tl-lg">Товар</th>
                                                <th className="p-2">Ед.</th>
                                                <th className="p-2 rounded-tr-lg">Кол-во</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {details.extra_items.map((item: any) => (
                                                <tr key={item.product_id} className="border-b border-yellow-100">
                                                    <td className="p-2 font-medium">{item.product_name}</td>
                                                    <td className="p-2 text-center text-gray-500">{item.unit}</td>
                                                    <td className="p-2 text-center font-bold text-yellow-700">{item.qty}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Export footer */}
                <div className="p-5 border-t flex items-center gap-3">
                    <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                    >
                        <option value="">Выбрать шаблон для экспорта...</option>
                        {templates.map((t: any) => (
                            <option key={t.template_id} value={t.template_id}>{t.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleExport}
                        disabled={!selectedTemplate || exporting}
                        className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-sm disabled:opacity-50 hover:bg-blue-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        {exporting ? 'Экспорт...' : 'Скачать DOCX'}
                    </button>
                </div>
            </div>
        </div>
    );
}

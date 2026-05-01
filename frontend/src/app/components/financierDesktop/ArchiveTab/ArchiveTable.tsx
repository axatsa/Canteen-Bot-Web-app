import { Eye } from 'lucide-react';

interface ArchiveTableProps {
    orders: any[];
    onSelectOrder: (orderId: string) => void;
}

export function ArchiveTable({ orders, onSelectOrder }: ArchiveTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <th className="text-left p-3 rounded-tl-xl">№</th>
                        <th className="text-left p-3">Дата создания</th>
                        <th className="text-left p-3">Филиал</th>
                        <th className="text-left p-3">Тип</th>
                        <th className="text-right p-3">Отправлено пост.</th>
                        <th className="text-right p-3">Получено от пост.</th>
                        <th className="text-right p-3"></th>
                        <th className="text-right p-3 rounded-tr-xl">Сумма</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {orders.length === 0 && (
                        <tr><td colSpan={7} className="text-center py-10 text-gray-400">Архив пуст</td></tr>
                    )}
                    {orders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50 cursor-pointer group" onClick={() => onSelectOrder(order.id)}>
                            <td className="p-3 font-mono text-gray-500 text-xs">#{order.id.slice(0, 6)}</td>
                            <td className="p-3 font-medium">{order.created_at?.slice(0, 10)}</td>
                            <td className="p-3 text-gray-600">{order.branch}</td>
                            <td className="p-3">
                                <div className="flex gap-1">
                                    {order.sent_to_meat_supplier && (
                                        <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-100">МЯСО</span>
                                    )}
                                    {order.sent_to_product_supplier && (
                                        <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-100">ПРОД</span>
                                    )}
                                </div>
                            </td>
                            <td className="p-3 text-right text-gray-500 text-xs">{order.sent_to_supplier_at ?? '—'}</td>
                            <td className="p-3 text-right text-gray-500 text-xs">{order.received_from_supplier_at ?? '—'}</td>
                            <td className="p-3 text-right">
                                <div className="flex items-center gap-2 justify-end">
                                    <Eye className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </td>
                            <td className="p-3 text-right font-bold text-gray-900 tabular-nums">
                                {(order.total_ordered_sum || 0).toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">UZS</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

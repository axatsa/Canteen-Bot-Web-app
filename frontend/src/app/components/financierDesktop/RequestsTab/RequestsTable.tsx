import { useState } from 'react';
import { ChevronUp, ChevronDown, Eye } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
    sent_to_supplier: 'У поставщика',
    waiting_snabjenec_receive: 'На приёмке',
    sent_to_financier: 'У финансиста',
    archived: 'Архив',
};

const STATUS_COLORS: Record<string, string> = {
    sent_to_supplier: 'bg-blue-100 text-blue-700',
    waiting_snabjenec_receive: 'bg-yellow-100 text-yellow-700',
    sent_to_financier: 'bg-purple-100 text-purple-700',
    archived: 'bg-gray-100 text-gray-600',
};

interface RequestsTableProps {
    orders: any[];
    onSelectOrder: (orderId: string) => void;
}

type SortKey = 'created_at' | 'completion_rate' | 'id';

export function RequestsTable({ orders, onSelectOrder }: RequestsTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>('created_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const sorted = [...orders].sort((a, b) => {
        let av = a[sortKey] ?? '';
        let bv = b[sortKey] ?? '';
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ k }: { k: SortKey }) => (
        sortKey === k
            ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />)
            : null
    );

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <th className="text-left p-3 rounded-tl-xl cursor-pointer hover:text-gray-700" onClick={() => handleSort('id')}>
                            № <SortIcon k="id" />
                        </th>
                        <th className="text-left p-3 cursor-pointer hover:text-gray-700" onClick={() => handleSort('created_at')}>
                            Дата <SortIcon k="created_at" />
                        </th>
                        <th className="text-left p-3">Статус</th>
                        <th className="text-left p-3">Филиал</th>
                        <th className="text-right p-3">Товаров</th>
                        <th className="text-right p-3 cursor-pointer hover:text-gray-700" onClick={() => handleSort('completion_rate')}>
                            % Доставки <SortIcon k="completion_rate" />
                        </th>
                        <th className="p-3 rounded-tr-xl"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {sorted.length === 0 && (
                        <tr><td colSpan={7} className="text-center py-10 text-gray-400">Нет заявок</td></tr>
                    )}
                    {sorted.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => onSelectOrder(order.id)}>
                            <td className="p-3 font-mono text-gray-500 text-xs">#{order.id.slice(0, 6)}</td>
                            <td className="p-3 font-medium">{order.created_at?.slice(0, 10)}</td>
                            <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                    {STATUS_LABELS[order.status] ?? order.status}
                                </span>
                            </td>
                            <td className="p-3 text-gray-600">{order.branch}</td>
                            <td className="p-3 text-right text-gray-600">
                                {order.total_items_received}/{order.total_items_ordered}
                            </td>
                            <td className="p-3">
                                <div className="flex items-center gap-2 justify-end">
                                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                        <div
                                            className="h-1.5 rounded-full bg-green-500 transition-all"
                                            style={{ width: `${Math.min(order.completion_rate, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 w-9 text-right">{order.completion_rate}%</span>
                                </div>
                            </td>
                            <td className="p-3 text-right">
                                <button className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-700">
                                    <Eye className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

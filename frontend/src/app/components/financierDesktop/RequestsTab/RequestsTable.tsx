import { useState } from 'react';
import { ChevronUp, ChevronDown, ArrowRight } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
    sent_to_supplier: 'У поставщика',
    waiting_snabjenec_receive: 'На приёмке',
    sent_to_financier: 'Ожидает финансиста',
    archived: 'Архив',
};

const STATUS_DOT: Record<string, string> = {
    sent_to_supplier: 'bg-blue-400',
    waiting_snabjenec_receive: 'bg-amber-400',
    sent_to_financier: 'bg-violet-400',
    archived: 'bg-gray-300',
};

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

    const SortIcon = ({ k }: { k: SortKey }) =>
        sortKey === k
            ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-0.5 opacity-60" /> : <ChevronDown className="w-3 h-3 inline ml-0.5 opacity-60" />)
            : null;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 select-none" onClick={() => handleSort('id')}>
                            № <SortIcon k="id" />
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 select-none" onClick={() => handleSort('created_at')}>
                            Дата <SortIcon k="created_at" />
                        </th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Статус</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Филиал</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Товаров</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 select-none" onClick={() => handleSort('completion_rate')}>
                            Доставка <SortIcon k="completion_rate" />
                        </th>
                        <th className="px-5 py-3 w-8" />
                    </tr>
                </thead>
                <tbody>
                    {sorted.length === 0 && (
                        <tr>
                            <td colSpan={7} className="text-center py-16 text-gray-300 text-sm font-medium">
                                Нет заявок
                            </td>
                        </tr>
                    )}
                    {sorted.map(order => (
                        <tr
                            key={order.id}
                            className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group"
                            onClick={() => onSelectOrder(order.id)}
                        >
                            <td className="px-5 py-4 font-mono text-gray-400 text-xs">
                                #{order.id.slice(0, 6)}
                            </td>
                            <td className="px-5 py-4 font-medium text-gray-700">
                                {order.created_at?.slice(0, 10)}
                            </td>
                            <td className="px-5 py-4">
                                <span className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[order.status] ?? 'bg-gray-300'}`} />
                                    <span className="text-xs font-medium text-gray-600">
                                        {STATUS_LABELS[order.status] ?? order.status}
                                    </span>
                                </span>
                            </td>
                            <td className="px-5 py-4 text-gray-600 text-sm">
                                {BRANCH_LABELS[order.branch] ?? order.branch}
                            </td>
                            <td className="px-5 py-4 text-right text-gray-500 tabular-nums">
                                {order.total_items_received}/{order.total_items_ordered}
                            </td>
                            <td className="px-5 py-4">
                                <div className="flex items-center gap-2 justify-end">
                                    <div className="w-24 bg-gray-100 rounded-full h-1">
                                        <div
                                            className={`h-1 rounded-full transition-all ${
                                                order.completion_rate >= 100 ? 'bg-green-500' :
                                                order.completion_rate >= 50 ? 'bg-amber-400' : 'bg-red-400'
                                            }`}
                                            style={{ width: `${Math.min(order.completion_rate, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 w-9 text-right tabular-nums">
                                        {order.completion_rate}%
                                    </span>
                                </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors inline" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

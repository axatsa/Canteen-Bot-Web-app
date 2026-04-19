interface RequestsFiltersProps {
    statusFilter: string;
    branchFilter: string;
    onStatusChange: (v: string) => void;
    onBranchChange: (v: string) => void;
    onClear: () => void;
}

const STATUSES = [
    { value: '', label: 'Все статусы' },
    { value: 'sent_to_supplier', label: 'У поставщика' },
    { value: 'waiting_snabjenec_receive', label: 'На приёмке' },
    { value: 'sent_to_financier', label: 'У финансиста' },
];

const BRANCHES = [
    { value: '', label: 'Все филиалы' },
    { value: 'beltepa_land', label: 'Белтепа-Land' },
    { value: 'uchtepa_land', label: 'Учтепа-Land' },
    { value: 'rakat_land', label: 'Ракат-Land' },
    { value: 'mukumiy_land', label: 'Мукумий-Land' },
    { value: 'yunusabad_land', label: 'Юнусабад-Land' },
    { value: 'novoi_land', label: 'Новои-Land' },
    { value: 'novza_school', label: 'Новза-School' },
    { value: 'uchtepa_school', label: 'Учтепа-School' },
    { value: 'almazar_school', label: 'Алмазар-School' },
    { value: 'general_uzakov_school', label: 'Генерал Узоков-School' },
    { value: 'namangan_school', label: 'Наманган-School' },
    { value: 'novoi_school', label: 'Новои-School' },
];

export function RequestsFilters({ statusFilter, branchFilter, onStatusChange, onBranchChange, onClear }: RequestsFiltersProps) {
    return (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
            <select
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-1 focus:ring-blue-400 focus:outline-none"
            >
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select
                value={branchFilter}
                onChange={(e) => onBranchChange(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:ring-1 focus:ring-blue-400 focus:outline-none"
            >
                {BRANCHES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            {(statusFilter || branchFilter) && (
                <button onClick={onClear} className="text-sm text-gray-400 hover:text-gray-600 underline">
                    Очистить
                </button>
            )}
        </div>
    );
}

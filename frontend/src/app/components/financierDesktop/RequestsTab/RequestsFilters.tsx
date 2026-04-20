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
    { value: 'sent_to_financier', label: 'Ожидает' },
];

const BRANCHES = [
    { value: '', label: 'Все филиалы' },
    { value: 'beltepa_land',           label: 'Белтепа-Land' },
    { value: 'uchtepa_land',           label: 'Учтепа-Land' },
    { value: 'rakat_land',             label: 'Ракат-Land' },
    { value: 'mukumiy_land',           label: 'Мукумий-Land' },
    { value: 'yunusabad_land',         label: 'Юнусабад-Land' },
    { value: 'novoi_land',             label: 'Новои-Land' },
    { value: 'novza_school',           label: 'Новза-School' },
    { value: 'uchtepa_school',         label: 'Учтепа-School' },
    { value: 'almazar_school',         label: 'Алмазар-School' },
    { value: 'general_uzakov_school',  label: 'Ген. Узаков-School' },
    { value: 'namangan_school',        label: 'Наманган-School' },
    { value: 'novoi_school',           label: 'Новои-School' },
];

export function RequestsFilters({ statusFilter, branchFilter, onStatusChange, onBranchChange, onClear }: RequestsFiltersProps) {
    return (
        <div className="flex items-center gap-3 flex-wrap">
            {/* Status pills */}
            <div className="flex gap-1 flex-wrap">
                {STATUSES.map(s => (
                    <button
                        key={s.value}
                        onClick={() => onStatusChange(s.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            statusFilter === s.value
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Branch dropdown (12 branches = pills too many) */}
            <select
                value={branchFilter}
                onChange={(e) => onBranchChange(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold bg-white focus:ring-1 focus:ring-gray-400 focus:outline-none text-gray-600"
            >
                {BRANCHES.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                ))}
            </select>

            {(statusFilter || branchFilter) && (
                <button
                    onClick={onClear}
                    className="text-xs text-gray-400 hover:text-gray-600 font-medium underline underline-offset-2"
                >
                    Сбросить
                </button>
            )}
        </div>
    );
}

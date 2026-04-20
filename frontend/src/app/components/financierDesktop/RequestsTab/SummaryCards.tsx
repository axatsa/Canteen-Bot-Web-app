interface SummaryCardsProps {
    total: number;
    atChef: number;
    atSnabjenec: number;
    atSupplier: number;
    inReceiving: number;
    ready: number;
}

const PIPELINE: { key: keyof Omit<SummaryCardsProps, 'total'>; label: string; dot: string }[] = [
    { key: 'atChef',      label: 'У шефа',        dot: 'bg-slate-400' },
    { key: 'atSnabjenec', label: 'У снабженца',    dot: 'bg-yellow-400' },
    { key: 'atSupplier',  label: 'У поставщика',   dot: 'bg-blue-400' },
    { key: 'inReceiving', label: 'На приёмке',      dot: 'bg-amber-400' },
    { key: 'ready',       label: 'Ожидает меня',    dot: 'bg-violet-500' },
];

export function SummaryCards({ total, atChef, atSnabjenec, atSupplier, inReceiving, ready }: SummaryCardsProps) {
    const values = { atChef, atSnabjenec, atSupplier, inReceiving, ready };

    return (
        <div className="mb-6 space-y-3">
            {/* Total */}
            <div className="bg-gray-900 rounded-2xl px-5 py-4 flex items-baseline justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Всего активных заявок</span>
                <span className="text-4xl font-black text-white tabular-nums">{total}</span>
            </div>

            {/* Pipeline breakdown */}
            <div className="grid grid-cols-5 gap-2">
                {PIPELINE.map(({ key, label, dot }) => {
                    const val = values[key];
                    const isHighlight = key === 'ready' && val > 0;
                    return (
                        <div
                            key={key}
                            className={`rounded-2xl p-4 border ${
                                isHighlight
                                    ? 'bg-violet-50 border-violet-200'
                                    : 'bg-white border-gray-100'
                            }`}
                        >
                            <div className={`text-3xl font-black tracking-tight leading-none ${
                                isHighlight ? 'text-violet-700' : 'text-gray-900'
                            }`}>
                                {val}
                            </div>
                            <div className="flex items-center gap-1.5 mt-2">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-tight">
                                    {label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

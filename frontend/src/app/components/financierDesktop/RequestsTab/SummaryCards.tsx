interface SummaryCardsProps {
    total: number;
    inReceiving: number;
    ready: number;
    avgCompletion: number;
}

export function SummaryCards({ total, inReceiving, ready, avgCompletion }: SummaryCardsProps) {
    const cards = [
        { label: 'Всего заявок', value: total, highlight: false },
        { label: 'На приёмке', value: inReceiving, highlight: false },
        { label: 'Готово к проверке', value: ready, highlight: ready > 0 },
        { label: 'Среднее выполнение', value: `${avgCompletion}%`, highlight: false },
    ];

    return (
        <div className="grid grid-cols-4 gap-3 mb-6">
            {cards.map(c => (
                <div
                    key={c.label}
                    className={`rounded-2xl p-5 border transition-all ${
                        c.highlight
                            ? 'bg-gray-900 border-gray-900 text-white'
                            : 'bg-white border-gray-100 text-gray-900'
                    }`}
                >
                    <div className={`text-4xl font-black tracking-tight leading-none ${c.highlight ? 'text-white' : 'text-gray-900'}`}>
                        {c.value}
                    </div>
                    <div className={`text-xs font-medium mt-2 uppercase tracking-wide ${c.highlight ? 'text-gray-400' : 'text-gray-400'}`}>
                        {c.label}
                    </div>
                </div>
            ))}
        </div>
    );
}

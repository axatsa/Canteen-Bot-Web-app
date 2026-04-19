interface SummaryCardsProps {
    total: number;
    inReceiving: number;
    ready: number;
    avgCompletion: number;
}

export function SummaryCards({ total, inReceiving, ready, avgCompletion }: SummaryCardsProps) {
    const cards = [
        { label: 'Всего заявок', value: total, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'На приёмке', value: inReceiving, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
        { label: 'Готовых', value: ready, color: 'bg-green-50 text-green-700 border-green-200' },
        { label: 'Среднее %', value: `${avgCompletion}%`, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    ];

    return (
        <div className="grid grid-cols-4 gap-4 mb-6">
            {cards.map(c => (
                <div key={c.label} className={`rounded-xl border p-4 ${c.color}`}>
                    <div className="text-2xl font-bold">{c.value}</div>
                    <div className="text-sm mt-1 opacity-80">{c.label}</div>
                </div>
            ))}
        </div>
    );
}

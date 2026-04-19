import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DeliveryChartProps {
    data: Array<{ date: string; completion_rate: number; orders_count: number }>;
}

export function DeliveryChart({ data }: DeliveryChartProps) {
    if (data.length === 0) {
        return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Нет данных для графика</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                    formatter={(value: any) => [`${value}%`, '% доставки']}
                    labelStyle={{ fontWeight: 'bold' }}
                />
                <Line
                    type="monotone"
                    dataKey="completion_rate"
                    stroke="#2E7D32"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#2E7D32' }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

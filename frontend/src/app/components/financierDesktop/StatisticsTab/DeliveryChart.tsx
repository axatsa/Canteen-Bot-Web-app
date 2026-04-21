import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DeliveryChartProps {
    data: Array<{ date: string; completion: number }>;
}

export function DeliveryChart({ data }: DeliveryChartProps) {
    if (!data || data.length === 0) {
        return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Нет данных для графика</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: '#9ca3af' }} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => val.split('-').slice(1).join('.')} // MM.DD
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    formatter={(value: any) => [`${value}%`, 'Выполнение']}
                    labelFormatter={(label) => `Дата: ${label}`}
                />
                <Line
                    type="monotone"
                    dataKey="completion"
                    stroke="#000"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#000', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#000', strokeWidth: 2, stroke: '#fff' }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

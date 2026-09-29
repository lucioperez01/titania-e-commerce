'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function IncomeGraph() {
    const data = [
        { name: 'Lun', income: 4000 },
        { name: 'Mar', income: 3000 },
        { name: 'Mié', income: 5200 },
        { name: 'Jue', income: 2780 },
        { name: 'Vie', income: 4890 },
        { name: 'Sáb', income: 5390 },
        { name: 'Dom', income: 3490 },
    ]

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
                <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" strokeOpacity={0.2} />
                <XAxis
                    dataKey="name"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: '#4b5563', strokeOpacity: 0.3 }}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: '#4b5563', strokeOpacity: 0.3 }}
                    tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#171717',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '0.5rem',
                        color: '#fff',
                    }}
                    formatter={(value) => [`$${Number(value).toLocaleString('es-AR')}`, 'Ingresos']}
                />
                <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fill="url(#incomeGradient)"
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}

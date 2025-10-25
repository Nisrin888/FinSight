/**
 * Income vs Expense Trend Chart
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const IncomeTrendChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-center px-6">
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 backdrop-blur-sm">
          <svg className="w-16 h-16 text-primary-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <p className="text-white font-semibold mb-2">Not Enough Data Yet</p>
        <p className="text-gray-400 text-sm max-w-xs">
          Add more income and expense transactions over time to see your financial trends here
        </p>
      </div>
    );
  }

  // Transform backend data format to chart format
  const chartData = data.map((item) => {
    const entry = {
      period: item._id || item.period,
      income: 0,
      expense: 0,
    };

    // Handle nested data array from backend
    if (item.data && Array.isArray(item.data)) {
      item.data.forEach((d) => {
        if (d.type === 'income') entry.income = d.total;
        if (d.type === 'expense') entry.expense = d.total;
      });
    } else {
      // Handle direct income/expense properties
      entry.income = item.income || 0;
      entry.expense = item.expense || 0;
    }

    return entry;
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ${entry.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="period" stroke="#6B7280" style={{ fontSize: '12px' }} />
        <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          align="center"
          verticalAlign="bottom"
          iconType="circle"
          wrapperStyle={{
            paddingTop: '20px',
            paddingLeft: '85px',
            display: 'flex',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        />
        <Area
          type="monotone"
          dataKey="income"
          stroke="#10B981"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorIncome)"
          name="Income"
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke="#EF4444"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorExpense)"
          name="Expense"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default IncomeTrendChart;

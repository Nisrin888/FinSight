/**
 * Spending by Category Pie Chart
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const SpendingPieChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-400">
        <p>No spending data available</p>
      </div>
    );
  }

  // Diverse color palette for better visual distinction
  const colorPalette = [
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#84CC16', // Lime
    '#06B6D4', // Cyan
    '#F43F5E', // Rose
  ];

  // Format data for Recharts with diverse colors
  const chartData = data.map((item, index) => ({
    name: item.name,
    value: item.total,
    color: colorPalette[index % colorPalette.length],
    icon: item.icon,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{data.icon}</span>
            <p className="font-semibold text-gray-900">{data.name}</p>
          </div>
          <p className="text-sm text-gray-600">
            ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        {payload.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default SpendingPieChart;

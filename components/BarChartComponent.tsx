
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface ChartData {
  name: string;
  value: number;
}

interface BarChartComponentProps {
  data: ChartData[];
}

// Helper to darken a hex color
const darkenColor = (color: string, amount: number) => {
    let usePound = false;
    if (color.startsWith("#")) {
        color = color.slice(1);
        usePound = true;
    }
    const num = parseInt(color, 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;

    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);
    
    const newColor = ((r << 16) | (g << 8) | b).toString(16);
    return (usePound ? "#" : "") + ('000000' + newColor).slice(-6);
};

const BAR_COLORS = ['#33b2df', '#9ad464', '#fec54d', '#f87ea0', '#a87ff0'];

const ThreeDBar = (props: any) => {
    const { fill, x, y, width, height, index, value } = props;
    if (height <= 0 || value === 0) return null;
    
    const depth = 10;
    const color = BAR_COLORS[index % BAR_COLORS.length];
    const darkerColor = darkenColor(color, 30);

    return (
        <g>
            {/* Main 3D bar */}
            <rect x={x} y={y} width={width} height={height} fill={color} stroke={darkerColor} strokeWidth="0.5"/>
            <path d={`M${x},${y} L${x + depth},${y - depth} L${x + width + depth},${y - depth} L${x + width},${y} Z`} fill={color} stroke={darkerColor} strokeWidth="0.5" />
            <path d={`M${x + width},${y} L${x + width + depth},${y - depth} L${x + width + depth},${y + height - depth} L${x + width},${y + height} Z`} fill={darkerColor} stroke={darkenColor(darkerColor, 20)} strokeWidth="0.5" />
        </g>
    );
};

export const BarChartComponent: React.FC<BarChartComponentProps> = ({ data }) => {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl h-96 border-2 border-brand-primary transition-all duration-300 hover:shadow-[0_0_20px_rgba(79,70,229,0.6)] hover:scale-105">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Step Code wise Pending</h3>
      <AnimatePresence mode="wait">
        {data.length > 0 ? (
          <motion.div
            key="chart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-[90%]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#666' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#666' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid #ddd',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Bar dataKey="value" shape={<ThreeDBar />}>
                  <LabelList dataKey="value" position="top" style={{ fill: '#374151', fontSize: 12, fontWeight: 'bold' }} offset={15} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <motion.div
            key="no-data"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center h-full text-gray-500"
          >
            No data available for this chart.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

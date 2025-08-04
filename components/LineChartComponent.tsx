
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface ChartData {
  name: string;
  value: number;
}

interface LineChartComponentProps {
  data: ChartData[];
}

// A vibrant color palette for the chart dots
const DOT_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

const CustomizedDot: React.FC<{ cx?: number, cy?: number, index?: number }> = (props) => {
  const { cx, cy, index } = props;

  if (cx === undefined || cy === undefined || index === undefined) {
    return null;
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={DOT_COLORS[index % DOT_COLORS.length]}
      stroke="#ffffff"
      strokeWidth={2}
      filter="url(#dot-shadow)"
    />
  );
};

const CustomizedXAxisTick: React.FC<any> = (props) => {
    const { x, y, payload, activeLabel } = props;
    const isActive = payload.value === activeLabel;

    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={16}
                textAnchor="end"
                fill={isActive ? '#4f46e5' : '#6b7280'}
                transform="rotate(-45)"
                style={{
                    fontSize: isActive ? 14 : 11,
                    fontWeight: isActive ? 'bold' : 'normal',
                    transition: 'all 0.2s ease-in-out',
                }}
            >
                {payload.value}
            </text>
        </g>
    );
};


export const LineChartComponent: React.FC<LineChartComponentProps> = ({ data }) => {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  return (
    <div className="relative bg-white p-4 sm:p-6 rounded-lg shadow-xl h-96 border-2 border-brand-primary transition-all duration-300 hover:shadow-[0_0_20px_rgba(79,70,229,0.6)] hover:scale-105">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Date wise Pending</h3>
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
              <AreaChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 0,
                  bottom: 45,
                }}
                onMouseMove={(state) => {
                  if (state.isTooltipActive) {
                    setActiveLabel(state.activeLabel);
                  } else {
                    setActiveLabel(null);
                  }
                }}
                onMouseLeave={() => {
                  setActiveLabel(null);
                }}
              >
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                        <stop offset="50%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#eef2ff" stopOpacity={0.05}/>
                    </linearGradient>
                    <filter id="dot-shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="rgba(0,0,0,0.2)" />
                    </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60} 
                  interval={0}
                  tick={<CustomizedXAxisTick activeLabel={activeLabel} />} 
                />
                <YAxis allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: '#4f46e5', strokeWidth: 1.5, strokeDasharray: '5 5' }}
                  contentStyle={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(5px)',
                      border: '1px solid #ddd',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  name="Pending Follow-ups" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  fill="url(#chartGradient)" 
                  activeDot={(props) => {
                    const { cx, cy, index } = props;
                    if (cx === undefined || cy === undefined || index === undefined) return null;
                    return (
                        <circle
                            cx={cx}
                            cy={cy}
                            r={8}
                            fill={DOT_COLORS[index % DOT_COLORS.length]}
                            stroke="#ffffff"
                            strokeWidth={3}
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                        />
                    );
                  }}
                  dot={<CustomizedDot />}
                >
                  <LabelList dataKey="value" position="top" style={{ fill: '#374151', fontSize: 12, fontWeight: 'bold' }} offset={10} />
                </Area>
              </AreaChart>
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
           No pending follow-ups to display.
         </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

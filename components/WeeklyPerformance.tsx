

import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { TodaysTaskData } from '../types';
import { ChevronRightIcon } from './icons';

// A metric definition with daily targets
interface PerformanceMetric {
    name: string;
    dailyPlan: number;
    stepCode: string;
}

// Daily planned numbers as per user request
const dailyMetrics: PerformanceMetric[] = [
    { name: '1st Contact', dailyPlan: 50, stepCode: 'Step-1' },
    { name: 'FollowUps-1st Connect', dailyPlan: 50, stepCode: 'Step-1a' },
    { name: 'Meeting Fixed', dailyPlan: 4, stepCode: 'Step-2' },
    { name: 'Send Req. Material', dailyPlan: 4, stepCode: 'Step-5' },
    { name: 'FollowUps-After Meeting', dailyPlan: 50, stepCode: 'Step-7' },
];

interface WeeklyPerformanceProps {
    data: TodaysTaskData[];
    onOpenReport: (metric: { name: string, stepCode: string }) => void;
    dateRange: { start: Date | null; end: Date | null };
}

// Helper to count weekdays (Monday-Friday) in a date range
const countWeekdays = (start: Date, end: Date): number => {
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
        const day = current.getDay();
        if (day >= 1 && day <= 5) { // 1=Mon, 5=Fri
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
};

// Color logic based on the performance score.
// User request: Green: 0 to -5, Orange: -6 to -76, Red: -75 to -100
const getGaugeColor = (score: number) => {
    // Green: for scores from 0% to -5%.
    if (score >= -5) {
        return { main: '#10b981', bg: '#d1fae5', glow: 'rgba(16, 185, 129, 0.6)' }; // Green
    }
    // Red: for scores from -75% to -100%.
    if (score <= -75) {
        // The user specified that -76 should be Orange.
        // We'll round the score to handle values close to -76.
        if (Math.round(score) === -76) {
            return { main: '#f59e0b', bg: '#fef3c7', glow: 'rgba(245, 158, 11, 0.6)' }; // Orange
        }
        return { main: '#ef4444', bg: '#fee2e2', glow: 'rgba(239, 68, 68, 0.6)' }; // Red
    }
    // Orange: This handles the range between Green and Red.
    return { main: '#f59e0b', bg: '#fef3c7', glow: 'rgba(245, 158, 11, 0.6)' }; // Orange
};


// Reusable AnimatedNumber component
const AnimatedNumber: React.FC<{ value: number, className?: string, decimals?: number }> = ({ value, className, decimals = 0 }) => {
    const count = useMotionValue(0);
    const transformed = useTransform(count, (latest) => {
        return latest.toFixed(decimals);
    });

    useEffect(() => {
        const controls = animate(count, value, {
            duration: 1.5,
            ease: [0.25, 1, 0.5, 1] // easeOutExpo
        });
        return controls.stop;
    }, [value, count]);

    return <motion.span className={className}>{transformed}</motion.span>;
}

interface MetricCardProps {
    metric: PerformanceMetric & { planned: number; actual: number; };
    onOpenReport: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric, onOpenReport }) => {
    const { name, planned, actual } = metric;
    
    // Calculate performance score. If actual >= planned, score is 0. Otherwise it's a negative percentage of the shortfall.
    const performanceScore = planned > 0 ? Math.max(-100, Math.min(0, ((actual / planned) - 1) * 100)) : 0;

    const colors = getGaugeColor(performanceScore);
    
    // The gauge's fill percentage is derived from the score, where -100% score is 0% fill and 0% score is 100% fill.
    const gaugeFillPercentage = 100 + performanceScore;
    
    const RADIUS = 60;
    const STROKE_WIDTH = 12;
    const circumference = 2 * Math.PI * RADIUS;
    const offset = useMotionValue(circumference);
    const strokeDashoffset = useTransform(offset, val => val);

    useEffect(() => {
        const controls = animate(offset, circumference * (1 - gaugeFillPercentage / 100), {
            duration: 1.5,
            ease: [0.25, 1, 0.5, 1]
        });
        return controls.stop;
    }, [gaugeFillPercentage, offset, circumference]);

    return (
        <motion.div
            className="group relative bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center overflow-hidden border-2 h-full"
            whileHover={{ 
                y: -5, 
                boxShadow: `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1), 0 0 20px ${colors.glow}`
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            style={{ '--hover-color': colors.main, borderColor: colors.main } as React.CSSProperties}
        >
            <div 
                className="absolute -top-1/4 -right-1/4 w-48 h-48 rounded-full opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                style={{ backgroundColor: colors.main }}
            />
            
            <h3 className="font-bold text-gray-800 text-center mb-4 text-lg min-h-[3.5rem] flex items-center justify-center">{name}</h3>

            <div className="relative w-40 h-40 mb-4">
                <svg width="100%" height="100%" viewBox="0 0 144 144" className="-rotate-90">
                    <circle
                        cx="72" cy="72" r={RADIUS}
                        fill="none"
                        stroke={colors.bg}
                        strokeWidth={STROKE_WIDTH}
                    />
                    <motion.circle
                        cx="72" cy="72" r={RADIUS}
                        fill="none"
                        stroke={colors.main}
                        strokeWidth={STROKE_WIDTH}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        style={{ strokeDashoffset }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-baseline text-gray-900">
                        <AnimatedNumber value={performanceScore} decimals={0} className="text-3xl font-extrabold" />
                        <span className="text-xl font-bold">%</span>
                    </div>
                </div>
            </div>

            <div className="w-full mt-auto">
                <div className="flex justify-around w-full text-center mb-5">
                    <div>
                        <span className="text-sm font-medium text-gray-500">Planned</span>
                        <p className="text-2xl font-bold text-gray-700">
                            <AnimatedNumber value={planned} />
                        </p>
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-500">Actual</span>
                        <p className="text-2xl font-bold text-gray-700">
                            <AnimatedNumber value={actual} />
                        </p>
                    </div>
                </div>
                
                <button 
                    onClick={onOpenReport}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 group-hover:bg-[var(--hover-color)] group-hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--hover-color)]"
                >
                    View Report
                    <ChevronRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
            </div>
        </motion.div>
    );
};

export const WeeklyPerformance: React.FC<WeeklyPerformanceProps> = ({ data, onOpenReport, dateRange }) => {

    const weekdays = dateRange.start && dateRange.end ? countWeekdays(dateRange.start, dateRange.end) : 0;
    
    const calculatedMetrics = dailyMetrics.map(metric => {
        const planned = metric.dailyPlan * weekdays;
        const actual = data.filter(d => d.stepCode === metric.stepCode).length;
        return { ...metric, planned, actual };
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };
    
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div
            className="bg-gray-50/50 rounded-xl p-6 border border-gray-200/80"
        >
            <motion.h2 
                className="text-2xl font-bold text-gray-800 mb-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                Weekly Performance Metrics
            </motion.h2>
            {calculatedMetrics.length > 0 ? (
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {calculatedMetrics.map((metric) => (
                        <motion.div key={metric.name} variants={itemVariants} className="h-full">
                            <MetricCard
                                metric={metric}
                                onOpenReport={() => onOpenReport(metric)}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <div className="text-center py-10 text-gray-500">
                    No data available for the selected period.
                </div>
            )}
        </div>
    );
};
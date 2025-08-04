
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TodaysTaskData } from '../types';
import { XMarkIcon, ArrowUpDownIcon, SearchIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from './icons';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend, XAxis, YAxis, LabelList, CartesianGrid } from 'recharts';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    data: TodaysTaskData[];
    userRole: 'Admin' | 'User';
    showCharts?: boolean; // New optional prop
}

type SortKey = keyof TodaysTaskData;
type SortDirection = 'asc' | 'desc';

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

const getColumnWidths = (): Record<string, number> => ({
    leadId: 140,
    personName: 190,
    mobile: 150,
    stepCode: 140,
    planned: 210,
    actual: 210,
    status: 150,
    remark: 350,
    doer: 130,
});

const headers: { key: SortKey; label: string }[] = [
    { key: 'leadId', label: 'Lead Id' },
    { key: 'personName', label: 'Person Name' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'stepCode', label: 'Step Code' },
    { key: 'planned', label: 'Planned' },
    { key: 'actual', label: 'Actual' },
    { key: 'status', label: 'Status' },
    { key: 'remark', label: 'Remark' },
    { key: 'doer', label: 'Doer' },
];

const COLUMNS_WITH_ASTERISKS = ['planned', 'actual', 'status', 'remark'];
const BAR_COLORS = ['#4f46e5', '#10b981', '#3b82f6', '#f97316', '#ec4899', '#8b5cf6'];


const backdrop = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
};

const modal = {
    hidden: { y: "30px", opacity: 0, scale: 0.95 },
    visible: {
        y: "0",
        opacity: 1,
        scale: 1,
        transition: { type: "spring" as const, stiffness: 400, damping: 40 }
    },
    exit: {
        y: "30px",
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.2 }
    }
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;

    // Threshold below which the label is rendered outside the pie
    const LABEL_THRESHOLD = 0.06; // Display label inside if slice is 6% or larger

    if (percent < LABEL_THRESHOLD) {
        // --- Render label outside with a line for small slices ---
        const lineStartRadius = outerRadius + 5;
        const labelRadius = outerRadius + 20; // How far the label text is from the pie
        
        // Start of the line (just outside the slice)
        const startX = cx + lineStartRadius * Math.cos(-midAngle * RADIAN);
        const startY = cy + lineStartRadius * Math.sin(-midAngle * RADIAN);

        // End of the line (where the text will be)
        const endX = cx + labelRadius * Math.cos(-midAngle * RADIAN);
        const endY = cy + labelRadius * Math.sin(-midAngle * RADIAN);

        // Determine text anchor based on which side of the pie it is
        const textAnchor = Math.cos(-midAngle * RADIAN) > 0 ? 'start' : 'end';

        return (
            <g>
                {/* The connector line */}
                <path d={`M${startX},${startY}L${endX},${endY}`} stroke="#6b7280" fill="none" strokeWidth={1}/>
                {/* A small dot at the start of the line */}
                <circle cx={startX} cy={startY} r={2} fill="#6b7280" />
                {/* The percentage text */}
                <text x={endX + (textAnchor === 'start' ? 3 : -3)} y={endY} fill="#374151" textAnchor={textAnchor} dominantBaseline="central" fontSize={11} fontWeight="bold">
                    {`${(percent * 100).toFixed(0)}%`}
                </text>
            </g>
        );
    }
    
    // --- Render label inside for larger slices ---
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5; // Position label in the middle of the slice
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const ThreeDVerticalBar = (props: any) => {
    const { x, y, width, height, index, value } = props;
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

const ThreeDHorizontalBar = (props: any) => {
    const { x, y, width, height, index, value } = props;
    if (width <= 0 || value === 0) return null;
    
    const depth = 8;
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


export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, title, data, userRole, showCharts = true }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(getColumnWidths);
    const [chartsPanelWidth, setChartsPanelWidth] = useState(350);
    const [isResizing, setIsResizing] = useState(false);
    const resizeData = useRef<{ startX: number; startWidth: number } | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const isAdmin = userRole === 'Admin';
    
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setIsFullScreen(false);
        }
    }, [isOpen]);

    const chartData = useMemo(() => {
        if (!isAdmin || data.length === 0) return [];
    
        const doerCounts = data.reduce((acc, task) => {
            const doer = task.doer || 'Unassigned';
            acc[doer] = (acc[doer] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    
        return Object.entries(doerCounts)
            .map(([name, tasks]) => ({ name, tasks }))
            .sort((a, b) => b.tasks - a.tasks);
    }, [data, isAdmin]);

    const stepCodeChartData = useMemo(() => {
        if (data.length === 0) return [];

        const stepCodeCounts = data.reduce((acc, task) => {
            const stepCode = task.stepCode || 'Uncategorized';
            acc[stepCode] = (acc[stepCode] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(stepCodeCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [data]);
    
    const toggleFullScreen = () => {
        setIsFullScreen(prev => !prev);
    };

    const handleMouseDownResize = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        resizeData.current = {
            startX: e.clientX,
            startWidth: chartsPanelWidth,
        };
        setIsResizing(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [chartsPanelWidth]);

    const handleMouseMoveResize = useCallback((e: MouseEvent) => {
        if (!isResizing || !resizeData.current) return;
        const { startX, startWidth } = resizeData.current;
        const dx = e.clientX - startX;
        const newWidth = startWidth + dx;
        if (newWidth > 320 && newWidth < 600) {
            setChartsPanelWidth(newWidth);
        }
    }, [isResizing]);

    const handleMouseUpResize = useCallback(() => {
        setIsResizing(false);
        resizeData.current = null;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }, []);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMoveResize);
            window.addEventListener('mouseup', handleMouseUpResize);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMoveResize);
            window.removeEventListener('mouseup', handleMouseUpResize);
        };
    }, [isResizing, handleMouseMoveResize, handleMouseUpResize]);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        return data.filter(item => 
            String(item.leadId).toLowerCase().includes(lowercasedSearchTerm) ||
            String(item.mobile).toLowerCase().includes(lowercasedSearchTerm) ||
            String(item.stepCode).toLowerCase().includes(lowercasedSearchTerm) ||
            String(item.status).toLowerCase().includes(lowercasedSearchTerm)
        );
    }, [data, searchTerm]);

    const sortedData = useMemo(() => {
        let sortableItems = [...filteredData];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredData, sortConfig]);

    const processCell = (value: any, key: string) => {
        if (COLUMNS_WITH_ASTERISKS.includes(key) && typeof value === 'string') {
            const processedValue = value.replace(/\s*\*\s*/g, '\n').trim();
            return <div title={processedValue} className="whitespace-pre-line">{processedValue || '-'}</div>;
        }
        return <div title={String(value ?? '')} className="whitespace-nowrap overflow-hidden text-ellipsis">{value ?? '-'}</div>;
    };

    const fullScreenButtonClass = isFullScreen
        ? 'bg-violet-800 hover:bg-violet-900 focus:ring-violet-800' // Custom exit full screen color
        : 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-700'; // Violet theme for primary action

    const chartsToDisplay = isAdmin ? (
        <>
            <motion.div className="bg-white rounded-xl p-4 mb-6 transition-all duration-300 border-2 border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)]" whileHover={{ scale: 1.05 }}>
                <h4 className="text-md font-semibold text-gray-700 mb-2 text-center">SC Performance %</h4>
                <div className="w-full h-80 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius="55%"
                                outerRadius="85%"
                                fill="#8884d8"
                                dataKey="tasks"
                                nameKey="name"
                                paddingAngle={2}
                                labelLine={false}
                                label={renderCustomizedLabel}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} stroke={BAR_COLORS[index % BAR_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ color: '#374151' }}
                                labelStyle={{color: '#6b7280'}}
                            />
                            <Legend verticalAlign="bottom" height={50} iconSize={10} wrapperStyle={{color: '#4b5563', fontSize: '12px'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            <motion.div className="bg-white rounded-xl p-4 mb-6 transition-all duration-300 border-2 border-brand-primary hover:shadow-[0_0_20px_rgba(79,70,229,0.6)]" whileHover={{ scale: 1.05 }}>
                <h4 className="text-md font-semibold text-gray-700 mb-2 text-center">SC wise Performance</h4>
                <div className="w-full h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" stroke="#9ca3af" domain={[0, 'dataMax + 2']} allowDecimals={false} tick={{fill: '#6b7280', fontSize: 12}} />
                            <YAxis dataKey="name" type="category" stroke="#9ca3af" width={80} interval={0} tick={{ fontSize: 12, fill: '#374151', fontWeight: 'bold' }} />
                            <Tooltip
                                cursor={false}
                                contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ color: '#374151' }}
                                labelStyle={{color: '#6b7280'}}
                            />
                            <Bar dataKey="tasks" name="Tasks" shape={<ThreeDHorizontalBar />}>
                                <LabelList dataKey="tasks" position="right" style={{ fill: '#4b5563', fontSize: 12, fontWeight: 'bold' }} offset={15} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            <motion.div className="bg-white rounded-xl p-4 transition-all duration-300 border-2 border-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.6)]" whileHover={{ scale: 1.05 }}>
                <h4 className="text-md font-semibold text-gray-700 mb-2 text-center">Step wise Performance</h4>
                <div className="w-full h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stepCodeChartData} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                stroke="#9ca3af" 
                                interval={0} 
                                angle={-55} 
                                textAnchor="end" 
                                height={70} 
                                tick={{fill: '#6b7280', fontSize: 11}} 
                            />
                            <YAxis 
                                stroke="#9ca3af" 
                                allowDecimals={false} 
                                tick={{fill: '#6b7280', fontSize: 12}} 
                                domain={[0, 'dataMax + 2']}
                            />
                            <Tooltip
                                cursor={false}
                                contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontWeight: 'bold' }}
                                labelStyle={{color: '#6b7280'}}
                            />
                            <Bar dataKey="count" name="Records" shape={<ThreeDVerticalBar />}>
                                <LabelList dataKey="count" position="top" style={{ fill: '#4b5563', fontSize: 12, fontWeight: 'bold' }} offset={15} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </>
    ) : (
        <motion.div className="bg-white rounded-xl p-4 transition-all duration-300 border-2 border-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.6)]" whileHover={{ scale: 1.05 }}>
            <h4 className="text-md font-semibold text-gray-700 mb-2 text-center">Step wise Performance</h4>
            <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stepCodeChartData} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            stroke="#9ca3af" 
                            interval={0} 
                            angle={-55} 
                            textAnchor="end" 
                            height={70} 
                            tick={{fill: '#6b7280', fontSize: 11}} 
                        />
                        <YAxis 
                            stroke="#9ca3af" 
                            allowDecimals={false} 
                            tick={{fill: '#6b7280', fontSize: 12}} 
                            domain={[0, 'dataMax + 2']}
                        />
                        <Tooltip
                            cursor={false}
                            contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontWeight: 'bold' }}
                            labelStyle={{color: '#6b7280'}}
                        />
                        <Bar dataKey="count" name="Records" shape={<ThreeDVerticalBar />}>
                            <LabelList dataKey="count" position="top" style={{ fill: '#4b5563', fontSize: 12, fontWeight: 'bold' }} offset={15} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );


    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center ${isFullScreen ? 'p-0' : 'p-4'}`}
                    variants={backdrop}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={onClose}
                >
                    <motion.div
                        id="report-modal"
                        variants={modal}
                        className={`bg-gray-50 flex flex-col border border-gray-200 ${isFullScreen ? 'w-screen h-screen rounded-none' : 'rounded-xl shadow-2xl w-full h-full max-w-7xl max-h-[90vh]'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-bold text-gray-900 shrink-0">{title}</h2>
                                <span className="bg-violet-100 text-violet-800 text-sm font-semibold px-3 py-1 rounded-md border border-violet-400">
                                    {sortedData.length} records found
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <SearchIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="search"
                                        placeholder="Search by Lead ID, Mobile, Step Code, or Status..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoComplete="off"
                                        className="block w-72 pl-10 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 sm:text-sm transition-colors duration-300"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleFullScreen}
                                    className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white flex items-center gap-2 ${fullScreenButtonClass}`}
                                    aria-label={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                                >
                                    {isFullScreen ? <ArrowsPointingInIcon className="h-5 w-5"/> : <ArrowsPointingOutIcon className="h-5 w-5"/>}
                                    <span>{isFullScreen ? 'Exit Full Screen' : 'View Full Screen'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-violet-500 transition-colors"
                                    aria-label="Close"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </header>

                        <div className="flex flex-col md:flex-row flex-grow min-h-0">
                            {showCharts && (isAdmin || stepCodeChartData.length > 0) && (
                                <>
                                <div
                                    style={{ flex: `0 0 ${chartsPanelWidth}px` }}
                                    className="p-4 bg-white md:border-r border-gray-200 overflow-y-auto"
                                >
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 sticky top-0 bg-white/80 backdrop-blur-sm py-2 z-10 text-center">
                                        Performance Breakdown
                                    </h3>
                                    {chartsToDisplay}
                                </div>
                                <div
                                    onMouseDown={handleMouseDownResize}
                                    className="w-1.5 cursor-col-resize bg-gray-200 hover:bg-violet-500 transition-colors duration-200 hidden md:block"
                                    aria-label="Resize panel"
                                 />
                                </>
                            )}
                            <div className="flex-grow overflow-auto" style={{flex: '1 1 0%'}}>
                                <table className="w-full text-sm text-left text-gray-600" style={{ tableLayout: 'fixed' }}>
                                    <colgroup>
                                        {headers.map(header => <col key={header.key} style={{ width: `${columnWidths[header.key] || 100}px` }} />)}
                                    </colgroup>
                                    <thead className="text-xs text-white uppercase bg-violet-600 sticky top-0 z-10">
                                        <tr>
                                            {headers.map((header) => (
                                                <th key={header.key} scope="col" className="px-6 py-3 relative group select-none">
                                                    <div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort(header.key)}>
                                                        {header.label}
                                                        <ArrowUpDownIcon className="h-4 w-4" />
                                                    </div>
                                                    <div
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        className="absolute top-0 right-0 h-full w-2 cursor-col-resize opacity-0 group-hover:opacity-100"
                                                        aria-hidden="true"
                                                    />
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {sortedData.length > 0 ? sortedData.map((item, index) => (
                                            <tr key={item.leadId + '-' + index} className="odd:bg-white even:bg-gray-100 hover:bg-violet-50 transition-all duration-200 ease-in-out hover:scale-[1.01] hover:shadow-lg hover:relative hover:z-10">
                                                {headers.map(header => (
                                                    <td key={header.key} className="px-6 py-3 align-top">
                                                        {processCell(item[header.key], header.key)}
                                                    </td>
                                                ))}
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={headers.length} className="text-center py-16 text-gray-500">
                                                    {searchTerm ? 'No records match your search.' : 'No records found for this category.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

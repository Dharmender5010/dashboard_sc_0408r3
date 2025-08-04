
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TodaysTaskData } from '../types';
import { SearchableSelect } from './SearchableSelect';
import { DateRangePicker } from './DateRangePicker';
import { FilterXIcon, ArrowUpDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from './icons';
import { DEVELOPER_EMAIL } from '../services/helpService';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend, XAxis, YAxis, LabelList, CartesianGrid } from 'recharts';
import { WeeklyPerformance } from './WeeklyPerformance';
import { ReportModal } from './ReportModal';


interface PerformancePageProps {
    todaysTaskData: TodaysTaskData[];
    userRole: 'Admin' | 'User';
    userName: string;
    userEmail: string;
}

interface PerformanceMetric {
    name: string;
    stepCode: string;
}

const monthOrder: { [key: string]: number } = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
};

const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr || !dateStr.trim()) return null;

    // Handle DD/MM/YYYY format first
    const slashParts = dateStr.split('/');
    if (slashParts.length === 3) {
        const day = parseInt(slashParts[0], 10);
        const month = parseInt(slashParts[1], 10) - 1;
        const year = parseInt(slashParts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            return new Date(year, month, day);
        }
    }
    
    // Handle format "23-Jul"
    const parts = dateStr.split('-');
    if (parts.length === 2 && isNaN(parseInt(parts[1], 10))) {
        const day = parseInt(parts[0], 10);
        const month = monthOrder[parts[1]];
        if (!isNaN(day) && month !== undefined) {
            const currentYear = new Date().getFullYear();
            return new Date(currentYear, month, day);
        }
    }
    // Handle standard date strings like "YYYY-MM-DD" or "MM/DD/YYYY"
    // Note: 'MM/DD/YYYY' is ambiguous, but this is a fallback.
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    
    return null;
};


const getLastWeek = (): { start: Date; end: Date } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay(); // Sunday: 0, Monday: 1, ...

    const lastSunday = new Date(today);
    // If today is Sunday, get last week's Sunday, otherwise get this week's.
    const sundayOffset = dayOfWeek === 0 ? -7 : -dayOfWeek;
    lastSunday.setDate(today.getDate() + sundayOffset);
    lastSunday.setHours(23, 59, 59, 999);
    
    const lastMonday = new Date(lastSunday);
    lastMonday.setDate(lastSunday.getDate() - 6);
    lastMonday.setHours(0, 0, 0, 0);

    return { start: lastMonday, end: lastSunday };
};

type SortKey = keyof TodaysTaskData;
type SortDirection = 'asc' | 'desc';

const ROWS_PER_PAGE = 100;
const COLUMNS_WITH_ASTERISKS = ['planned', 'actual', 'status', 'remark'];
const BAR_COLORS = ['#4f46e5', '#10b981', '#3b82f6', '#f97316', '#ec4899', '#8b5cf6'];
const RADIAN = Math.PI / 180;

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

const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;

    const LABEL_THRESHOLD = 0.06; // Display label inside if slice is 6% or larger

    if (percent < LABEL_THRESHOLD) {
        const lineStartRadius = outerRadius + 5;
        const labelRadius = outerRadius + 20;
        
        const startX = cx + lineStartRadius * Math.cos(-midAngle * RADIAN);
        const startY = cy + lineStartRadius * Math.sin(-midAngle * RADIAN);

        const endX = cx + labelRadius * Math.cos(-midAngle * RADIAN);
        const endY = cy + labelRadius * Math.sin(-midAngle * RADIAN);

        const textAnchor = Math.cos(-midAngle * RADIAN) > 0 ? 'start' : 'end';

        return (
            <g>
                <path d={`M${startX},${startY}L${endX},${endY}`} stroke="#6b7280" fill="none" strokeWidth={1}/>
                <circle cx={startX} cy={startY} r={2} fill="#6b7280" />
                <text x={endX + (textAnchor === 'start' ? 3 : -3)} y={endY} fill="#374151" textAnchor={textAnchor} dominantBaseline="central" fontSize={11} fontWeight="bold">
                    {`${(percent * 100).toFixed(0)}%`}
                </text>
            </g>
        );
    }
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
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

export const PerformancePage: React.FC<PerformancePageProps> = ({ todaysTaskData, userRole, userName, userEmail }) => {

    const [selectedSc, setSelectedSc] = useState<string>('');
    const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>(getLastWeek());
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'actual', direction: 'desc'});
    const [currentPage, setCurrentPage] = useState(1);
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        leadId: 140, personName: 190, mobile: 150, stepCode: 140, planned: 210,
        actual: 210, status: 150, remark: 350, doer: 130
    });
    
    const [reportModalState, setReportModalState] = useState<{
        isOpen: boolean;
        title: string;
        data: TodaysTaskData[];
    }>({ isOpen: false, title: '', data: [] });

    const isAdmin = useMemo(() => userRole === 'Admin' || userEmail === DEVELOPER_EMAIL, [userRole, userEmail]);

    const doerOptions = useMemo(() => {
        const doers = new Set<string>();
        todaysTaskData.forEach(task => {
            if (task.doer) doers.add(task.doer);
        });
        return Array.from(doers).sort().map(d => ({ value: d, label: d }));
    }, [todaysTaskData]);

    const handleResetFilters = () => {
        if (isAdmin) setSelectedSc('');
        setDateRange(getLastWeek());
    };

    const filteredData = useMemo(() => {
        return todaysTaskData.filter(item => {
            const scMatch = isAdmin ? (selectedSc ? item.doer === selectedSc : true) : (item.doer === userName);
            
            const dateMatch = (() => {
                if (!dateRange.start || !dateRange.end) return true;
                if (!item.lastActual || !item.lastActual.trim()) return false;
                
                const itemDate = parseDateString(item.lastActual);
                if (!itemDate) return false;

                itemDate.setHours(0, 0, 0, 0);
                const startDate = new Date(dateRange.start);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(dateRange.end);
                endDate.setHours(23, 59, 59, 999);

                return itemDate >= startDate && itemDate <= endDate;
            })();

            return scMatch && dateMatch;
        });
    }, [todaysTaskData, isAdmin, selectedSc, userName, dateRange]);
    
    const handleOpenWeeklyReport = (metric: PerformanceMetric) => {
        const reportData = filteredData.filter(task => task.stepCode === metric.stepCode);

        setReportModalState({
            isOpen: true,
            title: `${metric.name} Report`,
            data: reportData,
        });
    };
    
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredData]);

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
    
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
        const endIndex = startIndex + ROWS_PER_PAGE;
        return sortedData.slice(startIndex, endIndex);
    }, [sortedData, currentPage]);
    
    const totalPages = Math.ceil(sortedData.length / ROWS_PER_PAGE);

    const requestSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const scChartData = useMemo(() => {
        if (!isAdmin) return [];
        const counts = filteredData.reduce((acc, task) => {
            const doer = task.doer || 'Unassigned';
            acc[doer] = (acc[doer] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [filteredData, isAdmin]);

    const stepCodeChartData = useMemo(() => {
        const counts = filteredData.reduce((acc, task) => {
            const step = task.stepCode || 'N/A';
            acc[step] = (acc[step] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [filteredData]);

    const tableHeaders: { key: SortKey; label: string }[] = [
        { key: 'leadId', label: 'Lead Id' }, { key: 'personName', label: 'Person Name' },
        { key: 'mobile', label: 'Mobile' }, { key: 'stepCode', label: 'Step Code' },
        { key: 'planned', label: 'Planned' }, { key: 'actual', label: 'Actual' },
        { key: 'status', label: 'Status' }, { key: 'remark', label: 'Remark' }, 
        { key: 'doer', label: 'Doer' },
    ];

    const filterButtonTheme = "w-full h-full flex items-center justify-between bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-teal-500 transition-all";
    const initialLoadTransition = { type: "spring" as const, stiffness: 300, damping: 20 };

    return (
        <div>
            <ReportModal
                isOpen={reportModalState.isOpen}
                onClose={() => setReportModalState(prev => ({ ...prev, isOpen: false }))}
                title={reportModalState.title}
                data={reportModalState.data}
                userRole={userRole}
                showCharts={false}
            />
            <div className="mb-6 p-4 bg-white rounded-lg shadow-md border border-gray-200">
                <div className={`grid grid-cols-1 gap-4 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                     {isAdmin && (
                        <SearchableSelect
                            options={doerOptions}
                            value={selectedSc}
                            onChange={setSelectedSc}
                            placeholder="All SCs"
                            buttonClassName={filterButtonTheme}
                        />
                    )}
                    <DateRangePicker 
                      value={dateRange}
                      onApply={setDateRange}
                      buttonClassName={filterButtonTheme}
                    />
                    <button
                        onClick={handleResetFilters}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-gray-700 transition-all flex items-center justify-center gap-2"
                        aria-label="Reset Filters"
                    >
                        <FilterXIcon className="h-5 w-5" />
                        <span>Reset Filters</span>
                    </button>
                </div>
            </div>
            
            <div className="mb-8">
                <WeeklyPerformance data={filteredData} onOpenReport={handleOpenWeeklyReport} dateRange={dateRange} />
            </div>

            <div className={`grid grid-cols-1 gap-8 mb-8 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
                {isAdmin && (
                    <>
                        <motion.div
                            className="bg-white rounded-xl p-4 h-[420px] border-2 border-emerald-500"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...initialLoadTransition, delay: 0.1 }}
                            whileHover={{
                                scale: 1.05,
                                boxShadow: "0 0 20px rgba(16, 185, 129, 0.6)",
                                transition: { type: "tween" as const, duration: 0.2 }
                            }}
                        >
                            <h3 className="text-md font-semibold text-gray-700 mb-2 text-center">SC Performance %</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={scChartData}
                                        cx="50%"
                                        cy="50%"
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius="55%"
                                        outerRadius="85%"
                                        fill="#8884d8"
                                        paddingAngle={2}
                                        labelLine={false}
                                        label={renderCustomizedLabel}
                                    >
                                        {scChartData.map((entry, index) => (
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
                        </motion.div>

                        <motion.div
                            className="bg-white rounded-xl p-4 h-[420px] border-2 border-brand-primary"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...initialLoadTransition, delay: 0.2 }}
                            whileHover={{
                                scale: 1.05,
                                boxShadow: "0 0 20px rgba(79, 70, 229, 0.6)",
                                transition: { type: "tween" as const, duration: 0.2 }
                            }}
                        >
                            <h4 className="text-md font-semibold text-gray-700 mb-2 text-center">SC wise Performance</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={scChartData} layout="vertical" margin={{ top: 5, right: 50, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" stroke="#9ca3af" domain={[0, 'dataMax + 2']} allowDecimals={false} tick={{fill: '#6b7280', fontSize: 12}} />
                                    <YAxis dataKey="name" type="category" stroke="#9ca3af" width={60} interval={0} tick={{ fontSize: 12, fill: '#374151', fontWeight: 'bold' }} />
                                    <Tooltip
                                        cursor={false}
                                        contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#374151' }}
                                        labelStyle={{color: '#6b7280'}}
                                    />
                                    <Bar dataKey="value" name="Tasks" shape={<ThreeDHorizontalBar />}>
                                        <LabelList dataKey="value" position="right" style={{ fill: '#4b5563', fontSize: 12, fontWeight: 'bold' }} offset={15} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>
                    </>
                )}
                 <motion.div
                    className="bg-white rounded-xl p-4 h-[420px] border-2 border-orange-500"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...initialLoadTransition, delay: isAdmin ? 0.3 : 0.1 }}
                    whileHover={{
                        scale: 1.05,
                        boxShadow: "0 0 20px rgba(249, 115, 22, 0.6)",
                        transition: { type: "tween" as const, duration: 0.2 }
                    }}
                >
                    <h3 className="text-md font-semibold text-gray-700 mb-2 text-center">Step wise Performance</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stepCodeChartData} margin={{ top: 40, right: 20, left: 5, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                stroke="#9ca3af" 
                                interval={0} 
                                angle={-45} 
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
                            <Bar dataKey="value" name="Records" shape={<ThreeDVerticalBar />}>
                                <LabelList dataKey="value" position="top" style={{ fill: '#4b5563', fontSize: 12, fontWeight: 'bold' }} offset={15} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>


            <motion.div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                 <div className="overflow-auto max-h-[65vh]">
                     <table className="w-full text-sm text-left text-gray-800" style={{ tableLayout: 'fixed' }}>
                        <colgroup>
                            {tableHeaders.map(header => <col key={header.key} style={{ width: `${columnWidths[header.key as keyof typeof columnWidths] || 100}px` }} />)}
                        </colgroup>
                        <thead className="text-xs text-white uppercase bg-teal-600 sticky top-0 z-10">
                            <tr>
                                {tableHeaders.map((header) => (
                                    <th key={header.key} scope="col" className="px-6 py-4 relative group select-none">
                                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort(header.key)}>
                                            {header.label}
                                            <ArrowUpDownIcon className="h-4 w-4"/>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                         <tbody>
                            {paginatedData.length > 0 ? paginatedData.map((item, index) => (
                                <tr key={item.leadId + '-' + index} className="bg-white border-b hover:bg-teal-50 group transition-all duration-200 ease-in-out hover:scale-[1.01] hover:shadow-lg hover:relative hover:z-10">
                                    {tableHeaders.map(header => (
                                        <td key={header.key} className="px-6 py-4 align-top">
                                            {(() => {
                                                const cellValue = item[header.key];
                                                if (COLUMNS_WITH_ASTERISKS.includes(header.key) && typeof cellValue === 'string') {
                                                    const processedValue = cellValue.replace(/\s*\*\s*/g, '\n').trim();
                                                    return <div title={processedValue} className="whitespace-pre-line">{processedValue || '-'}</div>;
                                                }
                                                return <div title={String(cellValue ?? '')} className="whitespace-nowrap overflow-hidden text-ellipsis">{cellValue ?? '-'}</div>;
                                            })()}
                                        </td>
                                    ))}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={tableHeaders.length} className="text-center py-16 text-gray-500">
                                        No performance records found for the selected filters.
                                    </td>
                                </tr>
                            )}
                         </tbody>
                     </table>
                 </div>
                 {sortedData.length > 0 && (
                     <div className="flex justify-between items-center p-4 bg-white border-t">
                        <span className="text-sm text-gray-700">
                            Showing <span className="font-semibold">{Math.min((currentPage - 1) * ROWS_PER_PAGE + 1, sortedData.length)}</span> to <span className="font-semibold">{Math.min(currentPage * ROWS_PER_PAGE, sortedData.length)}</span> of <span className="font-semibold">{sortedData.length}</span> results
                        </span>
                         {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="flex items-center justify-center h-9 w-9 rounded-md bg-teal-600 text-white shadow-sm transition-colors duration-200 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                    aria-label="Go to first page"
                                >
                                    <span className="sr-only">First</span>
                                    <ChevronsLeftIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="flex items-center justify-center h-9 w-9 rounded-md bg-teal-600 text-white shadow-sm transition-colors duration-200 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                    aria-label="Go to previous page"
                                >
                                    <span className="sr-only">Previous</span>
                                    <ChevronLeftIcon className="h-4 w-4" />
                                </button>
                                
                                <span className="text-sm font-semibold text-gray-700 tabular-nums px-2">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center justify-center h-9 w-9 rounded-md bg-teal-600 text-white shadow-sm transition-colors duration-200 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                    aria-label="Go to next page"
                                >
                                    <span className="sr-only">Next</span>
                                    <ChevronRightIcon className="h-4 w-4" />
                                </button>
                                 <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center justify-center h-9 w-9 rounded-md bg-teal-600 text-white shadow-sm transition-colors duration-200 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                    aria-label="Go to last page"
                                >
                                    <span className="sr-only">Last</span>
                                    <ChevronsRightIcon className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                 )}
            </motion.div>
            <motion.footer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 py-4 text-sm text-gray-600 flex justify-between items-center border-t border-gray-200"
            >
              <span className="font-semibold">Developed by:- Dharmender</span>
              <span className="font-medium">&copy;2025 Sales Dashboard. All rights reserved.</span>
            </motion.footer>
        </div>
    );
};

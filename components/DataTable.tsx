

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { FollowUpData, ClickInfo } from '../types';
import { ArrowUpDownIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from './icons';

interface DataTableProps {
  data: FollowUpData[];
  onOpenFormModal: (url: string, leadId: string) => void;
  clickedLeadInfo: Map<string, ClickInfo>;
}

type SortKey = keyof FollowUpData;
type SortDirection = 'asc' | 'desc';

const ROWS_PER_PAGE = 100;
const COLUMNS_WITH_ASTERISKS = ['planned', 'actual', 'lastStatus', 'remark'];
const FROZEN_COLUMNS = ['leadId', 'personName', 'mobile'];

// This is the single source of truth for default column widths.
const getColumnWidths = (): Record<string, number> => ({
    leadId: 140,
    personName: 190,
    mobile: 200,
    state: 130,
    requirement: 220,
    salesPerson: 180,
    stepName: 200,
    stepCode: 140,
    daysOfFollowUp: 150,
    numberOfFollowUps: 150,
    planned: 210,
    actual: 210,
    lastStatus: 150,
    remark: 350,
    link: 180,
    doer: 130,
});


export const DataTable: React.FC<DataTableProps> = ({ data, onOpenFormModal, clickedLeadInfo }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'daysOfFollowUp', direction: 'desc'});
    const [currentPage, setCurrentPage] = useState(1);
    
    // State for managing column widths.
    // It initializes from sessionStorage to persist widths through reloads,
    // and falls back to defaults if no saved widths are found.
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
        try {
            const savedWidths = sessionStorage.getItem('datatable-column-widths');
            return savedWidths ? JSON.parse(savedWidths) : getColumnWidths();
        } catch (error) {
            console.error("Could not parse saved column widths:", error);
            return getColumnWidths();
        }
    });

    const resizingColumnRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

    // Save column widths to sessionStorage whenever they change.
    useEffect(() => {
        sessionStorage.setItem('datatable-column-widths', JSON.stringify(columnWidths));
    }, [columnWidths]);


    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!resizingColumnRef.current) return;

        const { key, startX, startWidth } = resizingColumnRef.current;
        const newWidth = startWidth + (e.clientX - startX);
        
        // Enforce a minimum width of 60px
        if (newWidth > 60) {
            setColumnWidths(prev => ({
                ...prev,
                [key]: newWidth,
            }));
        }
    }, []);
    
    const handleMouseUp = useCallback(() => {
        resizingColumnRef.current = null;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, key: string) => {
        e.preventDefault();
        resizingColumnRef.current = {
            key,
            startX: e.clientX,
            startWidth: columnWidths[key] || 100,
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const headers: { key: SortKey; label: string }[] = [
        { key: 'leadId', label: 'Lead Id' },
        { key: 'personName', label: 'Person Name' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'state', label: 'State' },
        { key: 'requirement', label: 'Requirement' },
        { key: 'salesPerson', label: 'Sales Person' },
        { key: 'stepName', label: 'Step Name' },
        { key: 'stepCode', label: 'Step Code' },
        { key: 'daysOfFollowUp', label: 'Days of Follow-Up' },
        { key: 'numberOfFollowUps', label: 'Number of Follow-Ups' },
        { key: 'planned', label: 'Planned' },
        { key: 'actual', label: 'Actual' },
        { key: 'lastStatus', label: 'Status' },
        { key: 'remark', label: 'Remark' },
        { key: 'link', label: 'Link' },
        { key: 'doer', label: 'Doer' },
    ];

    const stickyColumnOffsets = useMemo(() => {
        const offsets: { [key: string]: number } = {};
        let currentLeft = 0;
        for (const header of headers) {
            if (FROZEN_COLUMNS.includes(header.key)) {
                offsets[header.key] = currentLeft;
                currentLeft += columnWidths[header.key] || 0;
            }
        }
        return offsets;
    }, [columnWidths]);

    useEffect(() => {
        setCurrentPage(1);
    }, [data]);

    const sortedData = useMemo(() => {
        let sortableItems = [...data];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                
                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;

                if (aVal < bVal) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aVal > bVal) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig]);

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

    return (
        <div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
            <div className="overflow-auto max-h-[65vh]">
                <table className="w-full text-sm text-left text-gray-800" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                        {headers.map(header => (
                            <col key={header.key} style={{ width: `${columnWidths[header.key] || 100}px` }} />
                        ))}
                    </colgroup>
                    <thead className="text-xs text-white uppercase bg-brand-primary sticky top-0 z-20">
                        <tr>
                            {headers.map((header) => {
                                const isFrozen = FROZEN_COLUMNS.includes(header.key);
                                const style: React.CSSProperties = isFrozen ? {
                                    position: 'sticky',
                                    left: stickyColumnOffsets[header.key],
                                    zIndex: 30,
                                } : {};

                                return (
                                    <th key={header.key} scope="col" className={`px-6 py-4 relative group select-none ${isFrozen ? 'bg-brand-primary' : ''}`} style={style}>
                                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort(header.key)}>
                                        {header.label}
                                        <ArrowUpDownIcon className="h-4 w-4"/>
                                        </div>
                                        <div
                                            onMouseDown={(e) => handleMouseDown(e, header.key)}
                                            className="absolute top-0 right-0 h-full w-2 cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-brand-secondary transition-opacity"
                                            aria-hidden="true"
                                        />
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((item, index) => (
                            <tr key={item.leadId + '-' + index} className="bg-white border-b hover:bg-brand-light group transition-all duration-200 ease-in-out hover:scale-[1.01] hover:shadow-lg hover:relative hover:z-10">
                                {headers.map(header => {
                                    const isFrozen = FROZEN_COLUMNS.includes(header.key);
                                    const style: React.CSSProperties = isFrozen ? {
                                        position: 'sticky',
                                        left: stickyColumnOffsets[header.key],
                                        zIndex: 10,
                                    } : {};

                                    return (
                                        <td key={header.key} className={`px-6 py-4 align-top ${isFrozen ? 'bg-white group-hover:bg-brand-light' : ''}`} style={style}>
                                            {header.key === 'link' ? (
                                                 item.link ? (
                                                    (() => {
                                                        const clickInfo = clickedLeadInfo.get(item.leadId);
                                                        const isClicked = !!clickInfo;
                                                        const timestamp = isClicked ? new Date(clickInfo.timestamp).toLocaleString(undefined, {
                                                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
                                                        }) : null;

                                                        return (
                                                            <div className="flex flex-col items-start">
                                                                <button
                                                                    onClick={() => onOpenFormModal(item.link, item.leadId)}
                                                                    className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-full transition-colors duration-200 text-sm ${
                                                                        isClicked
                                                                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' // Clicked state
                                                                            : 'bg-blue-100 text-brand-primary hover:bg-blue-200' // Default state
                                                                    }`}
                                                                    aria-label={`Mark done for lead ${item.leadId}`}
                                                                >
                                                                    <span>{isClicked ? 'Submitted' : 'Mark Done'}</span>
                                                                    <CheckCircleIcon className="h-4 w-4" />
                                                                </button>
                                                                {isClicked && (
                                                                    <span className="text-xs text-gray-500 mt-1.5 ml-1" title={new Date(clickInfo.timestamp).toLocaleString()}>
                                                                        {timestamp}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })()
                                                ) : (
                                                    '-'
                                                )
                                            ) : (() => {
                                                const cellValue = item[header.key];
                                                if (COLUMNS_WITH_ASTERISKS.includes(header.key) && typeof cellValue === 'string') {
                                                    const processedValue = cellValue.replace(/\s*\*\s*/g, '\n').trim();
                                                    return (
                                                        <div title={processedValue} className="whitespace-pre-line">
                                                            {processedValue || '-'}
                                                        </div>
                                                    );
                                                }
                    
                                                return (
                                                    <div
                                                        title={String(cellValue ?? '')}
                                                        className="whitespace-nowrap overflow-hidden text-ellipsis"
                                                    >
                                                        {cellValue ?? '-'}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                         {paginatedData.length === 0 && (
                            <tr>
                                <td colSpan={headers.length} className="text-center py-8 text-gray-500">
                                    No records found for the selected filters.
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
                                className="flex items-center justify-center h-9 w-9 rounded-md bg-brand-primary text-white shadow-sm transition-colors duration-200 hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark disabled:opacity-60 disabled:cursor-not-allowed"
                                aria-label="Go to first page"
                            >
                                <span className="sr-only">First</span>
                                <ChevronsLeftIcon className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="flex items-center justify-center h-9 w-9 rounded-md bg-brand-primary text-white shadow-sm transition-colors duration-200 hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark disabled:opacity-60 disabled:cursor-not-allowed"
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
                                className="flex items-center justify-center h-9 w-9 rounded-md bg-brand-primary text-white shadow-sm transition-colors duration-200 hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark disabled:opacity-60 disabled:cursor-not-allowed"
                                aria-label="Go to next page"
                            >
                                <span className="sr-only">Next</span>
                                <ChevronRightIcon className="h-4 w-4" />
                            </button>
                             <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="flex items-center justify-center h-9 w-9 rounded-md bg-brand-primary text-white shadow-sm transition-colors duration-200 hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark disabled:opacity-60 disabled:cursor-not-allowed"
                                aria-label="Go to last page"
                            >
                                <span className="sr-only">Last</span>
                                <ChevronsRightIcon className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
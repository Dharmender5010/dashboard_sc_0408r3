import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const isSameDay = (a: Date | null, b: Date | null) => {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

const formatDate = (date: Date) => `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

interface DateRangePickerProps {
    value: { start: Date | null, end: Date | null };
    onApply: (range: { start: Date | null, end: Date | null }) => void;
    buttonClassName?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onApply, buttonClassName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isPresetOpen, setIsPresetOpen] = useState(false);
    
    const [tempStart, setTempStart] = useState<Date | null>(value.start);
    const [tempEnd, setTempEnd] = useState<Date | null>(value.end);

    const initialViewDate = value.start || new Date();
    const [viewDateLeft, setViewDateLeft] = useState(new Date(initialViewDate.getFullYear(), initialViewDate.getMonth(), 1));

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsPresetOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTempStart(value.start);
            setTempEnd(value.end);
        }
    }, [value.start, value.end, isOpen]);

    const viewDateRight = useMemo(() => new Date(viewDateLeft.getFullYear(), viewDateLeft.getMonth() + 1, 1), [viewDateLeft]);
    
    const handlePrevMonth = () => setViewDateLeft(new Date(viewDateLeft.getFullYear(), viewDateLeft.getMonth() - 1, 1));
    const handleNextMonth = () => setViewDateLeft(new Date(viewDateLeft.getFullYear(), viewDateLeft.getMonth() + 1, 1));

    const handleDateClick = (day: Date) => {
        if (!tempStart || (tempStart && tempEnd)) {
            setTempStart(day);
            setTempEnd(null);
        } else if (tempStart && !tempEnd) {
            if (day < tempStart) {
                setTempEnd(tempStart);
                setTempStart(day);
            } else {
                setTempEnd(day);
            }
        }
    };

    const handleApply = () => {
        onApply({ start: tempStart, end: tempEnd });
        setIsOpen(false);
    };

    const handleCancel = () => {
        setIsOpen(false);
    };
    
    const handlePresetSelect = (preset: string) => {
        const today = new Date();
        let start = new Date();
        let end = new Date();
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);

        switch(preset) {
            case 'Today':
                break;
            case 'Yesterday':
                start.setDate(today.getDate() - 1);
                end.setDate(today.getDate() - 1);
                break;
            case 'This week':
                const firstDayOfWeek = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1);
                start.setDate(firstDayOfWeek);
                end.setDate(firstDayOfWeek + 6);
                break;
            case 'This month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'This year':
                start = new Date(today.getFullYear(), 0, 1);
                end = new Date(today.getFullYear(), 11, 31);
                break;
        }
        onApply({ start, end });
        setIsOpen(false);
        setIsPresetOpen(false);
    };
    
    const renderCalendar = (date: Date, type: 'start' | 'end') => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Adjust first day to be Monday-indexed (0=Mon, 6=Sun)
        const dayOfWeekOffset = (firstDay === 0) ? 6 : firstDay - 1;

        const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
        const blanks = Array.from({ length: dayOfWeekOffset }, () => null);
        const cells = [...blanks, ...days];

        return (
            <div className="p-2">
                <div className="flex justify-between items-center mb-2">
                    <button 
                        onClick={handlePrevMonth} 
                        className={`p-1 rounded-full hover:bg-gray-200 ${type === 'start' ? 'visible' : 'invisible'}`} 
                        aria-label="Previous month"
                    >
                        <ChevronLeftIcon className="h-5 w-5"/>
                    </button>
                    <div className="text-center">
                        <p className="font-bold text-gray-800 -mb-1">{type === 'start' ? 'Start date' : 'End date'}</p>
                        <p className="font-semibold text-gray-700">{`${MONTHS[month]} ${year}`}</p>
                    </div>
                    <button 
                        onClick={handleNextMonth} 
                        className={`p-1 rounded-full hover:bg-gray-200 ${type === 'end' ? 'visible' : 'invisible'}`} 
                        aria-label="Next month"
                    >
                        <ChevronRightIcon className="h-5 w-5"/>
                    </button>
                </div>
                <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-1">
                    {DAYS_OF_WEEK.map(d => <span key={d}>{d}</span>)}
                </div>
                <div className="grid grid-cols-7">
                    {cells.map((day, i) => {
                        if (!day) return <div key={`blank-${i}`} />;
                        const isSelected = isSameDay(day, tempStart) || isSameDay(day, tempEnd);
                        const isStart = isSameDay(day, tempStart);
                        const isEnd = isSameDay(day, tempEnd);
                        const inRange = tempStart && tempEnd && day > tempStart && day < tempEnd;
                        
                        return (
                           <button 
                                key={day.toISOString()}
                                onClick={() => handleDateClick(day)}
                                className={`
                                    w-9 h-9 text-sm rounded-full transition-colors duration-150
                                    ${isStart ? 'bg-brand-primary text-white' : ''}
                                    ${isEnd ? 'bg-brand-primary text-white' : ''}
                                    ${isSelected ? '' : 'hover:bg-brand-light'}
                                    ${inRange ? 'bg-indigo-100 text-gray-800 rounded-none' : ''}
                                    ${isStart && tempEnd ? 'rounded-r-none' : ''}
                                    ${isEnd && tempStart ? 'rounded-l-none' : ''}
                                `}
                           >
                               {day.getDate()}
                           </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    const presets = ['Today', 'Yesterday', 'This week', 'This month', 'This year'];
    const defaultButtonClasses = "w-full h-full flex items-center justify-between bg-brand-primary hover:bg-brand-dark text-white font-semibold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-brand-dark transition-all";

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={buttonClassName || defaultButtonClasses}
            >
                <span className="truncate">{value.start && value.end ? `${formatDate(value.start)} - ${formatDate(value.end)}` : 'Select Date Range'}</span>
                <ChevronDownIcon className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-20 top-full mt-2 w-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 p-4 transform -translate-x-1/4">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-x-8">
                            <div>
                                <p className="font-semibold text-gray-800">Start date</p>
                                <p className="text-brand-primary h-6">{tempStart ? formatDate(tempStart) : 'Select a date'}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">End date</p>
                                <p className="text-brand-primary h-6">{tempEnd ? formatDate(tempEnd) : 'Select a date'}</p>
                            </div>
                        </div>
                        <div className="relative">
                             <button onClick={() => setIsPresetOpen(!isPresetOpen)} className="flex items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-dark border border-brand-primary rounded-md px-3 py-1 hover:bg-brand-light transition-colors">
                                 Auto date range <ChevronDownIcon className="h-4 w-4"/>
                             </button>
                             {isPresetOpen && (
                                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border">
                                    {presets.map(p => (
                                        <button key={p} onClick={() => handlePresetSelect(p)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-brand-light">{p}</button>
                                    ))}
                                </div>
                             )}
                        </div>
                    </div>
                     <hr className="my-3"/>
                    <div className="flex">
                        <div className="w-1/2 pr-2 border-r">{renderCalendar(viewDateLeft, 'start')}</div>
                        <div className="w-1/2 pl-2">{renderCalendar(viewDateRight, 'end')}</div>
                    </div>
                    <hr className="my-3"/>
                    <div className="flex justify-end gap-3">
                        <button onClick={handleCancel} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
                        <button onClick={handleApply} className="px-4 py-2 text-sm font-bold text-white bg-brand-primary hover:bg-brand-dark rounded-lg">Apply</button>
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { useState, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FollowUpData, PerformanceData, HelpTicket, ClickInfo, TodaysTaskData } from '../types';
import { Header } from './Header';
import { BarChartComponent } from './BarChartComponent';
import { LineChartComponent } from './LineChartComponent';
import { DataTable } from './DataTable';
import { FilterXIcon, SearchIcon } from './icons';
import { SearchableSelect } from './SearchableSelect';
import { DateRangePicker } from './DateRangePicker';
import { PerformanceCards } from './PerformanceCards';
import { AnimatedBackground } from './AnimatedBackground';
import { HelpModal } from './HelpModal';
import { NotificationsPanel } from './NotificationsPanel';
import { FormModal } from './FormModal';
import { ReportModal } from './ReportModal';
import { FloatingNav } from './FloatingNav';
import { HelpImageButton } from './HelpImageButton';
import { PerformancePage } from './PerformancePage';
import { AIAssistantButton } from './AIAssistantButton';

interface DashboardPageProps {
  userEmail: string;
  userName: string;
  userRole: 'Admin' | 'User';
  scUserEmails: string[];
  data: FollowUpData[];
  performanceData: PerformanceData[];
  todaysTaskData: TodaysTaskData[];
  helpTickets: HelpTicket[];
  onUpdateTicket: (ticketId: string, status: string) => Promise<void>;
  onLogout: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  onStartTour: () => void;
  maintenanceStatus: 'ON' | 'OFF';
  onUpdateMaintenanceStatus: (newStatus: 'ON' | 'OFF') => Promise<void>;
  isMaintenanceToggling: boolean;
  countdown: number;
}

const monthOrder: { [key: string]: number } = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
};

const parseDateString = (dateStr: string): Date | null => {
    const parts = dateStr.split('-');
    if (parts.length === 2) {
        const day = parseInt(parts[0], 10);
        const month = monthOrder[parts[1]];
        if (!isNaN(day) && month !== undefined) {
            const currentYear = new Date().getFullYear();
            const today = new Date();
            if (today.getMonth() < 3 && month > 8) {
                 return new Date(currentYear - 1, month, day);
            }
            return new Date(currentYear, month, day);
        }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    
    return null;
};

const pageContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
        },
    },
};

const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring' as const, stiffness: 100 }
    },
};

// Define props for the new extracted component
interface DashboardViewProps {
  userRole: 'Admin' | 'User';
  userEmail: string;
  selectedScEmail: string;
  onSelectedScEmailChange: (email: string) => void;
  scUserEmails: string[];
  performanceData: PerformanceData[];
  maintenanceStatus: 'ON' | 'OFF';
  countdown: number;
  onCardClick: (category: string) => void;
  filters: { stepCode: string; mobile: string; leadId: string; };
  onFilterChange: (filterName: 'stepCode' | 'mobile' | 'leadId', value: string) => void;
  uniqueOptions: { stepCodes: string[]; mobiles: string[]; leadIds: string[]; };
  dateRange: { start: Date | null, end: Date | null };
  onDateRangeApply: (range: { start: Date | null, end: Date | null }) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onResetFilters: () => void;
  dateWiseData: { name: string, value: number }[];
  stepCodeData: { name: string, value: number }[];
  filteredData: FollowUpData[];
  onOpenFormModal: (url: string, leadId: string) => void;
  clickedLeadInfo: Map<string, ClickInfo>;
}

// Extracted DashboardView component to prevent re-animation on prop changes
const DashboardView: React.FC<DashboardViewProps> = ({
  userRole,
  userEmail,
  selectedScEmail,
  onSelectedScEmailChange,
  scUserEmails,
  performanceData,
  maintenanceStatus,
  countdown,
  onCardClick,
  filters,
  onFilterChange,
  uniqueOptions,
  dateRange,
  onDateRangeApply,
  searchTerm,
  onSearchTermChange,
  onResetFilters,
  dateWiseData,
  stepCodeData,
  filteredData,
  onOpenFormModal,
  clickedLeadInfo
}) => {
    return (
        <motion.div
            variants={pageContainerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants} id="performance-cards-container">
                <PerformanceCards
                    userRole={userRole}
                    userEmail={userEmail}
                    selectedScEmail={selectedScEmail}
                    performanceData={performanceData}
                    maintenanceStatus={maintenanceStatus}
                    countdown={countdown}
                    onCardClick={onCardClick}
                />
            </motion.div>
            
            <motion.div className="mb-8" variants={itemVariants} id="filters-container">
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${userRole === 'Admin' ? 'lg:grid-cols-3 xl:grid-cols-5' : 'lg:grid-cols-2 xl:grid-cols-4'}`}>
                    {userRole === 'Admin' && (
                        <div id="admin-sc-filter-container">
                          <SearchableSelect
                              value={selectedScEmail}
                              onChange={onSelectedScEmailChange}
                              options={scUserEmails.map(email => ({ value: email, label: email }))}
                              placeholder="SC Email"
                          />
                        </div>
                    )}
                    <div id="lead-id-filter-container">
                      <SearchableSelect
                          value={filters.leadId}
                          onChange={(val) => onFilterChange('leadId', val)}
                          options={uniqueOptions.leadIds.map(id => ({ value: id, label: id }))}
                          placeholder="Lead ID"
                      />
                    </div>
                    <div id="step-code-filter-container">
                      <SearchableSelect
                          value={filters.stepCode}
                          onChange={(val) => onFilterChange('stepCode', val)}
                          options={uniqueOptions.stepCodes.map(code => ({ value: code, label: code }))}
                          placeholder="Step Code"
                      />
                    </div>
                     <div id="date-range-filter-container">
                      <DateRangePicker 
                        value={dateRange}
                        onApply={onDateRangeApply}
                      />
                    </div>
                    <div id="mobile-filter-container">
                       <SearchableSelect
                          value={filters.mobile}
                          onChange={(val) => onFilterChange('mobile', val)}
                          options={uniqueOptions.mobiles.map(mobile => ({ value: mobile, label: mobile }))}
                          placeholder="Mobile Number"
                      />
                    </div>
                </div>
                <div className="flex justify-between items-center mt-6 gap-6">
                    <div className="relative flex-grow group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400 transition-colors duration-300 group-focus-within:text-brand-primary" />
                        </div>
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => onSearchTermChange(e.target.value)}
                            placeholder="Search by Lead ID, Step Code, Mobile, Sales Person, or Status..."
                            className="block w-full pl-12 pr-4 py-3.5 bg-white border-2 border-brand-primary text-gray-900 rounded-lg shadow-sm focus:outline-none focus:border-brand-secondary focus:shadow-[0_0_20px_rgba(79,70,229,0.7)] placeholder:text-gray-500 transition-all duration-300 sm:text-sm"
                            id="global-search-input"
                            autoComplete="off"
                        />
                    </div>
                    <button
                        onClick={onResetFilters}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3.5 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-gray-700 transition-all flex items-center justify-center gap-2"
                        aria-label="Reset Filters"
                        id="reset-filters-button"
                    >
                        <FilterXIcon className="h-5 w-5" />
                        <span>Reset Filters</span>
                    </button>
                </div>
            </motion.div>

            <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8" variants={pageContainerVariants}>
               <motion.div variants={itemVariants} id="line-chart-container"><LineChartComponent data={dateWiseData} /></motion.div>
               <motion.div variants={itemVariants} id="bar-chart-container"><BarChartComponent data={stepCodeData} /></motion.div>
            </motion.div>
            
            <motion.div variants={itemVariants} id="data-table-container">
                <DataTable 
                    data={filteredData} 
                    onOpenFormModal={onOpenFormModal}
                    clickedLeadInfo={clickedLeadInfo}
                />
            </motion.div>

            <motion.footer 
                variants={itemVariants} 
                className="mt-8 py-4 text-sm text-gray-600 flex justify-between items-center border-t border-gray-200"
            >
              <span className="font-semibold">Developed by:- Dharmender</span>
              <span className="font-medium">&copy;2025 Sales Dashboard. All rights reserved.</span>
            </motion.footer>

        </motion.div>
    );
};


export const DashboardPage = forwardRef<any, DashboardPageProps>(({ userEmail, userName, userRole, scUserEmails, data, performanceData, todaysTaskData, helpTickets, onUpdateTicket, onLogout, onRefresh, isRefreshing, lastUpdated, onStartTour, maintenanceStatus, onUpdateMaintenanceStatus, countdown, isMaintenanceToggling }, ref) => {
    const [view, setView] = useState<'dashboard' | 'performance'>('dashboard');
    const [filters, setFilters] = useState({ stepCode: '', mobile: '', leadId: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
    const [selectedScEmail, setSelectedScEmail] = useState<string>('');
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [formModalUrl, setFormModalUrl] = useState<string | null>(null);
    const [reportModalState, setReportModalState] = useState<{
        isOpen: boolean;
        title: string;
        data: TodaysTaskData[];
    }>({ isOpen: false, title: '', data: [] });

    const [clickedLeadInfo, setClickedLeadInfo] = useState<Map<string, ClickInfo>>(() => {
        try {
            const item = sessionStorage.getItem('clickedLeadInfo');
            return item ? new Map(JSON.parse(item)) : new Map();
        } catch {
            return new Map();
        }
    });

    const shapeColor = useMemo(() => {
        if (view === 'performance') {
            // Teal color to match the performance page theme
            return 'rgba(20, 184, 166, 0.15)'; 
        }
        // Return undefined to use the default CSS color for the dashboard
        return undefined;
    }, [view]);
    
    const handleCardClick = (category: string) => {
        if (!['Calls Made', 'Meeting Fixed', 'FollowUps Done'].includes(category)) return;

        let filteredTasks = todaysTaskData.filter(task => task.category === category);

        if (userRole === 'User') {
            filteredTasks = filteredTasks.filter(task => task.scEmail.toLowerCase() === userEmail.toLowerCase());
        } else if (userRole === 'Admin' && selectedScEmail) {
            filteredTasks = filteredTasks.filter(task => task.scEmail.toLowerCase() === selectedScEmail.toLowerCase());
        }

        setReportModalState({
            isOpen: true,
            title: `${category} Report`,
            data: filteredTasks,
        });
    };

    const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const handleResetFilters = () => {
        setFilters({ stepCode: '', mobile: '', leadId: '' });
        setDateRange({ start: null, end: null });
        setSearchTerm('');
        if (userRole === 'Admin') {
            setSelectedScEmail('');
        }
    };
    
    // Expose functions to be called by the parent component (App.tsx)
    useImperativeHandle(ref, () => ({
        changeView(newView: 'dashboard' | 'performance') {
            setView(newView);
        },
        openReportModal(category: string) {
            handleCardClick(category);
        },
        closeReportModal() {
            setReportModalState(prev => ({ ...prev, isOpen: false }));
        },
        applyFilter(filterName: string, value: string) {
            if (Object.keys(filters).includes(filterName)) {
                handleFilterChange(filterName as keyof typeof filters, value);
            } else if (filterName === 'scEmail' && userRole === 'Admin') {
                setSelectedScEmail(value);
            }
        },
        resetFilters() {
            handleResetFilters();
        },
        getCurrentState() {
            return {
                view,
                filters,
                selectedScEmail,
            };
        },
        clickMarkDone(leadId: string) {
            const lead = data.find(item => String(item.leadId).trim() === String(leadId).trim());
            if (lead && lead.link) {
                handleOpenFormModal(lead.link, lead.leadId);
                return `Opening the form for lead ${leadId}.`;
            }
            return `Sorry, I could not find a valid link for lead ID ${leadId}. Please check the ID and try again.`;
        },
        logout() {
            onLogout();
        },
        toggleMaintenance() {
            onUpdateMaintenanceStatus(maintenanceStatus === 'ON' ? 'OFF' : 'ON');
        }
    }));

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const newMap = new Map(clickedLeadInfo);
        let hasChanges = false;

        for (const [leadId, info] of newMap.entries()) {
            if (!info || !info.date || info.date !== today) {
                newMap.delete(leadId);
                hasChanges = true;
            }
        }

        if (hasChanges) {
            setClickedLeadInfo(newMap);
            sessionStorage.setItem('clickedLeadInfo', JSON.stringify(Array.from(newMap.entries())));
        }
    }, [lastUpdated]); 

    const handleDateRangeApply = (range: { start: Date | null, end: Date | null }) => {
        setDateRange(range);
    }
    
    const handleOpenFormModal = (url: string, leadId: string) => {
        if (url.includes('/viewform')) {
            const embedUrl = url.replace('/viewform', '/viewform?embedded=true');
            setFormModalUrl(embedUrl);
        } else {
            setFormModalUrl(url);
        }
        setClickedLeadInfo(prev => {
            const today = new Date().toISOString().split('T')[0];
            const newMap = new Map(prev);
            newMap.set(leadId, { timestamp: Date.now(), date: today });
            sessionStorage.setItem('clickedLeadInfo', JSON.stringify(Array.from(newMap.entries())));
            return newMap;
        });
    };

    const handleCloseFormModal = () => {
        setFormModalUrl(null);
        onRefresh();
    };


    const baseData = useMemo(() => {
        if (userRole === 'Admin') {
            if (selectedScEmail) {
                return data.filter(item => item.scEmail === selectedScEmail);
            }
            return data;
        }
        return data.filter(item => item.scEmail.toLowerCase() === userEmail.toLowerCase());
    }, [data, userRole, userEmail, selectedScEmail]);

    const uniqueOptions = useMemo(() => {
        const stepCodes = new Set<string>();
        const mobiles = new Set<string>();
        const leadIds = new Set<string>();
        baseData.forEach(item => {
            if(item.stepCode) stepCodes.add(item.stepCode);
            if(item.mobile) mobiles.add(String(item.mobile));
            if(item.leadId) leadIds.add(item.leadId);
        });
        return {
            stepCodes: Array.from(stepCodes).sort(),
            mobiles: Array.from(mobiles).sort(),
            leadIds: Array.from(leadIds).sort()
        };
    }, [baseData]);

    const filteredData = useMemo(() => {
        const lowercasedSearchTerm = searchTerm.toLowerCase();

        return baseData.filter(item => {
            const stepCodeMatch = filters.stepCode ? item.stepCode === filters.stepCode : true;
            const mobileMatch = filters.mobile ? String(item.mobile) === filters.mobile : true;
            const leadIdMatch = filters.leadId ? item.leadId === filters.leadId : true;

            const dateMatch = (() => {
                if (!dateRange.start || !dateRange.end) return true;
                if (!item.lastPlannedDcDoor || !item.lastPlannedDcDoor.trim()) return false;
                
                const itemDate = parseDateString(item.lastPlannedDcDoor);
                if (!itemDate) return false;

                itemDate.setHours(0, 0, 0, 0);
                const startDate = new Date(dateRange.start);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(dateRange.end);
                endDate.setHours(23, 59, 59, 999);

                return itemDate >= startDate && itemDate <= endDate;
            })();

            const searchMatch = lowercasedSearchTerm
                ? String(item.leadId).toLowerCase().includes(lowercasedSearchTerm) ||
                  String(item.stepCode).toLowerCase().includes(lowercasedSearchTerm) ||
                  String(item.mobile).toLowerCase().includes(lowercasedSearchTerm) ||
                  String(item.salesPerson).toLowerCase().includes(lowercasedSearchTerm) ||
                  String(item.lastStatus).toLowerCase().includes(lowercasedSearchTerm)
                : true;

            return stepCodeMatch && mobileMatch && leadIdMatch && dateMatch && searchMatch;
        });
    }, [baseData, filters, dateRange, searchTerm]);

    const stepCodeData = useMemo(() => {
        const counts: { [key: string]: number } = {};
        filteredData.forEach(item => {
            if (item.stepCode) {
                counts[item.stepCode] = (counts[item.stepCode] || 0) + 1;
            }
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [filteredData]);

    const dateWiseData = useMemo(() => {
        const counts: { [key: string]: number } = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        filteredData.forEach(item => {
             if (item.lastPlannedDcDoor && item.lastPlannedDcDoor.trim()) {
                const dateObj = parseDateString(item.lastPlannedDcDoor);
                if (dateObj && dateObj <= today) {
                    const dateKey = item.lastPlannedDcDoor.trim();
                    counts[dateKey] = (counts[dateKey] || 0) + 1;
                }
            }
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value, dateObj: parseDateString(name) }))
            .filter(item => item.dateObj !== null)
            .sort((a, b) => a.dateObj!.getTime() - b.dateObj!.getTime())
            .map(({ name, value }) => ({ name, value }));

    }, [filteredData]);

    return (
        <div className="min-h-screen font-sans">
            <AnimatedBackground shapeColor={shapeColor} />
            
            <FloatingNav onStartTour={onStartTour} />
            <HelpImageButton onClick={() => setIsHelpModalOpen(true)} />

            <HelpModal 
                isOpen={isHelpModalOpen} 
                onClose={() => setIsHelpModalOpen(false)}
                userEmail={userEmail}
                userName={userName}
            />
            <FormModal
                isOpen={!!formModalUrl}
                onClose={handleCloseFormModal}
                url={formModalUrl}
            />
            <ReportModal
                isOpen={reportModalState.isOpen}
                onClose={() => setReportModalState(prev => ({ ...prev, isOpen: false, data: [] }))}
                title={reportModalState.title}
                data={reportModalState.data}
                userRole={userRole}
            />
            <NotificationsPanel
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                tickets={helpTickets}
                userEmail={userEmail}
                userName={userName}
                userRole={userRole}
                onUpdateTicket={onUpdateTicket}
            />


            <Header 
                userEmail={userEmail} 
                userName={userName} 
                userRole={userRole} 
                onLogout={onLogout} 
                lastUpdate={lastUpdated ? lastUpdated.toLocaleTimeString() : 'N/A'}
                isRefreshing={isRefreshing}
                helpTickets={helpTickets}
                onToggleNotifications={() => setIsNotificationsOpen(prev => !prev)}
                maintenanceStatus={maintenanceStatus}
                onUpdateMaintenanceStatus={onUpdateMaintenanceStatus}
                isMaintenanceToggling={isMaintenanceToggling}
                currentView={view}
                onViewChange={setView}
            />
            
            <main className="p-4 sm:p-6 lg:p-8 relative z-0">
                 <AnimatePresence mode="wait">
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {view === 'dashboard' ? (
                            <DashboardView
                                userRole={userRole}
                                userEmail={userEmail}
                                selectedScEmail={selectedScEmail}
                                onSelectedScEmailChange={setSelectedScEmail}
                                scUserEmails={scUserEmails}
                                performanceData={performanceData}
                                maintenanceStatus={maintenanceStatus}
                                countdown={countdown}
                                onCardClick={handleCardClick}
                                filters={filters}
                                onFilterChange={handleFilterChange}
                                uniqueOptions={uniqueOptions}
                                dateRange={dateRange}
                                onDateRangeApply={handleDateRangeApply}
                                searchTerm={searchTerm}
                                onSearchTermChange={setSearchTerm}
                                onResetFilters={handleResetFilters}
                                dateWiseData={dateWiseData}
                                stepCodeData={stepCodeData}
                                filteredData={filteredData}
                                onOpenFormModal={handleOpenFormModal}
                                clickedLeadInfo={clickedLeadInfo}
                            />
                        ) : (
                            <div id="performance-page-container">
                                <PerformancePage
                                    todaysTaskData={todaysTaskData}
                                    userRole={userRole}
                                    userName={userName}
                                    userEmail={userEmail}
                                />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
});

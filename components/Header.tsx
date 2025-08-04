
  import React, { useState, useEffect, useMemo, useRef } from 'react';
  import { motion, AnimatePresence } from 'framer-motion';
  import { UserIcon, RefreshCwIcon, LogOutIcon, BellIcon, LayoutGridIcon, TrendingUpIcon, XMarkIcon } from './icons';
  import { HelpTicket } from '../types';
  import { DEVELOPER_EMAIL } from '../services/helpService';
  import { InternetSpeedIndicator } from './InternetSpeedIndicator';

  interface HeaderProps {
    userEmail: string;
    userName: string;
    userRole: 'Admin' | 'User';
    onLogout: () => void;
    lastUpdate: string;
    isRefreshing: boolean;
    helpTickets: HelpTicket[];
    onToggleNotifications: () => void;
    maintenanceStatus: 'ON' | 'OFF';
    onUpdateMaintenanceStatus: (newStatus: 'ON' | 'OFF') => Promise<void>;
    isMaintenanceToggling: boolean;
    currentView: 'dashboard' | 'performance';
    onViewChange: (view: 'dashboard' | 'performance') => void;
  }

  const formatDateTime = (date: Date): string => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = days[date.getDay()];

      const day = date.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();

      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';

      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const strHours = String(hours).padStart(2, '0');

      return `${dayName}, ${day}-${month}-${year} ${strHours}:${minutes}:${seconds} ${ampm}`;
  };

  // Spinner component using pure CSS for robustness in production builds.
  const MaintenanceSpinner: React.FC<{ isToggling: boolean }> = ({ isToggling }) => {
    const dots = Array.from({ length: 8 });
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <g className={isToggling ? 'animate-spin-dots' : ''}>
                {dots.map((_, i) => (
                    <circle
                        key={i}
                        cx="12"
                        cy="5"
                        r="2.5"
                        fill="#374151"
                        transform={`rotate(${i * 45}, 12, 12)`}
                    />
                ))}
            </g>
        </svg>
    );
  };


  export const Header: React.FC<HeaderProps> = ({ userEmail, userName, userRole, onLogout, lastUpdate, helpTickets, onToggleNotifications, maintenanceStatus, onUpdateMaintenanceStatus, isMaintenanceToggling, currentView, onViewChange, isRefreshing }) => {
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [isPageNavOpen, setIsPageNavOpen] = useState(false);
    const pageNavRef = useRef<HTMLDivElement>(null);

    const isDeveloper = userEmail.toLowerCase() === DEVELOPER_EMAIL;

    const navItems = [
      {
        view: 'dashboard' as const,
        label: 'Dashboard',
        icon: <LayoutGridIcon className="h-7 w-7" />,
        colorClass: 'text-brand-primary',
        bgColorClass: 'bg-brand-primary',
        bgColorHex: '#4f46e5',
        borderColorClass: 'border-brand-primary',
        focusRingClass: 'focus:ring-brand-primary',
        shadowClass: 'hover:shadow-[0_0_25px_rgba(79,70,229,0.8)]',
        labelClasses: 'shadow-[0_4px_14px_rgba(79,70,229,0.25)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.4)]'
      },
      {
        view: 'performance' as const,
        label: 'Performance',
        icon: <TrendingUpIcon className="h-7 w-7" />,
        colorClass: 'text-teal-500',
        bgColorClass: 'bg-teal-600',
        bgColorHex: '#0d9488',
        borderColorClass: 'border-teal-500',
        focusRingClass: 'focus:ring-teal-500',
        shadowClass: 'hover:shadow-[0_0_25px_rgba(20,184,166,0.8)]',
        labelClasses: 'shadow-[0_4px_14px_rgba(20,184,166,0.25)] hover:shadow-[0_8px_30px_rgba(20,184,166,0.4)]'
      },
    ];
    
    const currentNavItem = useMemo(() => navItems.find(item => item.view === currentView), [currentView]);
    const dashboardItem = navItems.find(item => item.view === 'dashboard');
    const performanceItem = navItems.find(item => item.view === 'performance');
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pageNavRef.current && !pageNavRef.current.contains(event.target as Node)) {
                setIsPageNavOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [pageNavRef]);


    const handleToggleMaintenance = () => {
      if (isMaintenanceToggling) return;
      const newStatus = maintenanceStatus === 'ON' ? 'OFF' : 'ON';
      onUpdateMaintenanceStatus(newStatus);
    };

    const pendingTicketsCount = useMemo(() => {
      if (!helpTickets) return 0;
      if (userRole === 'User' && !isDeveloper) {
          return helpTickets.filter(t => t.userEmail.toLowerCase() === userEmail.toLowerCase() && t.status === 'Pending').length;
      }
      // For Admin and Dev, show all pending tickets
      return helpTickets.filter(t => t.status === 'Pending').length;
    }, [helpTickets, userEmail, userRole, isDeveloper]);

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentDateTime(new Date());
      }, 1000);
      return () => clearInterval(timer);
    }, []);


    return (
      <header className="bg-white shadow-sm py-2 px-4 sticky top-0 z-30">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src="https://i.ibb.co/TqHt3sGk/visual-data.png" alt="visual-data" className="h-12 w-auto" />
              <div id="header-title">
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">SC-Dashboard</h1>
                <p className="text-sm text-gray-500 tracking-wide">{formatDateTime(currentDateTime)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div id="header-user-info" className="text-right hidden sm:block">
                <p className="font-semibold text-brand-primary text-sm capitalize -mb-1">{userName} ({isDeveloper ? 'Developer' : userRole})</p>
                <div className="flex items-center gap-2 justify-end text-gray-600">
                  <UserIcon className="h-5 w-5"/>
                  <span className="font-medium text-sm">{userEmail}</span>
                </div>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <p className="text-xs text-gray-400">Last Update: {lastUpdate}</p>
                  <InternetSpeedIndicator />
                </div>
              </div>

              <div id="header-notifications-button">
                  <button
                      onClick={onToggleNotifications}
                      className="relative p-2 text-gray-500 hover:text-brand-primary hover:bg-brand-light rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
                      aria-label="View notifications"
                  >
                      <BellIcon className="h-6 w-6" />
                      {pendingTicketsCount > 0 && (
                          <span className="absolute top-0 right-0 block h-5 w-5 text-xs font-bold flex items-center justify-center rounded-full ring-2 ring-white bg-status-danger text-white">
                              {pendingTicketsCount}
                          </span>
                      )}
                  </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <div className="flex items-center justify-end h-4 mb-1 text-xs">
                    <AnimatePresence>
                        {isRefreshing && (
                            <motion.div
                                key="refreshing-indicator"
                                className="flex items-center gap-1.5 text-amber-600 font-semibold mr-2"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <RefreshCwIcon className="h-3 w-3 animate-spin" />
                                <span>Refreshing...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <p className="text-gray-400">Auto refresh in every 1 min.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      id="header-logout-button"
                      onClick={() => onLogout()}
                      className="flex items-center gap-2 bg-status-danger hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <LogOutIcon className="h-4 w-4" />
                      <span>Logout</span>
                    </motion.button>
                  </div>
                </div>

                {isDeveloper && (
                  <div className={`flex flex-col items-center justify-center bg-gray-100 p-2 rounded-lg transition-colors duration-300 ${maintenanceStatus === 'ON' ? 'blinking-border' : 'border-2 border-status-success'}`}>
                    <label
                        htmlFor="maintenance-toggle"
                        className="relative inline-flex items-center cursor-pointer group"
                    >
                        <input
                            type="checkbox"
                            id="maintenance-toggle"
                            className="sr-only"
                            checked={maintenanceStatus === 'ON'}
                            onChange={handleToggleMaintenance}
                            disabled={isMaintenanceToggling}
                            aria-label="Toggle maintenance mode"
                        />
                        <div
                            className={`relative w-16 h-8 flex items-center rounded-full transition-colors duration-300 ${
                            maintenanceStatus === 'ON' ? 'bg-red-500' : 'bg-green-500'
                            }`}
                        >
                            <motion.div
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center"
                                layout
                                transition={{ type: 'spring', stiffness: 700, damping: 30 }}
                                style={{ left: maintenanceStatus === 'ON' ? 'calc(4rem - 1.75rem)' : '0.25rem' }}
                            >
                                <MaintenanceSpinner isToggling={isMaintenanceToggling} />
                            </motion.div>
                            <AnimatePresence>
                                {maintenanceStatus === 'ON' && (
                                    <motion.span
                                        key="on"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute left-2 text-xs font-extrabold text-white"
                                    >
                                        ON
                                    </motion.span>
                                )}
                            </AnimatePresence>
                            <AnimatePresence>
                                {maintenanceStatus === 'OFF' && (
                                    <motion.span
                                        key="off"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute right-2 text-xs font-extrabold text-white"
                                    >
                                        OFF
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-max bg-gray-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            Mode: {maintenanceStatus}
                        </span>
                    </label>
                    <span className="text-xs font-semibold text-gray-600 mt-1">Maintenance</span>
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Centered Navigation Control */}
        <div ref={pageNavRef} className="relative h-0" id="page-navigation-container">
            <AnimatePresence>
                {isPageNavOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsPageNavOpen(false)}
                    />
                )}
            </AnimatePresence>

            <div 
              className="absolute -bottom-14 left-1/2 -translate-x-1/2 z-40" 
              role="navigation" 
              aria-label="Page Navigation"
              style={{ pointerEvents: isPageNavOpen ? 'auto' : 'none' }}
            >
                <div className="relative w-full h-full flex items-center justify-center">
                    <AnimatePresence>
                        {isPageNavOpen && (
                            <>
                                {dashboardItem && (
                                    <motion.div
                                        className="absolute"
                                        initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                                        animate={{ opacity: 1, scale: 1, x: -95, y: 70 }}
                                        exit={{ opacity: 0, scale: 0.5, x: 0, y: 0, transition: { duration: 0.2 } }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                        role="menuitem"
                                    >
                                        <motion.button
                                            onClick={() => { onViewChange(dashboardItem.view); setIsPageNavOpen(false); }}
                                            className={`flex flex-col items-center justify-center gap-2 w-28 h-28 rounded-full transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-brand-primary ${dashboardItem.shadowClass} ${
                                                currentView === dashboardItem.view
                                                    ? 'bg-brand-primary text-white font-bold shadow-2xl scale-105'
                                                    : 'bg-white/90 text-gray-700 font-semibold hover:bg-white border border-gray-200'
                                            }`}
                                            whileHover={{ y: 8, scale: 1.1 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                                        >
                                            <div className={currentView === dashboardItem.view ? 'text-white' : dashboardItem.colorClass}>{dashboardItem.icon}</div>
                                            <span className="text-sm">{dashboardItem.label}</span>
                                        </motion.button>
                                    </motion.div>
                                )}
                                {performanceItem && (
                                    <motion.div
                                        className="absolute"
                                        initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                                        animate={{ opacity: 1, scale: 1, x: 95, y: 70 }}
                                        exit={{ opacity: 0, scale: 0.5, x: 0, y: 0, transition: { duration: 0.2 } }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.05 }}
                                        role="menuitem"
                                    >
                                        <motion.button
                                            onClick={() => { onViewChange(performanceItem.view); setIsPageNavOpen(false); }}
                                            className={`flex flex-col items-center justify-center gap-2 w-28 h-28 rounded-full transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-teal-500 ${performanceItem.shadowClass} ${
                                                currentView === performanceItem.view
                                                    ? 'bg-teal-600 text-white font-bold shadow-2xl scale-105'
                                                    : 'bg-white/90 text-gray-700 font-semibold hover:bg-white border border-gray-200'
                                            }`}
                                            whileHover={{ y: 8, scale: 1.1 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                                        >
                                            <div className={currentView === performanceItem.view ? 'text-white' : performanceItem.colorClass}>{performanceItem.icon}</div>
                                            <span className="text-sm">{performanceItem.label}</span>
                                        </motion.button>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 z-50">
              <div className="relative flex justify-center items-center">
                  <AnimatePresence>
                      {!isPageNavOpen && currentNavItem && (
                          <motion.button
                              onClick={() => setIsPageNavOpen(true)}
                              initial={{ opacity: 0, y: 15, scale: 0.8 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 15, scale: 0.8 }}
                              whileHover={{ scale: 1.15, y: -5 }}
                              transition={{ type: 'tween', duration: 0.1 }}
                              className={`absolute bottom-14 font-bold text-xs px-4 py-2 rounded-lg text-white whitespace-nowrap cursor-pointer transition-all duration-300 ${currentNavItem.bgColorClass} ${currentNavItem.labelClasses}`}
                              aria-label={`Open navigation menu. Current page: ${currentNavItem.label}`}
                          >
                              {currentNavItem.label}
                              <div 
                                  className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
                                  style={{
                                      bottom: '-6px',
                                      borderLeft: '6px solid transparent',
                                      borderRight: '6px solid transparent',
                                      borderTop: `6px solid ${currentNavItem.bgColorHex}`
                                  }}
                              ></div>
                          </motion.button>
                      )}
                  </AnimatePresence>
                  {!isPageNavOpen && (
                      <motion.div
                          className="absolute w-14 h-14 bg-brand-primary rounded-full"
                          aria-hidden="true"
                          animate={{
                              scale: [1, 1.6, 1],
                              opacity: [0.6, 0, 0.6],
                          }}
                          transition={{
                              duration: 2.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                              repeatDelay: 1.5,
                          }}
                      />
                  )}
                  <motion.button
                      onClick={() => setIsPageNavOpen(!isPageNavOpen)}
                      className={`relative w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white z-10 border-2 transition-colors duration-300 ${
                          isPageNavOpen
                          ? 'border-brand-primary focus:ring-brand-primary'
                          : `${currentNavItem?.borderColorClass || 'border-brand-primary'} ${currentNavItem?.focusRingClass || 'focus:ring-brand-primary'}`
                      }`}
                      aria-haspopup="true"
                      aria-expanded={isPageNavOpen}
                      aria-label="Toggle page navigation"
                      whileHover={{ scale: 1.1, rotate: isPageNavOpen ? 0 : 10 }}
                      whileTap={{ scale: 0.9 }}
                  >
                     <AnimatePresence mode="wait">
                          <motion.div
                              key={isPageNavOpen ? 'close' : currentView}
                              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                              animate={{ rotate: 0, opacity: 1, scale: 1 }}
                              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                              className={isPageNavOpen ? 'text-brand-primary' : (currentNavItem?.colorClass || 'text-brand-primary')}
                          >
                              {isPageNavOpen 
                                  ? <XMarkIcon className="h-7 w-7" /> 
                                  : (currentNavItem?.icon || <LayoutGridIcon className="h-7 w-7" />)
                              }
                          </motion.div>
                      </AnimatePresence>
                  </motion.button>
              </div>
            </div>
        </div>
      </header>
    );
  };



import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PerformanceData } from '../types';
import { PerformanceCard } from './PerformanceCard';
import { InboxArrowDownIcon, PhoneIcon, CalendarDaysIcon, InfinityIcon, CheckBadgeIcon } from './icons';

interface PerformanceCardsProps {
    userRole: 'Admin' | 'User';
    userEmail: string;
    selectedScEmail: string;
    performanceData: PerformanceData[];
    maintenanceStatus: 'ON' | 'OFF';
    countdown: number;
    onCardClick: (category: string) => void;
}

const initialSummary = {
    leadsAssign: 0,
    callsMade: 0,
    meetingFixed: 0,
    onFollowUps: 0,
    followUpsDone: 0,
    connectedCallsMade: 0,
    connectedFollowUpsDone: 0,
};

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

interface CircularTimerProps {
    value: number;
    maxValue: number;
    label: string;
    color: string;
    textColor?: string;
    labelColor?: string;
}

const CircularTimer: React.FC<CircularTimerProps> = ({ value, maxValue, label, color, textColor, labelColor }) => {
    const RADIUS = 30;
    const STROKE_WIDTH = 5;
    const circumference = RADIUS * 2 * Math.PI;
    const progress = value / maxValue;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <div className="flex flex-col items-center text-center">
            <div className="relative w-[72px] h-[72px]">
                <svg
                    height="100%"
                    width="100%"
                    viewBox="0 0 70 70"
                    className="-rotate-90"
                >
                    <circle
                        stroke="rgba(255, 255, 255, 0.1)"
                        fill="transparent"
                        strokeWidth={STROKE_WIDTH}
                        r={RADIUS}
                        cx="35"
                        cy="35"
                    />
                    <motion.circle
                        stroke={color}
                        fill="transparent"
                        strokeWidth={STROKE_WIDTH}
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                        r={RADIUS}
                        cx="35"
                        cy="35"
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 0.5, ease: "circOut" }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-bold tracking-tight font-mono ${textColor || 'text-slate-700'}`}>
                        {String(value).padStart(2, '0')}
                    </span>
                </div>
            </div>
            <span className={`text-[10px] font-semibold uppercase mt-1 tracking-wider ${labelColor || 'text-slate-500'}`}>
                {label}
            </span>
        </div>
    );
};

export const PerformanceCards: React.FC<PerformanceCardsProps> = ({ userRole, userEmail, selectedScEmail, performanceData, maintenanceStatus, countdown, onCardClick }) => {

    const summaryData = useMemo(() => {
        if (!performanceData || performanceData.length === 0) {
            return initialSummary;
        }

        if (userRole === 'Admin') {
            if (selectedScEmail) {
                const userData = performanceData.find(p => p.scEmail === selectedScEmail);
                return userData || initialSummary;
            } else {
                // Sum of all users for admin
                return performanceData.reduce((acc, curr) => {
                    acc.leadsAssign += curr.leadsAssign;
                    acc.callsMade += curr.callsMade;
                    acc.meetingFixed += curr.meetingFixed;
                    acc.onFollowUps += curr.onFollowUps;
                    acc.followUpsDone += curr.followUpsDone;
                    acc.connectedCallsMade += curr.connectedCallsMade;
                    acc.connectedFollowUpsDone += curr.connectedFollowUpsDone;
                    return acc;
                }, { ...initialSummary, scEmail: '', sc: '' });
            }
        } else {
            // Data for the logged-in user
            const userData = performanceData.find(p => p.scEmail.toLowerCase() === userEmail.toLowerCase());
            return userData || initialSummary;
        }

    }, [performanceData, userRole, userEmail, selectedScEmail]);

    const cards = [
        { title: 'Leads Assign', value: summaryData.leadsAssign, icon: <InboxArrowDownIcon className="h-6 w-6" /> },
        { title: 'Calls Made', value: summaryData.callsMade, icon: <PhoneIcon className="h-6 w-6" />, connectedValue: summaryData.connectedCallsMade },
        { title: 'Meeting Fixed', value: summaryData.meetingFixed, icon: <CalendarDaysIcon className="h-6 w-6" /> },
        { title: 'On FollowUps', value: summaryData.onFollowUps, icon: <InfinityIcon className="h-6 w-6" /> },
        { title: 'FollowUps Done', value: summaryData.followUpsDone, icon: <CheckBadgeIcon className="h-6 w-6" />, connectedValue: summaryData.connectedFollowUpsDone },
    ];
    
    const hours = Math.floor(countdown / 3600);
    const minutes = Math.floor((countdown % 3600) / 60);
    const seconds = countdown % 60;

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Today's Performance</h1>
                {maintenanceStatus === 'ON' && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
                        className="flex flex-col items-center gap-4 rounded-xl bg-slate-800 p-4 shadow-lg border-2 border-amber-400 w-full max-w-md"
                        id="maintenance-status-display"
                    >
                        <div className="w-full">
                            <div className="relative flex justify-center w-full mb-3">
                                <div className="absolute top-0 w-28 h-5 -mt-2.5 flex justify-between">
                                    <div
                                        className="w-5 h-5 rounded-full bg-amber-400"
                                        style={{ animation: 'maintenance-flash-1 1s infinite step-end' }}
                                    ></div>
                                    <div
                                        className="w-5 h-5 rounded-full bg-amber-400"
                                        style={{ animation: 'maintenance-flash-2 1s infinite step-end' }}
                                    ></div>
                                </div>
                            </div>
                            <div
                                className="h-12 w-full relative flex items-center justify-center overflow-hidden rounded-md"
                                style={{
                                    background: 'repeating-linear-gradient(45deg, #facc15, #facc15 25px, #1e293b 25px, #1e293b 50px)',
                                    animation: 'maintenance-scroll 2s linear infinite',
                                    border: '2px solid #334155',
                                }}
                            >
                                <h3 className="text-xl font-black text-slate-800/70 tracking-widest uppercase" style={{ textShadow: '0 1px 1px rgba(255,255,255,0.2)'}}>
                                    Maintenance Mode
                                </h3>
                            </div>
                        </div>
                        
                        <div className="flex items-end gap-6 text-white pt-2">
                             <CircularTimer value={hours} maxValue={24} label="Hours" color="#f59e0b" textColor="text-white" labelColor="text-slate-300" />
                             <CircularTimer value={minutes} maxValue={60} label="Minutes" color="#ef4444" textColor="text-white" labelColor="text-slate-300" />
                             <CircularTimer value={seconds} maxValue={60} label="Seconds" color="#f87171" textColor="text-white" labelColor="text-slate-300" />
                        </div>
                    </motion.div>
                )}
            </div>
            <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 pt-8"
                variants={container}
                initial="hidden"
                animate="visible"
            >
                {cards.map(card => (
                    <motion.div key={card.title} variants={item} className="h-full relative">
                        {typeof card.connectedValue === 'number' && (
                            <div className="absolute bottom-full left-4 mb-1.5 z-20 whitespace-nowrap pointer-events-none">
                                <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.4 }}
                                >
                                    <motion.div
                                        className="bg-brand-primary text-white text-sm font-bold px-3.5 py-1.5 rounded-lg relative"
                                        animate={{
                                            boxShadow: [
                                                "0 0 0px 0px rgba(99, 102, 241, 0)",
                                                "0 0 15px 3px rgba(99, 102, 241, 0.7)",
                                                "0 0 0px 0px rgba(99, 102, 241, 0)",
                                            ]
                                        }}
                                        transition={{
                                            duration: 2.5,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    >
                                        Connected {card.connectedValue}
                                        <div 
                                            className="absolute left-4 bottom-[-6px] w-0 h-0"
                                            style={{
                                                borderLeft: '8px solid transparent',
                                                borderRight: '8px solid transparent',
                                                borderTop: '6px solid #4f46e5' // Corresponds to brand-primary
                                            }}
                                        ></div>
                                    </motion.div>
                                </motion.div>
                            </div>
                        )}
                        <PerformanceCard 
                            title={card.title} 
                            value={card.value} 
                            icon={card.icon} 
                            onClick={
                                ['Calls Made', 'Meeting Fixed', 'FollowUps Done'].includes(card.title) 
                                ? () => onCardClick(card.title) 
                                : undefined
                            }
                        />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
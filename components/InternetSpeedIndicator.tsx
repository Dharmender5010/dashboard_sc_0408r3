
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

type SpeedStatus = 'good' | 'ok' | 'slow' | 'testing';

const statusStyles: Record<SpeedStatus, { tooltipBg: string; arrowColor: string }> = {
    slow: {
        tooltipBg: 'bg-red-500',
        arrowColor: 'rgb(239, 68, 68)', // Tailwind red-500
    },
    ok: {
        tooltipBg: 'bg-amber-500',
        arrowColor: 'rgb(245, 158, 11)', // Tailwind amber-500
    },
    good: {
        tooltipBg: 'bg-emerald-500',
        arrowColor: 'rgb(16, 185, 129)', // Tailwind emerald-500
    },
    testing: {
        tooltipBg: 'bg-amber-500', // Testing uses the amber/yellow light
        arrowColor: 'rgb(245, 158, 11)', // Tailwind amber-500
    },
};

const Light: React.FC<{ color: string; active: boolean; isPulsing: boolean }> = ({ color, active, isPulsing }) => {
    const lightVariants = {
        active: { 
            opacity: 1, 
            boxShadow: `0 0 8px 1.5px ${color}, inset 0 0 4px rgba(255,255,255,0.5)` 
        },
        inactive: { 
            opacity: 0.25,
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' // Darker inner shadow for off state
        },
    };

    return (
        <motion.div
            className="w-3 h-3 rounded-full relative" // A bit smaller: 3x3 = 12px
            style={{ backgroundColor: color }}
            variants={lightVariants}
            animate={active ? 'active' : 'inactive'}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
            {/* Glossy overlay effect */}
            <div 
                className="absolute inset-0 rounded-full"
                style={{
                    background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.8), transparent 60%)',
                }}
            />

            {/* Special pulsing glow for the 'testing' state */}
            {isPulsing && (
                <motion.div
                    className="absolute -inset-0.5 rounded-full"
                    style={{
                        boxShadow: `0 0 10px 2.5px ${color}`
                    }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />
            )}
        </motion.div>
    );
};

export const InternetSpeedIndicator: React.FC = () => {
    const [status, setStatus] = useState<SpeedStatus>('testing');
    const [speedMbps, setSpeedMbps] = useState<number | null>(null);

    const checkSpeed = useCallback(async () => {
        setStatus('testing');
        setSpeedMbps(null);
        // Using a reliable image from a public CDN, approx 54KB.
        const imageUrl = 'https://i.imgur.com/pBcut2e.jpg'; 
        const imageSizeInBytes = 54 * 1024;
        const startTime = new Date().getTime();

        try {
            // Cache-busting parameter
            const response = await fetch(`${imageUrl}?t=${startTime}`, { mode: 'cors' });
            if (!response.ok) throw new Error('Failed to fetch image');

            await response.blob();
            const endTime = new Date().getTime();
            const durationInSeconds = (endTime - startTime) / 1000;
            
            // Handle case where duration is too small or zero to avoid Infinity
            if (durationInSeconds < 0.01) { 
                setSpeedMbps(Infinity);
                setStatus('good');
                return;
            }

            const speedBps = imageSizeInBytes * 8 / durationInSeconds;
            const speed = speedBps / 1000 / 1000; // Mbps
            setSpeedMbps(speed);
            
            if (speed > 1.5) {
                setStatus('good');
            } else if (speed > 0.5) {
                setStatus('ok');
            } else {
                setStatus('slow');
            }
        } catch (error) {
            console.error("Internet speed check failed:", error);
            setStatus('slow');
            setSpeedMbps(0);
        }
    }, []);

    useEffect(() => {
        checkSpeed(); // Initial check
        const interval = setInterval(checkSpeed, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, [checkSpeed]);

    const getTooltipText = () => {
        if (status === 'testing') return 'Checking connection speed...';
        if (speedMbps === null) return 'Connection status unknown';
        if (speedMbps === Infinity) return 'Excellent connection (very fast).';
        if (status === 'slow') return `Slow connection (${speedMbps.toFixed(2)} Mbps)`;
        if (status === 'ok') return `Connection OK (${speedMbps.toFixed(2)} Mbps).`;
        if (status === 'good') return `Good connection (${speedMbps.toFixed(2)} Mbps).`;
        return '';
    };

    const isTesting = status === 'testing';
    const currentStyle = statusStyles[status];

    return (
        <div className="flex items-center gap-2 group relative">
            <div className="flex items-center gap-1.5 p-1.5 bg-gradient-to-b from-slate-700 to-slate-800 rounded-full border-t border-slate-600 border-b border-slate-900 shadow-lg">
                <Light color="#ff5252" active={status === 'slow'} isPulsing={false} />
                <Light color="#ffc107" active={status === 'ok' || isTesting} isPulsing={isTesting} />
                <Light color="#4caf50" active={status === 'good'} isPulsing={false} />
            </div>
             <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10 ${currentStyle.tooltipBg}`}>
                {getTooltipText()}
                <div 
                    className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
                    style={{
                        bottom: '-6px',
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: `6px solid ${currentStyle.arrowColor}`
                    }}
                ></div>
            </div>
        </div>
    );
};

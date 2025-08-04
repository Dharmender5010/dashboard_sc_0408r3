
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

const Bubble: React.FC<{ style: React.CSSProperties }> = ({ style }) => {
    return <motion.div className="absolute rounded-full" style={style}></motion.div>
}

export const Bubbles: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedSeconds = time.toLocaleTimeString([], { second: '2-digit' });

    const bubbles = useMemo(() => {
        return Array.from({ length: 25 }).map((_, i) => {
            const size = Math.random() * 80 + 20; // 20px to 100px
            const left = Math.random() * 100;
            const animationDuration = Math.random() * 15 + 10; // 10s to 25s
            const animationDelay = Math.random() * 10;
            const opacity = Math.random() * 0.4 + 0.1; // 0.1 to 0.5
            const color = i % 2 === 0 ? 'rgba(79, 70, 229, 0.7)' : 'rgba(56, 189, 248, 0.7)'; // Indigo and Sky blue

            return {
                id: i,
                style: {
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${left}%`,
                    opacity: opacity,
                    backgroundColor: color,
                    animation: `floatUp ${animationDuration}s linear ${animationDelay}s infinite`,
                    boxShadow: `0 0 15px 5px ${color.replace('0.7)', '0.3)')}`
                }
            };
        });
    }, []);

    return (
        <motion.div
            className="fixed inset-0 bg-gradient-to-br from-slate-900 to-indigo-900 z-[99999] flex flex-col justify-center items-center text-white font-sans overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
        >
            <div className="absolute inset-0 w-full h-full">
                {bubbles.map(bubble => (
                    <Bubble key={bubble.id} style={bubble.style as React.CSSProperties} />
                ))}
            </div>
            
            <div className="relative text-center z-10" style={{ textShadow: '0 0 25px rgba(0,0,0,0.5)' }}>
                <div className="flex items-baseline justify-center">
                    <p className="text-[12rem] font-bold leading-none tracking-tighter">{formattedTime}</p>
                    <p className="text-6xl font-semibold -ml-2">{formattedSeconds}</p>
                </div>
                <p className="text-3xl text-slate-300 -mt-4">{time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                <p className="mt-8 text-slate-400 animate-pulse text-lg">Move mouse or press a key to continue</p>
            </div>
            
            <style>{`
                @keyframes floatUp {
                    0% {
                        transform: translateY(100vh) scale(1);
                        opacity: 0.7;
                    }
                    100% {
                        transform: translateY(-200px) scale(1.2);
                        opacity: 0;
                    }
                }
            `}</style>
        </motion.div>
    );
};

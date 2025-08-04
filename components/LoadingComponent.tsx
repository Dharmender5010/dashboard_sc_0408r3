
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Messages to cycle through
const loadingMessages = [
    "Connecting to the mothership...",
    "Gathering intelligence...",
    "Assembling data streams...",
    "Optimizing your dashboard...",
    "Finalizing interface..."
];

const salesWords = [
    'Lead', 'Deal', 'Quota', 'Pipeline', 'Forecast', 'Close', 'Prospect', 'FollowUps',
    'Negotiate', 'Revenue', 'Commission', 'Upsell', 'Demo', 'Value', 'Client',
    'Target', 'Sales', 'Growth', 'Strategy', 'Contract', 'Win', 'B2B', 'B2C', 'ROI',
    'Meetings', 'Calls', 'Orders'
];

// New "Falling Words" animation component
const FallingWordsAnimation: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let words: any[] = [];
        
        const dpr = window.devicePixelRatio || 1;
        
        const resizeCanvas = () => {
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.scale(dpr, dpr);

            const screenWidth = window.innerWidth;
            const columnCount = Math.floor(screenWidth / 25);
            const columnWidth = screenWidth / columnCount;

            words = Array.from({ length: columnCount }, (_, i) => ({
                text: salesWords[Math.floor(Math.random() * salesWords.length)],
                x: i * columnWidth,
                y: Math.random() * window.innerHeight * -1 - 50, // Start off-screen
                speed: Math.random() * 2 + 1, // 1 to 3
                fontSize: Math.random() * 10 + 12, // 12px to 22px
                opacity: Math.random() * 0.5 + 0.3, // 0.3 to 0.8
                color: ['#a5b4fc', '#eef2ff', '#6366f1'][Math.floor(Math.random() * 3)]
            }));
        };

        const resetWord = (word: any) => {
            word.y = -50;
            word.text = salesWords[Math.floor(Math.random() * salesWords.length)];
            word.speed = Math.random() * 2 + 1;
            word.fontSize = Math.random() * 10 + 12;
            word.opacity = Math.random() * 0.5 + 0.3;
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            words.forEach(word => {
                word.y += word.speed;
                if (word.y > window.innerHeight + 50) {
                    resetWord(word);
                }

                ctx.font = `bold ${word.fontSize}px Inter, sans-serif`;
                ctx.fillStyle = word.color;
                ctx.globalAlpha = word.opacity;
                ctx.fillText(word.text, word.x, word.y);
            });
            ctx.globalAlpha = 1;
            animationFrameId = requestAnimationFrame(animate);
        };

        resizeCanvas();
        animate();
        
        window.addEventListener('resize', resizeCanvas);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-40" aria-hidden="true" />;
};


interface LoadingComponentProps {
    progress: number;
}

export const LoadingComponent: React.FC<LoadingComponentProps> = ({ progress }) => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const messageIntervalId = setInterval(() => {
            setMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
        }, 2200); // Change message every 2.2 seconds

        return () => clearInterval(messageIntervalId);
    }, []);

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-brand-dark to-slate-900 text-white font-sans overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <FallingWordsAnimation />

            <div className="relative z-10 text-center w-full max-w-md px-4 bg-slate-900/50 backdrop-blur-sm rounded-xl py-8 shadow-2xl border border-white/10">
                <motion.h1 
                    className="text-4xl font-bold tracking-wider text-slate-100 mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    Loading Dashboard
                </motion.h1>

                <motion.div
                    className="text-8xl font-bold text-slate-100 mb-6 tabular-nums"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    {progress}
%
                </motion.div>

                <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden border border-slate-600">
                    <motion.div
                        className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full rounded-full"
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 200, damping: 30 }}
                    />
                </div>

                <div className="h-6 relative w-full overflow-hidden mt-6">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={messageIndex}
                            className="absolute w-full text-center text-slate-400"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            {loadingMessages[messageIndex]}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>
            
            <div className="absolute bottom-6 text-xs text-slate-500 z-10">
                &copy;2025 Sales Dashboard. All rights reserved.
            </div>
        </motion.div>
    );
};

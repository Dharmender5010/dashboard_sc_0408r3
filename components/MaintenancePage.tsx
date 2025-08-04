

import React from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100 } }
};

// Split text into words for animation
const title = "Website is under".split(" ");
const title2 = "MAINTENANCE".split("");

export const MaintenancePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans flex items-center justify-center p-4 overflow-hidden relative">
             {/* Animated background particles */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                {Array.from({ length: 15 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-indigo-100 rounded-full"
                        style={{
                            width: Math.random() * 50 + 20,
                            height: Math.random() * 50 + 20,
                            left: `${Math.random() * 100}%`,
                            bottom: '-50px',
                        }}
                        animate={{
                            y: `-${window.innerHeight + 100}px`,
                            x: (Math.random() - 0.5) * 200,
                            rotate: Math.random() * 360,
                            scale: Math.random() * 0.5 + 0.5,
                        }}
                        transition={{
                            duration: Math.random() * 15 + 10,
                            repeat: Infinity,
                            ease: 'linear',
                            delay: Math.random() * 5,
                        }}
                    />
                ))}
            </div>
            
            <div className="w-full max-w-5xl mx-auto z-10">
                <motion.div 
                    variants={itemVariants}
                    className="mb-8 flex items-center gap-3 text-sm font-medium text-slate-500 justify-center"
                >
                    <motion.div 
                        className="w-2 h-2 bg-indigo-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <span>Work in progress...</span>
                </motion.div>

                <motion.div 
                    className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-center md:text-left"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Left Column: Image */}
                    <motion.div 
                        className="w-full md:w-1/2 max-w-md md:max-w-none"
                        variants={itemVariants}
                    >
                       <img 
                            src="https://i.ibb.co/chJmZr2Y/Chat-GPT-Image-Jul-21-2025-07-45-44-PM.png"
                            alt="Chat-GPT-Image-Jul-21-2025-07-45-44-PM"
                            className="w-full h-auto rounded-lg shadow-2xl"
                        />
                    </motion.div>
                    
                    {/* Right Column: Text Content */}
                    <div className="w-full md:w-1/2">
                        <motion.div variants={itemVariants}>
                            <h1 className="text-4xl md:text-5xl font-light text-slate-700 leading-tight">
                                {title.map((el, i) => (
                                    <motion.span
                                        key={i}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{
                                            duration: 0.25,
                                            delay: i / 10,
                                        }}
                                        className="inline-block mr-3"
                                    >
                                        {el}
                                    </motion.span>
                                ))}
                                <br />
                                <strong className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-sky-500">
                                    {title2.map((el, i) => (
                                        <motion.span
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                type: 'spring',
                                                damping: 15,
                                                stiffness: 200,
                                                delay: (title.length + i) / 10,
                                            }}
                                            className="inline-block"
                                        >
                                            {el}
                                        </motion.span>
                                    ))}
                                </strong>
                            </h1>
                            <motion.p 
                                className="mt-6 text-base md:text-lg text-slate-500 max-w-lg mx-auto md:mx-0"
                                variants={itemVariants}
                            >
                                We're currently performing scheduled maintenance to improve our services. We'll be back online shortly.
                            </motion.p>
                        </motion.div>
                        
                        <motion.footer 
                            variants={itemVariants}
                            className="mt-8 text-slate-400 text-xs"
                        >
                             Thank you for your patience!
                        </motion.footer>
                    </div>

                </motion.div>
            </div>
        </div>
    );
};

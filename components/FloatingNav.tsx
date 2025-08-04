

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProMenuIcon, QuestionMarkCircleIcon, SparklesIcon } from './icons';

interface FloatingNavProps {
    onStartTour: () => void;
}

const containerVariants = {
    open: {
        transition: {
            staggerChildren: 0.07,
            delayChildren: 0.2
        }
    },
    closed: {
        transition: {
            staggerChildren: 0.05,
            staggerDirection: -1
        }
    }
};

const itemVariants = {
    open: {
        y: 0,
        opacity: 1,
        transition: {
            y: { stiffness: 1000, velocity: -100 }
        }
    },
    closed: {
        y: 50,
        opacity: 0,
        transition: {
            y: { stiffness: 1000 }
        }
    }
};

export const FloatingNav: React.FC<FloatingNavProps> = ({ onStartTour }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navRef = useRef<HTMLDivElement>(null);

    const navItems = [
        { label: 'Take a Tour', icon: <SparklesIcon className="h-4 w-4" />, action: onStartTour, id: 'floating-nav-tour' },
    ];

    // Effect to handle clicks outside the component
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // If the menu is open and the click is outside the nav container
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        // Add event listener when the menu is open
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Cleanup: remove event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]); // Re-run effect when `isOpen` changes

    return (
        <div ref={navRef} className="fixed bottom-4 left-4 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        className="space-y-2 mb-2 flex flex-col items-start"
                        variants={containerVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                    >
                        {navItems.map(item => (
                             <motion.li
                                key={item.label}
                                variants={itemVariants}
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                             >
                                <button
                                    id={item.id}
                                    onClick={() => {
                                        item.action();
                                        setIsOpen(false);
                                    }}
                                    className="flex items-center flex-row-reverse gap-3 group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 focus-visible:ring-brand-primary"
                                    aria-label={item.label}
                                >
                                    <span className="bg-white text-gray-800 text-sm font-semibold px-3 py-2 rounded-md shadow-md group-hover:bg-brand-light transition-colors">
                                        {item.label}
                                    </span>
                                    <div
                                        className="bg-white w-10 h-10 rounded-full flex items-center justify-center text-brand-primary shadow-lg group-hover:bg-brand-light transition-colors"
                                    >
                                        {item.icon}
                                    </div>
                                </button>
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
            <div className="relative flex justify-center items-center">
                {!isOpen && (
                    <motion.div
                        className="absolute w-12 h-12 bg-brand-primary rounded-full"
                        aria-hidden="true"
                        animate={{
                            scale: [1, 1.6, 1],
                            opacity: [0.7, 0, 0.7],
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            repeatDelay: 2,
                        }}
                    />
                )}
                <motion.button
                    id="floating-nav-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center text-white shadow-xl hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark"
                    aria-label="Toggle navigation menu"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                    <ProMenuIcon isOpen={isOpen} />
                </motion.button>
            </div>
        </div>
    );
};
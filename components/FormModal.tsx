

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ArrowTopRightOnSquareIcon, ClipboardIcon } from './icons';

interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string | null;
}

const backdrop = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
};

const modal = {
    hidden: { y: "30px", opacity: 0, scale: 0.98 },
    visible: {
        y: "0",
        opacity: 1,
        scale: 1,
        transition: { type: "spring" as const, stiffness: 400, damping: 40 }
    },
    exit: {
        y: "30px",
        opacity: 0,
        scale: 0.98,
        transition: { duration: 0.2 }
    }
};

const FormSkeleton: React.FC = () => (
    <div className="absolute inset-0 p-8 animate-pulse">
        <div className="h-10 bg-gray-300 rounded-md w-3/4 mb-8"></div>
        <div className="space-y-6">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
        </div>
    </div>
);

const ActionButton: React.FC<{ label: string, onClick: () => void, children: React.ReactNode }> = ({ label, onClick, children }) => (
    <div className="relative group">
        <button
            type="button"
            onClick={onClick}
            className="p-2 text-gray-500 hover:text-brand-primary rounded-full hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
            aria-label={label}
        >
            {children}
        </button>
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max bg-gray-800 text-white text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            {label}
        </div>
    </div>
);


export const FormModal: React.FC<FormModalProps> = ({ isOpen, onClose, url }) => {
    const [isIframeLoading, setIsIframeLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsIframeLoading(true); // Reset loading state each time modal opens
        }
    }, [isOpen]);

    useEffect(() => {
        if (isCopied) {
            const timer = setTimeout(() => setIsCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isCopied]);

    if (!url) return null;
    
    const originalUrl = url.replace('?embedded=true', '');

    const handleCopyLink = () => {
        navigator.clipboard.writeText(originalUrl);
        setIsCopied(true);
    };

    const handleOpenInNewTab = () => {
        window.open(originalUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
                    variants={backdrop}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={onClose}
                >
                    <motion.div
                        variants={modal}
                        className="bg-gray-100 rounded-xl shadow-2xl w-full h-full max-w-4xl max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="p-4 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-xl shrink-0">
                            <h2 className="text-lg font-bold text-gray-800">Complete Action</h2>
                            <div className="flex items-center gap-2">
                                <ActionButton label={isCopied ? "Copied!" : "Copy Link"} onClick={handleCopyLink}>
                                    <ClipboardIcon className="h-5 w-5" />
                                </ActionButton>
                                <ActionButton label="Open in new tab" onClick={handleOpenInNewTab}>
                                    <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                                </ActionButton>
                                 <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-700 hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600"
                                    aria-label="Close"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                    <span>Close</span>
                                </button>
                            </div>
                        </header>

                        <div className="flex-grow bg-gray-100 relative overflow-hidden">
                            {isIframeLoading && <FormSkeleton />}
                            <iframe
                                src={url}
                                title="Form"
                                className={`w-full h-full border-0 transition-opacity duration-500 ${isIframeLoading ? 'opacity-0' : 'opacity-100'}`}
                                frameBorder="0"
                                allowFullScreen
                                onLoad={() => setIsIframeLoading(false)}
                            >
                                Loading form...
                            </iframe>
                        </div>
                        <footer className="p-3 bg-gray-200 border-t border-gray-300 text-center rounded-b-xl shrink-0">
                            <p className="text-xs text-gray-600">Closing this window will automatically refresh the dashboard.</p>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

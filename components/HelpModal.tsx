

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PaperClipIcon, AtSymbolIcon } from './icons';
import { sendHelpRequest } from '../services/helpService';

// Declare Swal for TypeScript since it's loaded from a script tag
declare const Swal: any;

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail?: string;
    userName?: string;
}

const backdrop = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
};

const modal = {
    hidden: { y: "-50vh", opacity: 0 },
    visible: {
        y: "0",
        opacity: 1,
        transition: { type: "spring" as const, stiffness: 300, damping: 30 }
    },
};

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, userEmail, userName }) => {
    const [email, setEmail] = useState('');
    const [issue, setIssue] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (isOpen && userEmail) {
            setEmail(userEmail);
        }
        if (!isOpen) {
            // Reset form when modal closes
            handleReset();
        }
    }, [isOpen, userEmail]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setScreenshot(e.target.files[0]);
        }
    };
    
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        Swal.fire({
            title: 'Submitting your request...',
            text: 'Please wait.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            let screenshotData = null;
            if (screenshot) {
                const base64String = await fileToBase64(screenshot);
                screenshotData = {
                    mimeType: screenshot.type,
                    fileName: screenshot.name,
                    base64: base64String.split(',')[1] // Remove the 'data:mime/type;base64,' prefix
                };
            }
            
            await sendHelpRequest({
                email,
                issue,
                screenshot: screenshotData,
                userName: userName || 'N/A'
            });

            Swal.fire({
              icon: "success",
              title: "Request Sent!",
              text: "Our team will get back to you shortly.",
              timer: 2000,
              showConfirmButton: false,
            });
            onClose();

        } catch (error) {
            console.error(error);
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Something went wrong! Please try again.",
              footer: (error as Error).message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setEmail(userEmail || '');
        setIssue('');
        setScreenshot(null);
        if (formRef.current) {
            formRef.current.reset();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
                    variants={backdrop}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                >
                    <motion.div
                        variants={modal}
                        className="bg-white rounded-xl shadow-2xl w-full max-w-lg m-4"
                    >
                        <form ref={formRef} onSubmit={handleSubmit} onReset={handleReset} noValidate>
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-gray-800">Need Help?</h2>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600"
                                    aria-label="Close"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                <p className="text-sm text-gray-600">
                                    Please fill out the form below and we'll get back to you as soon as possible.
                                </p>
                                <div className="relative">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none pt-7">
                                       <AtSymbolIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                        placeholder="you@example.com"
                                        required
                                        disabled={!!userEmail}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="issue" className="block text-sm font-medium text-gray-700 mb-1">Describe your issue</label>
                                    <textarea
                                        id="issue"
                                        rows={5}
                                        value={issue}
                                        onChange={(e) => setIssue(e.target.value)}
                                        className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                                        placeholder="Please provide as much detail as possible..."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Screenshot (Optional)</label>
                                    <label htmlFor="screenshot-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-brand-primary hover:text-brand-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-secondary border border-gray-300 p-2 flex items-center justify-center gap-2">
                                        <PaperClipIcon className="h-5 w-5"/>
                                        <span>{screenshot ? 'Change screenshot' : 'Attach a file'}</span>
                                        <input id="screenshot-upload" name="screenshot-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                    {screenshot && <p className="mt-2 text-sm text-gray-500 truncate">Selected: {screenshot.name}</p>}
                                </div>
                            </div>

                            <div className="flex justify-end items-center gap-4 p-6 bg-gray-50 rounded-b-xl">
                                <button type="button" onClick={handleReset} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors">
                                    Reset
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !email || !issue}
                                    className="px-6 py-2 text-sm font-bold text-white bg-brand-primary hover:bg-brand-dark rounded-lg transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Submitting...
                                        </>
                                    ) : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

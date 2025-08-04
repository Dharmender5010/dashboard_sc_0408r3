import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiMessage } from '../types';
import { XMarkIcon, SparklesIcon } from './icons';

// Declare Swal for TypeScript since it's loaded from a script tag
declare const Swal: any;

interface AIAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: AiMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    outputMode: 'text_and_voice' | 'text_only';
    setOutputMode: (mode: 'text_and_voice' | 'text_only') => void;
    onResetConversation: () => void;
}

const LoadingDots: React.FC = () => (
    <div className="flex items-center gap-1.5">
        <motion.div className="h-2 w-2 bg-gray-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="h-2 w-2 bg-gray-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }} />
        <motion.div className="h-2 w-2 bg-gray-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />
    </div>
);

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose, conversation, onSendMessage, isLoading, outputMode, setOutputMode, onResetConversation }) => {
    const [prompt, setPrompt] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation, isLoading]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSendMessage(prompt);
        setPrompt('');
    };

    const handleClearConversation = () => {
        if (conversation.length === 0 || isLoading) return;

        Swal.fire({
            title: 'Clear Conversation?',
            text: "This will permanently delete the current conversation history.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, clear it!',
            cancelButtonText: 'No, keep it',
            customClass: {
                popup: 'rounded-xl shadow-lg',
                title: 'text-xl font-bold text-gray-800',
                htmlContainer: 'text-gray-600',
            }
        }).then((result: any) => {
            if (result.isConfirmed) {
                onResetConversation();
                Swal.fire({
                    toast: true,
                    position: 'top',
                    icon: 'success',
                    title: 'Conversation cleared',
                    showConfirmButton: false,
                    timer: 1500,
                    timerProgressBar: true,
                    customClass: {
                        popup: 'bg-white rounded-lg shadow-lg',
                    },
                });
            }
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex justify-center items-center p-4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-white/80 backdrop-blur-lg rounded-2xl w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl border border-white/20"
                        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-black/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                                    <SparklesIcon className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">AI Assistant</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-600">Voice</span>
                                    <label htmlFor="ai-output-toggle" className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" id="ai-output-toggle" className="sr-only peer" checked={outputMode === 'text_and_voice'} onChange={e => setOutputMode(e.target.checked ? 'text_and_voice' : 'text_only')} />
                                        <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                                    </label>
                                </div>
                                <button
                                    onClick={handleClearConversation}
                                    className="px-3 py-1.5 text-sm font-semibold rounded-lg text-gray-600 bg-gray-100 hover:bg-red-100 hover:text-red-700 focus:bg-red-100 focus:text-red-700 disabled:text-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    title="Clear conversation"
                                    disabled={conversation.length === 0 || isLoading}
                                >
                                    Clear Chat
                                </button>
                                <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors">
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-grow p-4 overflow-y-auto space-y-4">
                            {conversation.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                    <SparklesIcon className="w-16 h-16 text-gray-300 mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-700">How can I help you today?</h3>
                                    <p className="max-w-xs mt-1">Try asking things like "Show me today's performance" or "Filter for Step-1a".</p>
                                </div>
                            )}
                            {conversation.map((msg, index) => (
                                <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0"><SparklesIcon className="w-5 h-5 text-brand-primary" /></div>}
                                    <div className={`max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-brand-primary text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'} ${msg.role === 'system' ? 'bg-red-100 text-red-800 rounded-bl-none border border-red-200' : ''}`}>
                                        <p className="text-sm">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-end gap-2 justify-start">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0"><SparklesIcon className="w-5 h-5 text-brand-primary" /></div>
                                    <div className="p-3 bg-gray-200 rounded-2xl rounded-bl-none">
                                        <LoadingDots />
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef}></div>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-black/10">
                            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                                <div className="relative flex-grow">
                                    <input
                                        type="text"
                                        value={prompt}
                                        onChange={e => setPrompt(e.target.value)}
                                        placeholder="Ask me anything..."
                                        className="w-full bg-white border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                                        disabled={isLoading}
                                    />
                                </div>
                                <button type="submit" disabled={!prompt.trim() || isLoading} className="bg-brand-primary text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-brand-dark transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed">
                                    Send
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

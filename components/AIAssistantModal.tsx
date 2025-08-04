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

const MicIcon: React.FC<{ isRecording: boolean }> = ({ isRecording }) => (
    <svg className={`h-6 w-6 transition-colors ${isRecording ? 'text-red-500' : 'text-gray-500 group-hover:text-brand-primary'}`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z"></path>
        <path d="M12 16.5c-2.49 0-4.5-2.01-4.5-4.5H6c0 3.31 2.69 6 6 6s6-2.69 6-6h-1.5c0 2.49-2.01 4.5-4.5 4.5z"></path>
        <path d="M19 11h-1.5c0 2.49-2.01 4.5-4.5 4.5S8.5 13.49 8.5 11H7c0 3.31 2.69 6 6 6s6-2.69 6-6zM12 2c-1.66 0-3 1.34-3 3v6c0 1.66 1.34 3 3 3s3-1.34 3-3V5c0-1.66-1.34-3-3-3z"></path>
    </svg>
);

const LoadingDots: React.FC = () => (
    <div className="flex items-center gap-1.5">
        <motion.div className="h-2 w-2 bg-gray-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="h-2 w-2 bg-gray-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }} />
        <motion.div className="h-2 w-2 bg-gray-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />
    </div>
);

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose, conversation, onSendMessage, isLoading, outputMode, setOutputMode, onResetConversation }) => {
    const [prompt, setPrompt] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [placeholder, setPlaceholder] = useState('Ask me anything...');
    
    const recognitionRef = useRef<any>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const placeholderTimeoutRef = useRef<number | null>(null);
    const maxDurationTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation, isLoading]);
    
    useEffect(() => {
        if (isRecording) {
            setPlaceholder('Listening... Speak your concern now.');
            if (placeholderTimeoutRef.current) {
                clearTimeout(placeholderTimeoutRef.current);
                placeholderTimeoutRef.current = null;
            }
        } else if (!placeholderTimeoutRef.current) {
            setPlaceholder('Ask me anything...');
        }
    }, [isRecording]);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported by this browser.");
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;
        
        recognition.continuous = false; // Recognizes a single utterance, then stops.
        recognition.interimResults = true; // Provides interim results for live transcription.
        recognition.lang = 'en-IN'; // Use Indian English for better accent recognition and for Hindi.

        recognition.onresult = (event: any) => {
            if (maxDurationTimeoutRef.current) {
                clearTimeout(maxDurationTimeoutRef.current);
                 maxDurationTimeoutRef.current = window.setTimeout(() => recognitionRef.current?.stop(), 20000);
            }
            
            // Build the full transcript from all parts received so far.
            const transcript = Array.from(event.results)
                .map((result: any) => result[0].transcript)
                .join('');
            
            setPrompt(transcript);

            // If the last result is final, it means the user has paused.
            // Send the complete message.
            const lastResult = event.results[event.results.length - 1];
            if (lastResult.isFinal) {
                if (transcript.trim()) {
                    onSendMessage(transcript.trim());
                }
                setPrompt(''); // Clear the input for the next command.
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            if (placeholderTimeoutRef.current) clearTimeout(placeholderTimeoutRef.current);
            if (maxDurationTimeoutRef.current) clearTimeout(maxDurationTimeoutRef.current);
            
            if (event.error !== 'no-speech') {
                let title = 'Voice Input Error';
                let text = 'An unknown error occurred.';
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    title = 'Microphone Access Denied';
                    text = 'Please allow microphone access in your browser settings to use voice input.';
                } else if (event.error === 'network') {
                    title = 'Voice Connection Failed';
                    text = 'A network error occurred. Please check your internet connection.';
                }
                Swal.fire({ icon: 'error', title, text });
            }
            setIsRecording(false);
        };
        
        recognition.onend = () => {
            setIsRecording(false);
            if (maxDurationTimeoutRef.current) clearTimeout(maxDurationTimeoutRef.current);
        };
        
        return () => {
            if (recognitionRef.current) recognitionRef.current.abort();
            if (placeholderTimeoutRef.current) clearTimeout(placeholderTimeoutRef.current);
            if (maxDurationTimeoutRef.current) clearTimeout(maxDurationTimeoutRef.current);
        }
    }, [onSendMessage]);

    const handleMicClick = () => {
        if (!recognitionRef.current) {
            Swal.fire({ icon: 'warning', title: 'Unsupported Browser', text: "Your browser doesn't support speech recognition." });
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            try {
                setPrompt('');
                recognitionRef.current.start();
                setIsRecording(true);

                // Set a max duration timeout. If the user talks for 20s straight, stop listening.
                maxDurationTimeoutRef.current = window.setTimeout(() => {
                    if (recognitionRef.current) {
                        recognitionRef.current.stop();
                    }
                }, 20000);

            } catch (error) {
                console.error("Could not start recognition:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Could Not Start',
                    text: 'There was an issue starting voice recognition. Please ensure your microphone is enabled.',
                });
                setIsRecording(false);
            }
        }
    };
    
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
                                <div className={`relative flex-grow rounded-lg ${isRecording ? 'pulse-ring-animation' : ''}`}>
                                    <input
                                        type="text"
                                        value={prompt}
                                        onChange={e => setPrompt(e.target.value)}
                                        placeholder={placeholder}
                                        className="w-full bg-white border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                                        disabled={isLoading}
                                    />
                                </div>
                                <button type="button" onClick={handleMicClick} disabled={isLoading} className={`p-2.5 rounded-full group transition-colors ${isRecording ? 'bg-red-100 animate-pulse' : 'hover:bg-gray-100'}`} aria-label="Use voice input">
                                    <MicIcon isRecording={isRecording} />
                                </button>
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
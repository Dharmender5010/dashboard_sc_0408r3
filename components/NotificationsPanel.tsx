import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpTicket } from '../types';
import { XMarkIcon, CheckCircleIcon, TrashIcon, PaperClipIcon } from './icons';
import { DEVELOPER_EMAIL } from '../services/helpService';

// Declare Swal for TypeScript since it's loaded from a script tag
declare const Swal: any;

interface NotificationsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    tickets: HelpTicket[];
    userEmail: string;
    userName: string;
    userRole: 'Admin' | 'User';
    onUpdateTicket: (ticketId: string, status: string) => Promise<void>;
}

const statusStyles: Record<HelpTicket['status'] | 'Default', string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Resolved: 'bg-green-100 text-green-800',
    'Cancelled by User': 'bg-red-100 text-red-800',
    'Cancelled by Dev': 'bg-gray-100 text-gray-800',
    'Default': 'bg-gray-100 text-gray-800',
};

const TicketItem: React.FC<{ ticket: HelpTicket; isDeveloper: boolean; isOwner: boolean; onUpdate: (ticketId: string, status: string) => void; }> = ({ ticket, isDeveloper, isOwner, onUpdate }) => {
    
    const handleCancel = () => {
        const newStatus = isDeveloper ? 'Cancelled by Dev' : 'Cancelled by User';
        Swal.fire({
            title: 'Are you sure?',
            text: "Do you want to cancel this ticket? This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, cancel it!'
        }).then((result: any) => {
            if (result.isConfirmed) {
                onUpdate(ticket.ticketId, newStatus);
            }
        });
    };

    const handleResolve = () => {
        onUpdate(ticket.ticketId, 'Resolved');
    };

    const timeAgo = (dateString: string) => {
        if (!dateString) return 'a while ago';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'a while ago';

        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-semibold text-gray-700 truncate" title={ticket.ticketId}>
                    {ticket.ticketId}
                </h3>
                <span className={`text-xs font-bold inline-block px-2 py-1 rounded-full ${statusStyles[ticket.status] || statusStyles['Default']}`}>
                    {ticket.status}
                </span>
            </div>
            
            <div className="text-xs text-gray-500 mb-3">
                <span>Raised by <strong>{ticket.userName}</strong> &bull; {timeAgo(ticket.timestamp)}</span>
            </div>

            <p className="my-3 text-gray-700">{ticket.issue}</p>
            
            <div className="flex justify-between items-center text-xs text-gray-500 pt-3 mt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                    {ticket.screenshotLink && (
                        <a href={ticket.screenshotLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                            <PaperClipIcon className="h-4 w-4" /> View Screenshot
                        </a>
                    )}
                </div>
                {ticket.status === 'Pending' && (
                    <div className="flex gap-2">
                        {(isOwner || isDeveloper) && (
                            <button onClick={handleCancel} className="flex items-center gap-1 text-red-600 hover:text-red-800 font-semibold">
                                <TrashIcon className="h-4 w-4" /> Cancel
                            </button>
                        )}
                        {isDeveloper && (
                            <button onClick={handleResolve} className="flex items-center gap-1 text-green-600 hover:text-green-800 font-semibold">
                                <CheckCircleIcon className="h-4 w-4" /> Resolve
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose, tickets, userEmail, userName, userRole, onUpdateTicket }) => {
    const isDeveloper = userEmail.toLowerCase() === DEVELOPER_EMAIL.toLowerCase();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-30 z-30"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-gray-50 z-40 shadow-2xl flex flex-col"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <header className="flex items-center justify-between p-4 border-b bg-white">
                            <h2 className="text-xl font-bold text-gray-800">Notifications & Tickets</h2>
                            <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200">
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </header>
                        <div className="flex-grow p-4 overflow-y-auto space-y-4">
                            {tickets.length > 0 ? (
                                tickets.map(ticket => (
                                    <TicketItem
                                        key={ticket.ticketId}
                                        ticket={ticket}
                                        isDeveloper={isDeveloper}
                                        isOwner={ticket.userEmail.toLowerCase() === userEmail.toLowerCase()}
                                        onUpdate={(id, status) => onUpdateTicket(id, status)}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-20">
                                    <p className="text-gray-500">No tickets to display.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
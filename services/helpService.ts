// For the backend Google Apps Script, see services/googleAppsScript.ts

import { HelpTicket } from '../types';
import { WEB_APP_URL } from './config';

// --- CONFIGURATION ---
export const DEVELOPER_EMAIL = "mis@bonhoeffermachines.in";

interface ScreenshotData {
    mimeType: string;
    fileName: string;
    base64: string;
}

interface HelpRequestPayload {
    email: string;
    userName: string;
    issue: string;
    screenshot: ScreenshotData | null;
}

const handleApiError = (error: unknown, context: string): Error => {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return new Error(`Could not ${context}. This is likely due to a network issue or a problem with the support service configuration. Please check your internet connection and contact the administrator if the problem persists.`);
    }
    if (error instanceof Error) {
         return new Error(`Could not ${context}. Please check your network connection or contact support. Details: ${error.message}`);
    }
    return new Error(`An unknown error occurred while trying to ${context}.`);
}


export const sendHelpRequest = async (payload: HelpRequestPayload): Promise<any> => {
    if (!WEB_APP_URL || WEB_APP_URL.includes('PASTE_YOUR_URL_HERE')) {
        const errorMessage = 'The "Need Help?" feature is not yet configured. Please contact the administrator to set up the support service.';
        console.error('Help Service Error:', errorMessage, 'The `WEB_APP_URL` in `services/config.ts` must be set to a valid Google Apps Script URL.');
        throw new Error(errorMessage);
    }

    const requestBody = { action: 'send_help_request', ...payload };

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(requestBody),
        });

        const result = await response.json();
        
        if (!response.ok || result.success === false) {
           throw new Error(result.message || 'An unknown error occurred on the server.');
        }
        return result;

    } catch (error) {
        throw handleApiError(error, 'submit the help request');
    }
};

export const fetchHelpTickets = async (userEmail: string, userRole: 'Admin' | 'User'): Promise<HelpTicket[]> => {
    if (!WEB_APP_URL || WEB_APP_URL.includes('PASTE_YOUR_URL_HERE')) {
        return [];
    }
    
    const requestBody = { action: 'get_help_tickets', userEmail, userRole };

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(requestBody),
        });
        const result = await response.json();
        if (!response.ok || result.success === false) {
           throw new Error(result.message || 'An unknown error occurred on the server.');
        }
        return result.tickets || [];
    } catch(error) {
        throw handleApiError(error, 'fetch help tickets');
    }
};

export const updateTicketStatus = async (ticketId: string, status: string, userEmail: string, userName: string): Promise<any> => {
     if (!WEB_APP_URL || WEB_APP_URL.includes('PASTE_YOUR_URL_HERE')) {
        throw new Error('The help service is not configured.');
    }
    
    const requestBody = { action: 'update_ticket_status', ticketId, status, userEmail, userName };

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(requestBody),
        });
        const result = await response.json();
        if (!response.ok || result.success === false) {
           throw new Error(result.message || 'An unknown error occurred on the server.');
        }
        return result;
    } catch(error) {
        throw handleApiError(error, 'update ticket status');
    }
}

export const updateMaintenanceStatus = async (status: 'ON' | 'OFF', userEmail: string): Promise<any> => {
     if (!WEB_APP_URL || WEB_APP_URL.includes('PASTE_YOUR_URL_HERE')) {
        throw new Error('The service is not configured.');
    }
    
    const requestBody = { action: 'set_maintenance_mode', status, userEmail };

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(requestBody),
        });
        const result = await response.json();
        if (!response.ok || result.success === false) {
           throw new Error(result.message || 'An unknown error occurred on the server.');
        }
        return result;
    } catch(error) {
        throw handleApiError(error, 'update maintenance status');
    }
};

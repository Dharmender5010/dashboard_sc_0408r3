// A service to handle logging user activity like logins and logouts.
// For the backend Google Apps Script, see services/googleAppsScript.ts
import { WEB_APP_URL } from './config';

/**
 * Logs a user activity event (Login/Logout) to the backend Google Sheet.
 * This is a fire-and-forget function that will not block the UI or throw errors.
 * It uses `navigator.sendBeacon` for logout events to improve reliability.
 * @param email The user's email.
 * @param name The user's name.
 * @param activity The type of activity ('Login' or 'Logout').
 * @param loginMethod The method used for login ('Google' or 'OTP'), or null for logout.
 */
export const logActivity = (email: string, name: string, activity: 'Login' | 'Logout' | 'Toggle Maintenance', loginMethod: 'Google' | 'OTP' | 'ON' | 'OFF' | null = null): void => {
    if (!WEB_APP_URL || WEB_APP_URL.includes('PASTE_YOUR_URL_HERE')) {
        console.error('Activity logging service is not configured. Please set the WEB_APP_URL in services/config.ts');
        return;
    }

    const payload = {
        action: 'log_user_activity',
        email,
        name,
        activity,
        loginMethod,
    };

    try {
        // Use sendBeacon for logout as it's more reliable for requests during page unload.
        if (activity === 'Logout' && navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(payload)], { type: 'text/plain;charset=UTF-8' });
            // sendBeacon returns a boolean, but we don't need to act on it.
            // It will queue the request to be sent by the browser.
            navigator.sendBeacon(WEB_APP_URL, blob);
        } else {
            // Fallback to fetch with keepalive for other cases or if sendBeacon is not available.
            fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload),
                keepalive: true, // Important for requests that might be sent during page unload.
            }).catch(error => {
                // We catch the error here to prevent it from bubbling up and blocking the UI.
                // It's a background task, so we just log the failure.
                console.error(`Failed to log ${activity} activity via fetch:`, error);
            });
        }
    } catch (error) {
        console.error(`An unexpected error occurred while trying to log ${activity} activity:`, error);
    }
};

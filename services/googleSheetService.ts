
import { FollowUpData, UserPermission, PerformanceData, TodaysTaskData } from '../types';
import { WEB_APP_URL } from './config';

interface DashboardDataResponse {
  pendingTasks: FollowUpData[];
  userPermissions: UserPermission[];
  performanceData: PerformanceData[];
  todaysTasks: TodaysTaskData[];
}

/**
 * Fetches all necessary data for the dashboard from a single, consolidated
 * Google Apps Script endpoint.
 * @returns A promise that resolves to an object containing all dashboard data arrays.
 */
export const fetchAllDashboardData = async (): Promise<DashboardDataResponse> => {
    if (!WEB_APP_URL || WEB_APP_URL.includes('PASTE_YOUR_URL_HERE')) {
        const errorMessage = 'The data service is not yet configured. Please contact the administrator to set up the backend service.';
        console.error('Data Service Error:', errorMessage, 'The `WEB_APP_URL` in `services/config.ts` must be set to a valid Google Apps Script URL.');
        throw new Error(errorMessage);
    }
    
    const requestBody = { action: 'get_dashboard_data' };

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
           throw new Error(result.message || 'An unknown error occurred on the server while fetching dashboard data.');
        }

        // The script returns the data nested under a 'data' property
        if (!result.data) {
           throw new Error('Server returned a successful response but the data object was missing.');
        }
        
        // The script now handles all parsing, so we just need to cast the types.
        return {
            pendingTasks: result.data.pendingTasks || [],
            userPermissions: result.data.userPermissions || [],
            performanceData: result.data.performanceData || [],
            todaysTasks: result.data.todaysTasks || [],
        };

    } catch (error) {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            throw new Error(`Could not fetch dashboard data. This is likely due to a network issue or a problem with the backend service. Please check your internet connection and contact the administrator if the problem persists.`);
        }
        if (error instanceof Error) {
            throw new Error(`Could not fetch dashboard data. Details: ${error.message}`);
        }
        throw new Error(`An unknown error occurred while trying to fetch dashboard data.`);
    }
};

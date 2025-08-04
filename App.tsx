
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Joyride, { CallBackProps, STATUS, Step, EVENTS } from 'react-joyride';
import { AnimatePresence, motion } from 'framer-motion';
import { LoginPage } from './components/LoginPage';
import { DashboardPage } from './components/DashboardPage';
import { fetchAllDashboardData } from './services/googleSheetService';
import { fetchHelpTickets, updateTicketStatus, updateMaintenanceStatus, DEVELOPER_EMAIL } from './services/helpService';
import { loginSteps, dashboardStepsAdmin, dashboardStepsUser } from './services/tourService';
import { tts } from './services/ttsService';
import { getAiResponse } from './services/aiService';
import { TourTooltip } from './components/TourTooltip';
import { FollowUpData, UserPermission, PerformanceData, HelpTicket, TodaysTaskData, AiMessage, AiAction } from './types';
import { LoadingComponent } from './components/LoadingComponent';
import Screensaver from './components/Screensaver';
import { MaintenancePage } from './components/MaintenancePage';
import { logActivity } from './services/activityService';
import { AIAssistantButton } from './components/AIAssistantButton';
import { AIAssistantModal } from './components/AIAssistantModal';


// Declare Swal for TypeScript since it's loaded from a script tag
declare const Swal: any;

// --- CONFIGURATION ---
// Easily configurable screensaver start time in milliseconds
const SCREENSAVER_TIMEOUT = 120000;

const App: React.FC = () => {
    const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem('userEmail'));
    const [userName, setUserName] = useState<string | null>(() => localStorage.getItem('userName'));
    const [userRole, setUserRole] = useState<'Admin' | 'User' | null>(() => {
        const role = localStorage.getItem('userRole');
        return (role === 'Admin' || role === 'User') ? role : null;
    });

    const [allData, setAllData] = useState<FollowUpData[]>([]);
    const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
    const [todaysTaskData, setTodaysTaskData] = useState<TodaysTaskData[]>([]);
    const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
    const [helpTickets, setHelpTickets] = useState<HelpTicket[]>([]);
    const [scUserEmails, setScUserEmails] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [maintenanceStatus, setMaintenanceStatus] = useState<'ON' | 'OFF'>('OFF');
    const [countdown, setCountdown] = useState<number>(0); // This is now a duration in seconds, counting up
    const [isMaintenanceToggling, setIsMaintenanceToggling] = useState(false);
    const [isInitialLoadComplete, setIsInitialLoadComplete] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);
    
    // Ref to call methods on DashboardPage from the tour
    const dashboardRef = useRef<any>(null);

    // AI Assistant State
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [conversation, setConversation] = useState<AiMessage[]>([]);
    const [aiOutputMode, setAiOutputMode] = useState<'text_and_voice' | 'text_only'>('text_and_voice');
    const [isAiLoading, setIsAiLoading] = useState(false);


    // Tour state
    const [{ run, steps, stepIndex }, setTourState] = useState<{
        run: boolean;
        steps: Step[];
        stepIndex: number;
    }>({
        run: false,
        steps: [],
        stepIndex: 0,
    });
    
    // Screensaver state
    const [isScreensaverActive, setIsScreensaverActive] = useState(false);
    const inactivityTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    
    const isDeveloper = useMemo(() => userEmail?.toLowerCase() === DEVELOPER_EMAIL.toLowerCase(), [userEmail]);


    const handleUserActivity = useCallback(() => {
        setIsScreensaverActive(false);

        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        inactivityTimerRef.current = setTimeout(() => {
            if (!run && !isAiModalOpen) { // Also prevent screensaver when AI modal is open
                setIsScreensaverActive(true);
            }
        }, SCREENSAVER_TIMEOUT);
    }, [run, isAiModalOpen]);

    useEffect(() => {
        const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
        
        events.forEach(event => window.addEventListener(event, handleUserActivity));
        
        handleUserActivity();

        return () => {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
            events.forEach(event => window.removeEventListener(event, handleUserActivity));
        };
    }, [handleUserActivity]);

    const fetchTickets = useCallback(async () => {
        if (userEmail && userRole) {
            try {
                const tickets = await fetchHelpTickets(userEmail, userRole);
                setHelpTickets(tickets);
            } catch (err) {
                console.error("Failed to fetch help tickets", err);
            }
        }
    }, [userEmail, userRole]);

    // This effect handles ONLY the initial load animation and data fetch.
    useEffect(() => {
        let progressInterval: number;

        // Animate progress to 90% over ~11 seconds, then hold.
        progressInterval = window.setInterval(() => {
            setLoadingProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 1;
            });
        }, 120); // 120ms * 90 steps = 10.8 seconds

        // Fetch initial data
        fetchAllDashboardData()
            .then(dashboardData => {
                // Stop the slow animation
                clearInterval(progressInterval);

                // Set all the data states
                setAllData(dashboardData.pendingTasks);
                setUserPermissions(dashboardData.userPermissions);
                setPerformanceData(dashboardData.performanceData);
                setTodaysTaskData(dashboardData.todaysTasks);
                setLastUpdated(new Date());

                const maintenanceSetting = dashboardData.userPermissions.find(p => p.userType === 'Maintenance' && p.email === 'status');
                const currentStatus = (maintenanceSetting?.name === 'ON') ? 'ON' : 'OFF';
                setMaintenanceStatus(currentStatus);
                
                // Start a fast animation to 100%
                const fastInterval = setInterval(() => {
                    setLoadingProgress(prev => {
                        const next = prev + 5;
                        if (next >= 100) {
                            clearInterval(fastInterval);
                            // After reaching 100%, wait a moment then show the app
                            setTimeout(() => {
                                setIsInitialLoadComplete(true);
                                setIsLoading(false);
                            }, 500);
                            return 100;
                        }
                        return next;
                    });
                }, 40);

            })
            .catch(err => {
                clearInterval(progressInterval);
                const errorMessage = (err instanceof Error) ? err.message : 'Failed to load dashboard data. Please check your connection or contact support.';
                setError(errorMessage);
                console.error(err);
                // Finish loading to show the login page with the error
                setIsInitialLoadComplete(true);
                setIsLoading(false);
            });

        // Cleanup on unmount (though this component shouldn't unmount)
        return () => {
            clearInterval(progressInterval);
        };
    }, []); // Empty dependency array ensures this runs only once on mount.
    
    useEffect(() => {
        if (isInitialLoadComplete && userEmail && userRole) {
            fetchTickets();
        }
    }, [isInitialLoadComplete, userEmail, userRole, fetchTickets]);

    useEffect(() => {
        if (!isInitialLoadComplete) return;

        let timerId: number | undefined;

        if (maintenanceStatus === 'ON') {
            const startTimeString = localStorage.getItem('maintenanceStartTime');
            
            if (startTimeString) {
                const startTime = new Date(startTimeString).getTime();
                
                const updateCountdown = () => {
                    const now = new Date().getTime();
                    const elapsedSeconds = Math.floor((now - startTime) / 1000);
                    setCountdown(elapsedSeconds >= 0 ? elapsedSeconds : 0);
                };
                
                updateCountdown();
                timerId = window.setInterval(updateCountdown, 1000);

            } else {
                setCountdown(0);
            }

        } else {
            setCountdown(0); 
            localStorage.removeItem('maintenanceStartTime');
        }

        return () => {
            if(timerId) clearInterval(timerId);
        };
    }, [maintenanceStatus, isInitialLoadComplete]);


    const handleRefresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const dashboardData = await fetchAllDashboardData();

            setAllData(dashboardData.pendingTasks);
            setUserPermissions(dashboardData.userPermissions);
            setPerformanceData(dashboardData.performanceData);
            setTodaysTaskData(dashboardData.todaysTasks);
            setLastUpdated(new Date());

            const maintenanceSetting = dashboardData.userPermissions.find(p => p.userType === 'Maintenance' && p.email === 'status');
            const currentStatus = (maintenanceSetting?.name === 'ON') ? 'ON' : 'OFF';
            setMaintenanceStatus(currentStatus);
            
            if (userEmail && userRole) {
                await fetchTickets();
            }

        } catch (err) {
            const errorMessage = (err instanceof Error) ? err.message : 'Failed to load dashboard data. Please check your connection or contact support.';
            setError(errorMessage);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [userEmail, userRole, fetchTickets]);

    useEffect(() => {
        if (!isInitialLoadComplete) return;
        
        const intervalId = setInterval(handleRefresh, 60000); 
        return () => clearInterval(intervalId);
    }, [isInitialLoadComplete, handleRefresh]);
    
    useEffect(() => {
        if (userEmail && userPermissions.length > 0) {
            const userPermission = userPermissions.find(p => p.email.toLowerCase() === userEmail.toLowerCase());
            if (userPermission?.name) {
                setUserName(userPermission.name);
                localStorage.setItem('userName', userPermission.name);
            } else {
                handleLogout(false);
            }
        }
    }, [userEmail, userPermissions]);

    useEffect(() => {
        if (userRole === 'Admin' && userPermissions.length > 0) {
            const userEmails = userPermissions
                .filter(p => p.userType === 'User' && p.email)
                .map(p => p.email)
                .sort();
            setScUserEmails(userEmails);
        }
    }, [userRole, userPermissions]);

    useEffect(() => {
        if (run && steps[stepIndex]) {
            const content = steps[stepIndex].content as string;
            tts.speak(content, 'en');
        }
    }, [run, stepIndex, steps]);

    const handleLogin = (email: string, loginMethod: 'Google' | 'OTP') => {
        const normalizedEmail = email.toLowerCase().trim();
        const userPermission = userPermissions.find(p => p.email.toLowerCase() === normalizedEmail);

        if (userPermission && (userPermission.userType === 'Admin' || userPermission.userType === 'User' || userPermission.email.toLowerCase() === DEVELOPER_EMAIL.toLowerCase()) && userPermission.name) {
            Swal.fire({
              position: "center",
              icon: "success",
              title: "Login Successfully!",
              showConfirmButton: false,
              timer: 1500
            });
            
            const trimmedEmail = email.trim();
            const role = userPermission.userType as 'Admin' | 'User';
            const name = userPermission.name;
            
            logActivity(trimmedEmail, name, 'Login', loginMethod);

            localStorage.setItem('userEmail', trimmedEmail);
            localStorage.setItem('userRole', role);
            localStorage.setItem('userName', name);

            setUserEmail(trimmedEmail);
            setUserRole(role);
            setUserName(name);

            handleUserActivity();

            if (role === 'Admin') {
                const userEmails = userPermissions
                    .filter(p => p.userType === 'User' && p.email)
                    .map(p => p.email)
                    .sort();
                setScUserEmails(userEmails);
            }

            // Start the tour automatically if it's the user's first login.
            if (userPermission.loginCount === 0) {
                // Use a timeout to ensure the dashboard has had a moment to render
                setTimeout(() => {
                    handleTourStart('dashboard');
                }, 1000); // 1-second delay
            }
        } else {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Email id not registered or user data is incomplete.",
              footer: 'Please use the "Need Help?" option to contact support.'
            });
        }
    };

    const handleLogout = (showSuccessMessage = true) => {
        if (run) handleTourEnd();

        if (userEmail && userName) {
            logActivity(userEmail, userName, 'Logout', null);
        }

        if (showSuccessMessage) {
            Swal.fire({
              position: "center",
              icon: "success",
              title: "Logout Successfully!",
              showConfirmButton: false,
              timer: 1500
            });
        }

        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        sessionStorage.removeItem('datatable-column-widths');

        setUserEmail(null);
        setUserRole(null);
        setUserName(null);
        setScUserEmails([]);
        setHelpTickets([]);
        
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
    
    const handleTourStart = (page: 'login' | 'dashboard') => {
        let tourSteps: Step[] = [];
        if (page === 'login') {
            tourSteps = loginSteps;
        } else if (page === 'dashboard') {
            tourSteps = userRole === 'Admin' ? dashboardStepsAdmin : dashboardStepsUser;
        }

        setTourState({ run: true, steps: tourSteps, stepIndex: 0 });
    };

    const handleTourEnd = () => {
        tts.stop();
        setTourState({ run: false, steps: [], stepIndex: 0 });
    };

    const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
        if (!userEmail || !userName) {
            Swal.fire('Error', 'User information not available.', 'error');
            return;
        }

        try {
            await updateTicketStatus(ticketId, status, userEmail, userName);
            // Re-fetch tickets to update the UI
            await fetchTickets();
            Swal.fire('Success', 'Ticket status updated successfully.', 'success');
        } catch (err) {
            const errorMessage = (err instanceof Error) ? err.message : 'Failed to update ticket.';
            Swal.fire('Error', errorMessage, 'error');
        }
    };

    const handleUpdateMaintenanceStatus = async (newStatus: 'ON' | 'OFF') => {
        if (!isDeveloper) {
            Swal.fire('Permission Denied', 'Only the developer can change maintenance mode.', 'error');
            return;
        }
        if (isMaintenanceToggling) return;

        const confirmationTitle = `Turn Maintenance Mode ${newStatus}?`;
        const confirmationText = newStatus === 'ON'
            ? "This will block all non-developer users from accessing the application."
            : "This will restore access for all users and turn off maintenance mode.";
        
        const confirmButtonColor = newStatus === 'ON' ? '#ef4444' : '#10b981';

        const result = await Swal.fire({
            title: confirmationTitle,
            text: confirmationText,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: confirmButtonColor,
            cancelButtonColor: '#6b7280',
            confirmButtonText: `Yes, turn it ${newStatus}`,
            cancelButtonText: 'No, cancel'
        });

        if (result.isConfirmed) {
            setIsMaintenanceToggling(true);
            
            Swal.fire({
                title: `Turning Maintenance Mode ${newStatus}`,
                html: `
                    <div class="custom-swal-container-v2">
                        <p class="swal-text-custom-v2">Please wait while the system status is updated.</p>
                        <div class="swal-progress-bar"><div class="swal-progress-bar-inner"></div></div>
                    </div>`,
                customClass: { popup: 'custom-swal-popup-v2' },
                allowOutsideClick: false,
                showConfirmButton: false,
            });

            try {
                if (userEmail) {
                    await updateMaintenanceStatus(newStatus, userEmail);
                    setMaintenanceStatus(newStatus);
                    if (newStatus === 'ON') {
                        localStorage.setItem('maintenanceStartTime', new Date().toISOString());
                        setCountdown(0);
                    }
                    logActivity(userEmail, userName || 'Developer', 'Toggle Maintenance', newStatus);
                    Swal.fire({
                        icon: 'success',
                        title: `Mode ${newStatus}!`,
                        text: `The application is now in ${newStatus} mode.`,
                        timer: 2000,
                        showConfirmButton: false,
                        timerProgressBar: true,
                    });
                }
            } catch (err) {
                const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred.';
                setError(errorMessage);
                Swal.fire({ icon: 'error', title: 'Update Failed', text: errorMessage });
            } finally {
                setIsMaintenanceToggling(false);
            }
        }
    };

    const executeAiAction = (action: AiAction) => {
        if (!action || !action.command) return;

        const isNavigationAction = ['navigate', 'open_report_modal', 'click_mark_done', 'logout', 'toggle_maintenance'].includes(action.command);
        if (isNavigationAction) {
            setTimeout(() => setIsAiModalOpen(false), 1500);
        }

        switch (action.command) {
            case 'navigate':
                if (action.payload && dashboardRef.current) {
                    dashboardRef.current.changeView(action.payload);
                }
                break;
            case 'open_report_modal':
                if (action.payload && dashboardRef.current) {
                    dashboardRef.current.openReportModal(action.payload);
                }
                break;
            case 'apply_filter':
                if (action.payload && dashboardRef.current) {
                    const [filterName, value] = action.payload.split(':');
                    if (filterName && value) {
                        dashboardRef.current.applyFilter(filterName, value);
                    }
                }
                break;
            case 'reset_filters':
                if (dashboardRef.current) {
                    dashboardRef.current.resetFilters();
                }
                break;
            case 'click_mark_done':
                if (action.payload && dashboardRef.current) {
                    const reply = dashboardRef.current.clickMarkDone(action.payload);
                    const newAiMessage: AiMessage = { role: 'assistant', text: reply };
                    setConversation(prev => [...prev, newAiMessage]);
                    if (aiOutputMode === 'text_and_voice') {
                        tts.speak(reply, 'en');
                    }
                }
                break;
            case 'logout':
                setTimeout(() => handleLogout(), 500);
                break;
            case 'toggle_maintenance':
                if (isDeveloper) {
                    const newStatus = maintenanceStatus === 'ON' ? 'OFF' : 'ON';
                    handleUpdateMaintenanceStatus(newStatus);
                } else {
                    const newAiMessage: AiMessage = { role: 'assistant', text: "Sorry, only developers can perform this action." };
                    setConversation(prev => [...prev, newAiMessage]);
                     if (aiOutputMode === 'text_and_voice') {
                        tts.speak(newAiMessage.text, 'en');
                    }
                }
                break;
            default:
                console.warn('Unknown AI command:', action.command);
        }
    };

    const handleSendMessageToAi = async (message: string) => {
        if (!message.trim()) return;

        const userMessage: AiMessage = { role: 'user', text: message };
        setConversation(prev => [...prev, userMessage]);
        setIsAiLoading(true);

        try {
            const context = {
                user: { email: userEmail, name: userName, role: userRole, isDeveloper },
                dashboardState: dashboardRef.current ? dashboardRef.current.getCurrentState() : {},
                dataSummary: {
                    totalLeads: allData.length,
                    pendingLeads: allData.filter(d => d.lastStatus?.toLowerCase().includes('pending')).length,
                    uniqueStepCodes: [...new Set(allData.map(d => d.stepCode))],
                }
            };

            const aiResponse = await getAiResponse(message, context);
            const assistantMessage: AiMessage = { role: 'assistant', text: aiResponse.reply };
            setConversation(prev => [...prev, assistantMessage]);

            if (aiOutputMode === 'text_and_voice') {
                tts.speak(aiResponse.reply, aiResponse.language);
            }

            if (aiResponse.action && aiResponse.action.command) {
                executeAiAction(aiResponse.action);
            }

        } catch (error) {
            const errorMessage = (error instanceof Error) ? error.message : "Sorry, I encountered an error.";
            const systemMessage: AiMessage = { role: 'system', text: errorMessage };
            setConversation(prev => [...prev, systemMessage]);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleResetConversation = () => {
        setConversation([]);
    };

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, type, index, action, step } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            handleTourEnd();
            return;
        }

        if (action === 'close') {
            handleTourEnd();
            return;
        }
        
        if (type === EVENTS.STEP_AFTER) {
            let delay = 0;
            const customAction = (step as any).action;

            if (customAction && dashboardRef.current) {
                const { type: actionType, payload } = customAction;
                delay = 500;
                
                switch(actionType) {
                    case 'changeView':
                        dashboardRef.current.changeView(payload);
                        break;
                    case 'openReportModal':
                        dashboardRef.current.openReportModal(payload);
                        break;
                    case 'closeReportModal':
                        dashboardRef.current.closeReportModal();
                        break;
                }
            }

            // A small delay to allow UI to settle before moving to the next step's tooltip
            setTimeout(() => {
                if(data.type === EVENTS.STEP_AFTER) {
                    const newStepIndex = index + (action === 'next' ? 1 : -1);
                    setTourState(prev => ({...prev, stepIndex: newStepIndex}));
                }
            }, delay);
        }
    };

    if (isLoading && !isInitialLoadComplete) {
        return <LoadingComponent progress={loadingProgress} />;
    }

    if (maintenanceStatus === 'ON' && !isDeveloper) {
        return <MaintenancePage />;
    }

    if (!userEmail || !userRole) {
        return (
            <AnimatePresence mode="wait">
                <LoginPage onLogin={handleLogin} error={error} onStartTour={() => handleTourStart('login')} />
            </AnimatePresence>
        );
    }
    
    return (
        <>
            <Joyride
                callback={handleJoyrideCallback}
                continuous
                run={run}
                stepIndex={stepIndex}
                steps={steps}
                showProgress
                showSkipButton
                tooltipComponent={TourTooltip}
                styles={{
                    options: {
                        zIndex: 10000,
                    },
                }}
            />
            <AnimatePresence>
                {isScreensaverActive && <Screensaver />}
            </AnimatePresence>
            
            <DashboardPage
                ref={dashboardRef}
                userEmail={userEmail}
                userName={userName || ''}
                userRole={userRole}
                scUserEmails={scUserEmails}
                data={allData}
                performanceData={performanceData}
                todaysTaskData={todaysTaskData}
                helpTickets={helpTickets}
                onUpdateTicket={handleUpdateTicketStatus}
                onLogout={handleLogout}
                onRefresh={handleRefresh}
                isRefreshing={isLoading}
                lastUpdated={lastUpdated}
                onStartTour={() => handleTourStart('dashboard')}
                maintenanceStatus={maintenanceStatus}
                onUpdateMaintenanceStatus={handleUpdateMaintenanceStatus}
                isMaintenanceToggling={isMaintenanceToggling}
                countdown={countdown}
            />
            
            <AIAssistantButton onClick={() => setIsAiModalOpen(true)} />
            <AIAssistantModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                conversation={conversation}
                onSendMessage={handleSendMessageToAi}
                isLoading={isAiLoading}
                outputMode={aiOutputMode}
                setOutputMode={setAiOutputMode}
                onResetConversation={handleResetConversation}
            />
        </>
    );
};

export default App;

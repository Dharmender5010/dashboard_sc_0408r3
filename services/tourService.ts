
// Define a custom step type that includes our 'action' property.
// The original `interface TourStep extends Step` was causing a type error where `target` was not recognized.
// By defining the full shape of our tour steps directly, we resolve the issue.
// This interface is structurally compatible with the `Step` type from `react-joyride`.
interface TourStep {
  target: string;
  content: string;
  title: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto' | 'center';
  disableBeacon?: boolean;
  action?: {
    type: 'changeView' | 'openReportModal' | 'closeReportModal';
    payload?: any;
  };
}

export const loginSteps: TourStep[] = [
  {
    target: '#login-title',
    content: "Hello! Welcome to the SC-Dashboard. I'm here to give you a quick tour of the application.",
    placement: 'bottom',
    title: 'Welcome!',
    disableBeacon: true,
  },
  {
    target: '#google-login-button-container',
    content: 'You can sign in quickly and securely using your authorized Google account. Just click this button to proceed.',
    placement: 'bottom',
    title: 'Option 1: Sign In With Google',
  },
  {
    target: '#otp-login-container',
    content: 'Alternatively, you can enter your registered email address here and click "Send OTP". We\'ll email you a code to log in.',
    placement: 'top',
    title: 'Option 2: Email & OTP',
  },
  {
    target: '#help-image-button',
    content: 'If you need any assistance, click our friendly support assistant here to open the help form.',
    placement: 'left',
    title: 'Need Help?',
  },
  {
    target: '#floating-nav-toggle',
    content: 'If you ever want to retake this tour, click this icon.',
    placement: 'right',
    title: 'Tour Menu',
  },
];

export const dashboardStepsAdmin: TourStep[] = [
    {
        target: '#header-title',
        content: "Welcome, Admin! This tour will guide you through the key features of your dashboard.",
        placement: 'bottom',
        title: 'Dashboard Tour',
        disableBeacon: true,
    },
    {
        target: '#performance-cards-container',
        content: "Here's an overview of today's performance. The 'Calls Made', 'Meeting Fixed', and 'FollowUps Done' cards are clickable for more details.",
        placement: 'bottom',
        title: "Today's Performance",
    },
    {
        target: '#performance-cards-container',
        content: "Let's open the report for 'Calls Made' to see a detailed breakdown.",
        placement: 'bottom',
        title: "Detailed Reports",
        action: { type: 'openReportModal', payload: 'Calls Made' }
    },
    {
        target: '#report-modal',
        content: "This report modal shows SC performance via charts and a detailed data table. You can even go full-screen for a better view.",
        placement: 'center',
        title: "Performance Report",
    },
    {
        target: '#report-modal',
        content: "Now, let's close this and continue the tour.",
        placement: 'center',
        title: "Closing the Report",
        action: { type: 'closeReportModal' }
    },
    {
        target: '#admin-sc-filter-container',
        content: 'As an Admin, you can use this filter to see the dashboard from the perspective of any specific Sales Coordinator.',
        placement: 'bottom',
        title: 'Filter by SC Email',
    },
    {
        target: '#page-navigation-container',
        content: "This central button allows you to navigate between the main Dashboard and the Performance analysis page.",
        placement: 'top',
        title: 'Page Navigation'
    },
    {
        target: '#page-navigation-container',
        content: "Let's switch over to the Performance page now.",
        placement: 'top',
        title: 'Switching Views',
        action: { type: 'changeView', payload: 'performance' }
    },
    {
        target: 'body',
        content: "The Performance page offers a historical view of completed tasks. You can filter by SC and date range to analyze trends.",
        placement: 'center',
        title: 'Performance Page'
    },
    {
        target: 'body',
        content: "We'll head back to the main dashboard to finish up.",
        placement: 'center',
        title: "Back to Dashboard",
        action: { type: 'changeView', payload: 'dashboard' }
    },
    {
        target: '#help-image-button',
        content: 'If you need any assistance, just click our friendly support assistant here to open the help form.',
        placement: 'left',
        title: 'Need Help?',
    },
    {
        target: '#floating-nav-toggle',
        content: 'You can retake this tour anytime by clicking this icon.',
        placement: 'right',
        title: 'Tour Menu',
    },
    {
        target: '#header-logout-button',
        content: 'That concludes the tour! When you are finished, you can log out securely using this button.',
        placement: 'bottom',
        title: 'Logout',
    }
];

export const dashboardStepsUser: TourStep[] = [
    {
        target: '#header-title',
        content: "Welcome! This tour will guide you through the key features of your dashboard.",
        placement: 'bottom',
        title: 'Dashboard Tour',
        disableBeacon: true,
    },
    {
        target: '#performance-cards-container',
        content: "These cards show your performance for today. Cards like 'FollowUps Done' are clickable for a detailed report of your tasks.",
        placement: 'bottom',
        title: "Your Performance",
    },
    {
        target: '#performance-cards-container',
        content: "Let's open your 'FollowUps Done' report.",
        placement: 'bottom',
        title: "Detailed Reports",
        action: { type: 'openReportModal', payload: 'FollowUps Done' }
    },
    {
        target: '#report-modal',
        content: "This report shows your completed tasks with a breakdown by Step Code. You can go full-screen to see more.",
        placement: 'center',
        title: "Your Report",
    },
    {
        target: '#report-modal',
        content: "Now, let's close this and continue the tour.",
        placement: 'center',
        title: "Closing the Report",
        action: { type: 'closeReportModal' }
    },
    {
        target: '#page-navigation-container',
        content: "This central button allows you to navigate between your main Dashboard and the Performance analysis page.",
        placement: 'top',
        title: 'Page Navigation'
    },
    {
        target: '#page-navigation-container',
        content: "Let's switch to the Performance page.",
        placement: 'top',
        title: 'Switching Views',
        action: { type: 'changeView', payload: 'performance' }
    },
    {
        target: 'body',
        content: "This page shows a history of all your completed tasks. You can filter by date range to review your work.",
        placement: 'center',
        title: 'Performance History'
    },
    {
        target: 'body',
        content: "Let's go back to the main dashboard.",
        placement: 'center',
        title: "Back to Dashboard",
        action: { type: 'changeView', payload: 'dashboard' }
    },
    {
        target: '#help-image-button',
        content: 'If you need any assistance, just click our friendly support assistant here to open the help form.',
        placement: 'left',
        title: 'Need Help?',
    },
    {
        target: '#floating-nav-toggle',
        content: 'You can retake this tour anytime using this handy menu.',
        placement: 'right',
        title: 'Tour Menu',
    },
    {
        target: '#header-logout-button',
        content: 'That concludes the tour! You can log out securely from here. Enjoy using the dashboard!',
        placement: 'bottom',
        title: 'Logout',
    }
];
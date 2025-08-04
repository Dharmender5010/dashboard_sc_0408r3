
export interface FollowUpData {
  leadId: string;
  personName: string;
  mobile: number | null;
  state: string;
  requirement: string;
  salesPerson: string;
  stepName: string;
  stepCode: string;
  daysOfFollowUp: number | null;
  numberOfFollowUps: number | null;
  planned: string;
  actual: string;
  lastStatus: string;
  link: string;
  scEmail: string;
  doer: string;
  remark: string;
  lastPlannedDcDoor: string;
}

export interface UserPermission {
  userType: string;
  email: string;
  name: string;
  loginCount: number;
}

export interface PerformanceData {
  scEmail: string;
  sc: string;
  leadsAssign: number;
  callsMade: number;
  meetingFixed: number;
  onFollowUps: number;
  followUpsDone: number;
  connectedCallsMade: number;
  connectedFollowUpsDone: number;
}

export interface HelpTicket {
  ticketId: string;
  timestamp: string;
  userEmail: string;
  userName: string;
  issue: string;
  screenshotLink: string;
  status: 'Pending' | 'Resolved' | 'Cancelled by User' | 'Cancelled by Dev';
  lastUpdated: string;
  resolvedBy: string;
}

export interface ClickInfo {
    timestamp: number;
    date: string; // Format: "YYYY-MM-DD"
}

export interface TodaysTaskData {
  leadId: string;
  personName: string;
  mobile: number | null;
  stepCode: string;
  planned: string;
  actual: string;
  status: string;
  remark: string;
  scEmail: string;
  doer: string;
  category: string;
  lastActual: string;
}

// --- AI Assistant Types ---

export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
}

export interface AiAction {
  command: 'navigate' | 'open_report_modal' | 'apply_filter' | 'reset_filters' | 'click_mark_done' | 'logout' | 'toggle_maintenance' | null;
  payload: string | null;
}

// Module augmentation for framer-motion to fix widespread type errors.
// This is a workaround for a potential version mismatch or configuration issue
// where TypeScript doesn't correctly recognize framer-motion's animation props.
import 'framer-motion';

declare module 'framer-motion' {
    export interface MotionProps {
        initial?: any;
        animate?: any;
        exit?: any;
        whileHover?: any;
        whileTap?: any;
        whileFocus?: any;
        whileInView?: any;
        variants?: any;
        transition?: any;
        layout?: any;
        layoutId?: any;
        drag?: any;
        dragConstraints?: any;
        dragMomentum?: any;
    }
}

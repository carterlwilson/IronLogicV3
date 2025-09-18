// Schedule Template types
import type {ClientEnrollment} from "./index";

export interface ScheduleTemplate {
    _id: string;
    gymId: string;
    name: string;
    description?: string;
    assignedCoachId?: string;
    timeslots: TemplateTimeslot[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    // Virtual fields
    totalTimeslots?: number;
    totalCoaches?: number;
}

export interface TemplateTimeslot {
    timeslotId: string;
    dayOfWeek: number; // 1-7 (Monday-Sunday)
    startTime: string; // "09:00" format
    endTime: string;   // "10:00" format
    location: string;
    coachId?: string;
    maxCapacity: number;
    className?: string;
    notes?: string;
    isActive: boolean;
}

export interface WeeklyTimeslot {
    timeslotId: string;
    templateTimeslotId: string;
    dayOfWeek: number; // 1-7 (Monday-Sunday)
    startTime: string; // "09:00" format
    endTime: string;   // "10:00" format
    location: string;
    coachId?: string;
    maxCapacity: number;
    className?: string;
    notes?: string;
    isActive: boolean;
    enrollments: ClientEnrollment[];
    actualStartTime?: string;
    actualEndTime?: string;
}

// Weekly Schedule Types
export interface WeeklySchedule {
    _id: string;
    gymId: string;
    templateId: string;
    status: 'draft' | 'published' | 'active' | 'completed' | 'cancelled';
    assignedCoachId?: string;
    timeslots: WeeklyTimeslot[];
    totalEnrollments?: number;
    totalAvailableSpots?: number;
    notes?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    publishedAt?: string;
    publishedBy?: string;
}

export interface ScheduleStats {
    currentWeek: {
        totalTimeslots: number;
        totalEnrollments: number;
        totalCapacity: number;
    };
    schedulesByStatus: Array<{
        _id: string;
        count: number;
    }>;
    weeklyUtilization: Array<{
        week: string;
        enrollments: number;
        capacity: number;
        utilization: number;
    }>;
}
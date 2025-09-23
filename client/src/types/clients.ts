// Client Types
export interface Client {
    _id: string;
    userId: string;
    gymId: string;
    personalInfo: {
        firstName: string;
        lastName: string;
        dateOfBirth?: string;
        phone?: string;
        emergencyContact?: {
            name: string;
            phone: string;
            relationship: string;
        };
    };
    currentProgram?: {
        programId: string;
        currentBlockIndex: number;
        currentWeekIndex: number;
    };
    activeBenchmarks: ClientBenchmark[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ClientBenchmark {
    benchmarkId: string;
    templateId: string;
    value: {
        weight?: number;
        time?: number;
        reps?: number;
    };
    unit: string;
    recordedAt: string;
    recordedBy: string;
}

export interface ClientEnrollment {
    clientId: string;
    enrolledAt: string;
    status: 'enrolled' | 'cancelled' | 'completed' | 'no-show';
    notes?: string;
}
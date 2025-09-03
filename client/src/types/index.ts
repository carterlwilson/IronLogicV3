// Client-specific types (serialized for JSON/API communication)

export interface Gym {
  _id: string;
  name: string;
  ownerId: string | null;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  locations: GymLocation[];
  coachCount: number;
  clientCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GymLocation {
  locationId: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  capacity: number;
  amenities: string[];
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
  isActive: boolean;
}

// Workout Program Types
export interface WorkoutProgram {
  _id: string;
  name: string;
  gymId: string;
  description?: string;
  blocks: ProgramBlock[];
  durationWeeks: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  isActive: boolean;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramBlock {
  blockId: string;
  name: string;
  description?: string;
  orderIndex: number;
  volumeTargets: VolumeTarget[];
  weeks: ProgramWeek[];
}

export interface ProgramWeek {
  weekId: string;
  weekNumber: number;
  description?: string;
  volumeTargets: VolumeTarget[];
  days: ProgramDay[];
}

export interface ProgramDay {
  dayId: string;
  dayOfWeek: number; // 1-7
  name?: string;
  activities: ProgramActivity[];
}

export interface ProgramActivity {
  activityId: string;
  templateId: string;
  orderIndex: number;
  sets?: number;
  reps?: number;
  restPeriod?: number; // seconds
  intensityPercentage?: number;
  duration?: number; // seconds
  distance?: number; // meters
  notes?: string;
  type: 'strength' | 'conditioning' | 'diagnostic';
}

export interface VolumeTarget {
  activityGroup: string;
  targetPercentage: number;
}

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
  membershipInfo: {
    startDate: string;
    membershipType: string;
    isActive: boolean;
  };
  currentProgram?: {
    programId: string;
    currentBlockIndex: number;
    currentWeekIndex: number;
    startDate: string;
  };
  activeBenchmarks: ClientBenchmark[];
  coachId?: string;
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
// Client-specific types (serialized for JSON/API communication)

// Workout Program Types
export interface WorkoutProgram {
  _id: string;
  name: string;
  gymId: string;
  description?: string;
  blocks: ProgramBlock[];
  durationWeeks: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  isActive: boolean;
  isTemplate: boolean;
  version: number;
  parentProgramId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
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
  templateName: string; // Name of the activity template
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
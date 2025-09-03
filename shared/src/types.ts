import { ObjectId } from 'mongodb';

export type UserType = 'admin' | 'gym_owner' | 'coach' | 'client';

export interface User {
  _id: ObjectId;
  email: string;
  password: string;
  name: string;
  userType: UserType;
  gymId: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLogin?: Date;
  refreshToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

export interface Gym {
  _id: ObjectId;
  name: string;
  ownerId: ObjectId | null;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  locations: GymLocation[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  coachCount: number;
  clientCount: number;
}

export interface GymLocation {
  locationId: ObjectId;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  isActive: boolean;
}

// Activity Template interfaces
export interface ActivityGroup {
  _id: string;
  name: string;
  gymId?: string | null; // null for global activity groups
  description?: string;
  count: number; // Number of activities using this group
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityTemplate {
  _id: string;
  name: string;
  gymId?: string | null; // null for global activities
  activityGroupId: string;
  activityGroup?: ActivityGroup; // Populated when needed
  benchmarkTemplateId?: string | null; // reference to BenchmarkTemplate for intensity calculations
  benchmarkTemplate?: BenchmarkTemplate; // Populated when needed
  type: 'primary lift' | 'accessory lift' | 'conditioning' | 'diagnostic';
  description?: string | undefined;
  instructions?: string | undefined;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  _id: ObjectId;
  userId: ObjectId;
  gymId: ObjectId;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    phone: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  membershipInfo: {
    startDate: Date;
    membershipType: string;
    isActive: boolean;
  };
  currentProgram?: {
    programId: ObjectId;
    currentBlockIndex: number;
    currentWeekIndex: number;
    startDate: Date;
  };
  activeBenchmarks: ClientBenchmark[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Coach {
  _id: ObjectId;
  userId: ObjectId;
  gymId: ObjectId;
  personalInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  specializations: string[];
  hireDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}


export type BenchmarkType = 'weight' | 'time' | 'reps';
export type BenchmarkUnit = 'lbs' | 'kg' | 'seconds' | 'reps';

export interface BenchmarkTemplate {
  _id: ObjectId;
  name: string;
  gymId: ObjectId | null;
  type: BenchmarkType;
  unit: BenchmarkUnit;
  description: string;
  instructions: string;
  notes: string;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
}

export interface ClientBenchmark {
  benchmarkId: ObjectId;
  templateId: ObjectId;
  value: {
    weight?: number;
    time?: number;
    reps?: number;
  };
  unit: BenchmarkUnit;
  recordedAt: Date;
  recordedBy: ObjectId;
}

export interface WorkoutProgram {
  _id: ObjectId;
  name: string;
  gymId: ObjectId;
  description: string;
  blocks: ProgramBlock[];
  durationWeeks: number;
  isActive: boolean;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  parentProgramId?: ObjectId;
}

export interface ProgramBlock {
  blockId: ObjectId;
  name: string;
  description: string;
  orderIndex: number;
  volumeTargets: VolumeTarget[];
  weeks: ProgramWeek[];
}

export interface ProgramWeek {
  weekId: ObjectId;
  weekNumber: number;
  description: string;
  volumeTargets: VolumeTarget[];
  days: ProgramDay[];
}

export interface ProgramDay {
  dayId: ObjectId;
  dayOfWeek: number;
  name: string;
  activities: ProgramActivity[];
}

export interface ProgramActivity {
  activityId: ObjectId;
  templateId: ObjectId;
  orderIndex: number;
  sets?: number;
  reps?: number;
  restPeriod?: number;
  intensityPercentage?: number;
  notes?: string;
  duration?: number;
  distance?: number;
  type: 'strength' | 'conditioning' | 'diagnostic';
}

export interface VolumeTarget {
  activityGroup: string;
  targetPercentage: number;
}

export interface ScheduleTemplate {
  _id: ObjectId;
  gymId: ObjectId;
  name: string;
  description: string;
  isDefault: boolean;
  timeslots: TemplateTimeslot[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
}

export interface TemplateTimeslot {
  timeslotId: ObjectId;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  locationId: ObjectId;
  coachId: ObjectId;
  programId: ObjectId;
  maxCapacity: number;
  className: string;
  notes?: string;
  isActive: boolean;
}

export type ScheduleStatus = 'draft' | 'active' | 'completed';
export type EnrollmentStatus = 'enrolled' | 'checked_in' | 'completed' | 'no_show';

export interface WeeklySchedule {
  _id: ObjectId;
  gymId: ObjectId;
  weekStartDate: Date;
  templateId?: ObjectId;
  status: ScheduleStatus;
  timeslots: WeeklyTimeslot[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
}

export interface WeeklyTimeslot {
  timeslotId: ObjectId;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  locationId: ObjectId;
  coachId: ObjectId;
  programId: ObjectId;
  maxCapacity: number;
  className: string;
  notes?: string;
  enrolledClients: ClientEnrollment[];
  currentEnrollment: number;
  isAvailable: boolean;
}

export interface ClientEnrollment {
  clientId: ObjectId;
  enrolledAt: Date;
  status: EnrollmentStatus;
  enrolledBy: ObjectId;
}

export interface ClientBenchmarkHistory {
  _id: ObjectId;
  clientId: ObjectId;
  benchmarkTemplateId: ObjectId;
  value: {
    weight?: number;
    time?: number;
    reps?: number;
  };
  unit: BenchmarkUnit;
  recordedAt: Date;
  recordedBy: ObjectId;
  notes?: string;
  programContext?: {
    programId: ObjectId;
    blockIndex: number;
    weekIndex: number;
  };
}
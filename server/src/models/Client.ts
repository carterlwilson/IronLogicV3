import { Schema, model, Document } from 'mongoose';

export interface IClient extends Document {
  userId: Schema.Types.ObjectId;
  gymId: Schema.Types.ObjectId;
  personalInfo: {
    dateOfBirth?: Date;
    phone?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    fitnessGoals?: string[];
    medicalConditions?: string[];
    preferences?: {
      preferredCoaches?: Schema.Types.ObjectId[];
      workoutTimes?: string[];
      notificationPreferences?: {
        email: boolean;
        sms: boolean;
        push: boolean;
      };
    };
  };
  membershipInfo: {
    joinDate: Date;
    membershipType?: string;
    isActive: boolean;
    freezeHistory?: [{
      startDate: Date;
      endDate?: Date;
      reason?: string;
    }];
  };
  currentProgram?: {
    programId: Schema.Types.ObjectId;
    startDate: Date;
    currentWeek: number;
    currentDay: number;
    completedDays: number[];
    notes?: string;
  };
  activeBenchmarks: [{
    templateId: Schema.Types.ObjectId;
    currentValue?: {
      weight?: number;
      time?: number;
      reps?: number;
      distance?: number;
    };
    lastUpdated?: Date;
    targetValue?: {
      weight?: number;
      time?: number;
      reps?: number;
      distance?: number;
    };
    notes?: string;
  }];
  coachAssignments?: [{
    coachId: Schema.Types.ObjectId;
    assignedDate: Date;
    isActive: boolean;
    specialization?: string;
  }];
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  gymId: {
    type: Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  personalInfo: {
    dateOfBirth: Date,
    phone: String,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    },
    fitnessGoals: [String],
    medicalConditions: [String],
    preferences: {
      preferredCoaches: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      workoutTimes: [String],
      notificationPreferences: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true }
      }
    }
  },
  membershipInfo: {
    joinDate: { type: Date, default: Date.now },
    membershipType: String,
    isActive: { type: Boolean, default: true },
    freezeHistory: [{
      startDate: Date,
      endDate: Date,
      reason: String
    }]
  },
  currentProgram: {
    programId: { type: Schema.Types.ObjectId, ref: 'WorkoutProgram' },
    startDate: Date,
    currentWeek: { type: Number, default: 1 },
    currentDay: { type: Number, default: 1 },
    completedDays: [Number],
    notes: String
  },
  activeBenchmarks: [{
    templateId: { type: Schema.Types.ObjectId, ref: 'BenchmarkTemplate' },
    currentValue: {
      weight: Number,
      time: Number,
      reps: Number,
      distance: Number
    },
    lastUpdated: Date,
    targetValue: {
      weight: Number,
      time: Number,
      reps: Number,
      distance: Number
    },
    notes: String
  }],
  coachAssignments: [{
    coachId: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    specialization: String
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc, ret) {
      return ret;
    }
  }
});

// Indexes for performance
clientSchema.index({ userId: 1 }, { unique: true });
clientSchema.index({ gymId: 1 });
clientSchema.index({ 'membershipInfo.isActive': 1 });
clientSchema.index({ 'currentProgram.programId': 1 });
clientSchema.index({ 'activeBenchmarks.templateId': 1 });
clientSchema.index({ 'coachAssignments.coachId': 1, 'coachAssignments.isActive': 1 });

// Static methods
clientSchema.statics.findByUserId = function(userId: Schema.Types.ObjectId) {
  return this.findOne({ userId });
};

clientSchema.statics.findByGymId = function(gymId: Schema.Types.ObjectId) {
  return this.find({ gymId, 'membershipInfo.isActive': true });
};

export const Client = model<IClient>('Client', clientSchema);
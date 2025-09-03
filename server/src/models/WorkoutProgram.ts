import { Schema, model, Document, Types } from 'mongoose';

// Activity within a program day
interface ProgramActivity {
  activityId: Types.ObjectId;
  templateId: Types.ObjectId; // reference to ActivityTemplate
  orderIndex: number;
  // Activity parameters
  sets?: number;
  reps?: number;
  restPeriod?: number; // in seconds
  intensityPercentage?: number; // percentage of 1RM for benchmark calculations
  notes?: string;
  // For conditioning activities
  duration?: number; // in seconds
  distance?: number; // in meters
  // Activity type
  type: 'strength' | 'conditioning' | 'diagnostic';
}

// Day within a program week
interface ProgramDay {
  dayId: Types.ObjectId;
  dayOfWeek: number; // 1-7 (Monday-Sunday)
  name?: string; // e.g., "Upper Body Strength"
  activities: ProgramActivity[];
}

// Volume targets for activity groups
interface VolumeTarget {
  activityGroup: string; // e.g., "bench_press"
  targetPercentage: number; // e.g., 50 for 50%
}

// Week within a program block
interface ProgramWeek {
  weekId: Types.ObjectId;
  weekNumber: number;
  description?: string;
  // Volume targets at week level (overrides block level)
  volumeTargets: VolumeTarget[];
  days: ProgramDay[];
}

// Block within a program
interface ProgramBlock {
  blockId: Types.ObjectId;
  name: string;
  description?: string;
  orderIndex: number;
  // Volume targets at block level
  volumeTargets: VolumeTarget[];
  weeks: ProgramWeek[];
}

// Main WorkoutProgram interface
export interface WorkoutProgram extends Document {
  _id: Types.ObjectId;
  name: string;
  gymId: Types.ObjectId; // reference to Gym
  description?: string;
  // Program structure
  blocks: ProgramBlock[];
  // Program metadata
  durationWeeks: number; // total duration calculated from blocks
  isActive: boolean;
  isTemplate: boolean; // true if it's a template program
  createdAt: Date;
  updatedAt: Date;
  // Version control
  version: number;
  parentProgramId?: Types.ObjectId; // for program templates/copies
}

// Activity schema
const activitySchema = new Schema<ProgramActivity>({
  activityId: {
    type: Schema.Types.ObjectId,
    default: () => new Types.ObjectId(),
    required: true
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'ActivityTemplate',
    required: true
  },
  orderIndex: {
    type: Number,
    required: true,
    default: 0
  },
  // Activity parameters
  sets: {
    type: Number,
    min: 0,
    validate: {
      validator: function(this: ProgramActivity, value: number) {
        return this.type === 'strength' ? value > 0 : true;
      },
      message: 'Sets must be greater than 0 for strength activities'
    }
  },
  reps: {
    type: Number,
    min: 0,
    validate: {
      validator: function(this: ProgramActivity, value: number) {
        return this.type === 'strength' ? value > 0 : true;
      },
      message: 'Reps must be greater than 0 for strength activities'
    }
  },
  restPeriod: {
    type: Number,
    min: 0,
    default: 60 // default 60 seconds rest
  },
  intensityPercentage: {
    type: Number,
    min: 0,
    max: 200, // allow up to 200% for advanced programming
    validate: {
      validator: function(this: ProgramActivity, value: number) {
        return this.type === 'strength' ? value > 0 : true;
      },
      message: 'Intensity percentage required for strength activities'
    }
  },
  notes: {
    type: String,
    maxlength: 500
  },
  // For conditioning activities
  duration: {
    type: Number,
    min: 0,
    validate: {
      validator: function(this: ProgramActivity, value: number) {
        return this.type === 'conditioning' ? value > 0 : true;
      },
      message: 'Duration required for conditioning activities'
    }
  },
  distance: {
    type: Number,
    min: 0
  },
  // Activity type
  type: {
    type: String,
    enum: ['strength', 'conditioning', 'diagnostic'],
    required: true,
    default: 'strength'
  }
}, { _id: false });

// Day schema
const daySchema = new Schema<ProgramDay>({
  dayId: {
    type: Schema.Types.ObjectId,
    default: () => new Types.ObjectId(),
    required: true
  },
  dayOfWeek: {
    type: Number,
    min: 1,
    max: 7,
    required: true
  },
  name: {
    type: String,
    maxlength: 100,
    trim: true
  },
  activities: [activitySchema]
}, { _id: false });

// Volume target schema
const volumeTargetSchema = new Schema<VolumeTarget>({
  activityGroup: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  targetPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, { _id: false });

// Week schema
const weekSchema = new Schema<ProgramWeek>({
  weekId: {
    type: Schema.Types.ObjectId,
    default: () => new Types.ObjectId(),
    required: true
  },
  weekNumber: {
    type: Number,
    required: true,
    min: 1
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  volumeTargets: [volumeTargetSchema],
  days: [daySchema]
}, { _id: false });

// Block schema
const blockSchema = new Schema<ProgramBlock>({
  blockId: {
    type: Schema.Types.ObjectId,
    default: () => new Types.ObjectId(),
    required: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  orderIndex: {
    type: Number,
    required: true,
    default: 0
  },
  volumeTargets: [volumeTargetSchema],
  weeks: [weekSchema]
}, { _id: false });

// Main WorkoutProgram schema
const workoutProgramSchema = new Schema<WorkoutProgram>({
  name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  gymId: {
    type: Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  description: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  blocks: [blockSchema],
  durationWeeks: {
    type: Number,
    required: true,
    min: 1,
    max: 104 // max 2 years
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  parentProgramId: {
    type: Schema.Types.ObjectId,
    ref: 'WorkoutProgram'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
workoutProgramSchema.index({ gymId: 1, isActive: 1 });
workoutProgramSchema.index({ gymId: 1, isTemplate: 1 });
workoutProgramSchema.index({ 'blocks.weeks.days.activities.templateId': 1 });

// Pre-save middleware to calculate total duration
workoutProgramSchema.pre('save', function(this: WorkoutProgram) {
  if (this.blocks && this.blocks.length > 0) {
    const totalWeeks = this.blocks.reduce((total, block) => {
      return total + (block.weeks ? block.weeks.length : 0);
    }, 0);
    this.durationWeeks = totalWeeks;
  }
});

// Virtual for calculating total activities across all blocks
workoutProgramSchema.virtual('totalActivities').get(function(this: WorkoutProgram) {
  return this.blocks.reduce((total, block) => {
    return total + block.weeks.reduce((weekTotal, week) => {
      return weekTotal + week.days.reduce((dayTotal, day) => {
        return dayTotal + day.activities.length;
      }, 0);
    }, 0);
  }, 0);
});

// Static method to validate program structure
workoutProgramSchema.statics.validateStructure = function(programData: Partial<WorkoutProgram>) {
  const errors: string[] = [];
  
  if (!programData.blocks || programData.blocks.length === 0) {
    errors.push('Program must have at least one block');
  }
  
  if (programData.blocks) {
    programData.blocks.forEach((block, blockIndex) => {
      if (!block.weeks || block.weeks.length === 0) {
        errors.push(`Block ${blockIndex + 1} must have at least one week`);
      }
      
      if (block.weeks) {
        block.weeks.forEach((week, weekIndex) => {
          if (!week.days || week.days.length === 0) {
            errors.push(`Block ${blockIndex + 1}, Week ${weekIndex + 1} must have at least one day`);
          }
          
          if (week.days) {
            // Validate unique days of week within each week
            const daysOfWeek = week.days.map(day => day.dayOfWeek);
            const uniqueDays = new Set(daysOfWeek);
            if (daysOfWeek.length !== uniqueDays.size) {
              errors.push(`Block ${blockIndex + 1}, Week ${weekIndex + 1} has duplicate days of week`);
            }
            
            week.days.forEach((day, dayIndex) => {
              if (day.activities && day.activities.length > 0) {
                day.activities.forEach((activity, activityIndex) => {
                  if (!activity.templateId) {
                    errors.push(`Block ${blockIndex + 1}, Week ${weekIndex + 1}, Day ${dayIndex + 1}, Activity ${activityIndex + 1} must have a template`);
                  }
                });
              }
            });
          }
        });
      }
    });
  }
  
  return errors;
};

// Static method to calculate volume percentages
workoutProgramSchema.statics.calculateVolumePercentages = function(
  block: ProgramBlock,
  activityGroupMap: Map<string, string>
) {
  const groupTotals = new Map<string, number>();
  let totalReps = 0;
  
  // Calculate total reps per activity group
  block.weeks.forEach(week => {
    week.days.forEach(day => {
      day.activities.forEach(activity => {
        if (activity.type === 'strength' && activity.sets && activity.reps) {
          const templateId = activity.templateId.toString();
          const activityGroup = activityGroupMap.get(templateId);
          if (activityGroup) {
            const reps = activity.sets * activity.reps;
            groupTotals.set(activityGroup, (groupTotals.get(activityGroup) || 0) + reps);
            totalReps += reps;
          }
        }
      });
    });
  });
  
  // Convert to percentages
  const percentages = new Map<string, number>();
  groupTotals.forEach((reps, group) => {
    percentages.set(group, totalReps > 0 ? Math.round((reps / totalReps) * 100) : 0);
  });
  
  return percentages;
};

export default model<WorkoutProgram>('WorkoutProgram', workoutProgramSchema);
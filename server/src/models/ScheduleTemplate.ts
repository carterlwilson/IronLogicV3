import { Schema, model, Document, Types } from 'mongoose';

// Timeslot within a schedule template
interface TemplateTimeslot {
  timeslotId: Types.ObjectId;
  dayOfWeek: number; // 1-7 (Monday-Sunday)
  startTime: string; // "09:00" format
  endTime: string;   // "10:00" format
  locationId: Types.ObjectId; // reference to gym location
  coachId: Types.ObjectId; // reference to User (coach)
  programId?: Types.ObjectId; // optional reference to WorkoutProgram
  maxCapacity: number;
  className?: string; // e.g., "Morning Strength", "HIIT Class"
  notes?: string;
  isActive: boolean;
}

// Main ScheduleTemplate interface
export interface IScheduleTemplate extends Document {
  _id: Types.ObjectId;
  gymId: Types.ObjectId; // reference to Gym
  name: string;
  description?: string;
  isDefault: boolean; // only one default template per gym
  timeslots: TemplateTimeslot[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId; // reference to User who created this template
}

// Timeslot schema
const timeslotSchema = new Schema<TemplateTimeslot>({
  timeslotId: {
    type: Schema.Types.ObjectId,
    default: () => new Types.ObjectId()
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 1,
    max: 7,
    validate: {
      validator: Number.isInteger,
      message: 'Day of week must be an integer between 1 and 7'
    }
  },
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function(time: string) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
      },
      message: 'Start time must be in HH:MM format (24-hour)'
    }
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(time: string) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
      },
      message: 'End time must be in HH:MM format (24-hour)'
    }
  },
  locationId: {
    type: Schema.Types.ObjectId,
    required: true,
    validate: {
      validator: function(locationId: Types.ObjectId) {
        // Will be validated against actual gym locations in controller
        return Types.ObjectId.isValid(locationId);
      },
      message: 'Location ID must be a valid ObjectId'
    }
  },
  coachId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  programId: {
    type: Schema.Types.ObjectId,
    ref: 'WorkoutProgram',
    default: null // Optional - can be assigned later
  },
  maxCapacity: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    validate: {
      validator: Number.isInteger,
      message: 'Max capacity must be a positive integer'
    }
  },
  className: {
    type: String,
    maxlength: 100,
    trim: true
  },
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Main ScheduleTemplate schema
const scheduleTemplateSchema = new Schema<IScheduleTemplate>({
  gymId: {
    type: Schema.Types.ObjectId,
    ref: 'Gym',
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
  isDefault: {
    type: Boolean,
    default: false
  },
  timeslots: [timeslotSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
scheduleTemplateSchema.index({ gymId: 1, isActive: 1 });
scheduleTemplateSchema.index({ gymId: 1, isDefault: 1 });
scheduleTemplateSchema.index({ 'timeslots.coachId': 1 });
scheduleTemplateSchema.index({ 'timeslots.programId': 1 });

// Text search index
scheduleTemplateSchema.index({ 
  name: 'text', 
  description: 'text',
  'timeslots.className': 'text'
});

// Compound index for timeslot conflicts
scheduleTemplateSchema.index({ 
  gymId: 1, 
  'timeslots.dayOfWeek': 1, 
  'timeslots.startTime': 1, 
  'timeslots.endTime': 1,
  'timeslots.locationId': 1 
});

// Pre-save middleware to ensure only one default template per gym
scheduleTemplateSchema.pre('save', async function(this: IScheduleTemplate) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove default flag from all other templates for this gym
    await this.model().updateMany(
      { 
        gymId: this.gymId, 
        _id: { $ne: this._id },
        isActive: true 
      },
      { isDefault: false }
    );
  }
});

// Virtual for total timeslots count
scheduleTemplateSchema.virtual('totalTimeslots').get(function(this: IScheduleTemplate) {
  return this.timeslots.filter(slot => slot.isActive).length;
});

// Virtual for coaches count
scheduleTemplateSchema.virtual('totalCoaches').get(function(this: IScheduleTemplate) {
  const coaches = new Set();
  this.timeslots.forEach(slot => {
    if (slot.isActive && slot.coachId) {
      coaches.add(slot.coachId.toString());
    }
  });
  return coaches.size;
});

// Static method to validate timeslot conflicts
scheduleTemplateSchema.statics.validateTimeslotConflicts = function(timeslots: TemplateTimeslot[]) {
  const conflicts: string[] = [];
  
  for (let i = 0; i < timeslots.length; i++) {
    for (let j = i + 1; j < timeslots.length; j++) {
      const slot1 = timeslots[i];
      const slot2 = timeslots[j];
      
      if (!slot1 || !slot2) continue;
      
      // Check if same day, location, and overlapping times
      if (slot1.dayOfWeek === slot2.dayOfWeek && 
          slot1.locationId?.toString() === slot2.locationId?.toString()) {
        
        const start1 = new Date(`2000-01-01T${slot1.startTime}:00`);
        const end1 = new Date(`2000-01-01T${slot1.endTime}:00`);
        const start2 = new Date(`2000-01-01T${slot2.startTime}:00`);
        const end2 = new Date(`2000-01-01T${slot2.endTime}:00`);
        
        // Check for time overlap
        if (start1 < end2 && start2 < end1) {
          conflicts.push(
            `Timeslot conflict: ${slot1.startTime}-${slot1.endTime} overlaps with ${slot2.startTime}-${slot2.endTime} on day ${slot1.dayOfWeek} at location ${slot1.locationId}`
          );
        }
      }
      
      // Check coach double-booking
      if (slot1.dayOfWeek === slot2.dayOfWeek && 
          slot1.coachId?.toString() === slot2.coachId?.toString()) {
        
        const start1 = new Date(`2000-01-01T${slot1.startTime}:00`);
        const end1 = new Date(`2000-01-01T${slot1.endTime}:00`);
        const start2 = new Date(`2000-01-01T${slot2.startTime}:00`);
        const end2 = new Date(`2000-01-01T${slot2.endTime}:00`);
        
        // Check for time overlap
        if (start1 < end2 && start2 < end1) {
          conflicts.push(
            `Coach conflict: Coach ${slot1.coachId} is double-booked on day ${slot1.dayOfWeek} from ${slot1.startTime}-${slot1.endTime} and ${slot2.startTime}-${slot2.endTime}`
          );
        }
      }
    }
  }
  
  return conflicts;
};

// Static method to get templates with statistics
scheduleTemplateSchema.statics.getTemplatesWithStats = async function(gymId: Types.ObjectId) {
  return this.aggregate([
    { 
      $match: { 
        gymId: gymId,
        isActive: true 
      } 
    },
    {
      $addFields: {
        totalTimeslots: { $size: '$timeslots' },
        activeTimeslots: {
          $size: {
            $filter: {
              input: '$timeslots',
              cond: { $eq: ['$$this.isActive', true] }
            }
          }
        },
        uniqueCoaches: {
          $size: {
            $setUnion: ['$timeslots.coachId', []]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'createdByUser',
        pipeline: [{ $project: { name: 1, email: 1 } }]
      }
    },
    {
      $unwind: {
        path: '$createdByUser',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $sort: { isDefault: -1, updatedAt: -1 }
    }
  ]);
};

export default model<IScheduleTemplate>('ScheduleTemplate', scheduleTemplateSchema);
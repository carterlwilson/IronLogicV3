import { Schema, model, Document, Types } from 'mongoose';

// Client enrollment in a specific timeslot
interface ClientEnrollment {
  clientId: Types.ObjectId; // reference to Client
  enrolledAt: Date;
  status: 'enrolled' | 'cancelled' | 'completed' | 'no-show';
  notes?: string;
}

// Active timeslot in a weekly schedule (derived from template)
interface WeeklyTimeslot {
  timeslotId: Types.ObjectId; // matches templateTimeslot.timeslotId
  templateTimeslotId: Types.ObjectId; // reference to original template timeslot
  dayOfWeek: number; // 1-7 (Monday-Sunday)
  startTime: string; // "09:00" format
  endTime: string;   // "10:00" format
  locationId: Types.ObjectId; // reference to gym location
  coachId: Types.ObjectId; // reference to User (coach)
  programId?: Types.ObjectId; // optional reference to WorkoutProgram
  maxCapacity: number;
  className?: string;
  notes?: string;
  isActive: boolean;
  enrollments: ClientEnrollment[];
  actualStartTime?: string; // for tracking actual class times
  actualEndTime?: string;
}

// Main WeeklySchedule interface
export interface IWeeklySchedule extends Document {
  _id: Types.ObjectId;
  gymId: Types.ObjectId; // reference to Gym
  templateId: Types.ObjectId; // reference to ScheduleTemplate
  weekStartDate: Date; // Monday of the week (ISO week)
  weekEndDate: Date; // Sunday of the week
  status: 'draft' | 'published' | 'active' | 'completed' | 'cancelled';
  timeslots: WeeklyTimeslot[];
  totalEnrollments: number; // virtual field
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId; // reference to User who created this schedule
  publishedAt?: Date;
  publishedBy?: Types.ObjectId;
}

// Client enrollment schema
const clientEnrollmentSchema = new Schema<ClientEnrollment>({
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['enrolled', 'cancelled', 'completed', 'no-show'],
    default: 'enrolled'
  },
  notes: {
    type: String,
    maxlength: 200,
    trim: true
  }
}, { _id: false });

// Weekly timeslot schema
const weeklyTimeslotSchema = new Schema<WeeklyTimeslot>({
  timeslotId: {
    type: Schema.Types.ObjectId,
    default: () => new Types.ObjectId()
  },
  templateTimeslotId: {
    type: Schema.Types.ObjectId,
    required: true
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
    required: true
  },
  coachId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  programId: {
    type: Schema.Types.ObjectId,
    ref: 'WorkoutProgram',
    default: null
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
  },
  enrollments: [clientEnrollmentSchema],
  actualStartTime: {
    type: String,
    validate: {
      validator: function(time: string) {
        if (!time) return true; // Optional field
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
      },
      message: 'Actual start time must be in HH:MM format (24-hour)'
    }
  },
  actualEndTime: {
    type: String,
    validate: {
      validator: function(time: string) {
        if (!time) return true; // Optional field
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
      },
      message: 'Actual end time must be in HH:MM format (24-hour)'
    }
  }
}, { _id: false });

// Main WeeklySchedule schema
const weeklyScheduleSchema = new Schema<IWeeklySchedule>({
  gymId: {
    type: Schema.Types.ObjectId,
    ref: 'Gym',
    required: true
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'ScheduleTemplate',
    required: true
  },
  weekStartDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(date: Date) {
        // Ensure it's a Monday (day 1 in ISO week)
        return date.getDay() === 1;
      },
      message: 'Week start date must be a Monday'
    }
  },
  weekEndDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(date: Date) {
        // Ensure it's a Sunday (day 0 in JavaScript Date)
        return date.getDay() === 0;
      },
      message: 'Week end date must be a Sunday'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'active', 'completed', 'cancelled'],
    default: 'draft'
  },
  timeslots: [weeklyTimeslotSchema],
  notes: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishedAt: {
    type: Date
  },
  publishedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
weeklyScheduleSchema.index({ gymId: 1, weekStartDate: 1 });
weeklyScheduleSchema.index({ gymId: 1, status: 1 });
weeklyScheduleSchema.index({ templateId: 1, weekStartDate: 1 });
weeklyScheduleSchema.index({ 'timeslots.coachId': 1, weekStartDate: 1 });
weeklyScheduleSchema.index({ 'timeslots.enrollments.clientId': 1 });

// Compound index for preventing duplicate schedules
weeklyScheduleSchema.index({ 
  gymId: 1, 
  weekStartDate: 1 
}, { unique: true });

// Text search index
weeklyScheduleSchema.index({ 
  notes: 'text',
  'timeslots.className': 'text',
  'timeslots.notes': 'text'
});

// Virtual for total enrollments across all timeslots
weeklyScheduleSchema.virtual('totalEnrollments').get(function(this: IWeeklySchedule) {
  return this.timeslots.reduce((total, slot) => {
    return total + slot.enrollments.filter(enrollment => 
      enrollment.status === 'enrolled'
    ).length;
  }, 0);
});

// Virtual for available spots across all timeslots
weeklyScheduleSchema.virtual('totalAvailableSpots').get(function(this: IWeeklySchedule) {
  return this.timeslots.reduce((total, slot) => {
    if (!slot.isActive) return total;
    const enrolledCount = slot.enrollments.filter(enrollment => 
      enrollment.status === 'enrolled'
    ).length;
    return total + Math.max(0, slot.maxCapacity - enrolledCount);
  }, 0);
});

// Pre-save middleware to set week end date automatically
weeklyScheduleSchema.pre('save', function(this: IWeeklySchedule) {
  if (this.isModified('weekStartDate')) {
    // Calculate Sunday of the same week
    const weekStart = new Date(this.weekStartDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Add 6 days to get Sunday
    this.weekEndDate = weekEnd;
  }
});

// Static method to get week start/end dates from any date
weeklyScheduleSchema.statics.getWeekBounds = function(date: Date) {
  const inputDate = new Date(date);
  const dayOfWeek = inputDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate Monday of the week (ISO week start)
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Handle Sunday
  const weekStart = new Date(inputDate);
  weekStart.setDate(inputDate.getDate() - daysFromMonday);
  weekStart.setHours(0, 0, 0, 0);
  
  // Calculate Sunday of the week
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return { weekStart, weekEnd };
};

// Static method to create schedule from template
weeklyScheduleSchema.statics.createFromTemplate = async function(
  templateId: Types.ObjectId, 
  weekStartDate: Date, 
  createdBy: Types.ObjectId
) {
  const ScheduleTemplate = model('ScheduleTemplate');
  
  const template = await ScheduleTemplate.findById(templateId);
  if (!template) {
    throw new Error('Schedule template not found');
  }
  
  const { weekStart, weekEnd } = (this.constructor as any).getWeekBounds(weekStartDate);
  
  // Convert template timeslots to weekly timeslots
  const weeklyTimeslots = template.timeslots
    .filter((slot: any) => slot.isActive)
    .map((slot: any) => ({
      templateTimeslotId: slot.timeslotId,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      locationId: slot.locationId,
      coachId: slot.coachId,
      programId: slot.programId,
      maxCapacity: slot.maxCapacity,
      className: slot.className,
      notes: slot.notes,
      isActive: true,
      enrollments: []
    }));
  
  const weeklySchedule = new this({
    gymId: template.gymId,
    templateId: templateId,
    weekStartDate: weekStart,
    weekEndDate: weekEnd,
    status: 'draft',
    timeslots: weeklyTimeslots,
    createdBy: createdBy,
    isActive: true
  });
  
  return weeklySchedule;
};

// Static method to enroll client in timeslot
weeklyScheduleSchema.statics.enrollClient = async function(
  scheduleId: Types.ObjectId,
  timeslotId: Types.ObjectId,
  clientId: Types.ObjectId,
  notes?: string
) {
  const schedule = await this.findById(scheduleId);
  if (!schedule) {
    throw new Error('Weekly schedule not found');
  }
  
  const timeslot = schedule.timeslots.find((slot: any) => 
    slot.timeslotId.toString() === timeslotId.toString()
  );
  if (!timeslot) {
    throw new Error('Timeslot not found in schedule');
  }
  
  if (!timeslot.isActive) {
    throw new Error('Timeslot is not active');
  }
  
  // Check if client is already enrolled
  const existingEnrollment = timeslot.enrollments.find((enrollment: any) => 
    enrollment.clientId.toString() === clientId.toString() && 
    enrollment.status === 'enrolled'
  );
  if (existingEnrollment) {
    throw new Error('Client is already enrolled in this timeslot');
  }
  
  // Check capacity
  const currentEnrollments = timeslot.enrollments.filter((enrollment: any) => 
    enrollment.status === 'enrolled'
  ).length;
  if (currentEnrollments >= timeslot.maxCapacity) {
    throw new Error('Timeslot is at full capacity');
  }
  
  // Add enrollment
  timeslot.enrollments.push({
    clientId: clientId,
    enrolledAt: new Date(),
    status: 'enrolled',
    notes: notes
  });
  
  await schedule.save();
  return schedule;
};

// Static method to cancel client enrollment
weeklyScheduleSchema.statics.cancelEnrollment = async function(
  scheduleId: Types.ObjectId,
  timeslotId: Types.ObjectId,
  clientId: Types.ObjectId
) {
  const schedule = await this.findById(scheduleId);
  if (!schedule) {
    throw new Error('Weekly schedule not found');
  }
  
  const timeslot = schedule.timeslots.find((slot: any) => 
    slot.timeslotId.toString() === timeslotId.toString()
  );
  if (!timeslot) {
    throw new Error('Timeslot not found in schedule');
  }
  
  const enrollment = timeslot.enrollments.find((enrollment: any) => 
    enrollment.clientId.toString() === clientId.toString() && 
    enrollment.status === 'enrolled'
  );
  if (!enrollment) {
    throw new Error('Client enrollment not found or already cancelled');
  }
  
  enrollment.status = 'cancelled';
  
  await schedule.save();
  return schedule;
};

export default model<IWeeklySchedule>('WeeklySchedule', weeklyScheduleSchema);
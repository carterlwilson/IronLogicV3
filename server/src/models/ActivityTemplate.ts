import { Schema, model, Document, Types, Model, Query } from 'mongoose';

export interface IActivityTemplate extends Document {
  _id: Types.ObjectId;
  name: string;
  gymId?: Types.ObjectId; // null for global activities
  activityGroupId: Types.ObjectId;
  type: 'primary lift' | 'accessory lift' | 'conditioning' | 'diagnostic';
  description?: string;
  instructions?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const activityTemplateSchema = new Schema<IActivityTemplate>({
  name: { 
    type: String, 
    required: [true, 'Activity name is required'],
    trim: true,
    maxlength: [100, 'Activity name cannot exceed 100 characters']
  },
  gymId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Gym',
    default: null // null for global activities
  },
  activityGroupId: { 
    type: Schema.Types.ObjectId,
    ref: 'ActivityGroup',
    required: [true, 'Activity group is required']
  },
  type: { 
    type: String, 
    enum: {
      values: ['primary lift', 'accessory lift', 'conditioning', 'diagnostic'],
      message: 'Type must be either primary lift, accessory lift, conditioning, or diagnostic'
    },
    required: [true, 'Activity type is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  instructions: {
    type: String,
    trim: true,
    maxlength: [1000, 'Instructions cannot exceed 1000 characters']
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc, ret) {
      ret.id = ret._id;
      const { _id, __v, ...cleanRet } = ret;
      return { id: _id, ...cleanRet };
    }
  }
});

// Indexes for performance
activityTemplateSchema.index({ gymId: 1, isActive: 1 });
activityTemplateSchema.index({ type: 1, gymId: 1 });
activityTemplateSchema.index({ activityGroup: 1, gymId: 1 });
activityTemplateSchema.index({ name: 'text', description: 'text', instructions: 'text' });

// Compound index for common query patterns
activityTemplateSchema.index({ 
  gymId: 1, 
  isActive: 1, 
  type: 1, 
  activityGroup: 1 
});


// Static methods for common queries
activityTemplateSchema.statics.findByGym = function(gymId: Types.ObjectId | null) {
  return this.find({
    $or: [
      { gymId: gymId }, // Gym-specific activities
      { gymId: null }   // Global activities
    ],
    isActive: true
  });
};

activityTemplateSchema.statics.findByType = function(type: string, gymId?: Types.ObjectId | null) {
  const query: any = { type, isActive: true };
  
  if (gymId !== undefined) {
    query.$or = [
      { gymId: gymId },
      { gymId: null }
    ];
  }
  
  return this.find(query);
};


activityTemplateSchema.statics.getActivityGroups = function(gymId?: Types.ObjectId | null) {
  const matchStage: any = { isActive: true };
  
  if (gymId !== undefined) {
    matchStage.$or = [
      { gymId: gymId },
      { gymId: null }
    ];
  }
  
  return this.aggregate([
    { $match: matchStage },
    { $group: { 
        _id: '$activityGroup',
        count: { $sum: 1 },
        types: { $addToSet: '$type' }
      }
    },
    { $sort: { _id: 1 } },
    { $project: {
        _id: 0,
        name: '$_id',
        count: 1,
        types: 1
      }
    }
  ]);
};

// Define interface for static methods
interface IActivityTemplateModel extends Model<IActivityTemplate> {
  findByGym(gymId: Types.ObjectId | null): Query<IActivityTemplate[], IActivityTemplate>;
  findByType(type: string, gymId?: Types.ObjectId | null): Query<IActivityTemplate[], IActivityTemplate>;
  getActivityGroups(gymId?: Types.ObjectId | null): Promise<any[]>;
}

const ActivityTemplate = model<IActivityTemplate, IActivityTemplateModel>('ActivityTemplate', activityTemplateSchema);

export default ActivityTemplate;
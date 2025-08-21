import { Schema, model, Document, Types, Model } from 'mongoose';

export interface IActivityGroup extends Document {
  _id: Types.ObjectId;
  name: string;
  gymId?: Types.ObjectId; // null for global activity groups
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const activityGroupSchema = new Schema<IActivityGroup>({
  name: { 
    type: String, 
    required: [true, 'Activity group name is required'],
    trim: true,
    maxlength: [50, 'Activity group name cannot exceed 50 characters']
  },
  gymId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Gym',
    default: null // null for global activity groups
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc, ret: any) {
      ret._id = ret._id.toString();
      if (ret.gymId) ret.gymId = ret.gymId.toString();
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
activityGroupSchema.index({ gymId: 1, isActive: 1 });
activityGroupSchema.index({ name: 1, gymId: 1 }, { unique: true }); // Unique name per gym/global

// Static methods
activityGroupSchema.statics.findByGym = function(gymId?: string) {
  const query: any = { isActive: true };
  if (gymId) {
    // Find gym-specific groups AND global groups
    query.$or = [
      { gymId: gymId },
      { gymId: null }
    ];
  } else {
    // Only global groups for admin
    query.gymId = null;
  }
  return this.find(query).sort({ name: 1 });
};

activityGroupSchema.statics.findByName = function(name: string, gymId?: string) {
  return this.findOne({ 
    name: name.trim(), 
    gymId: gymId || null,
    isActive: true 
  });
};

// Pre-save middleware
activityGroupSchema.pre('save', function(next) {
  // Normalize name
  if (this.name) {
    this.name = this.name.trim();
  }
  next();
});

// Interface for static methods
interface IActivityGroupModel extends Model<IActivityGroup> {
  findByGym(gymId?: string): Promise<IActivityGroup[]>;
  findByName(name: string, gymId?: string): Promise<IActivityGroup | null>;
}

export const ActivityGroup = model<IActivityGroup, IActivityGroupModel>('ActivityGroup', activityGroupSchema);
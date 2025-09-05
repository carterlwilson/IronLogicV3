import { Schema, model, Document, Types, Model, Query } from 'mongoose';

export interface IBenchmarkTemplate extends Document {
  _id: Types.ObjectId;
  name: string;
  gymId?: Types.ObjectId; // null for global benchmark templates
  type: 'weight' | 'time' | 'reps';
  unit: 'lbs' | 'kg' | 'seconds' | 'reps';
  description?: string;
  instructions?: string;
  notes?: string;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId;
}

const benchmarkTemplateSchema = new Schema<IBenchmarkTemplate>({
  name: { 
    type: String, 
    required: [true, 'Benchmark name is required'],
    trim: true,
    maxlength: [100, 'Benchmark name cannot exceed 100 characters']
  },
  gymId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Gym',
    default: null // null for global benchmark templates
  },
  type: { 
    type: String, 
    enum: {
      values: ['weight', 'time', 'reps'],
      message: 'Type must be either weight, time, or reps'
    },
    required: [true, 'Benchmark type is required']
  },
  unit: { 
    type: String, 
    enum: {
      values: ['lbs', 'kg', 'seconds', 'reps'],
      message: 'Unit must be either lbs, kg, seconds, or reps'
    },
    required: [true, 'Benchmark unit is required']
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
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
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
benchmarkTemplateSchema.index({ gymId: 1, isActive: 1 });
benchmarkTemplateSchema.index({ type: 1, gymId: 1 });
benchmarkTemplateSchema.index({ tags: 1, gymId: 1 });
benchmarkTemplateSchema.index({ name: 'text', description: 'text', instructions: 'text', notes: 'text' });

// Compound index for common query patterns
benchmarkTemplateSchema.index({ 
  gymId: 1, 
  isActive: 1, 
  type: 1, 
  tags: 1 
});

// Static methods for common queries
benchmarkTemplateSchema.statics.findByGym = function(gymId: Types.ObjectId | null) {
  return this.find({
    $or: [
      { gymId: gymId }, // Gym-specific benchmark templates
      { gymId: null }   // Global benchmark templates
    ],
    isActive: true
  });
};

benchmarkTemplateSchema.statics.findByType = function(type: string, gymId?: Types.ObjectId | null) {
  const query: any = { type, isActive: true };
  
  if (gymId !== undefined) {
    query.$or = [
      { gymId: gymId },
      { gymId: null }
    ];
  }
  
  return this.find(query);
};

benchmarkTemplateSchema.statics.findByTags = function(tags: string[], gymId?: Types.ObjectId | null) {
  const query: any = { 
    tags: { $in: tags },
    isActive: true 
  };
  
  if (gymId !== undefined) {
    query.$or = [
      { gymId: gymId },
      { gymId: null }
    ];
  }
  
  return this.find(query);
};

benchmarkTemplateSchema.statics.getDistinctTags = function(gymId?: Types.ObjectId | null) {
  const matchStage: any = { isActive: true };
  
  if (gymId !== undefined) {
    matchStage.$or = [
      { gymId: gymId },
      { gymId: null }
    ];
  }
  
  return this.aggregate([
    { $match: matchStage },
    { $unwind: '$tags' },
    { $group: { 
        _id: '$tags',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $project: {
        _id: 0,
        tag: '$_id',
        count: 1
      }
    }
  ]);
};

// Custom validation for unit/type combinations
benchmarkTemplateSchema.pre('validate', function() {
  const validCombinations = {
    'weight': ['lbs', 'kg'],
    'time': ['seconds'],
    'reps': ['reps']
  };

  if (this.type && this.unit) {
    const validUnits = validCombinations[this.type as keyof typeof validCombinations];
    if (!validUnits.includes(this.unit)) {
      this.invalidate('unit', `Unit '${this.unit}' is not valid for type '${this.type}'`);
    }
  }
});

// Define interface for static methods
interface IBenchmarkTemplateModel extends Model<IBenchmarkTemplate> {
  findByGym(gymId: Types.ObjectId | null): Query<IBenchmarkTemplate[], IBenchmarkTemplate>;
  findByType(type: string, gymId?: Types.ObjectId | null): Query<IBenchmarkTemplate[], IBenchmarkTemplate>;
  findByTags(tags: string[], gymId?: Types.ObjectId | null): Query<IBenchmarkTemplate[], IBenchmarkTemplate>;
  getDistinctTags(gymId?: Types.ObjectId | null): Promise<any[]>;
}

const BenchmarkTemplate = model<IBenchmarkTemplate, IBenchmarkTemplateModel>('BenchmarkTemplate', benchmarkTemplateSchema);

export default BenchmarkTemplate;
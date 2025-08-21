import { Schema, model, Document, Types } from 'mongoose';

interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface ILocation {
  locationId: Schema.Types.ObjectId;
  name: string;
  address?: IAddress;
  capacity?: number;
  amenities?: string[];
  operatingHours?: {
    monday?: { open?: string; close?: string; };
    tuesday?: { open?: string; close?: string; };
    wednesday?: { open?: string; close?: string; };
    thursday?: { open?: string; close?: string; };
    friday?: { open?: string; close?: string; };
    saturday?: { open?: string; close?: string; };
    sunday?: { open?: string; close?: string; };
  };
  isActive: boolean;
  createdAt?: Date;
}

export interface IGym extends Document {
  name: string;
  ownerId: Schema.Types.ObjectId;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: IAddress;
  locations: ILocation[];
  settings: {
    timezone?: string;
    currency?: string;
    membershipTypes?: string[];
    classCapacityDefault?: number;
    bookingWindowDays?: number;
    cancellationPolicy?: {
      enabled: boolean;
      hoursBefore: number;
      penaltyType?: 'none' | 'fee' | 'credit_loss';
      penaltyAmount?: number;
    };
  };
  statistics: {
    coachCount: number;
    clientCount: number;
    totalMembers: number;
    activePrograms: number;
    lastUpdated?: Date;
  };
  subscription?: {
    plan: string;
    status: string;
    startDate: Date;
    endDate?: Date;
    maxMembers?: number;
    maxCoaches?: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const gymSchema = new Schema<IGym>({
  name: {
    type: String,
    required: [true, 'Gym name is required'],
    trim: true,
    maxlength: [100, 'Gym name cannot exceed 100 characters']
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  website: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  locations: [{
    locationId: {
      type: Schema.Types.ObjectId,
      default: Schema.Types.ObjectId
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'USA' }
    },
    capacity: {
      type: Number,
      min: [1, 'Capacity must be at least 1'],
      max: [1000, 'Capacity cannot exceed 1000']
    },
    amenities: [String],
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    timezone: {
      type: String,
      default: 'America/New_York'
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
    },
    membershipTypes: {
      type: [String],
      default: ['standard', 'premium', 'student', 'senior']
    },
    classCapacityDefault: {
      type: Number,
      default: 20,
      min: [1, 'Default class capacity must be at least 1']
    },
    bookingWindowDays: {
      type: Number,
      default: 7,
      min: [1, 'Booking window must be at least 1 day']
    },
    cancellationPolicy: {
      enabled: { type: Boolean, default: true },
      hoursBefore: { type: Number, default: 24 },
      penaltyType: {
        type: String,
        enum: ['none', 'fee', 'credit_loss'],
        default: 'none'
      },
      penaltyAmount: { type: Number, default: 0 }
    }
  },
  statistics: {
    coachCount: { type: Number, default: 0 },
    clientCount: { type: Number, default: 0 },
    totalMembers: { type: Number, default: 0 },
    activePrograms: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'pro', 'enterprise'],
      default: 'basic'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'trial'],
      default: 'trial'
    },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    maxMembers: { type: Number, default: 100 },
    maxCoaches: { type: Number, default: 5 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc, ret) {
      return ret;
    }
  }
});

// Indexes for performance
gymSchema.index({ name: 1 });
gymSchema.index({ ownerId: 1 });
gymSchema.index({ isActive: 1 });
gymSchema.index({ 'address.city': 1, 'address.state': 1 });
gymSchema.index({ 'locations.isActive': 1 });
gymSchema.index({ 'subscription.status': 1 });

// Static methods
gymSchema.statics.findByOwnerId = function(ownerId: Schema.Types.ObjectId) {
  return this.find({ ownerId, isActive: true });
};

gymSchema.statics.findActiveGyms = function() {
  return this.find({ isActive: true }).populate('ownerId', 'name email');
};

// Instance methods
gymSchema.methods.updateStatistics = async function() {
  // These would be calculated from actual data in a real implementation
  // For now, we'll leave them as manual updates through the API
  this.statistics.lastUpdated = new Date();
  return this.save();
};

gymSchema.methods.addLocation = function(locationData: Partial<ILocation>) {
  this.locations.push({
    locationId: new Types.ObjectId(),
    name: locationData.name || 'New Location',
    address: locationData.address,
    capacity: locationData.capacity,
    amenities: locationData.amenities || [],
    operatingHours: locationData.operatingHours,
    isActive: true,
    createdAt: new Date()
  });
  return this.save();
};

gymSchema.methods.removeLocation = function(locationId: string) {
  const location = this.locations.id(locationId);
  if (location) {
    location.isActive = false;
    return this.save();
  }
  throw new Error('Location not found');
};

export const Gym = model<IGym>('Gym', gymSchema);
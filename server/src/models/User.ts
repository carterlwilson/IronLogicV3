import { Schema, model, Document } from 'mongoose';
import { hashPassword, comparePassword } from '../utils/password';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  userType: 'admin' | 'gym_owner' | 'coach' | 'client';
  gymId?: Schema.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  refreshTokens: string[];
  passwordResetToken?: string | undefined;
  passwordResetExpires?: Date | undefined;
  lastLoginAt?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  hashPassword(): Promise<void>;
  generatePasswordResetToken(): string;
  incLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

const userSchema = new Schema<IUser>({
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required']
  },
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  userType: { 
    type: String, 
    enum: {
      values: ['admin', 'gym_owner', 'coach', 'client'],
      message: 'User type must be one of: admin, gym_owner, coach, client'
    },
    required: [true, 'User type is required']
  },
  gymId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Gym',
    validate: {
      validator: function(this: IUser, value: Schema.Types.ObjectId) {
        // Admin users don't need a gymId, others do
        if (this.userType === 'admin') {
          return true;
        }
        return value != null;
      },
      message: 'Gym ID is required for non-admin users'
    }
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  refreshTokens: [{
    type: String
  }],
  passwordResetToken: { type: String, required: false },
  passwordResetExpires: { type: Date, required: false },
  lastLoginAt: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc, ret) {
      delete (ret as any).password;
      delete (ret as any).refreshTokens;
      delete (ret as any).passwordResetToken;
      delete (ret as any).passwordResetExpires;
      delete (ret as any).loginAttempts;
      delete (ret as any).lockUntil;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ gymId: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ isActive: 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function(this: IUser) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(this: IUser, next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await hashPassword(this.password);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(this: IUser, candidatePassword: string): Promise<boolean> {
  return comparePassword(candidatePassword, this.password);
};

// Instance method to hash password manually
userSchema.methods.hashPassword = async function(this: IUser): Promise<void> {
  this.password = await hashPassword(this.password);
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function(this: IUser): string {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Token expires in 10 minutes
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  
  return resetToken;
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = async function(this: IUser): Promise<void> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !(this.lockUntil && this.lockUntil > new Date())) {
    (updates as any).$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = async function(this: IUser): Promise<void> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLoginAt: new Date() }
  });
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

export const User = model<IUser>('User', userSchema);
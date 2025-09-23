import { Schema, model, Document } from 'mongoose';

export interface IClientBenchmarkHistory extends Document {
  clientId: Schema.Types.ObjectId;
  templateId: Schema.Types.ObjectId;
  value: {
    weight?: number;
    time?: number;
    reps?: number;
    distance?: number;
  };
  notes?: string;
  recordedAt: Date;
  recordedBy: Schema.Types.ObjectId; // Who recorded it (coach or client)
  isActive: boolean; // For soft deletion
  replacedBy?: Schema.Types.ObjectId; // Reference to newer benchmark that replaced this one
  createdAt: Date;
  updatedAt: Date;
}

const clientBenchmarkHistorySchema = new Schema<IClientBenchmarkHistory>({
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'BenchmarkTemplate',
    required: true
  },
  value: {
    weight: Number,
    time: Number,
    reps: Number,
    distance: Number
  },
  notes: {
    type: String,
    maxlength: 500
  },
  recordedAt: {
    type: Date,
    default: Date.now
  },
  recordedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  replacedBy: {
    type: Schema.Types.ObjectId,
    ref: 'ClientBenchmarkHistory'
  }
}, {
  timestamps: true
});

// Indexes for performance
clientBenchmarkHistorySchema.index({ clientId: 1, templateId: 1, recordedAt: -1 });
clientBenchmarkHistorySchema.index({ clientId: 1, isActive: 1 });
clientBenchmarkHistorySchema.index({ templateId: 1 });
clientBenchmarkHistorySchema.index({ recordedAt: -1 });

export const ClientBenchmarkHistory = model<IClientBenchmarkHistory>('ClientBenchmarkHistory', clientBenchmarkHistorySchema);
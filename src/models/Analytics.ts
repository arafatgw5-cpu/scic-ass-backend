import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalytics extends Document {
  userId: mongoose.Types.ObjectId;
  resumeScore: number;
  aiUsageTokens: number;
  applicationsSent: number;
  createdAt: Date;
  updatedAt: Date;
}

const analyticsSchema = new Schema<IAnalytics>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    resumeScore: {
      type: Number,
      default: 0,
    },
    aiUsageTokens: {
      type: Number,
      default: 0,
    },
    applicationsSent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Analytics = mongoose.model<IAnalytics>('Analytics', analyticsSchema);

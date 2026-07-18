import mongoose, { Document, Schema } from 'mongoose';

export interface IRecommendation extends Document {
  userId: mongoose.Types.ObjectId;
  topCareers: {
    careerId: mongoose.Types.ObjectId;
    compatibilityScore: number;
    missingSkills: string[];
    reasoning: string;
  }[];
  learningRoadmap: {
    step: number;
    title: string;
    description: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const recommendationSchema = new Schema<IRecommendation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    topCareers: [
      {
        careerId: { type: Schema.Types.ObjectId, ref: 'Career', required: true },
        compatibilityScore: { type: Number, required: true },
        missingSkills: [String],
        reasoning: { type: String, required: true },
      },
    ],
    learningRoadmap: [
      {
        step: { type: Number, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Recommendation = mongoose.model<IRecommendation>('Recommendation', recommendationSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface ICareer extends Document {
  title: string;
  category: string;
  description: string;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Executive';
  requiredSkills: string[];
  responsibilities: string[];
  createdAt: Date;
  updatedAt: Date;
}

const careerSchema = new Schema<ICareer>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    salaryRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      currency: { type: String, default: 'USD' },
    },
    experienceLevel: {
      type: String,
      enum: ['Entry', 'Mid', 'Senior', 'Executive'],
      required: true,
    },
    requiredSkills: [
      {
        type: String,
      },
    ],
    responsibilities: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Career = mongoose.model<ICareer>('Career', careerSchema);

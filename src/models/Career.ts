import mongoose, { Document, Schema } from 'mongoose';

export interface ICareer extends Document {
  title: string;
  company: string;
  companyLogo?: string;
  category: string;
  description: string;
  location: string;
  jobType: 'Remote' | 'Hybrid' | 'Onsite';
  rating: number;
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
    company: {
      type: String,
      required: true,
      trim: true,
    },
    companyLogo: {
      type: String,
      default: '',
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
    location: {
      type: String,
      required: true,
    },
    jobType: {
      type: String,
      enum: ['Remote', 'Hybrid', 'Onsite'],
      default: 'Onsite',
    },
    rating: {
      type: Number,
      default: 4.0,
      min: 0,
      max: 5,
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
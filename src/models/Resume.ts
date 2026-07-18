import mongoose, { Document, Schema } from 'mongoose';

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  targetRole?: string;
  summary?: string;
  skills: string[];
  experience: {
    company: string;
    role: string;
    startDate?: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }[];
  education: {
    institution: string;
    degree: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    current: boolean;
  }[];
  projects: {
    name: string;
    description: string;
    url?: string;
    technologies: string[];
  }[];
  certifications: {
    name: string;
    issuer: string;
    date: string;
    url?: string;
  }[];
  atsScore: number;
  isDefault: boolean;
  content?: any;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      default: 'My Resume',
    },
    targetRole: {
      type: String,
    },
    summary: {
      type: String,
    },
    skills: [
      {
        type: String,
      },
    ],
    experience: [
      {
        company: { type: String, required: true },
        role: { type: String, required: true },
        startDate: { type: String, required: false },
        endDate: String,
        current: { type: Boolean, default: false },
        description: String,
      },
    ],
    education: [
      {
        institution: { type: String, required: true },
        degree: { type: String, required: true },
        field: { type: String, required: false },
        startDate: { type: String, required: false },
        endDate: String,
        current: { type: Boolean, default: false },
      },
    ],
    projects: [
      {
        name: { type: String, required: true },
        description: { type: String, required: true },
        url: String,
        technologies: [String],
      },
    ],
    certifications: [
      {
        name: { type: String, required: true },
        issuer: { type: String, required: true },
        date: String,
        url: String,
      },
    ],
    atsScore: {
      type: Number,
      default: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    content: {
      type: Schema.Types.Mixed,
    }
  },
  {
    timestamps: true,
  }
);

export const Resume = mongoose.model<IResume>('Resume', resumeSchema);

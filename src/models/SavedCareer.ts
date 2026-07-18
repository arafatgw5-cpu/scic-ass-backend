import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedCareer extends Document {
  userId: mongoose.Types.ObjectId;
  careerId: mongoose.Types.ObjectId;
  savedAt: Date;
}

const savedCareerSchema = new Schema<ISavedCareer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    careerId: {
      type: Schema.Types.ObjectId,
      ref: 'Career',
      required: true,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We're using savedAt manually instead of createdAt/updatedAt
  }
);

export const SavedCareer = mongoose.model<ISavedCareer>('SavedCareer', savedCareerSchema);

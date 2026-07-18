import { Request, Response } from 'express';
import { Recommendation } from '../models/Recommendation';

// Get the user's latest career recommendation
export const getRecommendation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const recommendation = await Recommendation.findOne({ userId })
      .populate('topCareers.careerId')
      .sort({ updatedAt: -1 });

    if (!recommendation) {
      res.status(404).json({ success: false, message: 'No recommendations found for this user' });
      return;
    }

    res.json({ success: true, data: recommendation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

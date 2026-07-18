import { Request, Response } from 'express';
import { Analytics } from '../models/Analytics';

import { Resume } from '../models/Resume';
import { SavedCareer } from '../models/SavedCareer';
import { ChatHistory } from '../models/ChatHistory';

// Get analytics for the current user
export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?._id;
    let analytics = await Analytics.findOne({ userId });

    if (!analytics) {
      analytics = await Analytics.create({ userId });
    }

    const resumesCount = await Resume.countDocuments({ userId });
    const savedCareersCount = await SavedCareer.countDocuments({ userId });
    const chatSessionsCount = await ChatHistory.countDocuments({ userId });

    res.json({ 
      success: true, 
      data: {
        analytics,
        resumesCount,
        savedCareersCount,
        chatSessionsCount
      } 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

// Update analytics
export const updateAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { resumeScore, aiUsageTokens, applicationsSent } = req.body;

    let analytics = await Analytics.findOne({ userId });

    if (!analytics) {
      analytics = await Analytics.create({
        userId,
        resumeScore: resumeScore || 0,
        aiUsageTokens: aiUsageTokens || 0,
        applicationsSent: applicationsSent || 0,
      });
    } else {
      if (resumeScore !== undefined) analytics.resumeScore = resumeScore;
      
      // Usually these would increment rather than replace
      if (aiUsageTokens !== undefined) analytics.aiUsageTokens += aiUsageTokens;
      if (applicationsSent !== undefined) analytics.applicationsSent += applicationsSent;
      
      await analytics.save();
    }

    res.json({ success: true, data: analytics });
  } catch (error: any) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

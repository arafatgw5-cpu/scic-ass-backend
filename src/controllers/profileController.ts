import { Request, Response } from 'express';
import { Profile } from '../models/Profile';

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const profile = await Profile.findOne({ userId });

    if (!profile) {
      res.status(404).json({ success: false, message: 'Profile not found' });
      return;
    }

    res.json({ success: true, data: profile });
  } catch (error: any) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { firstName, lastName, avatarUrl, headline, location, contactInfo } = req.body;

    let profile = await Profile.findOne({ userId });

    if (profile) {
      // Update existing profile
      profile.firstName = firstName || profile.firstName;
      profile.lastName = lastName || profile.lastName;
      profile.avatarUrl = avatarUrl || profile.avatarUrl;
      profile.headline = headline || profile.headline;
      profile.location = location || profile.location;
      
      if (contactInfo) {
        profile.contactInfo = { ...profile.contactInfo, ...contactInfo };
      }

      await profile.save();
    } else {
      // Create new profile
      profile = await Profile.create({
        userId,
        firstName,
        lastName,
        avatarUrl,
        headline,
        location,
        contactInfo
      });
    }

    res.json({ success: true, data: profile });
  } catch (error: any) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

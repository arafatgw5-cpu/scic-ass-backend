import { Request, Response } from 'express';
import { Newsletter } from '../models/Newsletter';

export const subscribeNewsletter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    // Check if already subscribed
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      res.status(400).json({ success: false, message: 'Email is already subscribed' });
      return;
    }

    await Newsletter.create({ email });

    res.status(201).json({ success: true, message: 'Successfully subscribed to newsletter' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

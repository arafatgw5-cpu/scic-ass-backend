import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Career } from '../models/Career';
import { SavedCareer } from '../models/SavedCareer';

// Get all careers (with filtering and sorting)
export const getCareers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, experienceLevel, location, jobType, search, sort } = req.query;
    
    let query: any = {};

    // Category Filter
    if (category && category !== 'All') query.category = category;
    
    // Experience Level Filter
    if (experienceLevel && experienceLevel !== 'All') query.experienceLevel = experienceLevel;

    // Location Filter (Partial match, case-insensitive)
    if (location && location !== 'All') {
      query.location = { $regex: location, $options: 'i' };
    }

    // Job Type Filter
    if (jobType && jobType !== 'All') query.jobType = jobType;

    // Search (Title, Company, or Skills)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { requiredSkills: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    let sortOptions: any = { createdAt: -1 }; // Default: newest first
    if (sort === 'oldest') sortOptions = { createdAt: 1 };
    if (sort === 'salary-low') sortOptions = { 'salaryRange.min': 1 };
    if (sort === 'salary-high') sortOptions = { 'salaryRange.max': -1 };
    if (sort === 'rating') sortOptions = { rating: -1 };

    const careers = await Career.find(query).sort(sortOptions);
    
    res.json({ success: true, data: careers });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
};

// Get a specific career by ID
export const getCareerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const career = await Career.findById(id);

    if (!career) {
      res.status(404).json({ success: false, message: 'Career not found' });
      return;
    }

    res.json({ success: true, data: career });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
};

// Save a career for the user
export const saveCareer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { id: careerId } = req.params;

    // Check if career exists
    const career = await Career.findById(careerId);
    if (!career) {
      res.status(404).json({ success: false, message: 'Career not found' });
      return;
    }

    const existing = await SavedCareer.findOne({ 
      userId, 
      careerId: new mongoose.Types.ObjectId(careerId as string) 
    });
    
    if (existing) {
      res.status(400).json({ success: false, message: 'Career already saved' });
      return;
    }

    const savedCareer = await SavedCareer.create({ 
      userId, 
      careerId: new mongoose.Types.ObjectId(careerId as string) 
    });
    
    res.status(201).json({ success: true, data: savedCareer });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
};

// Unsave a career
export const unsaveCareer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { id: careerId } = req.params;

    const deleted = await SavedCareer.findOneAndDelete({ 
      userId, 
      careerId: new mongoose.Types.ObjectId(careerId as string) 
    });
    
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Saved career not found' });
      return;
    }

    res.json({ success: true, data: {} });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
};

// Get all saved careers for the user
export const getSavedCareers = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const savedCareers = await SavedCareer.find({ userId }).populate('careerId');

    res.json({ success: true, data: savedCareers });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
};
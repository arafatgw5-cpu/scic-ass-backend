import { Request, Response } from 'express';
import { Resume } from '../models/Resume';

// Create a new resume
export const createResumeEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { title, targetRole, summary, experience, education, skills, projects, certifications, content, atsScore } = req.body;

    const resume = await Resume.create({
      userId,
      title: title || 'Untitled Resume',
      targetRole,
      summary,
      experience: experience || [],
      education: education || [],
      skills: skills || [],
      projects: projects || [],
      certifications: certifications || [],
      content,
      atsScore: atsScore || 0
    });

    res.status(201).json({ success: true, data: resume });
  } catch (error: any) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

// Get all resumes for the current user
export const getResumes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const resumes = await Resume.find({ userId }).sort({ updatedAt: -1 });

    res.json({ success: true, data: resumes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

// Get a specific resume by ID
export const getResumeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const resume = await Resume.findOne({ _id: id, userId });

    if (!resume) {
      res.status(404).json({ success: false, message: 'Resume not found' });
      return;
    }

    res.json({ success: true, data: resume });
  } catch (error: any) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

// Update a resume
export const updateResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const updatedResume = await Resume.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedResume) {
      res.status(404).json({ success: false, message: 'Resume not found' });
      return;
    }

    res.json({ success: true, data: updatedResume });
  } catch (error: any) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

// Delete a resume
export const deleteResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const deletedResume = await Resume.findOneAndDelete({ _id: id, userId });

    if (!deletedResume) {
      res.status(404).json({ success: false, message: 'Resume not found' });
      return;
    }

    res.json({ success: true, data: {} });
  } catch (error: any) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

// Generate PDF
export const generatePdf = async (req: Request, res: Response): Promise<void> => {
  try {
    // We expect the frontend to pass the resumeData in the body
    const { resumeData } = req.body;
    
    if (!resumeData) {
      res.status(400).json({ success: false, message: 'Resume data is required to generate PDF' });
      return;
    }

    // Require PDFKit dynamically or at the top
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    
    doc.pipe(res);

    // Title / Professional Summary
    doc.fontSize(20).text('Resume', { align: 'center' });
    doc.moveDown();

    if (resumeData.professionalSummary) {
      doc.fontSize(14).text('Professional Summary', { underline: true });
      doc.fontSize(10).text(resumeData.professionalSummary);
      doc.moveDown();
    } else if (resumeData.summary) {
      doc.fontSize(14).text('Professional Summary', { underline: true });
      doc.fontSize(10).text(resumeData.summary);
      doc.moveDown();
    }

    // Skills
    const skills = resumeData.optimizedSkills || resumeData.skills || [];
    if (skills.length > 0) {
      doc.fontSize(14).text('Skills', { underline: true });
      doc.fontSize(10).text(skills.join(', '));
      doc.moveDown();
    }

    // Experience
    const experience = resumeData.optimizedExperience || resumeData.experience || [];
    if (experience.length > 0) {
      doc.fontSize(14).text('Experience', { underline: true });
      experience.forEach((exp: any) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`${exp.role || exp.title} at ${exp.company}`);
        doc.fontSize(10).font('Helvetica').text(exp.description || '');
        doc.moveDown();
      });
    }

    // Projects
    const projects = resumeData.optimizedProjects || resumeData.projects || [];
    if (projects.length > 0) {
      doc.fontSize(14).text('Projects', { underline: true });
      projects.forEach((proj: any) => {
        doc.fontSize(12).font('Helvetica-Bold').text(proj.name || proj.title);
        doc.fontSize(10).font('Helvetica').text(proj.description || '');
        doc.moveDown();
      });
    }

    doc.end();
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate PDF' });
    }
  }
};

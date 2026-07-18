"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePdf = exports.deleteResume = exports.updateResume = exports.getResumeById = exports.getResumes = exports.createResumeEntry = void 0;
const Resume_1 = require("../models/Resume");
// Create a new resume
const createResumeEntry = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { title, targetRole, summary, experience, education, skills, projects, certifications, content, atsScore } = req.body;
        const resume = await Resume_1.Resume.create({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.createResumeEntry = createResumeEntry;
// Get all resumes for the current user
const getResumes = async (req, res) => {
    try {
        const userId = req.user?.id;
        const resumes = await Resume_1.Resume.find({ userId }).sort({ updatedAt: -1 });
        res.json({ success: true, data: resumes });
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.getResumes = getResumes;
// Get a specific resume by ID
const getResumeById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const resume = await Resume_1.Resume.findOne({ _id: id, userId });
        if (!resume) {
            res.status(404).json({ success: false, message: 'Resume not found' });
            return;
        }
        res.json({ success: true, data: resume });
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.getResumeById = getResumeById;
// Update a resume
const updateResume = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const updatedResume = await Resume_1.Resume.findOneAndUpdate({ _id: id, userId }, req.body, { new: true, runValidators: true });
        if (!updatedResume) {
            res.status(404).json({ success: false, message: 'Resume not found' });
            return;
        }
        res.json({ success: true, data: updatedResume });
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.updateResume = updateResume;
// Delete a resume
const deleteResume = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const deletedResume = await Resume_1.Resume.findOneAndDelete({ _id: id, userId });
        if (!deletedResume) {
            res.status(404).json({ success: false, message: 'Resume not found' });
            return;
        }
        res.json({ success: true, data: {} });
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.deleteResume = deleteResume;
// Generate PDF
const generatePdf = async (req, res) => {
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
        }
        else if (resumeData.summary) {
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
            experience.forEach((exp) => {
                doc.fontSize(12).font('Helvetica-Bold').text(`${exp.role || exp.title} at ${exp.company}`);
                doc.fontSize(10).font('Helvetica').text(exp.description || '');
                doc.moveDown();
            });
        }
        // Projects
        const projects = resumeData.optimizedProjects || resumeData.projects || [];
        if (projects.length > 0) {
            doc.fontSize(14).text('Projects', { underline: true });
            projects.forEach((proj) => {
                doc.fontSize(12).font('Helvetica-Bold').text(proj.name || proj.title);
                doc.fontSize(10).font('Helvetica').text(proj.description || '');
                doc.moveDown();
            });
        }
        doc.end();
    }
    catch (error) {
        console.error('PDF Generation Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Failed to generate PDF' });
        }
    }
};
exports.generatePdf = generatePdf;

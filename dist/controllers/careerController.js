"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSavedCareers = exports.unsaveCareer = exports.saveCareer = exports.getCareerById = exports.getCareers = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Career_1 = require("../models/Career");
const SavedCareer_1 = require("../models/SavedCareer");
// Get all careers (with basic filtering)
const getCareers = async (req, res) => {
    try {
        const { category, experienceLevel } = req.query;
        let query = {};
        if (category)
            query.category = category;
        if (experienceLevel)
            query.experienceLevel = experienceLevel;
        const careers = await Career_1.Career.find(query);
        res.json({ success: true, data: careers });
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.getCareers = getCareers;
// Get a specific career by ID
const getCareerById = async (req, res) => {
    try {
        const { id } = req.params;
        const career = await Career_1.Career.findById(id);
        if (!career) {
            res.status(404).json({ success: false, message: 'Career not found' });
            return;
        }
        res.json({ success: true, data: career });
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.getCareerById = getCareerById;
// Save a career for the user
const saveCareer = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id: careerId } = req.params;
        // Check if career exists
        const career = await Career_1.Career.findById(careerId);
        if (!career) {
            res.status(404).json({ success: false, message: 'Career not found' });
            return;
        }
        const existing = await SavedCareer_1.SavedCareer.findOne({ userId, careerId: new mongoose_1.default.Types.ObjectId(careerId) });
        if (existing) {
            res.status(400).json({ success: false, message: 'Career already saved' });
            return;
        }
        const savedCareer = await SavedCareer_1.SavedCareer.create({ userId, careerId: new mongoose_1.default.Types.ObjectId(careerId) });
        res.status(201).json({ success: true, data: savedCareer });
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.saveCareer = saveCareer;
// Unsave a career
const unsaveCareer = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id: careerId } = req.params;
        const deleted = await SavedCareer_1.SavedCareer.findOneAndDelete({ userId, careerId: new mongoose_1.default.Types.ObjectId(careerId) });
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Saved career not found' });
            return;
        }
        res.json({ success: true, data: {} });
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.unsaveCareer = unsaveCareer;
// Get all saved careers for the user
const getSavedCareers = async (req, res) => {
    try {
        const userId = req.user?.id;
        const savedCareers = await SavedCareer_1.SavedCareer.find({ userId }).populate('careerId');
        res.json({ success: true, data: savedCareers });
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.getSavedCareers = getSavedCareers;

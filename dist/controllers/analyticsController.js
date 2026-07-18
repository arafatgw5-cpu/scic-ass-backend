"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAnalytics = exports.getAnalytics = void 0;
const Analytics_1 = require("../models/Analytics");
const Resume_1 = require("../models/Resume");
const SavedCareer_1 = require("../models/SavedCareer");
const ChatHistory_1 = require("../models/ChatHistory");
// Get analytics for the current user
const getAnalytics = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        let analytics = await Analytics_1.Analytics.findOne({ userId });
        if (!analytics) {
            analytics = await Analytics_1.Analytics.create({ userId });
        }
        const resumesCount = await Resume_1.Resume.countDocuments({ userId });
        const savedCareersCount = await SavedCareer_1.SavedCareer.countDocuments({ userId });
        const chatSessionsCount = await ChatHistory_1.ChatHistory.countDocuments({ userId });
        res.json({
            success: true,
            data: {
                analytics,
                resumesCount,
                savedCareersCount,
                chatSessionsCount
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.getAnalytics = getAnalytics;
// Update analytics
const updateAnalytics = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { resumeScore, aiUsageTokens, applicationsSent } = req.body;
        let analytics = await Analytics_1.Analytics.findOne({ userId });
        if (!analytics) {
            analytics = await Analytics_1.Analytics.create({
                userId,
                resumeScore: resumeScore || 0,
                aiUsageTokens: aiUsageTokens || 0,
                applicationsSent: applicationsSent || 0,
            });
        }
        else {
            if (resumeScore !== undefined)
                analytics.resumeScore = resumeScore;
            // Usually these would increment rather than replace
            if (aiUsageTokens !== undefined)
                analytics.aiUsageTokens += aiUsageTokens;
            if (applicationsSent !== undefined)
                analytics.applicationsSent += applicationsSent;
            await analytics.save();
        }
        res.json({ success: true, data: analytics });
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.updateAnalytics = updateAnalytics;

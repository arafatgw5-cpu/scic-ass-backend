"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecommendation = void 0;
const Recommendation_1 = require("../models/Recommendation");
// Get the user's latest career recommendation
const getRecommendation = async (req, res) => {
    try {
        const userId = req.user?.id;
        const recommendation = await Recommendation_1.Recommendation.findOne({ userId })
            .populate('topCareers.careerId')
            .sort({ updatedAt: -1 });
        if (!recommendation) {
            res.status(404).json({ success: false, message: 'No recommendations found for this user' });
            return;
        }
        res.json({ success: true, data: recommendation });
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.getRecommendation = getRecommendation;

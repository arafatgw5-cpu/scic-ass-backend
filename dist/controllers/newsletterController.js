"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeNewsletter = void 0;
const Newsletter_1 = require("../models/Newsletter");
const subscribeNewsletter = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }
        // Check if already subscribed
        const existing = await Newsletter_1.Newsletter.findOne({ email });
        if (existing) {
            res.status(400).json({ success: false, message: 'Email is already subscribed' });
            return;
        }
        await Newsletter_1.Newsletter.create({ email });
        res.status(201).json({ success: true, message: 'Successfully subscribed to newsletter' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.subscribeNewsletter = subscribeNewsletter;

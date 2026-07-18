"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = void 0;
const Profile_1 = require("../models/Profile");
const getProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        const profile = await Profile_1.Profile.findOne({ userId });
        if (!profile) {
            res.status(404).json({ success: false, message: 'Profile not found' });
            return;
        }
        res.json({ success: true, data: profile });
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { firstName, lastName, avatarUrl, headline, location, contactInfo } = req.body;
        let profile = await Profile_1.Profile.findOne({ userId });
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
        }
        else {
            // Create new profile
            profile = await Profile_1.Profile.create({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.updateProfile = updateProfile;

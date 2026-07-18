"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.loginUser = exports.registerUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const Profile_1 = require("../models/Profile");
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '30d',
    });
};
const registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        if (!firstName || !lastName || !email || !password) {
            res.status(400).json({ success: false, message: 'Please provide all required fields' });
            return;
        }
        const userExists = await User_1.User.findOne({ email });
        if (userExists) {
            res.status(400).json({ success: false, message: 'User already exists' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const user = await User_1.User.create({
            name: `${firstName} ${lastName}`.trim(),
            email,
            passwordHash: hashedPassword,
            authProvider: 'local',
        });
        if (user) {
            await Profile_1.Profile.create({
                userId: user._id,
                firstName,
                lastName,
            });
            res.status(201).json({
                success: true,
                user: {
                    _id: user._id,
                    email: user.email,
                    role: user.role,
                },
                token: generateToken(user._id.toString()),
            });
        }
        else {
            res.status(400).json({ success: false, message: 'Invalid user data' });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.User.findOne({ email });
        if (user && user.passwordHash && (await bcryptjs_1.default.compare(password, user.passwordHash))) {
            res.json({
                success: true,
                user: {
                    _id: user._id,
                    email: user.email,
                    role: user.role,
                },
                token: generateToken(user._id.toString()),
            });
        }
        else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.loginUser = loginUser;
const getMe = async (req, res) => {
    try {
        const user = await User_1.User.findById(req.user._id).select('-passwordHash');
        const profile = await Profile_1.Profile.findOne({ userId: user?._id });
        res.json({
            success: true,
            user,
            profile,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.getMe = getMe;

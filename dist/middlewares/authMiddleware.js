"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
const protect = async (req, res, next) => {
    // 1. Get token from either cookie or Authorization header
    let betterAuthToken = req.cookies && req.cookies['better-auth.session_token'];
    let bearerToken = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        bearerToken = req.headers.authorization.split(' ')[1];
        // If the bearer token doesn't look like a JWT (no dots), treat it as a Better Auth token
        if (bearerToken && !bearerToken.includes('.')) {
            betterAuthToken = bearerToken;
        }
    }
    // Extract the actual token from the signed cookie format (token.signature)
    if (betterAuthToken && betterAuthToken.includes('.')) {
        betterAuthToken = betterAuthToken.split('.')[0];
    }
    // 2. Check for Better Auth session
    if (betterAuthToken) {
        try {
            const sessionCollection = mongoose_1.default.connection.collection('session');
            const session = await sessionCollection.findOne({ token: betterAuthToken });
            if (session && session.expiresAt > new Date()) {
                const usersCollection = mongoose_1.default.connection.collection('user');
                // Handle both string and ObjectId userId from Better Auth
                let userObjectId;
                try {
                    userObjectId = new mongoose_1.default.Types.ObjectId(session.userId.toString());
                }
                catch (e) {
                    userObjectId = session.userId; // fallback if somehow not compatible
                }
                const userDoc = await usersCollection.findOne({ _id: userObjectId });
                if (userDoc) {
                    const idStr = userDoc._id.toString();
                    req.user = {
                        _id: userDoc._id,
                        id: idStr,
                        email: userDoc.email,
                        name: userDoc.name,
                        role: userDoc.role || 'user',
                    };
                    return next();
                }
            }
        }
        catch (err) {
            console.error('Better Auth verification failed', err);
        }
    }
    // 2. Fallback to JWT (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            const user = await User_1.User.findById(decoded.id).select('-passwordHash');
            if (!user) {
                res.status(401).json({ success: false, message: 'Not authorized, user not found' });
                return;
            }
            const idStr = user._id.toString();
            req.user = {
                _id: user._id,
                id: idStr,
                email: user.email,
                name: user.name,
                role: user.role,
            };
            return next();
        }
        catch (error) {
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
            return;
        }
    }
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
};
exports.protect = protect;
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    }
    else {
        res.status(403).json({ success: false, message: 'Not authorized as an admin' });
    }
};
exports.admin = admin;

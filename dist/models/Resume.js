"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resume = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const resumeSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        default: 'My Resume',
    },
    targetRole: {
        type: String,
    },
    summary: {
        type: String,
    },
    skills: [
        {
            type: String,
        },
    ],
    experience: [
        {
            company: { type: String, required: true },
            role: { type: String, required: true },
            startDate: { type: String, required: false },
            endDate: String,
            current: { type: Boolean, default: false },
            description: String,
        },
    ],
    education: [
        {
            institution: { type: String, required: true },
            degree: { type: String, required: true },
            field: { type: String, required: false },
            startDate: { type: String, required: false },
            endDate: String,
            current: { type: Boolean, default: false },
        },
    ],
    projects: [
        {
            name: { type: String, required: true },
            description: { type: String, required: true },
            url: String,
            technologies: [String],
        },
    ],
    certifications: [
        {
            name: { type: String, required: true },
            issuer: { type: String, required: true },
            date: String,
            url: String,
        },
    ],
    atsScore: {
        type: Number,
        default: 0,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    content: {
        type: mongoose_1.Schema.Types.Mixed,
    }
}, {
    timestamps: true,
});
exports.Resume = mongoose_1.default.model('Resume', resumeSchema);

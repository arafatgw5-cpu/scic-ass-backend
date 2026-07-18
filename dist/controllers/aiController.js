"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithAI = exports.parseResume = exports.getCareerRecommendations = exports.createResume = void 0;
const aiService_1 = require("../services/aiService");
// ─── GENERATE RESUME ───────────────────────────────────────────────
const createResume = async (req, res) => {
    try {
        const { targetJob, skills, experience, projects, education, achievements } = req.body;
        if (!targetJob || typeof targetJob !== 'string' || !targetJob.trim()) {
            res.status(400).json({ success: false, message: 'Target job title is required.' });
            return;
        }
        if (!skills || !Array.isArray(skills) || skills.length === 0) {
            res.status(400).json({ success: false, message: 'At least one skill is required.' });
            return;
        }
        const aiResume = await (0, aiService_1.generateResume)(targetJob.trim(), skills, experience || [], projects || [], education || [], achievements || []);
        res.json({
            success: true,
            message: 'Resume generated successfully',
            data: aiResume,
        });
    }
    catch (error) {
        handleAIError(res, error);
    }
};
exports.createResume = createResume;
// ─── CAREER RECOMMENDATIONS ────────────────────────────────────────
const getCareerRecommendations = async (req, res) => {
    try {
        const { resumeData, savedCareers } = req.body;
        const result = await (0, aiService_1.recommendCareers)(resumeData || null, savedCareers || []);
        res.json({
            success: true,
            message: 'Career recommendations generated successfully',
            data: result.recommendations,
        });
    }
    catch (error) {
        handleAIError(res, error);
    }
};
exports.getCareerRecommendations = getCareerRecommendations;
// ─── ANALYZE RESUME ────────────────────────────────────────────────
const parseResume = async (req, res) => {
    try {
        const { resumeText } = req.body;
        if (!resumeText || typeof resumeText !== 'string' || !resumeText.trim()) {
            res.status(400).json({ success: false, message: 'Resume text is required for analysis.' });
            return;
        }
        if (resumeText.length < 50) {
            res.status(400).json({ success: false, message: 'Resume text is too short. Please paste your full resume.' });
            return;
        }
        const analysis = await (0, aiService_1.analyzeResume)(resumeText.trim());
        res.json({
            success: true,
            message: 'Resume analyzed successfully',
            data: analysis,
        });
    }
    catch (error) {
        handleAIError(res, error);
    }
};
exports.parseResume = parseResume;
// ─── CHAT WITH AI (STREAMING SSE) ─────────────────────────────────
const chatWithAI = async (req, res) => {
    try {
        const { history, message } = req.body;
        if (!message || typeof message !== 'string' || !message.trim()) {
            res.status(400).json({ success: false, message: 'Message is required.' });
            return;
        }
        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        const stream = await (0, aiService_1.chatAssistantStream)(history || [], message.trim());
        for await (const chunk of stream) {
            const text = chunk.text();
            if (text) {
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
        }
        res.write('data: [DONE]\n\n');
        res.end();
    }
    catch (error) {
        // If headers already sent (streaming started), write error to stream
        if (res.headersSent) {
            const msg = error instanceof aiService_1.GeminiError ? error.message : 'An unexpected error occurred.';
            res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
            res.end();
        }
        else {
            handleAIError(res, error);
        }
    }
};
exports.chatWithAI = chatWithAI;
// ─── CENTRALIZED ERROR HANDLER ─────────────────────────────────────
function handleAIError(res, error) {
    if (error instanceof aiService_1.GeminiError) {
        console.error(`[AI Controller] GeminiError (${error.status}): ${error.message}`);
        res.status(error.status).json({
            success: false,
            message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        });
    }
    else if (error instanceof SyntaxError) {
        console.error(`[AI Controller] JSON Parse Error:`, error.message);
        res.status(502).json({
            success: false,
            message: 'Gemini returned invalid JSON. Please try again.',
        });
    }
    else {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[AI Controller] Unexpected Error:`, msg);
        res.status(500).json({
            success: false,
            message: msg,
        });
    }
}

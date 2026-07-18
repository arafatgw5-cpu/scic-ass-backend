import { Request, Response } from 'express';
import {
  generateResume,
  recommendCareers,
  analyzeResume,
  chatAssistantStream,
  analyzeImageWithGroq,
  GeminiError,
} from '../services/aiService';

// ─── GENERATE RESUME ───────────────────────────────────────────────
export const createResume = async (req: Request, res: Response): Promise<void> => {
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

    const aiResume = await generateResume(targetJob.trim(), skills, experience || [], projects || [], education || [], achievements || []);
    res.json({ success: true, message: 'Resume generated successfully', data: aiResume });
  } catch (error) {
    handleAIError(res, error);
  }
};

// ─── CAREER RECOMMENDATIONS ────────────────────────────────────────
export const getCareerRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resumeData, savedCareers } = req.body;
    const result = await recommendCareers(resumeData || null, savedCareers || []);
    res.json({ success: true, message: 'Career recommendations generated successfully', data: result.recommendations });
  } catch (error) {
    handleAIError(res, error);
  }
};

// ─── ANALYZE RESUME ────────────────────────────────────────────────
export const parseResume = async (req: Request, res: Response): Promise<void> => {
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
    const analysis = await analyzeResume(resumeText.trim());
    res.json({ success: true, message: 'Resume analyzed successfully', data: analysis });
  } catch (error) {
    handleAIError(res, error);
  }
};

// ─── CHAT WITH AI (STREAMING SSE) ─────────────────────────────────
export const chatWithAI = async (req: Request, res: Response): Promise<void> => {
  try {
    const { history, message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ success: false, message: 'Message is required.' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const stream = await chatAssistantStream(history || [], message.trim());
    for await (const chunk of stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    if (res.headersSent) {
      const msg = error instanceof GeminiError ? error.message : 'An unexpected error occurred.';
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      res.end();
    } else {
      handleAIError(res, error);
    }
  }
};

// ─── ANALYZE IMAGE (Groq Vision) - FULLY LOGGED ───────────────────
export const analyzeImage = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  console.log("🚀 [Vision API] Request received at /api/ai/vision");
  
  try {
    if (!req.file) {
      console.error("❌ [Vision API] No file found in req.file");
      res.status(400).json({ success: false, message: 'No image file was uploaded. Please attach an image.' });
      return;
    }

    const { buffer, mimetype, size, originalname } = req.file;
    console.log(`📦 [Vision API] File received: ${originalname}, Type: ${mimetype}, Size: ${size} bytes`);

    if (!buffer || size === 0) {
      res.status(400).json({ success: false, message: 'Uploaded image is empty.' });
      return;
    }

    const userPrompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : 'Describe this image in detail.';
    console.log(`💬 [Vision API] User Prompt: "${userPrompt}"`);

    const base64Image = buffer.toString('base64');
    const dataUrl = `data:${mimetype};base64,${base64Image}`;

    console.log("🔄 [Vision API] Calling analyzeImageWithGroq service...");
    const { analysis, imageType, modelUsed } = await analyzeImageWithGroq(dataUrl, mimetype, userPrompt);
    console.log("✅ [Vision API] Groq analysis successful!");

    res.json({
      success: true,
      analysis,
      model: modelUsed,
      processingTime: `${Date.now() - startTime}ms`,
      imageType,
    });
  } catch (error) {
    // 🔥 এই লাইনটি সবচেয়ে গুরুত্বপূর্ণ: এটি Vercel Logs-এ আসল এরর দেখাবে
    console.error("❌ [Vision API] CRITICAL ERROR:", error);
    console.error("❌ [Vision API] Error Stack:", error instanceof Error ? error.stack : 'No stack trace');
    handleAIError(res, error);
  }
};

// ─── CENTRALIZED ERROR HANDLER ─────────────────────────────────────
function handleAIError(res: Response, error: unknown): void {
  if (error instanceof GeminiError) {
    console.error(`[AI Controller] GeminiError (${error.status}): ${error.message}`);
    res.status(error.status).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'AI service temporarily unavailable. Please try again.' : error.message,
    });
  } else if (error instanceof SyntaxError) {
    console.error(`[AI Controller] JSON Parse Error:`, error.message);
    res.status(502).json({ success: false, message: 'Invalid response from AI provider.' });
  } else {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[AI Controller] Unexpected Error:`, msg);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : msg,
    });
  }
}
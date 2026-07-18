import { Request, Response } from 'express';
import {
  generateResume,
  recommendCareers,
  analyzeResume,
  chatAssistantStream,
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

    const aiResume = await generateResume(
      targetJob.trim(),
      skills,
      experience || [],
      projects || [],
      education || [],
      achievements || []
    );

    res.json({
      success: true,
      message: 'Resume generated successfully',
      data: aiResume,
    });
  } catch (error) {
    handleAIError(res, error);
  }
};

// ─── CAREER RECOMMENDATIONS ────────────────────────────────────────
export const getCareerRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resumeData, savedCareers } = req.body;

    const result = await recommendCareers(resumeData || null, savedCareers || []);

    res.json({
      success: true,
      message: 'Career recommendations generated successfully',
      data: result.recommendations,
    });
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

    res.json({
      success: true,
      message: 'Resume analyzed successfully',
      data: analysis,
    });
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

    // Set SSE headers
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
    // If headers already sent (streaming started), write error to stream
    if (res.headersSent) {
      const msg = error instanceof GeminiError ? error.message : 'An unexpected error occurred.';
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      res.end();
    } else {
      handleAIError(res, error);
    }
  }
};

// ─── CENTRALIZED ERROR HANDLER ─────────────────────────────────────
function handleAIError(res: Response, error: unknown): void {
  if (error instanceof GeminiError) {
    console.error(`[AI Controller] GeminiError (${error.status}): ${error.message}`);
    res.status(error.status).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    });
  } else if (error instanceof SyntaxError) {
    console.error(`[AI Controller] JSON Parse Error:`, error.message);
    res.status(502).json({
      success: false,
      message: 'Gemini returned invalid JSON. Please try again.',
    });
  } else {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[AI Controller] Unexpected Error:`, msg);
    res.status(500).json({
      success: false,
      message: msg,
    });
  }
}

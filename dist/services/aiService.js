"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiError = void 0;
exports.generateResume = generateResume;
exports.recommendCareers = recommendCareers;
exports.analyzeResume = analyzeResume;
exports.chatAssistantStream = chatAssistantStream;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
// ─── ENV CONFIG ────────────────────────────────────────────────
const PRIMARY_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';
const MAX_PROMPT_LENGTH = 30_000; // characters
// ─── LAZY SINGLETON GROQ CLIENT ────────────────────────────────
let groq = null;
function getGroqClient() {
    if (!groq) {
        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        if (!GROQ_API_KEY) {
            throw new Error('[AI Service] FATAL: GROQ_API_KEY is not defined in environment variables. ' +
                'Set it in your .env file and restart the server.');
        }
        groq = new groq_sdk_1.default({ apiKey: GROQ_API_KEY });
        console.log('[AI Service] Initialized Groq API:');
        console.log(`  API Key exists: true`);
        console.log(`  Primary model: ${PRIMARY_MODEL}`);
        console.log(`  Fallback model: ${FALLBACK_MODEL}`);
    }
    return groq;
}
// ─── ERROR HANDLER ─────────────────────────────────────────────────
function categorizeAIError(error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStr = errMsg.toLowerCase();
    if (errStr.includes('api key') || errStr.includes('invalid api')) {
        return { status: 401, message: 'Invalid Groq API key. Please check your GROQ_API_KEY.' };
    }
    if (errStr.includes('quota') || errStr.includes('rate limit') || errStr.includes('429')) {
        return { status: 429, message: 'Groq API rate limit or quota exceeded. Please wait a moment and try again.' };
    }
    if (errStr.includes('timeout')) {
        return { status: 504, message: 'API request timed out. Try a shorter prompt.' };
    }
    if (errStr.includes('network') || errStr.includes('econnrefused') || errStr.includes('fetch failed')) {
        return { status: 503, message: 'Cannot reach AI API. Check your network connection.' };
    }
    return { status: 500, message: `AI error: ${errMsg}` };
}
class GeminiError extends Error {
    // We keep the name "GeminiError" so we don't have to change aiController.ts
    status;
    constructor(status, message) {
        super(message);
        this.name = 'GeminiError';
        this.status = status;
    }
}
exports.GeminiError = GeminiError;
// ─── CORE: CALL GROQ API WITH FALLBACK ─────────────────────────────
async function callGroqJSON(prompt, temperature = 0.7) {
    if (!prompt || !prompt.trim()) {
        throw new GeminiError(400, 'Prompt cannot be empty.');
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
        throw new GeminiError(400, `Prompt too long (${prompt.length} chars). Maximum is ${MAX_PROMPT_LENGTH}.`);
    }
    console.log(`[Groq] Request — model: ${PRIMARY_MODEL}, prompt length: ${prompt.length}`);
    try {
        const client = getGroqClient();
        const chatCompletion = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: PRIMARY_MODEL,
            temperature,
            response_format: { type: 'json_object' }
        });
        const text = chatCompletion.choices[0]?.message?.content || "";
        if (!text || !text.trim()) {
            throw new Error('Empty response from Groq');
        }
        console.log(`[Groq] Response — status: OK, length: ${text.length}`);
        return text;
    }
    catch (primaryError) {
        console.warn(`[Groq] Primary model "${PRIMARY_MODEL}" failed:`, primaryError instanceof Error ? primaryError.message : primaryError);
        // Try fallback
        console.log(`[Groq] Trying fallback model "${FALLBACK_MODEL}"...`);
        try {
            const client = getGroqClient();
            const fallbackCompletion = await client.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: FALLBACK_MODEL,
                temperature,
                response_format: { type: 'json_object' }
            });
            const text = fallbackCompletion.choices[0]?.message?.content || "";
            if (!text || !text.trim()) {
                throw new Error('Empty response from Groq fallback model');
            }
            console.log(`[Groq] Fallback response — status: OK, length: ${text.length}`);
            return text;
        }
        catch (fallbackError) {
            const classified = categorizeAIError(fallbackError);
            throw new GeminiError(classified.status, classified.message);
        }
    }
}
// ─── GENERATE RESUME ───────────────────────────────────────────────
async function generateResume(targetJob, skills, experience, projects, education, achievements) {
    const prompt = `You are an expert resume writer specializing in ATS-optimized resumes.

Generate a professional resume in JSON format based on the following details.

Target Job: ${targetJob}
Skills: ${skills.join(', ')}
Experience: ${JSON.stringify(experience)}
Projects: ${JSON.stringify(projects)}
Education: ${JSON.stringify(education)}
Achievements: ${achievements.join(', ')}

Respond ONLY with valid JSON in this exact format:
{
  "professionalSummary": "string",
  "optimizedSkills": ["string"],
  "optimizedExperience": [{ "company": "string", "role": "string", "description": "string with bullet points" }],
  "optimizedProjects": [{ "name": "string", "description": "string" }]
}`;
    const text = await callGroqJSON(prompt, 0.7);
    return JSON.parse(text);
}
// ─── RECOMMEND CAREERS ─────────────────────────────────────────────
async function recommendCareers(resumeData, savedCareers) {
    const prompt = `You are an expert career counselor. Analyze the provided resume data and saved career interests, then recommend 3 top career paths.

Resume Data: ${JSON.stringify(resumeData || {})}
Saved Career Interests: ${JSON.stringify(savedCareers)}

Respond ONLY with valid JSON in this exact format:
{
  "recommendations": [
    {
      "careerTitle": "string",
      "compatibilityScore": number_0_to_100,
      "expectedSalary": "$XXk - $XXk",
      "missingSkills": ["string"],
      "reasoning": "string explaining why this is a good match",
      "learningRoadmap": [{ "step": 1, "title": "string", "description": "string" }]
    }
  ]
}`;
    const text = await callGroqJSON(prompt, 0.7);
    return JSON.parse(text);
}
// ─── ANALYZE RESUME ────────────────────────────────────────────────
async function analyzeResume(resumeText) {
    const prompt = `You are an expert ATS resume analyzer. Analyze this resume thoroughly and provide a detailed score and feedback.

Resume:
${resumeText}

Respond ONLY with valid JSON in this exact format:
{
  "atsScore": number_0_to_100,
  "grammarIssues": ["string"],
  "missingKeywords": ["string"],
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestions": ["string"]
}`;
    const text = await callGroqJSON(prompt, 0.2);
    return JSON.parse(text);
}
// ─── CHAT ASSISTANT (STREAMING) ────────────────────────────────────
async function* chatAssistantStream(history, message) {
    if (!message || !message.trim()) {
        throw new GeminiError(400, 'Chat message cannot be empty.');
    }
    console.log(`[Groq Chat] Request — history: ${history.length} messages, message length: ${message.length}`);
    // Convert Gemini history format to Groq/OpenAI history format
    const groqMessages = [
        {
            role: 'system',
            content: 'You are an AI Career Coach named SkillPilot. Answer concisely and professionally. Help with interview prep, salary negotiation, career planning, and resume advice. Keep context of the conversation.'
        }
    ];
    for (const msg of history) {
        groqMessages.push({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.parts.map(p => p.text).join(' ')
        });
    }
    groqMessages.push({
        role: 'user',
        content: message
    });
    try {
        const client = getGroqClient();
        const stream = await client.chat.completions.create({
            messages: groqMessages,
            model: PRIMARY_MODEL,
            stream: true,
        });
        console.log(`[Groq Chat] Stream started`);
        for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
                // Yield an object that mimics the old Gemini stream chunk
                yield { text: () => text };
            }
        }
    }
    catch (error) {
        const classified = categorizeAIError(error);
        throw new GeminiError(classified.status, classified.message);
    }
}

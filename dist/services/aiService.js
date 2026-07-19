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
exports.analyzeImageWithGroq = analyzeImageWithGroq;
exports.performTextAction = performTextAction;
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
// ════════════════════════════════════════════════════════════════════
// ─── IMAGE UNDERSTANDING (Groq Vision) ─────────────────────────────
// Additive only — does not touch generateResume / recommendCareers /
// analyzeResume / chatAssistantStream or their shared helpers above.
// ════════════════════════════════════════════════════════════════════
const PRIMARY_VISION_MODEL = process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
const FALLBACK_VISION_MODEL = process.env.GROQ_VISION_FALLBACK_MODEL || 'meta-llama/llama-4-maverick-17b-128e-instruct';
const IMAGE_REQUEST_TIMEOUT_MS = Number(process.env.GROQ_VISION_TIMEOUT_MS) || 30_000;
function buildVisionPrompt(userPrompt) {
    return `You are an expert AI vision analyst embedded in a career-coaching platform called SkillPilot.
Carefully examine the attached image and produce a rich, well-organized analysis. Include only the sections below that are actually relevant to this image (skip ones that clearly don't apply):

- Caption: one sentence summarizing the image.
- Objects detected: notable objects, people, or elements visible.
- Detailed explanation: a thorough description of the scene, content, and context.
- Text in image (OCR): transcribe any readable text exactly as it appears.
- UI explanation: if this is a screenshot of software/app/website, explain what the interface shows and how to use it.
- Receipt summary: if this is a receipt or invoice, summarize merchant, items, amounts, and total.
- Plant identification: if this shows a plant, identify the likely species and notable characteristics.
- Error explanation: if this is an error message or error screenshot, explain the likely cause and how to fix it.
- General description: a natural-language overview for anything not covered above.
${userPrompt ? `\nThe user also asked specifically: "${userPrompt}"\nAddress this directly as part of your analysis.\n` : ''}
Respond in EXACTLY this format, with no extra commentary before or after:
IMAGE_TYPE: <one short label, e.g. screenshot, receipt, plant, error, document, photo, diagram, general>
ANALYSIS:
<your full analysis as well-formatted text>`;
}
function parseVisionResponse(raw) {
    const typeMatch = raw.match(/IMAGE_TYPE:\s*(.+)/i);
    const analysisMatch = raw.match(/ANALYSIS:\s*([\s\S]*)/i);
    const imageType = typeMatch ? typeMatch[1].trim().split('\n')[0].trim() : 'general';
    const analysis = analysisMatch ? analysisMatch[1].trim() : raw.trim();
    return {
        analysis: analysis || raw.trim(),
        imageType: imageType || 'general',
    };
}
function callWithTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Request timeout after ${ms}ms`));
        }, ms);
        promise
            .then((result) => {
            clearTimeout(timer);
            resolve(result);
        })
            .catch((err) => {
            clearTimeout(timer);
            reject(err);
        });
    });
}
async function callGroqVision(dataUrl, userPrompt, model) {
    const client = getGroqClient();
    const prompt = buildVisionPrompt(userPrompt);
    const completion = await client.chat.completions.create({
        model,
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: dataUrl } },
                ],
            },
        ],
        temperature: 0.4,
        max_tokens: 1500,
    });
    const text = completion.choices[0]?.message?.content || '';
    if (!text || !text.trim()) {
        throw new Error('Empty response from Groq vision model');
    }
    return text;
}
// ─── ANALYZE IMAGE (with primary → fallback vision model) ──────────
async function analyzeImageWithGroq(dataUrl, _mimeType, userPrompt) {
    console.log(`[Groq Vision] Request — model: ${PRIMARY_VISION_MODEL}, prompt length: ${userPrompt.length}`);
    try {
        const raw = await callWithTimeout(callGroqVision(dataUrl, userPrompt, PRIMARY_VISION_MODEL), IMAGE_REQUEST_TIMEOUT_MS);
        const { analysis, imageType } = parseVisionResponse(raw);
        console.log(`[Groq Vision] Response — status: OK, length: ${analysis.length}`);
        return { analysis, imageType, modelUsed: PRIMARY_VISION_MODEL };
    }
    catch (primaryError) {
        console.warn(`[Groq Vision] Primary model "${PRIMARY_VISION_MODEL}" failed:`, primaryError instanceof Error ? primaryError.message : primaryError);
        console.log(`[Groq Vision] Trying fallback model "${FALLBACK_VISION_MODEL}"...`);
        try {
            const raw = await callWithTimeout(callGroqVision(dataUrl, userPrompt, FALLBACK_VISION_MODEL), IMAGE_REQUEST_TIMEOUT_MS);
            const { analysis, imageType } = parseVisionResponse(raw);
            console.log(`[Groq Vision] Fallback response — status: OK, length: ${analysis.length}`);
            return { analysis, imageType, modelUsed: FALLBACK_VISION_MODEL };
        }
        catch (fallbackError) {
            const classified = categorizeAIError(fallbackError);
            throw new GeminiError(classified.status, classified.message);
        }
    }
}
const ctxLine = (context) => context && context.trim()
    ? `\nTarget role / job-description context (use its keywords naturally):\n${context.trim()}\n`
    : '';
const jsonOnly = '\n\nRespond with ONLY valid JSON in this exact shape, no markdown, no extra text:\n{"result": "the final text"}';
const ACTION_PROMPTS = {
    'generate-summary': (_text, role, context) => `You are an expert resume writer. Write a powerful, ATS-friendly professional summary (3-4 sentences) for a ${role}. ` +
        `Use strong action verbs, convey seniority and impact, and weave in relevant keywords.` +
        ctxLine(context) + jsonOnly,
    'rewrite-summary': (text, role, context) => `Rewrite the following professional summary to be more impactful, concise and ATS-friendly for a ${role}, ` +
        `preserving its original meaning.\n\nTEXT:\n${text}` + ctxLine(context) + jsonOnly,
    'grammar-summary': (text) => `Fix ALL grammar, spelling, punctuation and awkward phrasing in the text below. ` +
        `Do not change the meaning or significantly change the length.\n\nTEXT:\n${text}` + jsonOnly,
    'shorter-summary': (text) => `Condense the text below to a maximum of 2 sentences while keeping the strongest, most relevant points.\n\nTEXT:\n${text}` + jsonOnly,
    'stronger-summary': (text, role, context) => `Make the text below stronger for a ${role} resume: use power verbs and quantifiable-impact language, ` +
        `keep roughly the same length.\n\nTEXT:\n${text}` + ctxLine(context) + jsonOnly,
    'ats-summary': (text, role, context) => `Optimize the summary below for ATS systems targeting a ${role}. Weave in relevant keywords naturally ` +
        `without keyword stuffing.\n\nTEXT:\n${text}` + ctxLine(context) + jsonOnly,
    'rewrite-exp': (text, role, context) => `Rewrite these work-experience notes into high-impact, ATS-friendly bullet points for a ${role}. ` +
        `Start each bullet with a strong action verb.\n\nTEXT:\n${text}` + ctxLine(context) + jsonOnly,
    'quantify-exp': (text) => `Add realistic, quantifiable metrics (percentages, $ saved, time reduced, users served, etc.) to the ` +
        `experience bullets below so achievements become measurable. Keep them believable.\n\nTEXT:\n${text}` + jsonOnly,
    'improve-project': (text, role, context) => `Improve this project description for a ${role} resume: highlight the tech stack, your specific role, ` +
        `and measurable outcomes/impact.\n\nTEXT:\n${text}` + ctxLine(context) + jsonOnly,
};
async function performTextAction(action, text, context, targetRole) {
    const builder = ACTION_PROMPTS[action];
    if (!builder) {
        throw new GeminiError(400, `Unknown AI action: ${action}`);
    }
    const prompt = builder(text || '', targetRole || 'a professional role', context || '');
    console.log(`[Groq TextAction] action=${action}, prompt length=${prompt.length}`);
    // Reuse callGroqJSON -> we asked the model for {"result": "..."}
    const raw = await callGroqJSON(prompt, action.includes('grammar') || action.includes('shorter') ? 0.2 : 0.7);
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.result === 'string' && parsed.result.trim()) {
            return parsed.result.trim();
        }
    }
    catch {
        // fall through to raw text
    }
    // If the model didn't wrap it in JSON, return the raw text trimmed.
    return raw.trim();
}

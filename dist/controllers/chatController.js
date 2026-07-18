"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMessage = exports.clearChatHistory = exports.getChatHistory = void 0;
const ChatHistory_1 = require("../models/ChatHistory");
// Get user's chat history
const getChatHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        let chatHistory = await ChatHistory_1.ChatHistory.findOne({ userId });
        if (!chatHistory) {
            chatHistory = await ChatHistory_1.ChatHistory.create({ userId, messages: [] });
        }
        res.json({ success: true, data: chatHistory });
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.getChatHistory = getChatHistory;
// Clear user's chat history
const clearChatHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        const chatHistory = await ChatHistory_1.ChatHistory.findOneAndUpdate({ userId }, { $set: { messages: [] } }, { new: true });
        if (!chatHistory) {
            res.status(404).json({ success: false, message: 'Chat history not found' });
            return;
        }
        res.json({ success: true, data: chatHistory });
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.clearChatHistory = clearChatHistory;
// Add a message to history (if frontend wants to manually sync)
const addMessage = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { role, content } = req.body;
        if (!role || !content) {
            res.status(400).json({ success: false, message: 'Role and content are required' });
            return;
        }
        let chatHistory = await ChatHistory_1.ChatHistory.findOne({ userId });
        if (!chatHistory) {
            chatHistory = new ChatHistory_1.ChatHistory({ userId, messages: [] });
        }
        chatHistory.messages.push({ role, content, timestamp: new Date() });
        await chatHistory.save();
        res.status(201).json({ success: true, data: chatHistory });
    }
    catch (error) {
        res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
    }
};
exports.addMessage = addMessage;

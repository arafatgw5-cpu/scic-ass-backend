import { Request, Response } from 'express';
import { ChatHistory } from '../models/ChatHistory';

// Get user's chat history
export const getChatHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    let chatHistory = await ChatHistory.findOne({ userId });

    if (!chatHistory) {
      chatHistory = await ChatHistory.create({ userId, messages: [] });
    }

    res.json({ success: true, data: chatHistory });
  } catch (error: any) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

// Clear user's chat history
export const clearChatHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    
    const chatHistory = await ChatHistory.findOneAndUpdate(
      { userId },
      { $set: { messages: [] } },
      { new: true }
    );

    if (!chatHistory) {
      res.status(404).json({ success: false, message: 'Chat history not found' });
      return;
    }

    res.json({ success: true, data: chatHistory });
  } catch (error: any) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

// Add a message to history (if frontend wants to manually sync)
export const addMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { role, content } = req.body;

    if (!role || !content) {
      res.status(400).json({ success: false, message: 'Role and content are required' });
      return;
    }

    let chatHistory = await ChatHistory.findOne({ userId });
    
    if (!chatHistory) {
      chatHistory = new ChatHistory({ userId, messages: [] });
    }

    chatHistory.messages.push({ role, content, timestamp: new Date() });
    await chatHistory.save();

    res.status(201).json({ success: true, data: chatHistory });
  } catch (error: any) {
    res.status(500).json({ success: false, message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message });
  }
};

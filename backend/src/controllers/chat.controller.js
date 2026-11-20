import { askGeminiChat } from '../services/chat.service.js';

export const handleChatMessage = async (req, res, next) => {
  try {
    const { message, history, apiKey, userContext } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.',
      });
    }

    const effectiveUser = req.user || userContext || null;

    const result = await askGeminiChat({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      apiKey: typeof apiKey === 'string' && apiKey.trim() ? apiKey.trim() : null,
      user: effectiveUser,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getChatStatus = async (req, res, next) => {
  try {
    const hasEnvKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
    return res.status(200).json({
      success: true,
      data: {
        isGeminiConfigured: hasEnvKey,
        assistantName: 'EduBot AI',
        model: hasEnvKey ? 'Google Gemini 1.5 Flash' : 'Educarrus Knowledge Engine',
      },
    });
  } catch (err) {
    next(err);
  }
};

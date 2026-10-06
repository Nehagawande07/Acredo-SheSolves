const Chat = require('../models/Chat');
const Message = require('../models/Message');

const createChat = async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    const existingChat = await Chat.findOne({
      participants: { $all: [req.userId, participantId], $size: 2 }
    });

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    const chat = await Chat.create({
      participants: [req.userId, participantId]
    });

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create chat', error: error.message });
  }
};

const getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.userId })
      .populate('participants', 'name phone')
      .sort({ updatedAt: -1 });
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get chats', error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { chatId, message } = req.body;

    if (!chatId || !message) {
      return res.status(400).json({ message: 'Chat ID and message are required' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.includes(req.userId)) {
      return res.status(403).json({ message: 'Not authorized to send message in this chat' });
    }

    const newMessage = await Message.create({
      chatId,
      senderId: req.userId,
      message
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.includes(req.userId)) {
      return res.status(403).json({ message: 'Not authorized to view messages in this chat' });
    }

    const messages = await Message.find({ chatId }).sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get messages', error: error.message });
  }
};

module.exports = {
  createChat,
  getMyChats,
  sendMessage,
  getMessages
};

import { api } from '../../services/api';

export const messagesService = {
  getConversations: async () => {
    return await api.getConversations();
  },

  getMessages: async (userId) => {
    return await api.getMessages(userId);
  },

  sendMessage: async (receiverId, content) => {
    return await api.sendMessage(receiverId, content);
  },

  uploadMedia: async (file) => {
    return await api.uploadMedia(file);
  },

  sendMediaMessage: async (receiverId, mediaUrl, type, content = '') => {
    return await api.sendMediaMessage(receiverId, mediaUrl, type, content);
  }
};

export default messagesService;
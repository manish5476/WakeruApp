import apiClient, { ApiResponse } from './client';
import { Platform } from 'react-native';

export interface IFeedbackData {
  rating: number;
  category: string;
  feedback: string;
  displayName?: string;
  deviceInfo?: Record<string, any>;
  attachments?: string[];
}

export interface IFeedbackItem {
  _id: string;
  userId?: string;
  displayName: string;
  rating: number;
  category: string;
  feedback: string;
  images?: string[];
  deviceInfo?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export const feedbackApi = {
  create: async (
    data: IFeedbackData,
  ): Promise<ApiResponse<{ feedback: IFeedbackItem }>> => {
    if (data.attachments && data.attachments.length > 0) {
      const formData = new FormData();
      formData.append('rating', String(data.rating));
      formData.append('category', data.category);
      formData.append('feedback', data.feedback);
      if (data.displayName) formData.append('displayName', data.displayName);
      if (data.deviceInfo)
        formData.append('deviceInfo', JSON.stringify(data.deviceInfo));

      for (let i = 0; i < data.attachments.length; i++) {
        const uri = data.attachments[i];
        const filename = `feedback-${Date.now()}-${i}.jpg`;

        if (Platform.OS === 'web') {
          const res = await fetch(uri);
          const blob = await res.blob();
          formData.append('images', blob, filename);
        } else {
          formData.append('images', {
            uri: uri,
            type: 'image/jpeg',
            name: filename,
          } as any);
        }
      }

      return apiClient.upload('/feedback', formData);
    }

    const { attachments, ...restData } = data;
    return apiClient.post('/feedback', restData);
  },

  list: async (): Promise<ApiResponse<{ feedbacks: IFeedbackItem[] }>> => {
    return apiClient.get('/feedback');
  },
};

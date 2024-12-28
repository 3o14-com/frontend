import { StorageService } from './storage';
import { API_ENDPOINTS } from '@/constants/api';
import type { Post } from '@/types/api';

export const ApiService = {
  async getHomeTimeline(server: string, page: number = 1): Promise<Post[]> {
    const accessToken = await StorageService.get('accessToken');
    if (!accessToken) throw new Error('Not authenticated');

    const response = await fetch(
      `https://${server}${API_ENDPOINTS.TIMELINE}?page=${page}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch home timeline');
    }

    return response.json();
  },
};

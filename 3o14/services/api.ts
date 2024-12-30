import { StorageService } from './storage';
import { API_ENDPOINTS } from '@/constants/api';
import type { Post } from '@/types/api';

export const ApiService = {
  async getHomeTimeline(server: string, max_id?: string): Promise<Post[]> {
    const accessToken = await StorageService.get('accessToken');
    if (!accessToken) throw new Error('Not authenticated');
    const url = new URL(`https://${server}${API_ENDPOINTS.TIMELINE}`);
    if (max_id) {
      url.searchParams.append('max_id', max_id);
    }
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch home timeline');
    }
    return response.json();
  },

  async getLocalTimeline(server: string, max_id?: string): Promise<Post[]> {
    const accessToken = await StorageService.get('accessToken');
    if (!accessToken) throw new Error('Not authenticated');

    const url = new URL(`https://${server}${API_ENDPOINTS.PUBLIC_TIMELINE}`);

    // Add required parameters
    url.searchParams.append('local', 'true');
    if (max_id) {
      url.searchParams.append('max_id', max_id);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch local timeline');
    }

    return response.json();
  },

  // ... rest of your existing methods remain unchanged
  async favourite(server: string, postId: string): Promise<void> {
    const accessToken = await StorageService.get('accessToken');
    if (!accessToken) throw new Error('Not authenticated');
    const url = `https://${server}${API_ENDPOINTS.FAVOURITE.replace('{id}', postId)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error('Failed to like the post');
    }
  },
  // ... other methods
};

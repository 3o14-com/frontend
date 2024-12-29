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

  async reblog(server: string, postId: string): Promise<void> {
    const accessToken = await StorageService.get('accessToken');
    if (!accessToken) throw new Error('Not authenticated');

    const url = `https://${server}${API_ENDPOINTS.REBLOG.replace('{id}', postId)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to repost');
    }
  },

  async unfavourite(server: string, postId: string): Promise<void> {
    const accessToken = await StorageService.get('accessToken');
    if (!accessToken) throw new Error('Not authenticated');

    const url = `https://${server}${API_ENDPOINTS.UNFAVOURITE.replace('{id}', postId)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to unfavourite the post');
    }
  },

  async unreblog(server: string, postId: string): Promise<void> {
    const accessToken = await StorageService.get('accessToken');
    if (!accessToken) throw new Error('Not authenticated');

    const url = `https://${server}${API_ENDPOINTS.UNREBLOG.replace('{id}', postId)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to unreblog the post');
    }
  },

  async comment(server: string, postId: string, content: string): Promise<void> {
    const accessToken = await StorageService.get('accessToken');
    if (!accessToken) throw new Error('Not authenticated');

    const url = `https://${server}${API_ENDPOINTS.COMMENT}`;
    const body = JSON.stringify({
      status: content,
      in_reply_to_id: postId,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      throw new Error('Failed to post the comment');
    }
  },
};
;

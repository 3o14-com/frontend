import { StorageService } from './storage';
import { API_ENDPOINTS } from '@/constants/api';
import type { Post, Context } from '@/types/api';


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

  /**
   * Fetches a specific status and its context
   * @param server - The Mastodon instance domain
   * @param id - The status ID to fetch
   * @returns Promise containing the status and its context
   */
  async getStatus(server: string, id: string): Promise<{ status: Post; context: Context }> {
    const accessToken = await StorageService.get('accessToken');
    if (!accessToken) throw new Error('Not authenticated');

    // Construct URLs for both endpoints
    const statusUrl = `https://${server}${API_ENDPOINTS.STATUS.replace('{id}', id)}`;
    const contextUrl = `https://${server}${API_ENDPOINTS.STATUS_CONTEXT.replace('{id}', id)}`;

    try {
      // Fetch both status and context concurrently
      const [statusResponse, contextResponse] = await Promise.all([
        fetch(statusUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(contextUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      // Check for response errors
      if (!statusResponse.ok) {
        throw new Error(`Failed to fetch status: ${statusResponse.statusText}`);
      }
      if (!contextResponse.ok) {
        throw new Error(`Failed to fetch context: ${contextResponse.statusText}`);
      }

      // Parse responses
      const [status, context] = await Promise.all([
        statusResponse.json() as Promise<Post>,
        contextResponse.json() as Promise<Context>,
      ]);

      return {
        status,
        context: {
          ancestors: context.ancestors || [],
          descendants: context.descendants || [],
        },
      };
    } catch (error) {
      // Enhance error message with details
      throw new Error(
        `Failed to fetch status and context: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Fetches only the context of a status (ancestors and descendants)
   * @param server - The Mastodon instance domain
   * @param id - The status ID to fetch context for
   * @returns Promise containing the context
   */
  async getStatusContext(server: string, id: string): Promise<Context> {
    const accessToken = await StorageService.get('accessToken');
    if (!accessToken) throw new Error('Not authenticated');

    const url = `https://${server}${API_ENDPOINTS.STATUS_CONTEXT.replace('{id}', id)}`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch status context: ${response.statusText}`);
      }

      const context = await response.json();
      return {
        ancestors: context.ancestors || [],
        descendants: context.descendants || [],
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch status context: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

};

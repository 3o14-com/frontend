import { StorageService } from './storage';
import { API_ENDPOINTS } from '@/constants/api';
import type { CreatePostParams, MediaUploadResponse, Relationship, Account, Post, Context, FollowersResponse, FollowingResponse, ProfileResponse } from '@/types/api';


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

  /**
   * Fetches a user's profile information and posts
   * @param server - The Mastodon server domain
   * @param username - The username to fetch
   * @returns ProfileResponse containing account details and posts
   * @throws Error if not authenticated or request fails
   */
  async getProfile(server: string, username: string): Promise<ProfileResponse> {
    const accessToken = await StorageService.get('accessToken');
    if (!accessToken) throw new Error('Not authenticated');

    const url = `https://${server}${API_ENDPOINTS.ACCOUNT_LOOKUP.replace('{username}', username)}`;

    try {
      // First, get the account ID
      const lookupResponse = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!lookupResponse.ok) {
        throw new Error(`Failed to lookup account: ${lookupResponse.statusText}`);
      }

      const account: Account = await lookupResponse.json();

      // Then, fetch the account's posts
      const postsUrl = `https://${server}${API_ENDPOINTS.ACCOUNT_STATUSES.replace('{id}', account.id)}`;
      const postsResponse = await fetch(postsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!postsResponse.ok) {
        throw new Error(`Failed to fetch account posts: ${postsResponse.statusText}`);
      }

      const posts = await postsResponse.json();

      return {
        account,
        posts,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch profile: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Fetches a user's followers list with pagination
   * @param server - The Mastodon server domain
   * @param accountId - The account ID to fetch followers for
   * @param page - Optional page token for pagination
   * @returns FollowersResponse containing list of followers and next page token
   * @throws Error if not authenticated or request fails
   */
  async getFollowers(
    server: string,
    accountId: string,
    page?: string
  ): Promise<FollowersResponse> {
    const accessToken = await StorageService.get('accessToken');
    if (!accessToken) throw new Error('Not authenticated');

    const baseUrl = `https://${server}${API_ENDPOINTS.ACCOUNT_FOLLOWERS.replace('{id}', accountId)}`;
    const url = new URL(baseUrl);
    if (page) url.searchParams.set('max_id', page);
    url.searchParams.set('limit', '30');

    try {
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch followers: ${response.statusText}`);
      }

      const data = await response.json();
      const linkHeader = response.headers.get('Link');
      const nextPage = linkHeader?.match(/<[^>]*>\s*;\s*rel="next"/)?.[0]?.match(/max_id=([^&>]*)/)?.[1];

      return {
        accounts: data,
        next_page: nextPage,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch followers: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Fetches a user's following list with pagination
   * @param server - The Mastodon server domain
   * @param accountId - The account ID to fetch following for
   * @param page - Optional page token for pagination
   * @returns FollowingResponse containing list of followed accounts and next page token
   * @throws Error if not authenticated or request fails
   */
  async getFollowing(
    server: string,
    accountId: string,
    page?: string
  ): Promise<FollowingResponse> {
    const accessToken = await StorageService.get('accessToken');
    if (!accessToken) throw new Error('Not authenticated');

    const baseUrl = `https://${server}${API_ENDPOINTS.ACCOUNT_FOLLOWING.replace('{id}', accountId)}`;
    const url = new URL(baseUrl);
    if (page) url.searchParams.set('max_id', page);
    url.searchParams.set('limit', '30');

    try {
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch following: ${response.statusText}`);
      }

      const data = await response.json();
      const linkHeader = response.headers.get('Link');
      const nextPage = linkHeader?.match(/<[^>]*>\s*;\s*rel="next"/)?.[0]?.match(/max_id=([^&>]*)/)?.[1];

      return {
        accounts: data,
        next_page: nextPage,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch following: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  async followAccount(server: string, accountId: string): Promise<Relationship> {
    const accessToken = await StorageService.get('accessToken');
    if (!accessToken) throw new Error('Not authenticated');

    const url = `https://${server}${API_ENDPOINTS.FOLLOW.replace('{id}', accountId)}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to follow account: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      throw new Error(
        `Failed to follow account: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  async unfollowAccount(server: string, accountId: string): Promise<Relationship> {
    const accessToken = await StorageService.get('accessToken');
    if (!accessToken) throw new Error('Not authenticated');

    const url = `https://${server}${API_ENDPOINTS.UNFOLLOW.replace('{id}', accountId)}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to unfollow account: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      throw new Error(
        `Failed to unfollow account: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  async getRelationship(server: string, accountId: string): Promise<Relationship> {
    const accessToken = await StorageService.get('accessToken');
    if (!accessToken) throw new Error('Not authenticated');

    const url = `https://${server}${API_ENDPOINTS.RELATIONSHIPS}?id[]=${accountId}`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to get relationship: ${response.statusText}`);
      }

      const relationships = await response.json();
      return relationships[0];
    } catch (error) {
      throw new Error(
        `Failed to get relationship: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  async createPost(
    server: string,
    params: CreatePostParams
  ): Promise<Post> {
    const accessToken = await StorageService.get('accessToken');
    if (!accessToken) throw new Error('Not authenticated');

    const url = `https://${server}${API_ENDPOINTS.CREATE_POST}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Failed to create post: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      throw new Error(
        `Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  async uploadMedia(
    server: string,
    file: FormData
  ): Promise<MediaUploadResponse> {
    const accessToken = await StorageService.get('accessToken');
    if (!accessToken) throw new Error('Not authenticated');

    const url = `https://${server}${API_ENDPOINTS.UPLOAD_MEDIA}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload media: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      throw new Error(
        `Failed to upload media: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

};
